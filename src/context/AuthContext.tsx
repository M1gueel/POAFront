import { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Usuario, AuthContextType, Rol } from '../interfaces/user'; // Agregar Rol aquí
import { API } from '../api/userAPI';


// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props para el AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

// Función para verificar si el token ha expirado
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true; // Si no se puede decodificar, considerarlo expirado
  }
};

// Componente Provider
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Función para limpiar la autenticación
  const clearAuth = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
    delete API.defaults.headers.common['Authorization'];
  }, []);

  // Función de logout
  const logout = useCallback(() => {
    clearAuth();
    navigate('/login');
  }, [clearAuth, navigate]);

  // Función para obtener el rol completo
  const getUserRole = (): Rol | null => {
    console.log('getUserRole() - usuario:', usuario);
    console.log('getUserRole() - usuario.rol:', usuario?.rol);
    return usuario?.rol || null;
  };

  // Función para verificar rol por UUID
  const hasRole = (roleId: string): boolean => {
    const result = usuario?.id_rol === roleId;
    console.log(`hasRole(${roleId}):`, result);
    console.log('usuario?.id_rol:', usuario?.id_rol);
    return result;
  };

  // Función para verificar rol por nombre
  const hasRoleByName = (roleName: string): boolean => {
    const result = usuario?.rol?.nombre_rol === roleName;
    console.log(`hasRoleByName(${roleName}):`, result);
    console.log('usuario?.rol?.nombre_rol:', usuario?.rol?.nombre_rol);
    return result;
  };

  // Función para verificar múltiples roles por UUID
  const hasAnyRole = (roleIds: string[]): boolean => {
    const result = roleIds.some(roleId => hasRole(roleId));
    console.log(`hasAnyRole(${roleIds.join(', ')}):`, result);
    return result;
  };

  // Función para verificar múltiples roles por nombre
  const hasAnyRoleByName = (roleNames: string[]): boolean => {
    const result = roleNames.some(roleName => hasRoleByName(roleName));
    console.log(`hasAnyRoleByName(${roleNames.join(', ')}):`, result);
    return result;
  };

  // Funciones de utilidad
  const getUserId = (): string | null => {
    return usuario?.id || null;
  };

  const getRoleId = (): string | null => {
    return usuario?.id_rol || null;
  };

  const getRoleName = (): string | null => {
    return usuario?.rol?.nombre_rol || null;
  };

  // Función para verificar el token periódicamente
  const verificarToken = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    
    if (!storedToken) {
      return false;
    }

    // Verificar si el token ha expirado por tiempo
    if (isTokenExpired(storedToken)) {
      console.log('Token expirado por tiempo');
      clearAuth();
      return false;
    }

    try {
      // Verificar el token con el servidor
      const response = await API.get('/perfil', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      });
      
      // Si llegamos aquí, el token es válido
      return true;
    } catch (error: any) {
      console.log('Error al verificar token:', error);
      
      // Si es error 401 (no autorizado), el token no es válido
      if (error.response?.status === 401) {
        clearAuth();
        return false;
      }
      
      // Para otros errores, mantener el token (podría ser problema de red)
      return true;
    }
  }, [clearAuth]);

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const inicializarAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUsuario = localStorage.getItem('usuario');

      console.log('=== Inicializando Auth ===');
      console.log('storedToken:', storedToken ? 'Existe' : 'No existe');
      console.log('storedUsuario:', storedUsuario ? 'Existe' : 'No existe');

      if (storedToken && storedUsuario) {
        try {
          // Verificar si el token es válido
          const tokenValido = await verificarToken();
          
          if (tokenValido) {
            const parsedUsuario = JSON.parse(storedUsuario);
            console.log('Usuario parseado:', parsedUsuario);
            console.log('ID del rol:', parsedUsuario.id_rol);
            console.log('Rol completo:', parsedUsuario.rol);
            
            setToken(storedToken);
            setUsuario(parsedUsuario);
            API.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          }
        } catch (error) {
          console.error('Error al parsear datos del usuario:', error);
          clearAuth();
        }
      }

      setLoading(false);
    };

    inicializarAuth();
  }, [verificarToken, clearAuth]);

  // Verificar token periódicamente (cada 5 minutos)
  useEffect(() => {
    if (!token) return;

    const intervalo = setInterval(async () => {
      const tokenValido = await verificarToken();
      if (!tokenValido && token) {
        console.log('Token inválido detectado, cerrando sesión');
        logout();
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(intervalo);
  }, [token, verificarToken, logout]);

  // Interceptor para manejar respuestas 401
  useEffect(() => {
    const interceptor = API.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && token) {
          console.log('Respuesta 401 detectada, cerrando sesión');
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      API.interceptors.response.eject(interceptor);
    };
  }, [token, logout]);

  // Redireccionar según autenticación y ruta
  useEffect(() => {
    if (!loading) {
      const isPublicRoute = ['/login', '/register'].includes(location.pathname);

      if (!token && !isPublicRoute) {
        // Si no hay token y no es ruta pública, redirigir a login
        navigate('/login');
      } else if (token && isPublicRoute) {
        // Si hay token y es ruta pública, redirigir a la página principal
        navigate('/dashboard');
      }
    }
  }, [token, location.pathname, loading, navigate]);

  // Función de login
  const login = useCallback((newToken: string, userData: Usuario) => {
    console.log('=== Login ===');
    console.log('newToken:', newToken ? 'Existe' : 'No existe');
    console.log('userData:', userData);
    
    localStorage.setItem('token', newToken);
    localStorage.setItem('usuario', JSON.stringify(userData));
    API.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUsuario(userData);
    navigate('/dashboard');
  }, [navigate]);

  // Valor del contexto
  const value = {
    usuario,
    token,
    isAuthenticated: !!token,
    login,
    logout,
    loading,
    getUserRole,
    hasRole,
    hasRoleByName,
    hasAnyRole,
    hasAnyRoleByName,
    getUserId,
    getRoleId,
    getRoleName
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : <div>Cargando...</div>}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
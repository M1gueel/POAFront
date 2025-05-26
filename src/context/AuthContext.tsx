import { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Usuario, AuthContextType } from '../interfaces/user';
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

      if (storedToken && storedUsuario) {
        try {
          // Verificar si el token es válido
          const tokenValido = await verificarToken();
          
          if (tokenValido) {
            const parsedUsuario = JSON.parse(storedUsuario);
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
    loading
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
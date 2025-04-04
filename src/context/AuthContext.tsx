import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Definir la interfaz de usuario
interface Usuario {
  nombre: string;
  rol: string;
  imagen: string;
}

// Definir la interfaz del contexto de autenticación
interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, userData: Usuario) => void;
  logout: () => void;
  loading: boolean;
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props para el AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

// Componente Provider
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const inicializarAuth = () => {
      const storedToken = localStorage.getItem('token');
      const storedUsuario = localStorage.getItem('usuario');

      if (storedToken && storedUsuario) {
        try {
          const parsedUsuario = JSON.parse(storedUsuario);
          setToken(storedToken);
          setUsuario(parsedUsuario);
        } catch (error) {
          console.error('Error al parsear datos del usuario:', error);
          // Si hay un error, eliminar los datos corruptos
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
        }
      }
      
      setLoading(false);
    };

    inicializarAuth();
  }, []);

  // Redireccionar según autenticación y ruta
  useEffect(() => {
    if (!loading) {
      const isPublicRoute = ['/login', '/register'].includes(location.pathname);
      
      if (!token && !isPublicRoute) {
        // Si no hay token y no es ruta pública, redirigir a login
        navigate('/login');
      } else if (token && isPublicRoute) {
        // Si hay token y es ruta pública, redirigir a la página principal
        navigate('/');
      }
    }
  }, [token, location.pathname, loading, navigate]);

  // Función de login
  const login = (newToken: string, userData: Usuario) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('usuario', JSON.stringify(userData));
    setToken(newToken);
    setUsuario(userData);
    navigate('/');
  };

  // Función de logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
    navigate('/login');
  };

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
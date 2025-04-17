export interface UserRegister {
    nombre_usuario: string;
    email: string;
    password: string;
    id_rol: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}

export interface Rol {
    id_rol: string;
    nombre_rol: string;
    descripcion: string;
}

export interface UserProfile {
    nombre: string;
    rol: string;
    username?: string;
}

export interface PerfilUsuario {
    id: string;
    nombre: string;
    rol: string; // Este es el id_rol
}

// Definir la interfaz de usuario
export interface Usuario {
  nombre: string;
  rol: string;
}

// Definir la interfaz del contexto de autenticación
export interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, userData: Usuario) => void;
  logout: () => void;
  loading: boolean;
}
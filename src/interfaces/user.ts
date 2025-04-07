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
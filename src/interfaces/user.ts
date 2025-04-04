export interface UserLogin {
    username: string;
    password: string;
}

export interface UserRegister {
    nombre_usuario: string;
    email: string;
    password: string;
    id_rol: string;
}

export interface UserProfile {
    nombre: string;
    rol: string;
    imagen: string;
    username?: string;
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
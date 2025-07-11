// Interfaz para registro de usuario
export interface UserRegister {
    nombre_usuario: string;
    email: string;
    password: string;
    id_rol: string;
}

// Interfaz para respuesta de autenticación
export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: {
        id: string;         // UUID del usuario
        nombre: string;
        email: string;
        id_rol: string;     // UUID del rol
        rol?: Rol;          // Información completa del rol (opcional)
  };
}

// Interfaz base para el rol
export interface Rol {
    id_rol: string;
    nombre_rol: string;
    descripcion: string;
}

export interface UserProfile {
    nombre_rol: string;
    id_rol: string;
    username?: string;
}

export interface PerfilUsuario {
    id: string;
    nombre: string;
    id_rol: string; // Este es el id_rol
}

// Interfaz para datos básicos del usuario
export interface Usuario {
    id: string;
    nombre: string;
    email?: string;         // Email opcional
    id_rol: string;
    rol?: {
        id_rol: string;
        nombre_rol: string;
        descripcion: string;
    };
}

// Definir la interfaz del contexto de autenticación
export interface AuthContextType {
    usuario: Usuario | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (token: string, userData: Usuario) => void;
    logout: () => void;
    loading: boolean;
    
    // Funciones para manejo de roles con UUIDs
    getUserRole: () => Rol | null;
    hasRole: (roleId: string) => boolean;           // Ahora usa UUID
    hasRoleByName: (roleName: string) => boolean;   // Nueva función para nombres
    hasAnyRole: (roleIds: string[]) => boolean;     // Ahora usa UUIDs
    hasAnyRoleByName: (roleNames: string[]) => boolean; // Nueva función para nombres

    // Nuevas funciones de utilidad
    getUserId: () => string | null;
    getRoleId: () => string | null;
    getRoleName: () => string | null;
}

// Tipos de utilidad actualizados
export type RoleType = 
    | '80ffe2c0-f134-4274-b1aa-b632b74ea070'  // Administrador
    | '229f92d5-5d85-4557-8208-c0c000ac63b4'  // Director de Investigacion
    | '60b2d6f2-ac42-4447-bde7-8f8979636350'  // Director de Proyecto
    | 'b7d16467-bff9-41df-ab7f-5df0d9d35f5c'  // Director de reformas
    | string;

// Constantes para los roles (más fácil de mantener)
export const ROLES = {
    ADMINISTRADOR: '80ffe2c0-f134-4274-b1aa-b632b74ea070',
    DIRECTOR_INVESTIGACION: '229f92d5-5d85-4557-8208-c0c000ac63b4',
    DIRECTOR_PROYECTO: '60b2d6f2-ac42-4447-bde7-8f8979636350',
    DIRECTOR_REFORMAS: 'b7d16467-bff9-41df-ab7f-5df0d9d35f5c'
} as const;

// Mapeo de nombres de roles
export const ROLE_NAMES = {
    [ROLES.ADMINISTRADOR]: 'Administrador',
    [ROLES.DIRECTOR_INVESTIGACION]: 'Director de Investigacion',
    [ROLES.DIRECTOR_PROYECTO]: 'Director de Proyecto',
    [ROLES.DIRECTOR_REFORMAS]: 'Director de reformas'
} as const;

// Interfaz para validación de roles
export interface RoleValidation {
    isValid: boolean;
    message?: string;
    requiredRole?: string;
    hasPermission?: boolean;
}

// Interfaz para decodificar JWT
export interface DecodedJWT {
    payload: JWTPayload;
    header: {
        alg: string;
        typ: string;
    };
}

// Tipos de permisos (puedes expandir según necesites)
export type Permission = 
    | 'read'
    | 'write' 
    | 'delete'
    | 'admin'
    | 'manage_projects'
    | 'manage_poas'
    | 'approve_budgets';

// Interfaz para manejo de permisos
export interface PermissionCheck {
    hasPermission: boolean;
    roleId: string;
    roleName: string;
    message?: string;
}

// Interfaz para el payload del JWT
export interface JWTPayload {
    sub: string;        // ID del usuario (UUID)
    id_rol: string;     // ID del rol (UUID)
    exp: number;        // Timestamp de expiración
    iat?: number;       // Issued at (opcional)
    iss?: string;       // Issuer (opcional)
}
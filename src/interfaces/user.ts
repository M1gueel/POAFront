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
    hasAnyRole: (roleIds: string[]) => boolean;     // Ahora usa UUIDs
    // Nuevas funciones de utilidad
    getUserId: () => string | null;
    getRoleId: () => string | null;
}

// Clase para manejo dinámico de roles
class RoleManager {
    private static instance: RoleManager;
    private roles: Map<string, string> = new Map(); // clave_normalizada -> id_rol
    private rolesByName: Map<string, string> = new Map(); // nombre_original -> id_rol
    private rolesLoaded: boolean = false;

    private constructor() {}

    static getInstance(): RoleManager {
        if (!RoleManager.instance) {
            RoleManager.instance = new RoleManager();
        }
        return RoleManager.instance;
    }

    // Función para normalizar nombres de roles
    private normalizeRoleName(roleName: string): string {
        return roleName
            .toUpperCase()
            .replace(/\s+/g, '_')
            .replace(/[ÁÀÄÂ]/g, 'A')
            .replace(/[ÉÈËÊ]/g, 'E')
            .replace(/[ÍÌÏÎ]/g, 'I')
            .replace(/[ÓÒÖÔ]/g, 'O')
            .replace(/[ÚÙÜÛ]/g, 'U')
            .replace(/Ñ/g, 'N')
            .replace(/[^A-Z0-9_]/g, '');
    }

    // Cargar roles desde la API
    async loadRoles(): Promise<void> {
        if (this.rolesLoaded) return;

        try {
            const { rolAPI } = await import('../api/userAPI');
            const rolesData = await rolAPI.getRoles();
            
            console.log('🔄 Roles obtenidos de la API:', rolesData);
            
            // Limpiar mapas
            this.roles.clear();
            this.rolesByName.clear();
            
            // Mapear roles
            rolesData.forEach(rol => {
                const normalizedName = this.normalizeRoleName(rol.nombre_rol);
                this.roles.set(normalizedName, rol.id_rol);
                this.rolesByName.set(rol.nombre_rol, rol.id_rol);
                
                console.log(`📋 Mapeando: "${rol.nombre_rol}" -> "${normalizedName}" -> ${rol.id_rol}`);
            });
            
            this.rolesLoaded = true;
            console.log('✅ Roles cargados exitosamente');
            console.log('🗂️ Mapa de roles normalizados:', Object.fromEntries(this.roles));
            console.log('🗂️ Mapa de roles por nombre original:', Object.fromEntries(this.rolesByName));
        } catch (error) {
            console.error('❌ Error al cargar roles:', error);
            throw error;
        }
    }

    // Obtener UUID del rol por nombre normalizado
    getRoleId(roleName: string): string | null {
        const normalizedName = this.normalizeRoleName(roleName);
        const roleId = this.roles.get(normalizedName);
        
        console.log(`🔍 Buscando rol: "${roleName}" -> "${normalizedName}" -> ${roleId || 'NO ENCONTRADO'}`);
        
        return roleId || null;
    }

    // Obtener UUID del rol por nombre original
    getRoleIdByOriginalName(originalName: string): string | null {
        const roleId = this.rolesByName.get(originalName);
        console.log(`🔍 Buscando por nombre original: "${originalName}" -> ${roleId || 'NO ENCONTRADO'}`);
        return roleId || null;
    }

    // Verificar si los roles están cargados
    isLoaded(): boolean {
        return this.rolesLoaded;
    }

    // Obtener todos los roles normalizados
    getAllRoles(): Record<string, string> {
        return Object.fromEntries(this.roles);
    }

    // Obtener todos los roles por nombre original
    getAllRolesByOriginalName(): Record<string, string> {
        return Object.fromEntries(this.rolesByName);
    }

    // Recargar roles (útil para refresh)
    async reloadRoles(): Promise<void> {
        this.rolesLoaded = false;
        await this.loadRoles();
    }

    // Método para debugging
    debugRoles(): void {
        console.log('=== ESTADO DE ROLES ===');
        console.log('Roles cargados:', this.rolesLoaded);
        console.log('Roles normalizados:', Object.fromEntries(this.roles));
        console.log('Roles por nombre original:', Object.fromEntries(this.rolesByName));
        console.log('========================');
    }
}

// Instancia global del manager
const roleManager = RoleManager.getInstance();

// Objeto proxy para los roles que consulta dinámicamente
export const ROLES = new Proxy({}, {
    get(target, prop: string) {
        if (typeof prop !== 'string') return undefined;
        
        const roleId = roleManager.getRoleId(prop);
        if (!roleId) {
            console.warn(`⚠️ Rol '${prop}' no encontrado. Roles disponibles:`, roleManager.getAllRoles());
            roleManager.debugRoles(); // Agregar debug automático
            return null;
        }
        return roleId;
    }
}) as {
    ADMINISTRADOR: string;
    DIRECTOR_DE_INVESTIGACION: string;  // Cambiado para coincidir con el nombre normalizado
    DIRECTOR_DE_PROYECTO: string;       // Cambiado para coincidir con el nombre normalizado
    DIRECTOR_DE_REFORMAS: string;       // Cambiado para coincidir con el nombre normalizado
    [key: string]: string;
};

// Función para inicializar los roles (debe llamarse al inicio de la app)
export const initializeRoles = async (): Promise<void> => {
    console.log('🚀 Inicializando roles...');
    await roleManager.loadRoles();
    console.log('✅ Roles inicializados');
};

// Función para verificar si los roles están cargados
export const areRolesLoaded = (): boolean => {
    return roleManager.isLoaded();
};

// Función para obtener todos los roles (útil para debugging)
export const getAllRoles = (): Record<string, string> => {
    return roleManager.getAllRoles();
};

// Función para obtener todos los roles por nombre original
export const getAllRolesByOriginalName = (): Record<string, string> => {
    return roleManager.getAllRolesByOriginalName();
};

// Función para debugging
export const debugRoles = (): void => {
    roleManager.debugRoles();
};

// Función para obtener rol por nombre original (útil para casos especiales)
export const getRoleIdByOriginalName = (originalName: string): string | null => {
    return roleManager.getRoleIdByOriginalName(originalName);
};

// Tipos de utilidad actualizados (ahora dinámicos)
export type RoleType = string; // Ahora es completamente dinámico

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
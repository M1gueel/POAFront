import { useAuth } from '../context/AuthContext';

export const useRoleAccess = () => {
    const { usuario } = useAuth();
    
    const hasRole = (roleName: string): boolean => {
        return usuario?.rol?.nombre_rol === roleName;
    };
    
    const hasAnyRole = (roles: string[]): boolean => {
        return roles.some(role => hasRole(role));
    };
    
    const isAdmin = (): boolean => hasRole('Administrador');
    const isDirector = (): boolean => hasRole('Director');
    const isCoordinador = (): boolean => hasRole('Coordinador');
    
    return { hasRole, hasAnyRole, isAdmin, isDirector, isCoordinador };
};
import { useState, useEffect } from 'react';
import { Rol, RoleManager } from '../interfaces/user';
import { rolAPI } from '../api/userAPI';

export const useRoles = () => {
    const [roles, setRoles] = useState<Rol[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Cargar roles al montar el componente
    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Inicializar RoleManager y obtener roles
            await RoleManager.initialize();
            const rolesData = RoleManager.getRoles();
            
            setRoles(rolesData);
        } catch (err) {
            console.error('Error al cargar roles:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    // Función helper para obtener IDs de roles por nombres
    const getRoleIdsByNames = (names: string[]): string[] => {
        return RoleManager.getRoleIdsByNames(names);
    };

    // Función helper para obtener rol por nombre
    const getRoleByName = (name: string): Rol | null => {
        return RoleManager.getRoleByName(name);
    };

    // Función helper para obtener rol por ID
    const getRoleById = (id: string): Rol | null => {
        return RoleManager.getRoleById(id);
    };

    // Obtener IDs de roles específicos
    const getAdminRoleId = (): string | null => {
        return RoleManager.getAdminRoleId();
    };

    const getDirectorInvestigacionRoleId = (): string | null => {
        return RoleManager.getDirectorInvestigacionRoleId();
    };

    const getDirectorProyectoRoleId = (): string | null => {
        return RoleManager.getDirectorProyectoRoleId();
    };

    const getDirectorReformasRoleId = (): string | null => {
        return RoleManager.getDirectorReformasRoleId();
    };

    return {
        roles,
        loading,
        error,
        loadRoles,
        getRoleIdsByNames,
        getRoleByName,
        getRoleById,
        getAdminRoleId,
        getDirectorInvestigacionRoleId,
        getDirectorProyectoRoleId,
        getDirectorReformasRoleId,
        // Constantes de nombres para facilitar el uso
        ROLE_NAMES: RoleManager.ROLE_NAMES
    };
};
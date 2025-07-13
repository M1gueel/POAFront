import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../interfaces/user';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[]; // UUIDs de roles
  fallbackPath?: string;
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  fallbackPath = '/dashboard'
}) => {
  const { 
    isAuthenticated, 
    hasAnyRole, 
    loading,
    usuario,
    getRoleId,
  } = useAuth();

  // Debug logging
  console.log('=== RoleProtectedRoute Debug ===');
  console.log('isAuthenticated:', isAuthenticated);
  console.log('loading:', loading);
  console.log('requiredRoles:', requiredRoles);
  console.log('Usuario actual:', usuario);
  console.log('ID del rol del usuario:', getRoleId());
  console.log('ROLES.ADMINISTRADOR:', ROLES.ADMINISTRADOR);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    console.log('⏳ Loading...');
    return <div>Cargando...</div>;
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    console.log('❌ No autenticado, redirigiendo al login');
    return <Navigate to="/login" replace />;
  }

  // Verificar permisos por UUID (método recomendado)
  if (requiredRoles.length > 0) {
    const hasPermission = hasAnyRole(requiredRoles);
    console.log('Verificando por UUIDs:', requiredRoles);
    console.log('¿Tiene algún rol requerido (UUID)?', hasPermission);
    
    if (!hasPermission) {
      console.log('❌ No tiene rol requerido (UUID), redirigiendo a:', fallbackPath);
      return <Navigate to={fallbackPath} replace />;
    }
  }

  // Si no se especificaron roles requeridos, permitir acceso
  if (requiredRoles.length === 0) {
    console.log('⚠️ No se especificaron roles requeridos, permitiendo acceso');
    return <>{children}</>;
  }

  console.log('✅ Acceso concedido');
  return <>{children}</>;
};

export default RoleProtectedRoute;
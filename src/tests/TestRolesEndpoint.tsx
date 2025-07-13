// Agrega este código temporal en tu App.tsx o como un componente separado para testing

import { useEffect } from 'react';
import { rolAPI } from '../api/userAPI';

const TestRolesEndpoint = () => {
  useEffect(() => {
    const testRoles = async () => {
      try {
        console.log('🔍 Testeando endpoint de roles...');
        const roles = await rolAPI.getRoles();
        console.log('✅ Roles obtenidos:', roles);
        
        // Verificar estructura de cada rol
        roles.forEach((rol, index) => {
          console.log(`Rol ${index}:`, {
            id_rol: rol.id_rol,
            nombre_rol: rol.nombre_rol,
            descripcion: rol.descripcion
          });
        });
      } catch (error) {
        console.error('❌ Error al obtener roles:', error);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
        }
      }
    };

    testRoles();
  }, []);

  return <div>Testeando roles... (ver consola)</div>;
};

export default TestRolesEndpoint;
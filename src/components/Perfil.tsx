import React, { useEffect, useState } from 'react';
import { userAPI } from '../api/userAPI';
import { PerfilUsuario, Rol } from '../interfaces/user';
import { useAuth } from '../context/AuthContext';

const Perfil: React.FC = () => {
  const { token } = useAuth();
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [nombreRol, setNombreRol] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarPerfil = async () => {
      if (!token) {
        setError('No hay sesión activa');
        setLoading(false);
        return;
      }

      try {
        // Obtener el perfil del usuario
        const perfilData = await userAPI.getPerfilUsuario();
        setPerfil(perfilData);

        // Obtener el nombre del rol
        const rolName = await userAPI.getRolNameById(perfilData.rol);
        setNombreRol(rolName);
      } catch (err) {
        console.error('Error al cargar el perfil:', err);
        setError('Error al cargar los datos del perfil');
      } finally {
        setLoading(false);
      }
    };

    cargarPerfil();
  }, [token]);

  if (loading) return <div className="container mx-auto p-4">Cargando perfil...</div>;
  if (error) return <div className="container mx-auto p-4 text-red-500">{error}</div>;
  if (!perfil) return <div className="container mx-auto p-4">No se encontró información del perfil</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Perfil de Usuario</h1>
        
        <div className="space-y-4">
          <div className="flex flex-col">
            <span className="text-gray-600 text-sm">ID:</span>
            <span className="font-medium">{perfil.id}</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-gray-600 text-sm">Nombre:</span>
            <span className="font-medium">{perfil.nombre}</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-gray-600 text-sm">Rol:</span>
            <span className="font-medium">{nombreRol}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
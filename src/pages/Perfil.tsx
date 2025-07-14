import React, { useEffect, useState } from 'react';
import { userAPI, rolAPI } from '../api/userAPI';
import { PerfilUsuario } from '../interfaces/user';
import { useAuth } from '../context/AuthContext';
import '../styles/Perfil.css'; // Importamos los estilos

const Perfil: React.FC = () => {
  const { token } = useAuth();
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [nombreRol, setNombreRol] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // En el useEffect:
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
            
            // Obtener todos los roles y filtrar
            const roles = await rolAPI.getRoles();
            const rolEncontrado = roles.find(rol => rol.id_rol === perfilData.id_rol);
            setNombreRol(rolEncontrado?.nombre_rol || 'Rol no encontrado');
            
        } catch (err) {
            console.error('Error al cargar el perfil:', err);
            setError('Error al cargar los datos del perfil');
        } finally {
            setLoading(false);
        }
    };
    cargarPerfil();
}, [token]);

  if (loading) {
    return (
      <div className="perfil-wrapper">
        <h1 className="perfil-title">Perfil de Usuario</h1>
        <div className="loading-message">Cargando perfil...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="perfil-wrapper">
        <h1 className="perfil-title">Perfil de Usuario</h1>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="perfil-wrapper">
        <h1 className="perfil-title">Perfil de Usuario</h1>
        <div className="empty-message">No se encontró información del perfil</div>
      </div>
    );
  }

  return (
    <div className="perfil-wrapper">
      <h1 className="perfil-title">Perfil de Usuario</h1>
      
      <div className="perfil-card">
        <div className="perfil-datos">
          <div className="perfil-campo">
            <span className="perfil-etiqueta">ID</span>
            <span className="perfil-valor">{perfil.id}</span>
          </div>
          
          <div className="perfil-campo">
            <span className="perfil-etiqueta">Nombre</span>
            <span className="perfil-valor">{perfil.nombre}</span>
          </div>
          
          <div className="perfil-campo">
            <span className="perfil-etiqueta">Rol</span>
            <span className="perfil-valor">{nombreRol}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
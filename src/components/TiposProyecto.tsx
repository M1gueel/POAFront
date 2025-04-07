import React, { useEffect, useState } from 'react';
import { TipoProyecto } from '../interfaces/project';
import { projectAPI } from '../api/projectAPI';
import { HelpCircle } from 'lucide-react';
import '../styles/TiposProyecto.css'; // Importamos el archivo CSS

// Componente para mostrar los tipos de proyecto como botones
const TiposProyecto: React.FC = () => {
  const [tiposProyecto, setTiposProyecto] = useState<TipoProyecto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTiposProyecto = async () => {
      try {
        setLoading(true);
        const data = await projectAPI.getTiposProyecto();
        setTiposProyecto(data);
        setError(null);
      } catch (err) {
        console.error('Error al obtener tipos de proyecto:', err);
        setError('Error al cargar los tipos de proyecto');
      } finally {
        setLoading(false);
      }
    };

    fetchTiposProyecto();
  }, []);

  if (loading) {
    return (
      <div className="tipos-proyecto-wrapper">
        <h1 className="tipos-proyecto-title">Tipo de Proyecto</h1>
        <div className="loading-message">Cargando tipos de proyecto...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tipos-proyecto-wrapper">
        <h1 className="tipos-proyecto-title">Tipo de Proyecto</h1>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="tipos-proyecto-wrapper">
      <h1 className="tipos-proyecto-title">Tipo de Proyecto</h1>
      <div className="tipos-proyecto-container">
        {tiposProyecto.length === 0 ? (
          <div className="empty-message">No hay tipos de proyecto disponibles</div>
        ) : (
          tiposProyecto.map((tipo) => (
            <button
              key={tipo.id_tipo_proyecto}
              className="tipo-proyecto-button"
              onClick={() => {
                // Aquí puedes manejar la acción del botón
                console.log('Tipo seleccionado:', tipo);
              }}
            >
              <div>
              <span className="tipo-proyecto-codigo">
                <span style={{ display: 'inline-block', minWidth: '50px' }}>
                  {tipo.codigo_tipo}
                </span>
                |
              </span>
                <span className="tipo-proyecto-nombre">{tipo.nombre}</span>
              </div>
              <div className="tooltip-container">
                <HelpCircle size={18} className="help-icon" />
                <div className="tooltip">
                  {tipo.descripcion}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default TiposProyecto;
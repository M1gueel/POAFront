import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CrearProyectoApi from '../api/CrearProyectoApi';
import { TipoProyecto } from '../interfaces/project';


const CrearProyecto: React.FC = () => {
  const { tipoProyectoId } = useParams<{ tipoProyectoId: string }>();
  const [tipoProyectoSeleccionado, setTipoProyectoSeleccionado] = useState<TipoProyecto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchTipoProyecto = async () => {
      try {
        setIsLoading(true);
        const mockTiposProyecto = [
          {
            id_tipo_proyecto: '1e4e8f1c-1a1a-4a1a-8a1a-1a1a1a1a1a1a',
            codigo_tipo: 'PIIF',
            nombre: 'Interno con financiamiento',
            descripcion: 'Proyectos internos que requieren cierto monto de dinero'
          },
          {
            id_tipo_proyecto: '2e4e8f1c-2a2a-4a2a-8a2a-2a2a2a2a2a2a',
            codigo_tipo: 'PIS',
            nombre: 'Semilla con financiamiento',
            descripcion: 'Proyectos semilla que requieren cierto monto de dinero'
          },
          // ... otros tipos de proyecto
        ];
        
        const tipoProyecto = mockTiposProyecto.find(tipo => tipo.id_tipo_proyecto === tipoProyectoId);
        
        if (tipoProyecto) {
          setTipoProyectoSeleccionado(tipoProyecto);
        } else {
          setError('Tipo de proyecto no encontrado');
        }
      } catch (err) {
        console.error('Error al cargar tipo de proyecto:', err);
        setError('Error al cargar la información del tipo de proyecto');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTipoProyecto();
  }, [tipoProyectoId]);
  
  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3">Cargando información del tipo de proyecto...</p>
      </div>
    );
  }
  
  if (error || !tipoProyectoSeleccionado) {
    return (
      <div className="alert alert-danger" role="alert">
        {error || 'Tipo de proyecto no encontrado. Por favor, seleccione un tipo de proyecto válido.'}
      </div>
    );
  }
  
  return (
    <CrearProyectoApi 
      tipoProyectoSeleccionado={tipoProyectoSeleccionado}
      onCancel={() => window.history.back()} // Volver atrás al cancelar
    />
  );
};

export default CrearProyecto;
import React from 'react';
import { TipoProyecto, Proyecto } from '../interfaces/project';

interface ProyectoFormHeaderProps {
  tipoProyecto: TipoProyecto | null;
  error: string | null;
  isEditing?: boolean;
  proyectoSeleccionado?: Proyecto | null;
}

export const ProyectoFormHeader: React.FC<ProyectoFormHeaderProps> = ({ 
  tipoProyecto, 
  error, 
  isEditing = false,
  proyectoSeleccionado 
}) => {
  return (
    <>
      <div className="nuevo-proyecto-header">
        <h2 className="nuevo-proyecto-title">
          {isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}
        </h2>
        {tipoProyecto && (
          <p className="nuevo-proyecto-subtitle">
            Tipo: {tipoProyecto.nombre}
            {tipoProyecto.duracion_meses && (
              <span className="ms-2 text-muted">(Duración máxima: {tipoProyecto.duracion_meses} meses)</span>
            )}
          </p>
        )}
        {isEditing && proyectoSeleccionado && (
          <div className="mt-2">
            <span className="badge bg-primary me-2">{proyectoSeleccionado.codigo_proyecto}</span>
            <span className="text-muted">{proyectoSeleccionado.titulo}</span>
          </div>
        )}
      </div>
      
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
    </>
  );
};

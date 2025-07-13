import React from 'react';
import { Card } from 'react-bootstrap';
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
  const headerClass = isEditing 
    ? "bg-warning bg-gradient text-dark p-3" 
    : "bg-primary bg-gradient text-white p-3";

  return (
    <Card.Header className={headerClass}>
      <h2 className="mb-0 fw-bold text-center">
        {isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}
      </h2>
      {tipoProyecto && (
        <p className="mb-0 text-center mt-2 opacity-75">
          Tipo: {tipoProyecto.nombre}
          {tipoProyecto.duracion_meses && (
            <span className="ms-2">(Duración máxima: {tipoProyecto.duracion_meses} meses)</span>
          )}
        </p>
      )}
      {isEditing && proyectoSeleccionado && (
        <div className="text-center mt-2">
          <span className="badge bg-primary me-2">{proyectoSeleccionado.codigo_proyecto}</span>
          <span className="opacity-75">{proyectoSeleccionado.titulo}</span>
        </div>
      )}
      {isEditing && !proyectoSeleccionado && (
        <p className="mb-0 text-center mt-2 opacity-75">
          Seleccione el proyecto que desea editar
        </p>
      )}
      {error && (
        <div className="alert alert-danger mt-3 mb-0" role="alert">
          {error}
        </div>
      )}
    </Card.Header>
  );
};

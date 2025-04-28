// src/components/proyecto/ProyectoFormHeader.tsx
import React from 'react';
import { TipoProyecto } from '../../interfaces/project';

interface ProyectoFormHeaderProps {
  tipoProyecto: TipoProyecto | null;
  error: string | null;
}

export const ProyectoFormHeader: React.FC<ProyectoFormHeaderProps> = ({ tipoProyecto, error }) => {
  return (
    <>
      <div className="nuevo-proyecto-header">
        <h2 className="nuevo-proyecto-title">Nuevo Proyecto</h2>
        {tipoProyecto && (
          <p className="nuevo-proyecto-subtitle">
            Tipo: {tipoProyecto.nombre}
            {tipoProyecto.duracion_meses && (
              <span className="ms-2 text-muted">(Duración máxima: {tipoProyecto.duracion_meses} meses)</span>
            )}
          </p>
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

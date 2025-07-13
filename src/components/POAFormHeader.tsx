import React from 'react';
import { Card } from 'react-bootstrap';

interface POAFormHeaderProps {
  error: string | null;
  isEditing?: boolean;
  poaId?: string;
}

export const POAFormHeader: React.FC<POAFormHeaderProps> = ({ 
  error, 
  isEditing = false,
  poaId 
}) => {
  const headerClass = isEditing 
    ? "bg-warning bg-gradient text-dark p-3" 
    : "bg-primary bg-gradient text-white p-3";
  
  const title = isEditing 
    ? `Editar POA ${poaId ? `#${poaId}` : ''}`
    : 'Crear Nuevo POA';

  return (
    <Card.Header className={headerClass}>
      <h2 className="mb-0 fw-bold text-center">{title}</h2>
      {error && (
        <div className="alert alert-danger mt-3 mb-0" role="alert">
          {error}
        </div>
      )}
    </Card.Header>
  );
};

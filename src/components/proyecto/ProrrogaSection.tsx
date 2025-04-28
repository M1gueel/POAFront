// src/components/proyecto/ProrrogaSection.tsx
import React from 'react';
import { Form, Collapse } from 'react-bootstrap';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ProrrogaSectionProps {
  prorrogaOpen: boolean;
  setProrrogaOpen: (open: boolean) => void;
  fecha_prorroga: string;
  setFecha_prorroga: (fecha: string) => void;
  fecha_prorroga_inicio: string;
  setFecha_prorroga_inicio: (fecha: string) => void;
  fecha_prorroga_fin: string;
  setFecha_prorroga_fin: (fecha: string) => void;
  tiempo_prorroga_meses: string;
  setTiempo_prorroga_meses: (tiempo: string) => void;
  fecha_fin: string;
}

export const ProrrogaSection: React.FC<ProrrogaSectionProps> = ({
  prorrogaOpen,
  setProrrogaOpen,
  fecha_prorroga,
  setFecha_prorroga,
  fecha_prorroga_inicio,
  setFecha_prorroga_inicio,
  fecha_prorroga_fin,
  setFecha_prorroga_fin,
  tiempo_prorroga_meses,
  setTiempo_prorroga_meses,
  fecha_fin
}) => {
  return (
    <div className="prorroga-section">
      <h4 
        className="prorroga-title" 
        onClick={() => setProrrogaOpen(!prorrogaOpen)}
        style={{ cursor: 'pointer' }}
      >
        Datos de Prórroga <span className="text-muted fs-6">(Opcional)</span>
        <span className="ms-2 d-inline-flex align-items-center">
          {prorrogaOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </h4>  
      
      <Collapse in={prorrogaOpen}>
        <div>
          <Form.Group controlId="fecha_prorroga" className="form-group-custom">
            <Form.Label className="form-label-custom">Fecha de Prórroga <span className="text-muted">(Opcional)</span></Form.Label>
            <Form.Control
              type="date"
              size="lg"
              value={fecha_prorroga}
              onChange={(e) => setFecha_prorroga(e.target.value)}
              className="form-control-custom"
              min={fecha_fin}
            />
          </Form.Group>

          <Form.Group controlId="fecha_prorroga_inicio" className="form-group-custom">
            <Form.Label className="form-label-custom">Fecha de Inicio de Prórroga <span className="text-muted">(Opcional)</span></Form.Label>
            <Form.Control
              type="date"
              size="lg"
              value={fecha_prorroga_inicio}
              onChange={(e) => setFecha_prorroga_inicio(e.target.value)}
              className="form-control-custom"
              min={fecha_fin}
            />
          </Form.Group>

          <Form.Group controlId="fecha_prorroga_fin" className="form-group-custom">
            <Form.Label className="form-label-custom">Fecha de Fin de Prórroga <span className="text-muted">(Opcional)</span></Form.Label>
            <Form.Control
              type="date"
              size="lg"
              value={fecha_prorroga_fin}
              onChange={(e) => setFecha_prorroga_fin(e.target.value)}
              className="form-control-custom"
              min={fecha_prorroga_inicio || fecha_fin}
            />
          </Form.Group>

          <Form.Group controlId="tiempo_prorroga_meses" className="form-group-custom">
            <Form.Label className="form-label-custom">Tiempo de Prórroga (meses) <span className="text-muted">(Opcional)</span></Form.Label>
            <Form.Control
              type="number"
              placeholder="Ingrese el tiempo de prórroga"
              size="lg"
              value={tiempo_prorroga_meses}
              onChange={(e) => setTiempo_prorroga_meses(e.target.value)}
              className="form-control-custom"
              min="1"
            />
          </Form.Group>
        </div>
      </Collapse>
    </div>
  );
};
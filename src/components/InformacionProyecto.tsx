import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { Proyecto } from '../interfaces/project';

interface InformacionProyectoProps {
  proyecto: Proyecto;
  cantidadPoas: number;
}

const InformacionProyecto: React.FC<InformacionProyectoProps> = ({ proyecto, cantidadPoas }) => {
  return (
    <Row className="mb-4">
      <Col md={12}>
        <Card className="bg-light">
          <Card.Body>
            <h5 className="mb-3">Información del Proyecto Seleccionado</h5>
            <Row>
              <Col md={6}>
                <p><strong>Código:</strong> {proyecto.codigo_proyecto}</p>
                <p><strong>Título:</strong> {proyecto.titulo}</p>
                <p><strong>Fecha Inicio:</strong> {proyecto.fecha_inicio}</p>
              </Col>
              <Col md={6}>
                <p><strong>Fecha Fin:</strong> {proyecto.fecha_fin}</p>
                <p><strong>Presupuesto Aprobado:</strong> ${parseFloat(proyecto.presupuesto_aprobado.toString()).toLocaleString('es-CO')}</p>
                <p><strong>POAs Asociados:</strong> {cantidadPoas}</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default InformacionProyecto;

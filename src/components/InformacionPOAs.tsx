import React from 'react';
import { Row, Col, Card, ListGroup } from 'react-bootstrap';

interface POAExtendido {
  id_poa: string;
  codigo_poa: string;
  anio_ejecucion: number | string;
  presupuesto_asignado: number;
  tipo_poa?: string;
  periodo?: {
    nombre_periodo: string;
  };
}

interface InformacionPOAsProps {
  poas: POAExtendido[];
}

const InformacionPOAs: React.FC<InformacionPOAsProps> = ({ poas }) => {
  return (
    <Row className="mb-4">
      <Col md={12}>
        <Card>
          <Card.Header className="bg-light">
            <h5 className="mb-0">POAs del Proyecto</h5>
          </Card.Header>
          <Card.Body>
            <ListGroup>
              {poas.map((poa) => (
                <ListGroup.Item key={poa.id_poa} className="mb-2">
                  <Row>
                    <Col md={6}>
                      <p className="mb-1"><strong>Código POA:</strong> {poa.codigo_poa}</p>
                      <p className="mb-1"><strong>Año Ejecución:</strong> {poa.anio_ejecucion}</p>
                      <p className="mb-1"><strong>Tipo:</strong> {poa.tipo_poa || 'No especificado'}</p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-1"><strong>Presupuesto Asignado:</strong> ${parseFloat(poa.presupuesto_asignado.toString()).toLocaleString('es-CO')}</p>
                      {poa.periodo && <p className="mb-1"><strong>Periodo:</strong> {poa.periodo.nombre_periodo}</p>}
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default InformacionPOAs;

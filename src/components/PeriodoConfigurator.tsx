import React from 'react';
import { Row, Col, Card, Form } from 'react-bootstrap';
import { Periodo } from '../interfaces/periodo';

interface PeriodoConfiguratorProps {
  periodosSeleccionados: Periodo[];
  periodoActual: number;
  setPeriodoActual: (index: number) => void;
  presupuestoPorPeriodo: { [key: string]: string };
  codigoPorPeriodo: { [key: string]: string };
  anioPorPeriodo: { [key: string]: string };
  anioPorPeriodoError: { [key: string]: string };
  setCodigoPorPeriodo: (codigos: { [key: string]: string }) => void;
  setAnioPorPeriodo: (anios: { [key: string]: string }) => void;
  handlePresupuestoChange: (e: React.ChangeEvent<HTMLInputElement>, idPeriodo: string) => void;
  presupuestoError: string | null;
}

export const PeriodoConfigurator: React.FC<PeriodoConfiguratorProps> = ({
  periodosSeleccionados,
  periodoActual,
  setPeriodoActual,
  presupuestoPorPeriodo,
  codigoPorPeriodo,
  anioPorPeriodo,
  anioPorPeriodoError,
  setCodigoPorPeriodo,
  setAnioPorPeriodo,
  handlePresupuestoChange,
  presupuestoError
}) => {
  if (periodosSeleccionados.length === 0) {
    return null;
  }

  return (
    <Row className="mb-4">
      <Col md={12}>
        <Card>
          <Card.Header className="bg-light">
            <ul className="nav nav-tabs card-header-tabs">
              {periodosSeleccionados.map((periodo, index) => (
                <li className="nav-item" key={periodo.id_periodo}>
                  <button 
                    className={`nav-link ${periodoActual === index ? 'active' : ''}`}
                    onClick={() => setPeriodoActual(index)}
                    type="button"
                  >
                    {periodo.anio}
                  </button>
                </li>
              ))}
            </ul>
          </Card.Header>
          <Card.Body>
            {periodosSeleccionados.length > 0 && periodoActual >= 0 && (
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3" controlId={`codigo_${periodosSeleccionados[periodoActual].id_periodo}`}>
                    <Form.Label className="fw-semibold">Código POA <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      type="text" 
                      value={codigoPorPeriodo[periodosSeleccionados[periodoActual].id_periodo] || ''}
                      onChange={(e) => setCodigoPorPeriodo({
                        ...codigoPorPeriodo,
                        [periodosSeleccionados[periodoActual].id_periodo]: e.target.value
                      })}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3" controlId={`anio_${periodosSeleccionados[periodoActual].id_periodo}`}>
                    <Form.Label className="fw-semibold">Año de Ejecución <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      value={anioPorPeriodo[periodosSeleccionados[periodoActual].id_periodo] || ''}
                      onChange={(e) => {
                        const valor = parseFloat(e.target.value);
                        if (!isNaN(valor) && valor > 0) {
                          setAnioPorPeriodo({
                            ...anioPorPeriodo,
                            [periodosSeleccionados[periodoActual].id_periodo]: e.target.value
                          });
                        }
                      }}
                      required
                      isInvalid={!!anioPorPeriodoError?.[periodosSeleccionados[periodoActual].id_periodo]}
                    />
                    {anioPorPeriodoError?.[periodosSeleccionados[periodoActual].id_periodo] && (
                      <Form.Control.Feedback type="invalid">
                        {anioPorPeriodoError[periodosSeleccionados[periodoActual].id_periodo]}
                      </Form.Control.Feedback>
                    )}
                    <Form.Text className="text-muted">
                      El año debe ser un valor numérico positivo
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3" controlId={`presupuesto_${periodosSeleccionados[periodoActual].id_periodo}`}>
                    <Form.Label className="fw-semibold">Presupuesto Asignado ($) <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      type="text" 
                      value={presupuestoPorPeriodo[periodosSeleccionados[periodoActual].id_periodo] || ''}
                      onChange={(e) => handlePresupuestoChange(e as React.ChangeEvent<HTMLInputElement>, periodosSeleccionados[periodoActual].id_periodo)}
                      isInvalid={!!presupuestoError}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {presupuestoError}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

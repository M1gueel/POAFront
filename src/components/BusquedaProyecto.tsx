import React from 'react';
import { Row, Col, Form, Table, Badge } from 'react-bootstrap';
import { Proyecto } from '../interfaces/project';

interface BusquedaProyectoProps {
  busquedaProyecto: string;
  mostrarBusqueda: boolean;
  isLoading: boolean;
  proyectosFiltrados: Proyecto[];
  setBusquedaProyecto: (value: string) => void;
  setMostrarBusqueda: (value: boolean) => void;
  seleccionarProyecto: (proyecto: Proyecto) => void;
  // Nuevas props opcionales para validación
  validarProyecto?: (proyecto: Proyecto) => Promise<{ esValido: boolean; razon?: string }>;
  mostrarValidacion?: boolean;
}

const BusquedaProyecto: React.FC<BusquedaProyectoProps> = ({
  busquedaProyecto,
  mostrarBusqueda,
  isLoading,
  proyectosFiltrados,
  setBusquedaProyecto,
  setMostrarBusqueda,
  seleccionarProyecto,
  validarProyecto,
  mostrarValidacion = false
}) => {
  const [validaciones, setValidaciones] = React.useState<{ [key: string]: { esValido: boolean; razon?: string } }>({});
  const [validandoProyectos, setValidandoProyectos] = React.useState(false);

  // Validar proyectos cuando cambie la lista filtrada
  React.useEffect(() => {
    const validarProyectosFiltrados = async () => {
      if (!validarProyecto || !mostrarValidacion || proyectosFiltrados.length === 0) {
        return;
      }

      setValidandoProyectos(true);
      const nuevasValidaciones: { [key: string]: { esValido: boolean; razon?: string } } = {};

      try {
        // Validar todos los proyectos en paralelo
        const promesasValidacion = proyectosFiltrados.map(async (proyecto) => {
          try {
            const resultado = await validarProyecto(proyecto);
            nuevasValidaciones[proyecto.id_proyecto] = resultado;
          } catch (error) {
            console.error(`Error validando proyecto ${proyecto.codigo_proyecto}:`, error);
            nuevasValidaciones[proyecto.id_proyecto] = { esValido: true }; // En caso de error, permitir selección
          }
        });

        await Promise.all(promesasValidacion);
        setValidaciones(nuevasValidaciones);
      } catch (error) {
        console.error('Error general validando proyectos:', error);
      } finally {
        setValidandoProyectos(false);
      }
    };

    validarProyectosFiltrados();
  }, [proyectosFiltrados, validarProyecto, mostrarValidacion]);

  const manejarSeleccionProyecto = (proyecto: Proyecto) => {
    if (mostrarValidacion && validaciones[proyecto.id_proyecto] && !validaciones[proyecto.id_proyecto].esValido) {
      // No permitir selección si no es válido
      return;
    }
    seleccionarProyecto(proyecto);
  };

  const obtenerEstiloFila = (proyecto: Proyecto) => {
    if (!mostrarValidacion || !validaciones[proyecto.id_proyecto]) {
      return { cursor: 'pointer' };
    }

    const validacion = validaciones[proyecto.id_proyecto];
    return {
      cursor: validacion.esValido ? 'pointer' : 'not-allowed',
      opacity: validacion.esValido ? 1 : 0.6,
      backgroundColor: validacion.esValido ? 'transparent' : '#f8f9fa'
    };
  };

  return (
    <Row>
      <Col md={12} className="mb-4">
        <Form.Group controlId="id_proyecto">
          <Form.Label className="fw-semibold">Proyecto Asociado <span className="text-danger">*</span></Form.Label>
          <div className="position-relative">
            <Form.Control
              type="text"
              placeholder="Buscar proyecto por código o título"
              value={busquedaProyecto}
              onChange={(e) => {
                setBusquedaProyecto(e.target.value);
                setMostrarBusqueda(true);
              }}
              onFocus={() => setMostrarBusqueda(true)}
              className="form-control-lg"
            />
           
            {/* Resultados de búsqueda */}
            {mostrarBusqueda && (
              <div
                className="position-absolute w-100 mt-1 shadow bg-white rounded border"
                style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}
              >
                {isLoading || validandoProyectos ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <span className="ms-2">
                      {isLoading ? 'Buscando proyectos...' : 'Validando disponibilidad...'}
                    </span>
                  </div>
                ) : (
                  <Table hover size="sm" className="mb-0">
                    <tbody>
                      {proyectosFiltrados.length > 0 ? (
                        proyectosFiltrados.map(proyecto => {
                          const validacion = validaciones[proyecto.id_proyecto];
                          return (
                            <tr
                              key={proyecto.id_proyecto}
                              onClick={() => manejarSeleccionProyecto(proyecto)}
                              style={obtenerEstiloFila(proyecto)}
                            >
                              <td style={{ width: '30%' }}>{proyecto.codigo_proyecto}</td>
                              <td style={{ width: mostrarValidacion ? '50%' : '70%' }}>
                                {proyecto.titulo}
                              </td>
                              {mostrarValidacion && (
                                <td style={{ width: '20%' }} className="text-end">
                                  {validacion ? (
                                    validacion.esValido ? (
                                      <Badge bg="success" className="ms-1">
                                        <i className="bi bi-check-circle me-1"></i>
                                        Disponible
                                      </Badge>
                                    ) : (
                                      <Badge bg="warning" className="ms-1" title={validacion.razon}>
                                        <i className="bi bi-exclamation-triangle me-1"></i>
                                        No disponible
                                      </Badge>
                                    )
                                  ) : (
                                    <Badge bg="secondary" className="ms-1">
                                      <div className="spinner-border spinner-border-sm" role="status" style={{ width: '12px', height: '12px' }}>
                                        <span className="visually-hidden">Validando...</span>
                                      </div>
                                    </Badge>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={mostrarValidacion ? 3 : 2} className="text-center py-2">
                            No se encontraron proyectos
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                )}
              </div>
            )}
          </div>
        </Form.Group>
      </Col>
    </Row>
  );
};

export default BusquedaProyecto;
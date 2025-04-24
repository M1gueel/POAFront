import React from 'react';
import { Row, Col, Form, Table } from 'react-bootstrap';

interface BusquedaProyectoProps {
  busquedaProyecto: string;
  mostrarBusqueda: boolean;
  isLoading: boolean;
  proyectosFiltrados: Proyecto[];
  setBusquedaProyecto: (value: string) => void;
  setMostrarBusqueda: (value: boolean) => void;
  seleccionarProyecto: (proyecto: Proyecto) => void;
}

const BusquedaProyecto: React.FC<BusquedaProyectoProps> = ({
  busquedaProyecto,
  mostrarBusqueda,
  isLoading,
  proyectosFiltrados,
  setBusquedaProyecto,
  setMostrarBusqueda,
  seleccionarProyecto
}) => {
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
                {isLoading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <span className="ms-2">Buscando proyectos...</span>
                  </div>
                ) : (
                  <Table hover size="sm" className="mb-0">
                    <tbody>
                      {proyectosFiltrados.length > 0 ? (
                        proyectosFiltrados.map(proyecto => (
                          <tr
                            key={proyecto.id_proyecto}
                            onClick={() => seleccionarProyecto(proyecto)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td>{proyecto.codigo_proyecto}</td>
                            <td>{proyecto.titulo}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="text-center py-2">No se encontraron proyectos</td>
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
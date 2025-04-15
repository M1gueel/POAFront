import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card, Row, Col, Table } from 'react-bootstrap';
import { Proyecto } from '../interfaces/project';
import { EstadoPOA, TipoPOA, Periodo } from '../interfaces/poa';
import { projectAPI } from '../api/projectAPI';
import { poaAPI } from '../api/poaAPI';
import PeriodoModal from './PeriodoModal';

const CrearPOA: React.FC = () => {
  // Estados para campos del formulario - actualizados conforme a la tabla SQL
  const [id_proyecto, setIdProyecto] = useState('');
  const [id_periodo, setIdPeriodo] = useState('');
  const [id_estado_poa, setIdEstadoPoa] = useState('');
  const [id_tipo_poa, setIdTipoPoa] = useState('');
  const [codigo_poa, setCodigoPoa] = useState('');
  const [anio_ejecucion, setAnioEjecucion] = useState('');
  const [presupuesto_asignado, setPresupuestoAsignado] = useState('0.00');
  
  // Estados adicionales para información complementaria
  const [fecha_inicio, setFechaInicio] = useState('');
  const [fecha_fin, setFechaFin] = useState('');
  
  // Estados para las listas de opciones
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [estadosPoa, setEstadosPoa] = useState<EstadoPOA[]>([]);
  const [tiposPoa, setTiposPoa] = useState<TipoPOA[]>([]);
  
  // Estado para proyectos filtrados para la búsqueda
  const [proyectosFiltrados, setProyectosFiltrados] = useState<Proyecto[]>([]);
  const [busquedaProyecto, setBusquedaProyecto] = useState('');
  const [mostrarBusqueda, setMostrarBusqueda] = useState(false);

  // Estado para el proyecto seleccionado completo (para pasar al modal)
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null);
  const [tipoPOASeleccionado, setTipoPOASeleccionado] = useState<TipoPOA | null>(null);

  // Estado para modal de creación de periodo
  const [showCrearPeriodo, setShowCrearPeriodo] = useState(false);
  
  // Estados para mostrar mensajes de carga o error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Obtener proyectos de la API
        const proyectosData = await projectAPI.getProyectos();
        setProyectos(proyectosData);
        setProyectosFiltrados(proyectosData);

        // Obtener estados de POA
        const estadosData = await poaAPI.getEstadosPOA();
        setEstadosPoa(estadosData);
        
        // Obtener tipos de POA
        const tiposData = await poaAPI.getTiposPOA();
        setTiposPoa(tiposData);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarDatos();
  }, []);

  // Efecto para actualizar el presupuesto máximo cuando se selecciona un tipo de POA
  useEffect(() => {
    if (id_tipo_poa) {
      const tipoPOASeleccionado = tiposPoa.find(tipo => tipo.id_tipo_poa === id_tipo_poa);
      if (tipoPOASeleccionado) {
        setPresupuestoAsignado(tipoPOASeleccionado.presupuesto_maximo.toString());
        setTipoPOASeleccionado(tipoPOASeleccionado);
      }
    }
  }, [id_tipo_poa, tiposPoa]);

  // Filtrar proyectos según la búsqueda
  useEffect(() => {
    const filtrarProyectos = async () => {
      if (busquedaProyecto.length > 0) {
        setIsLoading(true);
        try {
          // Usar el método getProyectos con filtro
          const filtrados = await projectAPI.getProyectos({
            codigo: busquedaProyecto,
            titulo: busquedaProyecto
          });
          setProyectosFiltrados(filtrados);
        } catch (err) {
          console.error('Error al filtrar proyectos:', err);
          // En caso de error, realizar filtrado en cliente con datos ya cargados
          const filtrados = proyectos.filter(proyecto => 
            proyecto.codigo_proyecto.toLowerCase().includes(busquedaProyecto.toLowerCase()) ||
            proyecto.titulo.toLowerCase().includes(busquedaProyecto.toLowerCase())
          );
          setProyectosFiltrados(filtrados);
        } finally {
          setIsLoading(false);
        }
      } else {
        setProyectosFiltrados(proyectos);
      }
    };
    // Debounce para evitar demasiadas llamadas API durante la escritura
    const timeoutId = setTimeout(() => {
      filtrarProyectos();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [busquedaProyecto, proyectos]);

  // Auto-generar código POA
  useEffect(() => {
    if (id_proyecto && id_tipo_poa && anio_ejecucion) {
      const proyectoSeleccionado = proyectos.find(p => p.id_proyecto === id_proyecto);
      const tipoSeleccionado = tiposPoa.find(t => t.id_tipo_poa === id_tipo_poa);
      
      if (proyectoSeleccionado && tipoSeleccionado) {
        // Formato: CÓDIGO-TIPO-AÑO-SECUENCIAL (el secuencial sería asignado por el backend)
        const codigoBase = `${proyectoSeleccionado.codigo_proyecto}-${tipoSeleccionado.codigo_tipo}-${anio_ejecucion}`;
        setCodigoPoa(`${codigoBase}-001`); // El secuencial sería generado por el backend
      }
    }
  }, [id_proyecto, id_tipo_poa, anio_ejecucion, proyectos, tiposPoa]);

  // Seleccionar un proyecto de la búsqueda
  const seleccionarProyecto = (proyecto: Proyecto) => {
    setIdProyecto(proyecto.id_proyecto);
    setProyectoSeleccionado(proyecto);
    setBusquedaProyecto(`${proyecto.codigo_proyecto} - ${proyecto.titulo}`);
    setMostrarBusqueda(false);
    
    // Si ya hay un tipo POA seleccionado, autoseleccionar según el tipo de proyecto
    if (proyecto.id_tipo_proyecto && tiposPoa.length > 0) {
      const tipoCorrespondiente = tiposPoa.find(
        tipo => tipo.codigo_tipo === proyecto.id_tipo_proyecto
      );
      if (tipoCorrespondiente) {
        setIdTipoPoa(tipoCorrespondiente.id_tipo_poa);
      }
    }
    
    // Obtener año de ejecución de la fecha de inicio del proyecto
    if (proyecto.fecha_inicio) {
      const anioInicio = new Date(proyecto.fecha_inicio).getFullYear().toString();
      setAnioEjecucion(anioInicio);
    }
  };

  // Manejar guardado de nuevos periodos
  const handleGuardarPeriodo = (periodosGuardados: Periodo[]) => {
    // Actualizar la lista de periodos
    setPeriodos(prevPeriodos => [...prevPeriodos, ...periodosGuardados]);
    
    // Seleccionar el primer periodo guardado
    if (periodosGuardados.length > 0) {
      const primerPeriodo = periodosGuardados[0];
      setIdPeriodo(primerPeriodo.id_periodo);
      setFechaInicio(primerPeriodo.fecha_inicio);
      setFechaFin(primerPeriodo.fecha_fin);
      if (primerPeriodo.anio) {
        setAnioEjecucion(primerPeriodo.anio);
      }
    }
    
    setShowCrearPeriodo(false);
  };

  // Manejar envío del formulario
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validar campos requeridos según la estructura de la tabla SQL
    if (!id_proyecto || !id_periodo || !id_estado_poa || !id_tipo_poa || !codigo_poa || !anio_ejecucion || !presupuesto_asignado) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }
    
    // Validar que el presupuesto esté dentro del rango permitido
    const presupuestoNum = parseFloat(presupuesto_asignado);
    const tipoPOASeleccionado = tiposPoa.find(tipo => tipo.id_tipo_poa === id_tipo_poa);
    
    if (tipoPOASeleccionado && presupuestoNum > tipoPOASeleccionado.presupuesto_maximo) {
      setError(`El presupuesto excede el máximo permitido para este tipo de POA (${tipoPOASeleccionado.presupuesto_maximo})`);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Datos a enviar al backend
      const datosPOA = {
        id_proyecto,
        id_periodo,
        id_estado_poa,
        id_tipo_poa,
        codigo_poa,
        anio_ejecucion,
        presupuesto_asignado: presupuestoNum,
        // La fecha_creacion se establecerá en el backend con GETDATE()
        // El id_poa se generará automáticamente con NEWID()
      };
      
      // Aquí iría la llamada a la API para guardar el POA
      console.log('Enviando datos del POA:', datosPOA);
      
      // Mock de respuesta exitosa
      alert('POA creado con éxito');
      
      // Redireccionar o limpiar formulario
      // window.location.href = `/poa/${poaCreado.id_poa}`;
      
    } catch (err) {
      const mensajeError = err instanceof Error ? err.message : 'Error al crear el POA';
      setError(mensajeError);
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Card className="shadow-lg">
        <Card.Header className="bg-primary bg-gradient text-white p-3">
          <h2 className="mb-0 fw-bold text-center">Crear Nuevo POA</h2>
        </Card.Header>
        <Card.Body className="p-4">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          
          <Form onSubmit={handleSubmit}>
            {/* Sección de Proyecto */}
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
            
            {/* Sección de Tipo POA */}
            <Row>
              <Col md={6} className="mb-4">
                <Form.Group controlId="id_tipo_poa">
                  <Form.Label className="fw-semibold">Tipo de POA <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={id_tipo_poa}
                    onChange={(e) => setIdTipoPoa(e.target.value)}
                    className="form-control-lg"
                    disabled={isLoading}
                  >
                    <option value="">Seleccione...</option>
                    {tiposPoa.map(tipo => (
                      <option key={tipo.id_tipo_poa} value={tipo.id_tipo_poa}>
                        {tipo.codigo_tipo} - {tipo.nombre} (Máx. {tipo.presupuesto_maximo})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6} className="mb-4">
                <Form.Group controlId="id_estado_poa">
                  <Form.Label className="fw-semibold">Estado <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={id_estado_poa}
                    onChange={(e) => setIdEstadoPoa(e.target.value)}
                    className="form-control-lg"
                    disabled={isLoading}
                  >
                    <option value="">Seleccione...</option>
                    {estadosPoa.map(estado => (
                      <option key={estado.id_estado_poa} value={estado.id_estado_poa}>
                        {estado.nombre} - {estado.descripcion}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            {/* Sección de Periodo con opción para crear nuevo */}
            <Row>
              <Col md={12} className="mb-4">
                <Form.Group controlId="id_periodo">
                  <Form.Label className="fw-semibold">Periodo <span className="text-danger">*</span></Form.Label>
                  <div className="d-flex">
                    <Form.Select
                      value={id_periodo}
                      onChange={(e) => {
                        const periodoId = e.target.value;
                        setIdPeriodo(periodoId);
                        
                        if (periodoId) {
                          const periodoSeleccionado = periodos.find(p => p.id_periodo === periodoId);
                          if (periodoSeleccionado) {
                            setFechaInicio(periodoSeleccionado.fecha_inicio);
                            setFechaFin(periodoSeleccionado.fecha_fin);
                            if (periodoSeleccionado.anio) {
                              setAnioEjecucion(periodoSeleccionado.anio);
                            }
                          }
                        }
                      }}
                      className="form-control-lg"
                      disabled={isLoading}
                    >
                      <option value="">Seleccione...</option>
                      {periodos.map(periodo => (
                        <option key={periodo.id_periodo} value={periodo.id_periodo}>
                          {periodo.nombre_periodo} ({periodo.fecha_inicio} al {periodo.fecha_fin})
                        </option>
                      ))}
                    </Form.Select>
                    <Button 
                      variant="outline-primary" 
                      className="ms-2"
                      onClick={() => setShowCrearPeriodo(true)}
                      disabled={!proyectoSeleccionado || !tipoPOASeleccionado}
                    >
                      <i className="bi bi-plus-circle me-1"></i> Nuevo Periodo
                    </Button>
                  </div>
                  {(!proyectoSeleccionado || !tipoPOASeleccionado) && (
                    <Form.Text className="text-muted">
                      Debe seleccionar un proyecto y un tipo de POA antes de crear un nuevo periodo.
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>
            
            {/* Sección de Fechas y presupuesto */}
            <Row>
              <Col md={4} className="mb-4">
                <Form.Group controlId="anio_ejecucion">
                  <Form.Label className="fw-semibold">Año de Ejecución <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={anio_ejecucion}
                    onChange={(e) => setAnioEjecucion(e.target.value)}
                    className="form-control-lg"
                    disabled={isLoading}
                    placeholder="Ej: 2024"
                  />
                </Form.Group>
              </Col>
              
              <Col md={4} className="mb-4">
                <Form.Group controlId="codigo_poa">
                  <Form.Label className="fw-semibold">Código POA <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={codigo_poa}
                    onChange={(e) => setCodigoPoa(e.target.value)}
                    className="form-control-lg"
                    disabled={isLoading}
                    placeholder="Se generará automáticamente"
                  />
                </Form.Group>
              </Col>
              
              <Col md={4} className="mb-4">
                <Form.Group controlId="presupuesto_asignado">
                  <Form.Label className="fw-semibold">Presupuesto Asignado <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    value={presupuesto_asignado}
                    onChange={(e) => setPresupuestoAsignado(e.target.value)}
                    className="form-control-lg"
                    disabled={isLoading}
                    placeholder="0.00"
                    step="0.01"
                  />
                  {tipoPOASeleccionado && (
                    <Form.Text className="text-muted">
                      Máximo permitido: {tipoPOASeleccionado.presupuesto_maximo}
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>
            
            {/* Fechas de inicio y fin del periodo seleccionado */}
            <Row>
              <Col md={6} className="mb-4">
                <Form.Group controlId="fecha_inicio">
                  <Form.Label className="fw-semibold">Fecha de Inicio del Periodo</Form.Label>
                  <Form.Control
                    type="date"
                    value={fecha_inicio}
                    className="form-control-lg"
                    disabled={true}
                  />
                </Form.Group>
              </Col>
              
              <Col md={6} className="mb-4">
                <Form.Group controlId="fecha_fin">
                  <Form.Label className="fw-semibold">Fecha de Fin del Periodo</Form.Label>
                  <Form.Control
                    type="date"
                    value={fecha_fin}
                    className="form-control-lg"
                    disabled={true}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            {/* Botones de acción */}
            <div className="d-flex justify-content-end mt-4">
              <Button variant="secondary" className="me-2" type="button">
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Guardando...
                  </>
                ) : 'Crear POA'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      {/* Modal para crear períodos */}
      <PeriodoModal
        show={showCrearPeriodo}
        onHide={() => setShowCrearPeriodo(false)}
        onSave={handleGuardarPeriodo}
        proyectoSeleccionado={proyectoSeleccionado}
        tipoPOASeleccionado={tipoPOASeleccionado}
      />
    </Container>
  );
};

export default CrearPOA;
import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card, Row, Col, Table, Modal } from 'react-bootstrap';
import { Proyecto } from '../interfaces/project';
import { EstadoPOA, TipoPOA, Periodo } from '../interfaces/poa';
import { poaAPI } from '../api/poaAPI';
import { projectAPI } from '../api/projectAPI';

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
  
  // Estado para el proyecto seleccionado
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null);

  // Estado para modal de creación de periodo
  const [showCrearPeriodo, setShowCrearPeriodo] = useState(false);
  const [nuevoPeriodo, setNuevoPeriodo] = useState<Partial<Periodo>>({
    codigo_periodo: '',
    nombre_periodo: '',
    fecha_inicio: '',
    fecha_fin: '',
    anio: '',
    mes: ''
  });
  
  // Estados para mostrar mensajes de carga o error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Obtener proyectos desde la API
        const proyectosData = await projectAPI.getProyectos();
        setProyectos(proyectosData);
        setProyectosFiltrados(proyectosData);

        // Cargar estados POA desde la API
        const estadosData = await poaAPI.getEstadosPOA();
        setEstadosPoa(estadosData);
        
        // Cargar tipos POA desde la API
        const tiposData = await poaAPI.getTiposPOA();
        setTiposPoa(tiposData);
        
        // Cargar periodos desde la API
        const periodosData = await poaAPI.getPeriodos();
        setPeriodos(periodosData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarDatos();
  }, []);

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

  // Seleccionar un proyecto de la búsqueda y establecer datos automáticamente
  const seleccionarProyecto = async (proyecto: Proyecto) => {
    setIdProyecto(proyecto.id_proyecto);
    setBusquedaProyecto(`${proyecto.codigo_proyecto} - ${proyecto.titulo}`);
    setMostrarBusqueda(false);
    setProyectoSeleccionado(proyecto);
    
    try {
      // Establecer el código POA basado en el código del proyecto
      setCodigoPoa(`${proyecto.codigo_proyecto}-POA`);
      
      // Establecer el año de ejecución basado en la fecha de inicio del proyecto
      if (proyecto.fecha_inicio) {
        const anio = new Date(proyecto.fecha_inicio).getFullYear().toString();
        setAnioEjecucion(anio);
      }
      
      // Obtener y establecer tipo POA basado en el tipo de proyecto
      if (proyecto.id_tipo_proyecto) {
        const tipoPoaCorrespondiente = await poaAPI.getTipoPOAByTipoProyecto(proyecto.nombre_tipo_proyecto || '');
        if (tipoPoaCorrespondiente) {
          setIdTipoPoa(tipoPoaCorrespondiente.id_tipo_poa);
          // Establecer presupuesto máximo del tipo POA
          setPresupuestoAsignado(tipoPoaCorrespondiente.presupuesto_maximo.toString());
        }
      }
    } catch (err) {
      console.error('Error al procesar el proyecto seleccionado:', err);
      setError('Error al cargar datos automáticos del proyecto');
    }
  };

  // Actualizar campos de fecha cuando se selecciona un periodo
  const handleSeleccionPeriodo = (e: React.ChangeEvent<any>) => {
    const periodoId = (e.target as HTMLSelectElement).value;
    setIdPeriodo(periodoId);
    
    if (periodoId) {
      const periodoSeleccionado = periodos.find(p => p.id_periodo === periodoId);
      if (periodoSeleccionado) {
        setFechaInicio(periodoSeleccionado.fecha_inicio);
        setFechaFin(periodoSeleccionado.fecha_fin);
      }
    }
  };

  // Manejo del envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!id_proyecto || !id_periodo || !id_estado_poa || !codigo_poa || !anio_ejecucion) {
      setError('Todos los campos marcados con * son obligatorios');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Datos a enviar para crear POA
      const datosPOA = {
        id_proyecto,
        id_periodo,
        id_tipo_poa,
        codigo_poa,
        anio_ejecucion,
        presupuesto_asignado: parseFloat(presupuesto_asignado),
      };
      
      // Llamar a la API para crear el POA
      const nuevoPOA = await poaAPI.crearPOA(datosPOA);
      
      // Mostrar mensaje de éxito y resetear el formulario o redirigir
      alert('POA creado con éxito');
      
      // Reset del formulario o redirección
      // window.location.href = '/poas'; // Descomenta para redirigir
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el POA');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar cambios en el presupuesto asignado (solo valores positivos)
  const handlePresupuestoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    // Verificar que sea un número positivo o vacío
    if (valor === '' || (parseFloat(valor) >= 0)) {
      setPresupuestoAsignado(valor);
    }
  };

  // Manejar la apertura del modal de creación de periodo
  const handleAbrirModalPeriodo = () => {
    // Inicializar con fechas por defecto
    const hoy = new Date();
    const inicioAnio = new Date(hoy.getFullYear(), 0, 1).toISOString().split('T')[0];
    const finAnio = new Date(hoy.getFullYear(), 11, 31).toISOString().split('T')[0];
    
    setNuevoPeriodo({
      codigo_periodo: `${hoy.getFullYear()}-B${Math.floor(Math.random() * 9) + 1}`,
      nombre_periodo: `Nuevo Periodo ${hoy.getFullYear()}`,
      fecha_inicio: inicioAnio,
      fecha_fin: finAnio,
      anio: hoy.getFullYear().toString(),
      mes: 'Enero-Diciembre'
    });
    
    setShowCrearPeriodo(true);
  };

  // Manejar cambios en el formulario de nuevo periodo
  const handleChangePeriodo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNuevoPeriodo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Guardar nuevo periodo
  const handleGuardarPeriodo = async () => {
    // Validación básica
    if (!nuevoPeriodo.codigo_periodo || !nuevoPeriodo.nombre_periodo || !nuevoPeriodo.fecha_inicio || !nuevoPeriodo.fecha_fin) {
      alert('Todos los campos son obligatorios');
      return;
    }

    try {
      // Llamar a la API para crear nuevo periodo
      const periodoCrado = await poaAPI.crearPeriodo({
        codigo_periodo: nuevoPeriodo.codigo_periodo!,
        nombre_periodo: nuevoPeriodo.nombre_periodo!,
        fecha_inicio: nuevoPeriodo.fecha_inicio!,
        fecha_fin: nuevoPeriodo.fecha_fin!,
        anio: nuevoPeriodo.anio,
        mes: nuevoPeriodo.mes
      });
      
      // Actualizar lista de periodos
      setPeriodos([...periodos, periodoCrado]);
      
      // Cerrar modal
      setShowCrearPeriodo(false);
      
      // Opcional: seleccionar el nuevo periodo
      setIdPeriodo(periodoCrado.id_periodo);
      
      alert('Periodo creado con éxito');
    } catch (err) {
      alert('Error al crear periodo: ' + (err instanceof Error ? err.message : 'Error desconocido'));
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
            
            {/* Sección de Periodo con opción para crear nuevo */}
            <Row>
              <Col md={12} className="mb-4">
                <Form.Group controlId="id_periodo">
                  <Form.Label className="fw-semibold">Periodo <span className="text-danger">*</span></Form.Label>
                  <div className="d-flex">
                    <Form.Control
                      as="select"
                      value={id_periodo}
                      onChange={handleSeleccionPeriodo}
                      className="form-control-lg"
                      disabled={isLoading}
                    >
                      <option value="">Seleccione...</option>
                      {periodos.map(periodo => (
                        <option key={periodo.id_periodo} value={periodo.id_periodo}>
                          {periodo.nombre_periodo} ({periodo.fecha_inicio} al {periodo.fecha_fin})
                        </option>
                      ))}
                    </Form.Control>
                    <Button 
                      variant="outline-primary" 
                      className="ms-2"
                      onClick={handleAbrirModalPeriodo}
                    >
                      <i className="bi bi-plus-circle"></i> Nuevo
                    </Button>
                  </div>
                </Form.Group>
              </Col>
            </Row>
            
            {/* Sección de Tipo POA - Ahora se selecciona automáticamente */}
            <Row>
              <Col md={6} className="mb-4">
                <Form.Group controlId="id_tipo_poa">
                  <Form.Label className="fw-semibold">Tipo de POA <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="select"
                    value={id_tipo_poa}
                    disabled={true} // Disabled porque se selecciona automáticamente
                    className="form-control-lg"
                  >
                    <option value="">Seleccione un proyecto primero...</option>
                    {tiposPoa.map(tipo => (
                      <option key={tipo.id_tipo_poa} value={tipo.id_tipo_poa}>
                        {tipo.codigo_tipo} - {tipo.nombre} (Máx. {tipo.presupuesto_maximo})
                      </option>
                    ))}
                  </Form.Control>
                  <Form.Text className="text-muted">
                    Se selecciona automáticamente según el tipo de proyecto
                  </Form.Text>
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
            
            {/* Sección de detalles del POA */}
            <Row>
              <Col md={4} className="mb-4">
                <Form.Group controlId="codigo_poa">
                  <Form.Label className="fw-semibold">Código POA <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={codigo_poa}
                    readOnly
                    className="form-control-lg"
                    placeholder="Se generará automáticamente al seleccionar proyecto"
                  />
                  <Form.Text className="text-muted">
                    Se genera automáticamente basado en el código del proyecto
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={4} className="mb-4">
                <Form.Group controlId="anio_ejecucion">
                  <Form.Label className="fw-semibold">Año de Ejecución <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={anio_ejecucion}
                    readOnly
                    placeholder="Se completará automáticamente"
                    className="form-control-lg"
                  />
                  <Form.Text className="text-muted">
                    Se establece según la fecha de inicio del proyecto
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={4} className="mb-4">
                <Form.Group controlId="presupuesto_asignado">
                  <Form.Label className="fw-semibold">Presupuesto Asignado ($) <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={presupuesto_asignado}
                    onChange={handlePresupuestoChange}
                    className="form-control-lg"
                  />
                  <Form.Text className="text-muted">
                    Se establece según el presupuesto máximo del tipo de POA
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            {/* Botones de acción */}
            <Row className="mt-4">
              <Col className="d-flex justify-content-end">
                <Button variant="secondary" className="me-2" size="lg">
                  Cancelar
                </Button>
                <Button variant="primary" type="submit" size="lg" disabled={isLoading}>
                  {isLoading ? 'Guardando...' : 'Guardar POA'}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
      
      {/* Modal para crear nuevo periodo */}
      <Modal show={showCrearPeriodo} onHide={() => setShowCrearPeriodo(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Crear Nuevo Periodo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="nuevoPeriodoCodigo">
              <Form.Label>Código del Periodo</Form.Label>
              <Form.Control
                type="text"
                name="codigo_periodo"
                value={nuevoPeriodo.codigo_periodo}
                onChange={handleChangePeriodo}
                placeholder="Ej: 2024-B1"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="nuevoPeriodoNombre">
              <Form.Label>Nombre del Periodo</Form.Label>
              <Form.Control
                type="text"
                name="nombre_periodo"
                value={nuevoPeriodo.nombre_periodo}
                onChange={handleChangePeriodo}
                placeholder="Ej: Primer Periodo 2024"
                required
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="nuevoPeriodoFechaInicio">
                  <Form.Label>Fecha de Inicio</Form.Label>
                  <Form.Control
                    type="date"
                    name="fecha_inicio"
                    value={nuevoPeriodo.fecha_inicio}
                    onChange={handleChangePeriodo}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3" controlId="nuevoPeriodoFechaFin">
                  <Form.Label>Fecha de Fin</Form.Label>
                  <Form.Control
                    type="date"
                    name="fecha_fin"
                    value={nuevoPeriodo.fecha_fin}
                    onChange={handleChangePeriodo}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="nuevoPeriodoAnio">
                  <Form.Label>Año</Form.Label>
                  <Form.Control
                    type="text"
                    name="anio"
                    value={nuevoPeriodo.anio}
                    onChange={handleChangePeriodo}
                    placeholder="Ej: 2024"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3" controlId="nuevoPeriodoMes">
                  <Form.Label>Meses</Form.Label>
                  <Form.Control
                    type="text"
                    name="mes"
                    value={nuevoPeriodo.mes}
                    onChange={handleChangePeriodo}
                    placeholder="Ej: Enero-Marzo"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCrearPeriodo(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleGuardarPeriodo}>
            Guardar Periodo
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CrearPOA;
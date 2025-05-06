import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card, Row, Col, ListGroup, Alert, Spinner, Tabs, Tab } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Proyecto } from '../interfaces/project';
import { Periodo } from '../interfaces/periodo';
import { poaAPI } from '../api/poaAPI';
import { projectAPI } from '../api/projectAPI';
import { actividadAPI } from '../api/actividadAPI';
import BusquedaProyecto from '../components/BusquedaProyecto';

// Usando la interfaz ActividadCreate definida en el proyecto
import { ActividadCreate, ActividadForm, POAConActividades } from '../interfaces/actividad';

const CrearActividades: React.FC = () => {
  const navigate = useNavigate();

  // Estados para el proyecto
  const [id_proyecto, setIdProyecto] = useState('');
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [proyectosFiltrados, setProyectosFiltrados] = useState<Proyecto[]>([]);
  const [busquedaProyecto, setBusquedaProyecto] = useState('');
  const [mostrarBusqueda, setMostrarBusqueda] = useState(false);

  // Estados para POAs y periodos
  const [poasProyecto, setPoasProyecto] = useState<any[]>([]);
  const [periodosProyecto, setPeriodosProyecto] = useState<Periodo[]>([]);
  
  // Estados para la pestaña activa de POA
  const [activePoaTab, setActivePoaTab] = useState('');

  // Estados para actividades (solo la descripción)
  const [actividades, setActividades] = useState<ActividadForm[]>([
    { id: '1', descripcion_actividad: '' }
  ]);

  // Estado para los presupuestos por actividad por POA
  const [poasConActividades, setPoasConActividades] = useState<POAConActividades[]>([]);

  // Estados para mensajes y carga
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  // Inicializar la estructura de poasConActividades cuando cambian las actividades o los POAs
  useEffect(() => {
    if (poasProyecto.length > 0 && actividades.length > 0) {
      const nuevosPoasConActividades = poasProyecto.map(poa => {
        // Buscar si ya existe este POA en el estado actual
        const poaExistente = poasConActividades.find(p => p.id_poa === poa.id_poa);
        
        // Si existe, mantener los valores de actividades que ya están
        if (poaExistente) {
          // Asegurar que tiene todas las actividades actuales
          const actividadesActualizadas = actividades.map(act => {
            const actividadExistente = poaExistente.actividades.find(a => a.actividad_id === act.id);
            return {
              actividad_id: act.id,
              total_por_actividad: actividadExistente ? actividadExistente.total_por_actividad : 0
            };
          });
          
          return {
            id_poa: poa.id_poa,
            codigo_poa: poa.codigo_poa,
            presupuesto_asignado: parseFloat(poa.presupuesto_asignado),
            actividades: actividadesActualizadas
          };
        }
        
        // Si no existe, crear nuevo con actividades en 0
        return {
          id_poa: poa.id_poa,
          codigo_poa: poa.codigo_poa,
          presupuesto_asignado: parseFloat(poa.presupuesto_asignado),
          actividades: actividades.map(act => ({
            actividad_id: act.id,
            total_por_actividad: 0
          }))
        };
      });
      
      setPoasConActividades(nuevosPoasConActividades);
      
      // Si no hay pestaña activa, seleccionar la primera
      if (!activePoaTab && nuevosPoasConActividades.length > 0) {
        setActivePoaTab(nuevosPoasConActividades[0].id_poa);
      }
    }
  }, [poasProyecto, actividades]);

  // Seleccionar un proyecto y cargar sus POAs
  const seleccionarProyecto = async (proyecto: Proyecto) => {
    setIdProyecto(proyecto.id_proyecto);
    setBusquedaProyecto(`${proyecto.codigo_proyecto} - ${proyecto.titulo}`);
    setMostrarBusqueda(false);
    setProyectoSeleccionado(proyecto);
    
    try {
      setIsLoading(true);
      
      // Cargar los POAs del proyecto seleccionado
      const poasData = await poaAPI.getPOAsByProyecto(proyecto.id_proyecto);
      setPoasProyecto(poasData);
      
      // Extraer los periodos de los POAs
      const periodos: Periodo[] = [];
      for (const poa of poasData) {
        if (poa.periodo) {
          periodos.push(poa.periodo);
        }
      }
      
      setPeriodosProyecto(periodos);
      
      // Restablecer las actividades al seleccionar un nuevo proyecto
      setActividades([{ id: '1', descripcion_actividad: '' }]);
      
      // Restablecer los POAs con actividades
      setPoasConActividades([]);
      
      // Restablecer la pestaña activa
      setActivePoaTab('');
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error al cargar POAs del proyecto:', err);
      setError('Error al cargar los POAs asociados al proyecto');
      setIsLoading(false);
    }
  };

  // Manejar cambios en las actividades (descripción)
  const handleActividadChange = (id: string, value: string) => {
    const nuevasActividades = actividades.map(act => 
      act.id === id ? { ...act, descripcion_actividad: value } : act
    );
    setActividades(nuevasActividades);
  };

  // Manejar cambios en el total por actividad para un POA específico
  const handleTotalActividadChange = (poaId: string, actividadId: string, value: string) => {
    const monto = parseFloat(value) || 0;
    
    const nuevosPoasConActividades = poasConActividades.map(poa => {
      if (poa.id_poa === poaId) {
        const nuevasActividades = poa.actividades.map(act => {
          if (act.actividad_id === actividadId) {
            return { ...act, total_por_actividad: monto };
          }
          return act;
        });
        return { ...poa, actividades: nuevasActividades };
      }
      return poa;
    });
    
    setPoasConActividades(nuevosPoasConActividades);
  };

  // Agregar nueva actividad
  const agregarActividad = () => {
    const nuevaActividad = {
      id: Date.now().toString(),
      descripcion_actividad: ''
    };
    setActividades([...actividades, nuevaActividad]);
  };

  // Eliminar actividad
  const eliminarActividad = (id: string) => {
    if (actividades.length > 1) {
      const nuevasActividades = actividades.filter(act => act.id !== id);
      setActividades(nuevasActividades);
      
      // También eliminar esta actividad de los POAs
      const nuevosPoasConActividades = poasConActividades.map(poa => {
        return {
          ...poa,
          actividades: poa.actividades.filter(act => act.actividad_id !== id)
        };
      });
      
      setPoasConActividades(nuevosPoasConActividades);
    } else {
      setError('Debe haber al menos una actividad');
    }
  };

  // Calcular el total presupuestado para un POA específico
  const calcularTotalPresupuestado = (poaId: string): number => {
    const poa = poasConActividades.find(p => p.id_poa === poaId);
    if (!poa) return 0;
    
    return poa.actividades.reduce((total, act) => total + act.total_por_actividad, 0);
  };

  // Calcular el porcentaje del presupuesto utilizado para un POA específico
  const calcularPorcentajeUtilizado = (poaId: string): number => {
    const poa = poasConActividades.find(p => p.id_poa === poaId);
    if (!poa || poa.presupuesto_asignado === 0) return 0;
    
    const totalAsignado = calcularTotalPresupuestado(poaId);
    return (totalAsignado / poa.presupuesto_asignado) * 100;
  };

  // Validar el formulario
  const validarFormulario = (): boolean => {
    // Validar que haya un proyecto seleccionado
    if (!proyectoSeleccionado) {
      setError('Debe seleccionar un proyecto');
      return false;
    }

    // Validar que el proyecto tenga POAs
    if (poasProyecto.length === 0) {
      setError('El proyecto seleccionado no tiene POAs asociados');
      return false;
    }

    // Validar que todas las actividades tengan descripción
    const actividadesVacias = actividades.some(act => act.descripcion_actividad.trim() === '');
    if (actividadesVacias) {
      setError('Todas las actividades deben tener una descripción');
      return false;
    }

    // Validar que todas las actividades tengan un total mayor a cero en cada POA
    for (const poa of poasConActividades) {
      const actividadesSinMonto = poa.actividades.some(act => act.total_por_actividad <= 0);
      if (actividadesSinMonto) {
        setError(`Todas las actividades deben tener un total mayor a cero en el POA ${poa.codigo_poa}`);
        setActivePoaTab(poa.id_poa);
        return false;
      }
      
      // Validar que el total no supere el presupuesto del POA
      const totalPresupuestado = calcularTotalPresupuestado(poa.id_poa);
      if (totalPresupuestado > poa.presupuesto_asignado) {
        setError(`El total de las actividades (${totalPresupuestado.toLocaleString('es-CO')}) supera el presupuesto del POA ${poa.codigo_poa} (${poa.presupuesto_asignado.toLocaleString('es-CO')})`);
        setActivePoaTab(poa.id_poa);
        return false;
      }
    }

    return true;
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Array para almacenar las promesas de creación de actividades
      const promesas = [];
      
      // Para cada POA, crear sus actividades con los montos específicos
      for (const poa of poasConActividades) {
        // Preparar las actividades para este POA específico
        const actividadesParaEnviar: ActividadCreate[] = actividades.map(act => {
          // Encontrar el monto asignado a esta actividad para este POA
          const actividadPoa = poa.actividades.find(a => a.actividad_id === act.id);
          const monto = actividadPoa ? actividadPoa.total_por_actividad : 0;
          
          return {
            descripcion_actividad: act.descripcion_actividad,
            total_por_actividad: monto,
            saldo_actividad: monto // Asignar el mismo valor al saldo inicial
          };
        });
        
        // Crear las actividades para este POA
        promesas.push(
          actividadAPI.crearActividadesPorPOA(poa.id_poa, actividadesParaEnviar)
        );
      }
      
      // Esperar a que todas las promesas se resuelvan
      const resultados = await Promise.all(promesas);
      
      setSuccess(`Se han creado exitosamente las actividades para ${poasProyecto.length} POAs del proyecto`);
      
      // Reiniciar el formulario
      setActividades([{ id: '1', descripcion_actividad: '' }]);
      setPoasConActividades([]);
      
      // Opcional: redirigir a otra página después de un tiempo
      setTimeout(() => {
        navigate('/poas');
      }, 3000);
      
    } catch (err) {
      console.error('Error al crear actividades:', err);
      setError(err instanceof Error ? err.message : 'Error al crear las actividades');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Card className="shadow-lg">
        <Card.Header className="bg-primary bg-gradient text-white p-3">
          <h2 className="mb-0 fw-bold text-center">Crear Actividades para Proyecto</h2>
        </Card.Header>
        <Card.Body className="p-4">
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
              {success}
            </Alert>
          )}
          
          <Form onSubmit={handleSubmit}>
            {/* Sección de Búsqueda de Proyecto */}
            <BusquedaProyecto 
              busquedaProyecto={busquedaProyecto}
              mostrarBusqueda={mostrarBusqueda}
              isLoading={isLoading}
              proyectosFiltrados={proyectosFiltrados}
              setBusquedaProyecto={setBusquedaProyecto}
              setMostrarBusqueda={setMostrarBusqueda}
              seleccionarProyecto={seleccionarProyecto}
            />
            
            {/* Información del Proyecto Seleccionado */}
            {proyectoSeleccionado && (
              <Row className="mb-4">
                <Col md={12}>
                  <Card className="bg-light">
                    <Card.Body>
                      <h5 className="mb-3">Información del Proyecto Seleccionado</h5>
                      <Row>
                        <Col md={6}>
                          <p><strong>Código:</strong> {proyectoSeleccionado.codigo_proyecto}</p>
                          <p><strong>Título:</strong> {proyectoSeleccionado.titulo}</p>
                          <p><strong>Fecha Inicio:</strong> {proyectoSeleccionado.fecha_inicio}</p>
                        </Col>
                        <Col md={6}>
                          <p><strong>Fecha Fin:</strong> {proyectoSeleccionado.fecha_fin}</p>
                          <p><strong>Presupuesto Aprobado:</strong> ${parseFloat(proyectoSeleccionado.presupuesto_aprobado.toString()).toLocaleString('es-CO')}</p>
                          <p><strong>POAs Asociados:</strong> {poasProyecto.length}</p>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
            
            {/* Información de los POAs del Proyecto */}
            {proyectoSeleccionado && poasProyecto.length > 0 && (
              <Row className="mb-4">
                <Col md={12}>
                  <Card>
                    <Card.Header className="bg-light">
                      <h5 className="mb-0">POAs Asociados al Proyecto</h5>
                    </Card.Header>
                    <Card.Body>
                      <ListGroup>
                        {poasProyecto.map((poa, index) => (
                          <ListGroup.Item key={poa.id_poa} className="mb-2">
                            <Row>
                              <Col md={6}>
                                <p className="mb-1"><strong>Código POA:</strong> {poa.codigo_poa}</p>
                                <p className="mb-1"><strong>Año Ejecución:</strong> {poa.anio_ejecucion}</p>
                              </Col>
                              <Col md={6}>
                                <p className="mb-1"><strong>Presupuesto:</strong> ${parseFloat(poa.presupuesto_asignado).toLocaleString('es-CO')}</p>
                                <p className="mb-1"><strong>Periodo:</strong> {poa.periodo ? poa.periodo.nombre_periodo : 'N/A'}</p>
                              </Col>
                            </Row>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
            
            {/* Sección de descripción de actividades (común para todos los POAs) */}
            {proyectoSeleccionado && poasProyecto.length > 0 && (
              <Row className="mb-4">
                <Col md={12}>
                  <Card>
                    <Card.Header className="bg-light">
                      <h5 className="mb-0">Descripción de Actividades</h5>
                      <p className="text-muted small mb-0">
                        Estas actividades se crearán para todos los POAs asociados al proyecto
                      </p>
                    </Card.Header>
                    <Card.Body>
                      {actividades.map((actividad, index) => (
                        <Row key={actividad.id} className="mb-3 align-items-center">
                          <Col md={10}>
                            <Form.Group controlId={`actividad-${actividad.id}`}>
                              <Form.Label>Actividad {index + 1}</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={2}
                                value={actividad.descripcion_actividad}
                                onChange={(e) => handleActividadChange(actividad.id, e.target.value)}
                                placeholder="Describa la actividad"
                                required
                              />
                            </Form.Group>
                          </Col>
                          <Col md={2} className="d-flex align-items-end justify-content-center">
                            <Button 
                              variant="outline-danger"
                              onClick={() => eliminarActividad(actividad.id)}
                              disabled={actividades.length <= 1}
                              className="mb-2"
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </Col>
                        </Row>
                      ))}
                      
                      <Button 
                        variant="outline-primary" 
                        onClick={agregarActividad}
                        className="mt-2"
                      >
                        <i className="bi bi-plus-circle me-1"></i> Agregar Actividad
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
            
            {/* Asignación de presupuesto por POA */}
            {proyectoSeleccionado && poasProyecto.length > 0 && actividades.length > 0 && poasConActividades.length > 0 && (
              <Row className="mb-4">
                <Col md={12}>
                  <Card>
                    <Card.Header className="bg-light">
                      <h5 className="mb-0">Presupuesto por POA</h5>
                      <p className="text-muted small mb-0">
                        Asigne el presupuesto para cada actividad en cada POA
                      </p>
                    </Card.Header>
                    <Card.Body>
                      <Tabs
                        activeKey={activePoaTab}
                        onSelect={(k) => k && setActivePoaTab(k)}
                        className="mb-4"
                      >
                        {poasConActividades.map((poa) => (
                          <Tab 
                            key={poa.id_poa} 
                            eventKey={poa.id_poa} 
                            title={`POA ${poa.codigo_poa}`}
                          >
                            {/* Barra de progreso para este POA */}
                            <Row className="mb-4">
                              <Col md={12}>
                                <Alert variant={
                                  calcularPorcentajeUtilizado(poa.id_poa) > 100 ? "danger" : 
                                  calcularPorcentajeUtilizado(poa.id_poa) > 90 ? "warning" : "info"
                                }>
                                  <div className="d-flex justify-content-between">
                                    <div>
                                      <strong>Presupuesto POA:</strong> ${poa.presupuesto_asignado.toLocaleString('es-CO')}
                                    </div>
                                    <div>
                                      <strong>Total Asignado:</strong> ${calcularTotalPresupuestado(poa.id_poa).toLocaleString('es-CO')} 
                                      ({calcularPorcentajeUtilizado(poa.id_poa).toFixed(2)}% utilizado)
                                    </div>
                                  </div>
                                  <div className="progress mt-2">
                                    <div 
                                      className={`progress-bar ${
                                        calcularPorcentajeUtilizado(poa.id_poa) > 100 ? 'bg-danger' : 
                                        calcularPorcentajeUtilizado(poa.id_poa) > 90 ? 'bg-warning' : 'bg-success'
                                      }`}
                                      role="progressbar" 
                                      style={{width: `${Math.min(calcularPorcentajeUtilizado(poa.id_poa), 100)}%`}}
                                      aria-valuenow={Math.min(calcularPorcentajeUtilizado(poa.id_poa), 100)}
                                      aria-valuemin={0}
                                      aria-valuemax={100}
                                    ></div>
                                  </div>
                                </Alert>
                              </Col>
                            </Row>
                            
                            {/* Formulario de actividades para este POA */}
                            <ListGroup>
                              {actividades.map((actividad, index) => {
                                // Encontrar la actividad correspondiente en este POA
                                const actividadPoa = poa.actividades.find(a => a.actividad_id === actividad.id);
                                const totalActividad = actividadPoa ? actividadPoa.total_por_actividad : 0;
                                
                                return (
                                  <ListGroup.Item key={actividad.id} className="mb-2">
                                    <Row>
                                      <Col md={8}>
                                        <p className="mb-2"><strong>Actividad {index + 1}:</strong></p>
                                        <p className="mb-2">{actividad.descripcion_actividad}</p>
                                      </Col>
                                      <Col md={4}>
                                        <Form.Group controlId={`total-${poa.id_poa}-${actividad.id}`}>
                                          <Form.Label>Total por Actividad</Form.Label>
                                          <Form.Control
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={totalActividad}
                                            onChange={(e) => handleTotalActividadChange(poa.id_poa, actividad.id, e.target.value)}
                                            placeholder="Presupuesto"
                                            required
                                          />
                                        </Form.Group>
                                      </Col>
                                    </Row>
                                  </ListGroup.Item>
                                );
                              })}
                            </ListGroup>
                          </Tab>
                        ))}
                      </Tabs>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
            
            {/* Botones de acción */}
            <Row>
              <Col md={12} className="d-flex justify-content-end gap-2">
                <Button variant="secondary" type="button" onClick={() => navigate('/poas')}>
                  Cancelar
                </Button>
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={isLoading || !proyectoSeleccionado || poasProyecto.length === 0}
                >
                  {isLoading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Guardando...
                    </>
                  ) : 'Crear Actividades'}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CrearActividades;
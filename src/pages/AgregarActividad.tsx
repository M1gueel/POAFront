import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card, Row, Col, ListGroup, Spinner, Tabs, Tab, Toast, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Proyecto } from '../interfaces/project';
import { Periodo } from '../interfaces/periodo';
import { poaAPI } from '../api/poaAPI';
import { projectAPI } from '../api/projectAPI';
import { actividadAPI } from '../api/actividadAPI';
import BusquedaProyecto from '../components/BusquedaProyecto';

// Interfaces para actividades
import { ActividadCreate, ActividadForm, POAConActividades } from '../interfaces/actividad';

// Importamos la lista de actividades
import { getActividadesPorTipoPOA, ActividadOpciones } from '../utils/listaActividades';

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

  // Estado para los POAs con actividades seleccionadas
  const [poasConActividades, setPoasConActividades] = useState<POAConActividades[]>([]);

  // Estado para almacenar las actividades disponibles según el tipo de POA
  const [actividadesDisponiblesPorPoa, setActividadesDisponiblesPorPoa] = useState<{[key: string]: ActividadOpciones[]}>({});

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

  // Inicializar las actividades disponibles por tipo de POA cuando cambian los POAs del proyecto
  useEffect(() => {
    const nuevasActividadesDisponibles: {[key: string]: ActividadOpciones[]} = {};
    
    poasProyecto.forEach(poa => {
      const tipoPOA = poa.tipo_poa || 'PIM'; // Valor por defecto si no hay tipo
      nuevasActividadesDisponibles[poa.id_poa] = getActividadesPorTipoPOA(tipoPOA);
    });
    
    setActividadesDisponiblesPorPoa(nuevasActividadesDisponibles);
    
  }, [poasProyecto]);

  // Inicializar la estructura de poasConActividades cuando cambian los POAs
  useEffect(() => {
    if (poasProyecto.length > 0) {
      const nuevosPoasConActividades = poasProyecto.map(poa => ({
        id_poa: poa.id_poa,
        codigo_poa: poa.codigo_poa,
        tipo_poa: poa.tipo_poa || 'PIM',
        presupuesto_asignado: parseFloat(poa.presupuesto_asignado),
        actividades: [] // Comienza con actividades vacías
      }));
      
      setPoasConActividades(nuevosPoasConActividades);
      
      // Si no hay pestaña activa, seleccionar la primera
      if (!activePoaTab && nuevosPoasConActividades.length > 0) {
        setActivePoaTab(nuevosPoasConActividades[0].id_poa);
      }
    }
  }, [poasProyecto]);

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

  // Agregar nueva actividad en un POA específico
  const agregarActividad = (poaId: string) => {
    const nuevaActividadId = Date.now().toString();
    
    // Si es el primer POA, replicar la nueva actividad a todos los POAs
    const isFirstPoa = poasConActividades.length > 0 && poasConActividades[0].id_poa === poaId;
    
    // Actualizar el estado de POAs con actividades
    const nuevosPoasConActividades = poasConActividades.map(poa => {
      // Si es el primer POA o si se debe replicar la actividad
      if (poa.id_poa === poaId || (isFirstPoa && poa.id_poa !== poaId)) {
        return {
          ...poa,
          actividades: [
            ...poa.actividades,
            {
              actividad_id: nuevaActividadId,
              codigo_actividad: ""
            }
          ]
        };
      }
      return poa;
    });
    
    setPoasConActividades(nuevosPoasConActividades);
  };

  // Eliminar actividad de un POA específico
  const eliminarActividad = (poaId: string, actividadId: string) => {
    // Si es el primer POA, eliminar la actividad de todos los POAs
    const isFirstPoa = poasConActividades.length > 0 && poasConActividades[0].id_poa === poaId;
    
    // Actualizar el estado de POAs con actividades
    const nuevosPoasConActividades = poasConActividades.map(poa => {
      // Si es el primer POA o si se debe eliminar la actividad de otros POAs
      if (poa.id_poa === poaId || (isFirstPoa && poa.id_poa !== poaId)) {
        return {
          ...poa,
          actividades: poa.actividades.filter(act => act.actividad_id !== actividadId)
        };
      }
      return poa;
    });
    
    setPoasConActividades(nuevosPoasConActividades);
  };

  // Manejar cambios en la selección de actividad para un POA específico
  const handleActividadSeleccionChange = (poaId: string, actividadId: string, codigoActividad: string) => {
    // Primero encontramos la actividad correspondiente al código seleccionado
    const actividadesDisponibles = actividadesDisponiblesPorPoa[poaId] || [];
    const actividadSeleccionada = actividadesDisponibles.find(act => act.id === codigoActividad);
    
    // Si es el primer POA, actualizar todos los POAs con la misma actividad
    const isFirstPoa = poasConActividades.length > 0 && poasConActividades[0].id_poa === poaId;
    
    // Actualizar el código de actividad en poasConActividades
    const nuevosPoasConActividades = poasConActividades.map(poa => {
      // Si es el mismo POA o si es el primer POA (y se debe replicar)
      if (poa.id_poa === poaId || (isFirstPoa && poa.id_poa !== poaId)) {
        const nuevasActividades = poa.actividades.map(act => {
          if (act.actividad_id === actividadId) {
            return { ...act, codigo_actividad: codigoActividad };
          }
          return act;
        });
        return { ...poa, actividades: nuevasActividades };
      }
      return poa;
    });
    
    setPoasConActividades(nuevosPoasConActividades);
  };

  // Obtener la descripción de una actividad a partir de su código
  const getDescripcionActividad = (poaId: string, codigoActividad: string) => {
    const actividadesDisponibles = actividadesDisponiblesPorPoa[poaId] || [];
    const actividad = actividadesDisponibles.find(act => act.id === codigoActividad);
    return actividad ? actividad.descripcion : 'Seleccione una actividad';
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

    // Validar que haya al menos una actividad definida
    const hayActividadesDefinidas = poasConActividades.some(poa => poa.actividades.length > 0);
    if (!hayActividadesDefinidas) {
      setError('Debe definir al menos una actividad');
      return false;
    }

    // Validar que todas las actividades tengan una actividad seleccionada en cada POA
    for (const poa of poasConActividades) {
      if (poa.actividades.length === 0) continue; // Saltamos si no hay actividades
      
      const actividadesSinSeleccionar = poa.actividades.some(act => !act.codigo_actividad);
      if (actividadesSinSeleccionar) {
        setError(`Todas las actividades deben tener una opción seleccionada en el POA ${poa.codigo_poa}`);
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
      
      // Para cada POA, crear sus actividades seleccionadas
      for (const poa of poasConActividades) {
        // Preparar las actividades para este POA específico
        const actividadesParaEnviar: ActividadCreate[] = poa.actividades.map(actPoa => {
          return {
            descripcion_actividad: getDescripcionActividad(poa.id_poa, actPoa.codigo_actividad),
            total_por_actividad: 0, // Inicializar en 0, se calculará después con las tareas
            saldo_actividad: 0 // Inicializar en 0, se calculará después con las tareas
          };
        });
        
        // Crear las actividades para este POA solo si hay actividades para enviar
        if (actividadesParaEnviar.length > 0) {
          promesas.push(
            actividadAPI.crearActividadesPorPOA(poa.id_poa, actividadesParaEnviar)
          );
        }
      }
      
      // Esperar a que todas las promesas se resuelvan
      await Promise.all(promesas);
      
      setSuccess(`Se han creado exitosamente las actividades para ${poasProyecto.length} POAs del proyecto`);
      
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
                                <p className="mb-1"><strong>Tipo:</strong> {poa.tipo_poa || 'No especificado'}</p>
                              </Col>
                              <Col md={6}>
                                <p className="mb-1"><strong>Presupuesto Asignado:</strong> ${parseFloat(poa.presupuesto_asignado).toLocaleString('es-CO')}</p>
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
            )}
            
            {/* Sección de actividades por POA */}
            {proyectoSeleccionado && poasProyecto.length > 0 && (
              <Row className="mb-4">
                <Col md={12}>
                  <Card>
                    <Card.Header className="bg-light">
                      <h5 className="mb-0">Definición de Actividades por POA</h5>
                      <p className="text-muted small mb-0">
                        Las actividades añadidas en el primer POA se replicarán automáticamente en los demás POAs
                      </p>
                    </Card.Header>
                    <Card.Body>
                      {/* Tabs para POAs */}
                      <Tabs
                        activeKey={activePoaTab}
                        onSelect={(k) => setActivePoaTab(k || '')}
                        className="mb-4"
                        fill
                      >
                        {poasConActividades.map((poa, poaIndex) => (
                          <Tab 
                            key={poa.id_poa} 
                            eventKey={poa.id_poa} 
                            title={`${poa.codigo_poa}`}
                          >
                            <Card className="border-top-0 rounded-0 rounded-bottom">
                              <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  <h6 className="mb-0">{`Actividades para el periodo: ${poa.codigo_poa} - Tipo de POA: ${poa.tipo_poa}`}</h6>
                                  <Button 
                                    variant="success" 
                                    size="sm"
                                    onClick={() => agregarActividad(poa.id_poa)}
                                  >
                                    <i className="bi bi-plus-circle"></i> Agregar Actividad
                                  </Button>
                                </div>
                                
                                {poa.actividades.length === 0 ? (
                                  <Alert variant="info">
                                    No hay actividades definidas para este POA. Haga clic en "Agregar Actividad" para comenzar.
                                  </Alert>
                                ) : (
                                  poa.actividades.map((actividad, actIndex) => (
                                    <div key={`${poa.id_poa}-${actividad.actividad_id}`} className="mb-4 pb-3 border-bottom">
                                      <div className="d-flex justify-content-between align-items-center mb-2">
                                        <h6>Actividad {actIndex + 1}</h6>
                                        <Button 
                                          variant="danger" 
                                          size="sm"
                                          onClick={() => eliminarActividad(poa.id_poa, actividad.actividad_id)}
                                        >
                                          <i className="bi bi-trash"></i> Eliminar
                                        </Button>
                                      </div>
                                      
                                      <Form.Group className="mb-3">
                                        <Form.Label>Seleccione una actividad</Form.Label>
                                        <Form.Select
                                          value={actividad.codigo_actividad}
                                          onChange={(e) => handleActividadSeleccionChange(
                                            poa.id_poa, 
                                            actividad.actividad_id, 
                                            e.target.value
                                          )}
                                          required
                                        >
                                          <option value="">-- Seleccione una actividad --</option>
                                          {(actividadesDisponiblesPorPoa[poa.id_poa] || []).map((opcion) => (
                                            <option key={opcion.id} value={opcion.id}>
                                              {/* {opcion.id} - {opcion.descripcion} */}
                                              {opcion.descripcion}
                                            </option>
                                          ))}
                                        </Form.Select>
                                      </Form.Group>
                                      
                                      {/* Se eliminó el bloque condicional que mostraba la descripción */}
                                    </div>
                                  ))
                                )}
                                
                                {poaIndex === 0 && poa.actividades.length > 0 && (
                                  <Alert variant="warning" className="mt-3">
                                    <i className="bi bi-info-circle me-2"></i>
                                    Las actividades añadidas en este POA se replicarán en los demás POAs automáticamente.
                                  </Alert>
                                )}
                              </Card.Body>
                            </Card>
                          </Tab>
                        ))}
                      </Tabs>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Botones del formulario */}
            <Row className="mt-4">
              <Col md={12} className="d-flex justify-content-between">
                <Button 
                  variant="secondary" 
                  onClick={() => navigate('/poas')}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={isLoading || !proyectoSeleccionado || poasProyecto.length === 0}
                >
                  {isLoading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Actividades'
                  )}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Modal o spinner para indicar carga */}
      {isLoading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-50" style={{ zIndex: 1050 }}>
          <div className="bg-white p-4 rounded shadow-lg text-center">
            <Spinner animation="border" role="status" variant="primary" className="mb-3" />
            <p className="mb-0">Procesando su solicitud...</p>
          </div>
        </div>
      )}

      {/* Toast para mensajes */}
      <div 
        className="position-fixed bottom-0 end-0 p-3" 
        style={{ zIndex: 1055 }}
      >
        {error && (
          <Toast 
            onClose={() => setError(null)}
            show={!!error}
            delay={5000}
            autohide
            bg="danger"
            text="white"
          >
            <Toast.Header closeButton>
              <strong className="me-auto">Error</strong>
            </Toast.Header>
            <Toast.Body>{error}</Toast.Body>
          </Toast>
        )}
        
        {success && (
          <Toast 
            onClose={() => setSuccess(null)}
            show={!!success}
            delay={5000}
            autohide
            bg="success"
            text="white"
          >
            <Toast.Header closeButton>
              <strong className="me-auto">Éxito</strong>
            </Toast.Header>
            <Toast.Body>{success}</Toast.Body>
          </Toast>
        )}
      </div>
    </Container>
  );
};

export default CrearActividades;
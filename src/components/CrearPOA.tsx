import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card, Row, Col, Table, Modal } from 'react-bootstrap';
import { Proyecto } from '../interfaces/project';
import { EstadoPOA, TipoPOA, Periodo } from '../interfaces/poa';
import { poaAPI } from '../api/poaAPI';
import { projectAPI } from '../api/projectAPI';
import '../styles/NuevoPOA.css';

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

  // Estado para los periodos calculados del proyecto
  const [periodosCalculados, setPeriodosCalculados] = useState<Periodo[]>([]);
  
  // Estado para el presupuesto máximo (desde el proyecto)
  const [presupuestoMaximo, setPresupuestoMaximo] = useState<number>(0);
  const [presupuestoError, setPresupuestoError] = useState<string | null>(null);

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

  // Calcular periodos fiscales basados en las fechas del proyecto
  const calcularPeriodos = (fechaInicio: string, fechaFin: string): Periodo[] => {
    if (!fechaInicio || !fechaFin) return [];
    
    const periodos: Periodo[] = [];
    const fechaInicioObj = new Date(fechaInicio);
    const fechaFinObj = new Date(fechaFin);
    
    // Año inicial
    const anioInicio = fechaInicioObj.getFullYear();
    const anioFin = fechaFinObj.getFullYear();
    
    // Iterar por cada año entre la fecha de inicio y fin
    for (let anio = anioInicio; anio <= anioFin; anio++) {
      let periodoInicio: Date;
      let periodoFin: Date;
      
      // Para el primer año, usar la fecha de inicio del proyecto
      if (anio === anioInicio) {
        periodoInicio = new Date(fechaInicioObj);
      } else {
        // Para los años subsiguientes, iniciar el 1 de enero
        periodoInicio = new Date(anio, 0, 1);
      }
      
      // Para el último año, usar la fecha de fin del proyecto
      if (anio === anioFin) {
        periodoFin = new Date(fechaFinObj);
      } else {
        // Para los años anteriores al final, terminar el 31 de diciembre
        periodoFin = new Date(anio, 11, 31);
      }
      
      // Formatear fechas para guardar
      const inicioStr = periodoInicio.toISOString().split('T')[0];
      const finStr = periodoFin.toISOString().split('T')[0];
      
      // Determinar los meses del periodo
      const mesInicio = periodoInicio.getMonth();
      const mesFin = periodoFin.getMonth();
      
      const mesesNombres = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      
      const mesStr = mesInicio === 0 && mesFin === 11 
        ? 'Enero-Diciembre' 
        : `${mesesNombres[mesInicio]}-${mesesNombres[mesFin]}`;
      
      // Crear el objeto periodo
      periodos.push({
        id_periodo: `temp-${anio}`, // ID temporal, se reemplazará al guardar
        codigo_periodo: `PER-${anio}`,
        nombre_periodo: `Periodo Fiscal ${anio}`,
        fecha_inicio: inicioStr,
        fecha_fin: finStr,
        anio: anio.toString(),
        mes: mesStr
      } as Periodo);
    }
    
    return periodos;
  };

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
        }
      }
      
      // Establecer el presupuesto máximo desde el presupuesto aprobado del proyecto
      if (proyecto.presupuesto_aprobado) {
        const presupuestoMax = proyecto.presupuesto_aprobado;
        setPresupuestoMaximo(presupuestoMax);
        // setPresupuestoAsignado(presupuestoMax.toFixed(2));
        setPresupuestoAsignado(presupuestoMax.toString());
        
      }
      
      // Calcular periodos fiscales basados en fecha_inicio y fecha_fin del proyecto
      if (proyecto.fecha_inicio && proyecto.fecha_fin) {
        const periodosProyecto = calcularPeriodos(proyecto.fecha_inicio, proyecto.fecha_fin);
        setPeriodosCalculados(periodosProyecto);
        
        // Actualizar periodos disponibles combinando los existentes con los calculados
        const periodosActualizados = [...periodos];
        // Añadir periodos calculados que no existan ya en la lista de periodos
        periodosProyecto.forEach(periodoCalc => {
          const existePeriodo = periodosActualizados.some(
            p => p.anio === periodoCalc.anio && 
                 new Date(p.fecha_inicio).getTime() <= new Date(periodoCalc.fecha_inicio).getTime() &&
                 new Date(p.fecha_fin).getTime() >= new Date(periodoCalc.fecha_fin).getTime()
          );
          
          if (!existePeriodo) {
            periodosActualizados.push(periodoCalc);
          }
        });
        
        setPeriodos(periodosActualizados);
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
    
    // Validar que el presupuesto asignado no exceda el presupuesto aprobado
    if (parseFloat(presupuesto_asignado) > presupuestoMaximo) {
      setError(`El presupuesto asignado no puede exceder el presupuesto aprobado del proyecto (${presupuestoMaximo.toFixed(2)})`);
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


// Manejar cambios en el presupuesto asignado (solo valores positivos con 2 decimales)
const handlePresupuestoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const valor = e.target.value;
  
  // Permitir campo vacío para facilitar la edición
  if (valor === '') {
    setPresupuestoAsignado('');
    setPresupuestoError(null);
    return;
  }
  
  // Validar que no contenga letras o caracteres no permitidos
  if (/[a-zA-Z]|[^\d.-]/.test(valor)) {
    setPresupuestoError('Solo se permiten números y punto decimal');
    return;
  }
  
  // Validar primero si es negativo o cero
  if (valor.startsWith('-') || parseFloat(valor) <= 0) {
    setPresupuestoAsignado(valor); // Actualiza el campo para mostrar lo que escribió
    setPresupuestoError('El presupuesto debe ser un valor positivo');
    return;
  }
  
  // Si no es negativo, validar formato: solo números positivos con máximo 2 decimales
  const regex = /^\d+(\.\d{0,2})?$/;
  if (!regex.test(valor)) {
    return; // No actualiza el campo si no cumple con el formato
  }
  
  const valorNumerico = parseFloat(valor);
  
  // Validar que no exceda el presupuesto máximo
  if (valorNumerico > presupuestoMaximo) {
    setPresupuestoError(`El presupuesto no puede exceder ${presupuestoMaximo.toLocaleString('es-CO')}`);
    setPresupuestoAsignado(valor);
  } else {
    // Si todo está bien, actualiza el valor y limpia errores
    setPresupuestoAsignado(valor);
    setPresupuestoError(null);
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
    <div className="nuevo-poa-wrapper">
      <Card className="nuevo-poa-card">
        <h2 className="nuevo-poa-title">Crear Nuevo POA</h2>
        
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
          
          <Form className="py-3" onSubmit={handleSubmit}>
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
            
            {/* Información sobre el proyecto seleccionado */}
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
                          {/* <p><strong>Presupuesto Aprobado:</strong> ${proyectoSeleccionado.presupuesto_aprobado.toFixed(2)}</p> */}
                          <p><strong>Presupuesto Aprobado:</strong> ${proyectoSeleccionado.presupuesto_aprobado}</p>
                          <p><strong>Periodos Calculados:</strong> {periodosCalculados.length}</p>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
            
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
                      disabled={isLoading || !proyectoSeleccionado}
                    >
                      <option value="">Seleccione...</option>
                      
                      {/* Mostrar primero los periodos calculados */}
                      {periodosCalculados.length > 0 && (
                        <>
                          <optgroup label="Periodos del Proyecto">
                            {periodosCalculados.map((periodo, index) => (
                              <option key={`calc-${periodo.id_periodo || index}`} value={periodo.id_periodo}>
                                {periodo.nombre_periodo} ({periodo.fecha_inicio} al {periodo.fecha_fin})
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Otros Periodos">
                            </optgroup>
                        </>
                      )}
                      
                      {/* Mostrar los periodos existentes que no son del cálculo */}
                      {periodos
                        .filter(p => !periodosCalculados.some(pc => pc.anio === p.anio))
                        .map(periodo => (
                          <option key={periodo.id_periodo} value={periodo.id_periodo}>
                            {periodo.nombre_periodo} ({periodo.fecha_inicio} al {periodo.fecha_fin})
                          </option>
                        ))}
                      
                      {/* {periodosCalculados.length > 0 && (
                        </>
                      )} */}
                    </Form.Control>
                    <Button 
                      variant="outline-primary" 
                      className="ms-2"
                      onClick={handleAbrirModalPeriodo}
                      disabled={!proyectoSeleccionado}
                    >
                      <i className="bi bi-plus-circle"></i> Nuevo
                    </Button>
                  </div>
                  {!proyectoSeleccionado && (
                    <Form.Text className="text-muted">
                      Primero seleccione un proyecto para ver los periodos disponibles
                    </Form.Text>
                  )}
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
                    disabled={isLoading || !proyectoSeleccionado}
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
                    type="text" // Cambiado a text para permitir validaciones personalizadas
                    placeholder="Ingrese el presupuesto"
                    value={presupuesto_asignado}
                    onChange={handlePresupuestoChange}
                    isInvalid={!!presupuestoError}
                    className="form-control-lg"
                  />
                  {presupuestoError && (
                    <Form.Control.Feedback type="invalid">
                      {presupuestoError}
                    </Form.Control.Feedback>
                  )}
                  {proyectoSeleccionado && (
                    <Form.Text className="text-muted">
                      Máximo disponible: ${presupuestoMaximo.toLocaleString('es-CO')} (Presupuesto aprobado del proyecto)
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>
            
            {/* Botones de acción */}
            <Row className="mt-4">
              <Col className="d-flex justify-content-end">
                <Button variant="secondary" className="me-2" size="lg">
                  Cancelar
                </Button>
                <Button 
                  variant="primary" 
                  type="submit" 
                  size="lg" 
                  disabled={isLoading || !proyectoSeleccionado}
                >
                  {isLoading ? 'Guardando...' : 'Guardar POA'}
                </Button>
              </Col>
            </Row>
          </Form>
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
    </div>
  );
};

export default CrearPOA;
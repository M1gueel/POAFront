import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card, Row, Col, Table, Modal } from 'react-bootstrap';

// Interfaces actualizadas según la estructura de la BD
interface Proyecto {
  id_proyecto: string;
  codigo_proyecto: string;
  titulo: string;
}

interface Periodo {
  id_periodo: string;
  codigo_periodo: string;
  nombre_periodo: string;
  fecha_inicio: string;
  fecha_fin: string;
  anio?: string;
  mes?: string;
}

interface EstadoPOA {
  id_estado_poa: string;
  nombre: string;
  descripcion: string;
}

interface TipoPOA {
  id_tipo_poa: string;
  codigo_tipo: string;
  nombre: string;
  descripcion: string;
  duracion_meses: number;
  cantidad_periodos: number;
  presupuesto_maximo: number;
}

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
  const [descripcion, setDescripcion] = useState('');
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
        // Mock data - actualizada según la estructura proporcionada
        // En una implementación real, esto se reemplazaría con llamadas a la API
        
        // Proyectos (mantenidos del componente original)
        const mockProyectos: Proyecto[] = [
          { id_proyecto: '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', codigo_proyecto: 'PIIF-12345', titulo: 'Proyecto de Investigación A' },
          { id_proyecto: '2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b', codigo_proyecto: 'PIS-54321', titulo: 'Estudio de Factibilidad B' },
          { id_proyecto: '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', codigo_proyecto: 'PIGR-98765', titulo: 'Proyecto Grupal C' },
          { id_proyecto: '4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d', codigo_proyecto: 'PIM-56789', titulo: 'Iniciativa Multidisciplinaria D' },
        ];

        // Periodos (actualizados según el script SQL proporcionado)
        const mockPeriodos: Periodo[] = [
          { id_periodo: '1p1p1p1p-1p1p-1p1p-1p1p-1p1p1p1p1p1p', codigo_periodo: '2024-B1', nombre_periodo: 'Primer Periodo 2024', fecha_inicio: '2024-01-24', fecha_fin: '2024-06-24', anio: '2024', mes: 'Enero-Marzo' },
          { id_periodo: '2p2p2p2p-2p2p-2p2p-2p2p-2p2p2p2p2p2p', codigo_periodo: '2024-B2', nombre_periodo: 'Segundo Periodo 2024', fecha_inicio: '2024-07-24', fecha_fin: '2024-12-24', anio: '2025', mes: 'Mayo-Agosto' },
          { id_periodo: '3p3p3p3p-3p3p-3p3p-3p3p-3p3p3p3p3p3p', codigo_periodo: '2024-B3', nombre_periodo: 'Periodo Completo 2024', fecha_inicio: '2024-01-25', fecha_fin: '2024-12-25', anio: '2025', mes: 'Enero-Febrero' },
          { id_periodo: '4p4p4p4p-4p4p-4p4p-4p4p-4p4p4p4p4p4p', codigo_periodo: '2025-B1', nombre_periodo: 'Primer Periodo 2025', fecha_inicio: '2025-01-25', fecha_fin: '2025-06-25', anio: '2025', mes: 'Octubre-Noviem' },
          { id_periodo: '5p5p5p5p-5p5p-5p5p-5p5p-5p5p5p5p5p5p', codigo_periodo: '2025-B2', nombre_periodo: 'Segundo Periodo 2025', fecha_inicio: '2025-07-25', fecha_fin: '2025-12-25', anio: '2026', mes: 'Enero-Abril' },
          { id_periodo: '6p6p6p6p-6p6p-6p6p-6p6p-6p6p6p6p6p6p', codigo_periodo: '2025-B3', nombre_periodo: 'Periodo Completo 2025', fecha_inicio: '2025-01-25', fecha_fin: '2025-12-25', anio: '2026', mes: 'Enero-Abril' },
          { id_periodo: '7p7p7p7p-7p7p-7p7p-7p7p-7p7p7p7p7p7p', codigo_periodo: '2026-B3', nombre_periodo: 'Periodo Completo 2026', fecha_inicio: '2025-01-26', fecha_fin: '2025-12-26', anio: '2027', mes: 'Enero-Abril' },
        ];
        
        // Estados POA (actualizados según el script SQL proporcionado)
        const mockEstadosPoa: EstadoPOA[] = [
          { id_estado_poa: '1e1e1e1e-1e1e-1e1e-1e1e-1e1e1e1e1e1e', nombre: 'Ingresado', descripcion: 'El director del proyecto ingresa el POA, en este estado todavía se puede editarlo' },
          { id_estado_poa: '2e2e2e2e-2e2e-2e2e-2e2e-2e2e2e2e2e2e', nombre: 'Validado', descripcion: 'El director de investigación emite comentarios correctivos del POA y es enviado a Ejecucion o denuevo a Ingresado' },
          { id_estado_poa: '3e3e3e3e-3e3e-3e3e-3e3e-3e3e3e3e3e3e', nombre: 'Ejecucion', descripcion: 'El POA a sido aprobado para ejecución y todos puede leerlo, el sistema controla los saldos, el siguinete paso es Reforma o Finalizado' },
          { id_estado_poa: '4e4e4e4e-4e4e-4e4e-4e4e-4e4e4e4e4e4e', nombre: 'En Reforma', descripcion: 'El director del proyecto solicita una reforma de tareas o actividades que todavia tienen saldo y es enviado a Validado' },
          { id_estado_poa: '5e5e5e5e-5e5e-5e5e-5e5e-5e5e5e5e5e5e', nombre: 'Finalizado', descripcion: 'POA finalizado y cerrado' },
        ];
        
        // Tipos POA (actualizados según el script SQL proporcionado)
        const mockTiposPoa: TipoPOA[] = [
          { id_tipo_poa: '1t1t1t1t-1t1t-1t1t-1t1t-1t1t1t1t1t1t', codigo_tipo: 'PIIF', nombre: 'Interno con financiamiento', descripcion: 'Proyectos internos que requieren cierto monto de dinero', duracion_meses: 12, cantidad_periodos: 1, presupuesto_maximo: 6000.00 },
          { id_tipo_poa: '2t2t2t2t-2t2t-2t2t-2t2t-2t2t2t2t2t2t', codigo_tipo: 'PIS', nombre: 'Semilla con financiamiento', descripcion: 'Proyectos semilla que requieren cierto monto de dinero', duracion_meses: 18, cantidad_periodos: 2, presupuesto_maximo: 15000.00 },
          { id_tipo_poa: '3t3t3t3t-3t3t-3t3t-3t3t-3t3t3t3t3t3t', codigo_tipo: 'PIGR', nombre: 'Grupales', descripcion: 'Proyectos grupales que requieren cierto monto de dinero', duracion_meses: 24, cantidad_periodos: 2, presupuesto_maximo: 60000.00 },
          { id_tipo_poa: '4t4t4t4t-4t4t-4t4t-4t4t-4t4t4t4t4t4t', codigo_tipo: 'PIM', nombre: 'Multidisciplinarios', descripcion: 'Proyectos que incluyen varias disciplinas que requieren cierto monto de dinero', duracion_meses: 36, cantidad_periodos: 3, presupuesto_maximo: 120000.00 },
          { id_tipo_poa: '5t5t5t5t-5t5t-5t5t-5t5t-5t5t5t5t5t5t', codigo_tipo: 'PVIF', nombre: 'Vinculación con financiaminento', descripcion: 'Proyectos de vinculación con la sociedad que requieren cierto monto de dinero', duracion_meses: 18, cantidad_periodos: 2, presupuesto_maximo: 6000.00 },
          { id_tipo_poa: '6t6t6t6t-6t6t-6t6t-6t6t-6t6t6t6t6t6t', codigo_tipo: 'PTT', nombre: 'Transferencia tecnológica', descripcion: 'Proyectos de transferencia tecnológica y uso de equipamiento', duracion_meses: 18, cantidad_periodos: 2, presupuesto_maximo: 15000.00 },
          { id_tipo_poa: '7t7t7t7t-7t7t-7t7t-7t7t-7t7t7t7t7t7t', codigo_tipo: 'PVIS', nombre: 'Vinculación sin financiaminento', descripcion: 'Proyectos de vinculación con la sociedad sin necesidad de dinero', duracion_meses: 12, cantidad_periodos: 1, presupuesto_maximo: 0.00 },
        ];
        
        // Simular retraso de API
        setTimeout(() => {
          setProyectos(mockProyectos);
          setProyectosFiltrados(mockProyectos);
          setPeriodos(mockPeriodos);
          setEstadosPoa(mockEstadosPoa);
          setTiposPoa(mockTiposPoa);
          setIsLoading(false);
        }, 500);
        
        /* 
        // Conexión real a la API
        // Aquí iría la implementación real de las llamadas a la API
        const [proyectosRes, periodosRes, estadosRes, tiposRes] = await Promise.all([
          fetch('/api/proyectos'),
          fetch('/api/periodos'),
          fetch('/api/estados-poa'),
          fetch('/api/tipos-poa')
        ]);
        
        // Validación de respuestas
        if (!proyectosRes.ok) throw new Error('Error al cargar proyectos');
        if (!periodosRes.ok) throw new Error('Error al cargar periodos');
        if (!estadosRes.ok) throw new Error('Error al cargar estados de POA');
        if (!tiposRes.ok) throw new Error('Error al cargar tipos de POA');
        
        // Procesamiento de datos
        const proyectosData = await proyectosRes.json();
        const periodosData = await periodosRes.json();
        const estadosData = await estadosRes.json();
        const tiposData = await tiposRes.json();
        
        // Actualización de estados
        setProyectos(proyectosData);
        setProyectosFiltrados(proyectosData);
        setPeriodos(periodosData);
        setEstadosPoa(estadosData);
        setTiposPoa(tiposData);
        */
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
      }
    }
  }, [id_tipo_poa, tiposPoa]);

  // Filtrar proyectos según la búsqueda
  useEffect(() => {
    if (busquedaProyecto.length > 0) {
      const filtrados = proyectos.filter(proyecto => 
        proyecto.codigo_proyecto.toLowerCase().includes(busquedaProyecto.toLowerCase()) ||
        proyecto.titulo.toLowerCase().includes(busquedaProyecto.toLowerCase())
      );
      setProyectosFiltrados(filtrados);
    } else {
      setProyectosFiltrados(proyectos);
    }
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
    setBusquedaProyecto(`${proyecto.codigo_proyecto} - ${proyecto.titulo}`);
    setMostrarBusqueda(false);
  };

  // Actualizar campos de fecha cuando se selecciona un periodo
  const handleSeleccionPeriodo = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const periodoId = e.target.value;
    setIdPeriodo(periodoId);
    
    if (periodoId) {
      const periodoSeleccionado = periodos.find(p => p.id_periodo === periodoId);
      if (periodoSeleccionado) {
        setFechaInicio(periodoSeleccionado.fecha_inicio);
        setFechaFin(periodoSeleccionado.fecha_fin);
        // Si el periodo tiene año definido, usarlo para el año de ejecución
        if (periodoSeleccionado.anio) {
          setAnioEjecucion(periodoSeleccionado.anio);
        }
      }
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
  const handleGuardarPeriodo = () => {
    // Validación básica
    if (!nuevoPeriodo.codigo_periodo || !nuevoPeriodo.nombre_periodo || !nuevoPeriodo.fecha_inicio || !nuevoPeriodo.fecha_fin) {
      alert('Todos los campos son obligatorios');
      return;
    }

    // En una implementación real, esto se enviaría al backend
    // Simulación de respuesta del backend
    const nuevoPeriodoCompleto: Periodo = {
      id_periodo: `nuevo-${Date.now()}`,
      codigo_periodo: nuevoPeriodo.codigo_periodo!,
      nombre_periodo: nuevoPeriodo.nombre_periodo!,
      fecha_inicio: nuevoPeriodo.fecha_inicio!,
      fecha_fin: nuevoPeriodo.fecha_fin!,
      anio: nuevoPeriodo.anio,
      mes: nuevoPeriodo.mes
    };

    /* 
    // Conexión real a la API para guardar el periodo
    // POST para crear un nuevo periodo
    fetch('/api/periodos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(nuevoPeriodo)
    })
    .then(response => {
      if (!response.ok) throw new Error('Error al crear el periodo');
      return response.json();
    })
    .then(periodoCreado => {
      // Actualizar la lista de periodos
      setPeriodos(prevPeriodos => [...prevPeriodos, periodoCreado]);
      // Seleccionar el nuevo periodo
      setIdPeriodo(periodoCreado.id_periodo);
      setFechaInicio(periodoCreado.fecha_inicio);
      setFechaFin(periodoCreado.fecha_fin);
      if (periodoCreado.anio) {
        setAnioEjecucion(periodoCreado.anio);
      }
      setShowCrearPeriodo(false);
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error al crear el periodo');
    });
    */

    // Actualizar la lista de periodos (simulación)
    setPeriodos(prevPeriodos => [...prevPeriodos, nuevoPeriodoCompleto]);
    
    // Seleccionar el nuevo periodo
    setIdPeriodo(nuevoPeriodoCompleto.id_periodo);
    setFechaInicio(nuevoPeriodoCompleto.fecha_inicio);
    setFechaFin(nuevoPeriodoCompleto.fecha_fin);
    if (nuevoPeriodoCompleto.anio) {
      setAnioEjecucion(nuevoPeriodoCompleto.anio);
    }
    
    setShowCrearPeriodo(false);
  };

  // Manejar envío del formulario
  const handleSubmit = (event: React.FormEvent) => {
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
      
      // Campos adicionales para información
      descripcion,
      fecha_inicio,
      fecha_fin
    };
    
    console.log('Datos del POA a crear:', datosPOA);
    
    /* 
    // Conexión real a la API
    fetch('/api/poa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datosPOA)
    })
    .then(response => {
      if (!response.ok) throw new Error('Error al crear el POA');
      return response.json();
    })
    .then(poaCreado => {
      alert('POA creado con éxito');
      // Redireccionar o limpiar formulario
      // window.location.href = `/poa/${poaCreado.id_poa}`;
    })
    .catch(error => {
      console.error('Error:', error);
      setError('Error al crear el POA');
    });
    */
    
    // Simulación de éxito (eliminar en implementación real)
    alert('POA creado con éxito');
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
                 {/* Sección de detalles del POA */}
            <Row>
              <Col md={4} className="mb-4">
                <Form.Group controlId="codigo_poa">
                  <Form.Label className="fw-semibold">Código POA <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={codigo_poa}
                    onChange={(e) => setCodigoPoa(e.target.value)}
                    placeholder="Generado automáticamente"
                    readOnly
                    className="form-control-lg"
                  />
                </Form.Group>
              </Col>
              
              <Col md={4} className="mb-4">
                <Form.Group controlId="anio_ejecucion">
                  <Form.Label className="fw-semibold">Año de Ejecución <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={anio_ejecucion}
                    onChange={(e) => setAnioEjecucion(e.target.value)}
                    placeholder="Ej: 2024"
                    className="form-control-lg"
                  />
                </Form.Group>
              </Col>
              
              <Col md={4} className="mb-4">
                <Form.Group controlId="presupuesto_asignado">
                  <Form.Label className="fw-semibold">Presupuesto Asignado ($) <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={presupuesto_asignado}
                    onChange={(e) => setPresupuestoAsignado(e.target.value)}
                    className="form-control-lg"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            {/* Sección de descripción y fechas */}
            <Row>
              <Col md={12} className="mb-4">
                <Form.Group controlId="descripcion">
                  <Form.Label className="fw-semibold">Descripción</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Descripción detallada del POA..."
                    className="form-control-lg"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6} className="mb-4">
                <Form.Group controlId="fecha_inicio">
                  <Form.Label className="fw-semibold">Fecha de Inicio</Form.Label>
                  <Form.Control
                    type="date"
                    value={fecha_inicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    readOnly
                    className="form-control-lg"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6} className="mb-4">
                <Form.Group controlId="fecha_fin">
                  <Form.Label className="fw-semibold">Fecha de Fin</Form.Label>
                  <Form.Control
                    type="date"
                    value={fecha_fin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    readOnly
                    className="form-control-lg"
                  />
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
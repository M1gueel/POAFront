import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card, Row, Col, Table, Modal, ListGroup, Badge } from 'react-bootstrap';
import { Proyecto } from '../interfaces/project';
import { EstadoPOA, TipoPOA, Periodo, POA, PoaPeriodo } from '../interfaces/poa';
import { poaAPI } from '../api/poaAPI';
import { projectAPI } from '../api/projectAPI';
import '../styles/NuevoPOA.css';

const CrearPOA: React.FC = () => {
  // Estados para campos del formulario - actualizados conforme a la tabla SQL
  const [id_proyecto, setIdProyecto] = useState('');
  const [id_tipo_poa, setIdTipoPoa] = useState('');
  const [codigo_poa_base, setCodigoPoaBase] = useState(''); // Código base que se modificará para cada periodo
  
  // Estado para periodos seleccionados
  const [periodosSeleccionados, setPeriodosSeleccionados] = useState<Periodo[]>([]);
  const [periodoActual, setPeriodoActual] = useState<number>(0); // Índice del periodo actual en edición
  
  // Estados para campos específicos por periodo
  const [presupuestoPorPeriodo, setPresupuestoPorPeriodo] = useState<{ [key: string]: string }>({});
  const [codigoPorPeriodo, setCodigoPorPeriodo] = useState<{ [key: string]: string }>({});
  const [anioPorPeriodo, setAnioPorPeriodo] = useState<{ [key: string]: string }>({});
  
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
  
  // Estado para presupuesto
  const [presupuestoRestante, setPresupuestoRestante] = useState<number>(0);
  const [presupuestoError, setPresupuestoError] = useState<string | null>(null);
  const [presupuestoTotalAsignado, setPresupuestoTotalAsignado] = useState<number>(0);

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

  // Actualizar presupuesto total asignado cuando cambien los presupuestos por periodo
  useEffect(() => {
    let total = 0;
    Object.values(presupuestoPorPeriodo).forEach(presupuesto => {
      if (presupuesto && !isNaN(parseFloat(presupuesto))) {
        total += parseFloat(presupuesto);
      }
    });
    
    setPresupuestoTotalAsignado(total);
    
    if (proyectoSeleccionado) {
      const presupuestoAprobado = parseFloat(proyectoSeleccionado.presupuesto_aprobado.toString());
      setPresupuestoRestante(presupuestoAprobado - total);
    }
  }, [presupuestoPorPeriodo, proyectoSeleccionado]);

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
      // Establecer el código POA base basado en el código del proyecto
      setCodigoPoaBase(`${proyecto.codigo_proyecto}-POA`);
      
      // Obtener y establecer tipo POA basado en el tipo de proyecto
      if (proyecto.id_tipo_proyecto) {
        const tipoPoaCorrespondiente = await poaAPI.getTipoPOAByTipoProyecto(proyecto.nombre_tipo_proyecto || '');
        if (tipoPoaCorrespondiente) {
          setIdTipoPoa(tipoPoaCorrespondiente.id_tipo_poa);
        }
      }
      
      // Establecer el presupuesto restante desde el presupuesto aprobado del proyecto
      if (proyecto.presupuesto_aprobado) {
        const presupuestoAprobado = parseFloat(proyecto.presupuesto_aprobado.toString());
        setPresupuestoRestante(presupuestoAprobado);
      }
      
      // Calcular periodos fiscales basados en fecha_inicio y fecha_fin del proyecto
      if (proyecto.fecha_inicio && proyecto.fecha_fin) {
        const periodosProyecto = calcularPeriodos(proyecto.fecha_inicio, proyecto.fecha_fin);
        setPeriodosCalculados(periodosProyecto);
        
        // Inicializar los datos por periodo
        const presupuestoInicial: { [key: string]: string } = {};
        const codigoInicial: { [key: string]: string } = {};
        const anioInicial: { [key: string]: string } = {};
        
        periodosProyecto.forEach(periodo => {
          presupuestoInicial[periodo.id_periodo] = '';
          codigoInicial[periodo.id_periodo] = `${proyecto.codigo_proyecto}-POA-${periodo.anio}`;
          anioInicial[periodo.id_periodo] = periodo.anio || '';
        });
        
        setPresupuestoPorPeriodo(presupuestoInicial);
        setCodigoPorPeriodo(codigoInicial);
        setAnioPorPeriodo(anioInicial);
        
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

  // Seleccionar un periodo para añadirlo a los seleccionados
  const seleccionarPeriodo = (periodo: Periodo) => {
    // Verificar si ya está seleccionado
    const yaSeleccionado = periodosSeleccionados.some(p => p.id_periodo === periodo.id_periodo);
    
    if (!yaSeleccionado) {
      const nuevosSeleccionados = [...periodosSeleccionados, periodo];
      setPeriodosSeleccionados(nuevosSeleccionados);
      
      // Inicializar valores para este periodo si no existen
      if (!presupuestoPorPeriodo[periodo.id_periodo]) {
        setPresupuestoPorPeriodo({
          ...presupuestoPorPeriodo, 
          [periodo.id_periodo]: ''
        });
      }
      
      if (!codigoPorPeriodo[periodo.id_periodo]) {
        setCodigoPorPeriodo({
          ...codigoPorPeriodo,
          [periodo.id_periodo]: `${codigo_poa_base}-${periodo.anio}`
        });
      }
      
      if (!anioPorPeriodo[periodo.id_periodo]) {
        setAnioPorPeriodo({
          ...anioPorPeriodo,
          [periodo.id_periodo]: periodo.anio || ''
        });
      }
      
      // Si es el primer periodo seleccionado, establecerlo como actual
      if (nuevosSeleccionados.length === 1) {
        setPeriodoActual(0);
      }
    }
  };

  // Quitar un periodo de los seleccionados
  const quitarPeriodo = (index: number) => {
    const nuevosSeleccionados = [...periodosSeleccionados];
    const periodoQuitado = nuevosSeleccionados[index];
    nuevosSeleccionados.splice(index, 1);
    
    setPeriodosSeleccionados(nuevosSeleccionados);
    
    // Ajustar el índice actual si es necesario
    if (periodoActual >= nuevosSeleccionados.length && nuevosSeleccionados.length > 0) {
      setPeriodoActual(nuevosSeleccionados.length - 1);
    } else if (nuevosSeleccionados.length === 0) {
      setPeriodoActual(-1);
    }
  };

  // Manejar cambios en el presupuesto asignado para un periodo
  const handlePresupuestoChange = (e: React.ChangeEvent<HTMLInputElement>, idPeriodo: string) => {
    const valor = e.target.value;
    
    // Permitir campo vacío para facilitar la edición
    if (valor === '') {
      setPresupuestoPorPeriodo({
        ...presupuestoPorPeriodo,
        [idPeriodo]: ''
      });
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
      setPresupuestoPorPeriodo({
        ...presupuestoPorPeriodo,
        [idPeriodo]: valor
      });
      setPresupuestoError('El presupuesto debe ser un valor positivo');
      return;
    }
    
    // Si no es negativo, validar formato: solo números positivos con máximo 2 decimales
    const regex = /^\d+(\.\d{0,2})?$/;
    if (!regex.test(valor)) {
      return; // No actualiza el campo si no cumple con el formato
    }
    
    const valorNumerico = parseFloat(valor);
    const presupuestoActual = proyectoSeleccionado?.presupuesto_aprobado ? 
      parseFloat(proyectoSeleccionado.presupuesto_aprobado.toString()) : 0;
    
    // Calcular el total asignado excluyendo el periodo actual
    let totalOtrosPeriodos = 0;
    Object.entries(presupuestoPorPeriodo).forEach(([id, presupuesto]) => {
      if (id !== idPeriodo && presupuesto && !isNaN(parseFloat(presupuesto))) {
        totalOtrosPeriodos += parseFloat(presupuesto);
      }
    });
    
    // Validar que el nuevo total no exceda el presupuesto aprobado
    if (totalOtrosPeriodos + valorNumerico > presupuestoActual) {
      setPresupuestoError(`El total asignado excedería el presupuesto aprobado de ${presupuestoActual.toLocaleString('es-CO')}`);
    } else {
      setPresupuestoError(null);
    }
    
    // Actualizar el presupuesto para este periodo
    setPresupuestoPorPeriodo({
      ...presupuestoPorPeriodo,
      [idPeriodo]: valor
    });
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
      const periodoCreado = await poaAPI.crearPeriodo({
        codigo_periodo: nuevoPeriodo.codigo_periodo!,
        nombre_periodo: nuevoPeriodo.nombre_periodo!,
        fecha_inicio: nuevoPeriodo.fecha_inicio!,
        fecha_fin: nuevoPeriodo.fecha_fin!,
        anio: nuevoPeriodo.anio,
        mes: nuevoPeriodo.mes
      });
      
      // Actualizar lista de periodos
      setPeriodos([...periodos, periodoCreado]);
      
      // Cerrar modal
      setShowCrearPeriodo(false);
      
      // Seleccionar el nuevo periodo
      seleccionarPeriodo(periodoCreado);
      
      alert('Periodo creado con éxito');
    } catch (err) {
      alert('Error al crear periodo: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!id_proyecto || !id_tipo_poa || periodosSeleccionados.length === 0) {
      setError('Debe seleccionar un proyecto, un tipo de POA y al menos un periodo');
      return;
    }
    
    // Validar que todos los periodos tengan presupuesto asignado
    const periodonSinPresupuesto = periodosSeleccionados.some(
      p => !presupuestoPorPeriodo[p.id_periodo] || parseFloat(presupuestoPorPeriodo[p.id_periodo]) <= 0
    );
    
    if (periodonSinPresupuesto) {
      setError('Todos los periodos seleccionados deben tener un presupuesto asignado');
      return;
    }
    
    // Validar que el presupuesto total no exceda el presupuesto aprobado
    if (proyectoSeleccionado && presupuestoTotalAsignado > parseFloat(proyectoSeleccionado.presupuesto_aprobado.toString())) {
      setError('El presupuesto total asignado excede el presupuesto aprobado del proyecto');
      return;
    }

    // if (!anioPorPeriodo[periodos.id_periodo] || !presupuestoPorPeriodo[periodo.id_periodo]) {
    //   setError(`Faltan datos para el periodo ${periodos.nombre_periodo}`);
    //   setIsLoading(false);
    //   return;
    // }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Obtener el estado "Ingresado" para asignarlo automáticamente
      const estados = await poaAPI.getEstadosPOA();
      const estadoIngresado = estados.find(e => e.nombre === "Ingresado");
      
      if (!estadoIngresado) {
        throw new Error("Estado 'Ingresado' no encontrado en el sistema");
      }
      
      // Crear un POA para cada periodo seleccionado
      const poaCreados = [];
      
      for (const periodo of periodosSeleccionados) {
        // Datos a enviar para crear POA
        const datosPOA = {
          id_proyecto,
          id_tipo_poa,
          codigo_poa: codigoPorPeriodo[periodo.id_periodo] || `${codigo_poa_base}-${periodo.anio}`,
          anio_ejecucion: anioPorPeriodo[periodo.id_periodo] || periodo.anio || '',
          presupuesto_asignado: parseFloat(presupuestoPorPeriodo[periodo.id_periodo]),
          periodos: [periodo.id_periodo] // Enviamos el periodo como array para el backend
          // fecha_creacion: new Date().toISOString().split('T')[0] // Add creation date
        };
        
        console.log("Sending POA data:", datosPOA); // Log the payload

        // Llamar a la API para crear el POA
        const nuevoPOA = await poaAPI.crearPOA(datosPOA);
        poaCreados.push(nuevoPOA);
      }
      
      // Mostrar mensaje de éxito
      alert(`Se crearon ${poaCreados.length} POAs correctamente`);
      
      // Reset del formulario o redirección
      window.location.href = '/poas'; // Redirección a lista de POAs
    } catch (err) {
      console.error("Error details:", err); // Log detailed error
      setError(err instanceof Error ? err.message : 'Error al crear los POAs');
      // console.error(err);
    } finally {
      setIsLoading(false);
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
                          <p><strong>Presupuesto Aprobado:</strong> ${parseFloat(proyectoSeleccionado.presupuesto_aprobado.toString()).toLocaleString('es-CO')}</p>
                          <p><strong>Periodos Calculados:</strong> {periodosCalculados.length}</p>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
            
            {/* Sección de Selección de Periodos */}
            {proyectoSeleccionado && (
              <Row className="mb-4">
                <Col md={6}>
                  <Card>
                    <Card.Header className="bg-light">
                      <h5 className="mb-0">Periodos Disponibles</h5>
                    </Card.Header>
                    <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <ListGroup>
                        {periodosCalculados.length > 0 ? (
                          <>
                            <div className="mb-2 fw-bold text-primary">Periodos del Proyecto</div>
                            {periodosCalculados.map((periodo, index) => (
                              <ListGroup.Item 
                                key={`calc-${periodo.id_periodo || index}`}
                                action
                                onClick={() => seleccionarPeriodo(periodo)}
                                disabled={periodosSeleccionados.some(p => p.id_periodo === periodo.id_periodo)}
                              >
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <strong>{periodo.nombre_periodo}</strong> - {periodo.anio}
                                    <div className="small text-muted">{periodo.fecha_inicio} al {periodo.fecha_fin}</div>
                                    </div>
                                    <Badge bg="info">{periodo.mes || 'Anual'}</Badge>
                                  </div>
                                </ListGroup.Item>
                              ))}
                            </>
                          ) : (
                            <div className="text-center py-3 text-muted">
                              No hay periodos calculados para este proyecto
                            </div>
                          )}
                          {periodos.length > 0 && (
                            <>
                              <div className="mt-3 mb-2 fw-bold text-primary">Periodos del Sistema</div>
                              {periodos.map(periodo => (
                                <ListGroup.Item 
                                  key={periodo.id_periodo}
                                  action
                                  onClick={() => seleccionarPeriodo(periodo)}
                                  disabled={periodosSeleccionados.some(p => p.id_periodo === periodo.id_periodo)}
                                >
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                      <strong>{periodo.nombre_periodo}</strong> - {periodo.anio}
                                      <div className="small text-muted">{periodo.fecha_inicio} al {periodo.fecha_fin}</div>
                                    </div>
                                    <Badge bg="secondary">{periodo.mes || 'Anual'}</Badge>
                                  </div>
                                </ListGroup.Item>
                              ))}
                            </>
                          )}
                        </ListGroup>
                        <div className="d-grid gap-2 mt-3">
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            onClick={handleAbrirModalPeriodo}
                          >
                            <i className="bi bi-plus-circle me-1"></i> Crear Nuevo Periodo
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col md={6}>
                    <Card>
                      <Card.Header className="bg-light">
                        <h5 className="mb-0">Periodos Seleccionados</h5>
                      </Card.Header>
                      <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {periodosSeleccionados.length > 0 ? (
                          <ListGroup>
                            {periodosSeleccionados.map((periodo, index) => (
                              <ListGroup.Item key={periodo.id_periodo} className="d-flex justify-content-between align-items-center">
                                <div>
                                  <strong>{periodo.nombre_periodo}</strong> - {periodo.anio}
                                  <div className="small text-muted">{periodo.fecha_inicio} al {periodo.fecha_fin}</div>
                                </div>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm" 
                                  onClick={() => quitarPeriodo(index)}
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                        ) : (
                          <div className="text-center py-3 text-muted">
                            No hay periodos seleccionados
                          </div>
                        )}
                      </Card.Body>
                      {periodosSeleccionados.length > 0 && (
                        <Card.Footer className="bg-light">
                          <div className="d-flex justify-content-between align-items-center">
                            <span>Total Periodos: <strong>{periodosSeleccionados.length}</strong></span>
                            <span>
                              Presupuesto Total: <strong>${presupuestoTotalAsignado.toLocaleString('es-CO')}</strong>
                            </span>
                          </div>
                          <div className="mt-2">
                            Presupuesto Restante: 
                            <span className={`fw-bold ${presupuestoRestante < 0 ? 'text-danger' : 'text-success'}`}>
                              ${presupuestoRestante.toLocaleString('es-CO')}
                            </span>
                          </div>
                        </Card.Footer>
                      )}
                    </Card>
                  </Col>
                </Row>
              )}
              
              {/* Sección de Configuración de POA */}
              {proyectoSeleccionado && periodosSeleccionados.length > 0 && (
                <>
                  <Row className="mb-4">
                    <Col md={12}>
                      <Card>
                        <Card.Header className="bg-light">
                          <h5 className="mb-0">Configuración General del POA</h5>
                        </Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3" controlId="id_tipo_poa">
                                <Form.Label className="fw-semibold">Tipo de POA <span className="text-danger">*</span></Form.Label>
                                <Form.Select 
                                  value={id_tipo_poa} 
                                  onChange={(e) => setIdTipoPoa(e.target.value)}
                                  required
                                >
                                  <option value="">Seleccione un tipo</option>
                                  {tiposPoa.map(tipo => (
                                    <option key={tipo.id_tipo_poa} value={tipo.id_tipo_poa}>
                                      {tipo.nombre} ({tipo.duracion_meses} meses)
                                    </option>
                                  ))}
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3" controlId="codigo_poa_base">
                                <Form.Label className="fw-semibold">Código POA Base <span className="text-danger">*</span></Form.Label>
                                <Form.Control 
                                  type="text" 
                                  value={codigo_poa_base} 
                                  onChange={(e) => setCodigoPoaBase(e.target.value)}
                                  required
                                  placeholder="Código base para todos los POAs"
                                />
                                <Form.Text className="text-muted">
                                  Este código se usará como base y se complementará con el año para cada periodo
                                </Form.Text>
                              </Form.Group>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  
                  {/* Pestañas para cada periodo */}
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
                                    type="text" 
                                    value={anioPorPeriodo[periodosSeleccionados[periodoActual].id_periodo] || ''}
                                    onChange={(e) => setAnioPorPeriodo({
                                      ...anioPorPeriodo,
                                      [periodosSeleccionados[periodoActual].id_periodo]: e.target.value
                                    })}
                                    required
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={4}>
                                <Form.Group className="mb-3" controlId={`presupuesto_${periodosSeleccionados[periodoActual].id_periodo}`}>
                                  <Form.Label className="fw-semibold">Presupuesto Asignado ($) <span className="text-danger">*</span></Form.Label>
                                  <Form.Control 
                                    type="text" 
                                    value={presupuestoPorPeriodo[periodosSeleccionados[periodoActual].id_periodo] || ''}
                                    onChange={(e) => handlePresupuestoChange(e, periodosSeleccionados[periodoActual].id_periodo)}
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
                </>
              )}
              
              {/* Botones de acción */}
              <Row>
                <Col md={12} className="d-flex justify-content-end gap-2">
                  <Button variant="secondary" type="button" href="/poas">
                    Cancelar
                  </Button>
                  <Button 
                    variant="primary" 
                    type="submit" onClick={handleSubmit}
                    disabled={isLoading || !proyectoSeleccionado || periodosSeleccionados.length === 0}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Guardando...
                      </>
                    ) : 'Crear POAs'}
                  </Button>
                </Col>
              </Row>
            </Form>
            
            {/* Modal para crear nuevo periodo */}
            <Modal show={showCrearPeriodo} onHide={() => setShowCrearPeriodo(false)}>
              <Modal.Header closeButton>
                <Modal.Title>Crear Nuevo Periodo</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form.Group className="mb-3" controlId="codigo_periodo">
                  <Form.Label>Código del Periodo</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="codigo_periodo"
                    value={nuevoPeriodo.codigo_periodo || ''} 
                    onChange={handleChangePeriodo}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="nombre_periodo">
                  <Form.Label>Nombre del Periodo</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="nombre_periodo"
                    value={nuevoPeriodo.nombre_periodo || ''} 
                    onChange={handleChangePeriodo}
                    required
                  />
                </Form.Group>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="fecha_inicio">
                      <Form.Label>Fecha de Inicio</Form.Label>
                      <Form.Control 
                        type="date" 
                        name="fecha_inicio"
                        value={nuevoPeriodo.fecha_inicio || ''} 
                        onChange={handleChangePeriodo}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="fecha_fin">
                      <Form.Label>Fecha de Fin</Form.Label>
                      <Form.Control 
                        type="date" 
                        name="fecha_fin"
                        value={nuevoPeriodo.fecha_fin || ''} 
                        onChange={handleChangePeriodo}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="anio">
                      <Form.Label>Año</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="anio"
                        value={nuevoPeriodo.anio || ''} 
                        onChange={handleChangePeriodo}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="mes">
                      <Form.Label>Mes/es</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="mes"
                        value={nuevoPeriodo.mes || ''} 
                        onChange={handleChangePeriodo}
                        placeholder="Ej: Enero-Diciembre"
                      />
                    </Form.Group>
                  </Col>
                </Row>
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
          </Card.Body>
        </Card>
      </Container>
    );
  };
  
  export default CrearPOA;
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

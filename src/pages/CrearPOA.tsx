
import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card, Row, Col, ListGroup, Badge, Collapse } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Proyecto, TipoProyecto } from '../interfaces/project';
import { EstadoPOA, TipoPOA, PoaCreate, POA } from '../interfaces/poa';
import { Periodo, PeriodoCreate } from '../interfaces/periodo';
import { poaAPI } from '../api/poaAPI';
import { periodoAPI } from '../api/periodoAPI';
import { projectAPI } from '../api/projectAPI';
import ProyectoSeleccionadoCard from '../components/ProyectoSeleccionadoCard';
import CrearPeriodoModal from '../components/CrearPeriodoModal';
import BusquedaProyecto from '../components/BusquedaProyecto';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/NuevoPOA.css';


const CrearPOA: React.FC = () => {
  const navigate = useNavigate();

  // Estados para campos del formulario
  const [id_proyecto, setIdProyecto] = useState('');
  const [id_tipo_poa, setIdTipoPoa] = useState('');
  const [codigo_poa_base, setCodigoPoaBase] = useState('');
  
  // Estado para periodos seleccionados
  const [periodosSeleccionados, setPeriodosSeleccionados] = useState<Periodo[]>([]);
  const [periodoActual, setPeriodoActual] = useState<number>(0);
  const [nuevoPeriodoOpen, setNuevoPeriodoOpen] = useState(false);
  
  // Estados para campos específicos por periodo
  const [presupuestoPorPeriodo, setPresupuestoPorPeriodo] = useState<{ [key: string]: string }>({});
  const [codigoPorPeriodo, setCodigoPorPeriodo] = useState<{ [key: string]: string }>({});
  const [anioPorPeriodo, setAnioPorPeriodo] = useState<{ [key: string]: string }>({});
  const [anioPorPeriodoError, setAnioPorPeriodoError] = useState<{ [key: string]: string }>({});
  
  // Estados para las listas de opciones
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [estadosPoa, setEstadosPoa] = useState<EstadoPOA[]>([]);
  const [tiposPoa, setTiposPoa] = useState<TipoPOA[]>([]);
  const [tiposProyecto, setTiposProyecto] = useState<TipoProyecto[]>([]); // Nuevo estado
  const [tipoPoaSeleccionado, setTipoPoaSeleccionado] = useState<TipoPOA | null>(null);

  
  // Estado para proyectos filtrados para la búsqueda
  //const [proyectosFiltrados, setProyectosFiltrados] = useState<Proyecto[]>([]);
  //const [busquedaProyecto, setBusquedaProyecto] = useState('');
  //const [mostrarBusqueda, setMostrarBusqueda] = useState(false);
  
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
  const [nuevoPeriodo, setNuevoPeriodo] = useState<Partial<PeriodoCreate>>({
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
        //setProyectosFiltrados(proyectosData);
  
        // Cargar estados POA desde la API
        const estadosData = await poaAPI.getEstadosPOA();
        setEstadosPoa(estadosData);
        
        // Cargar tipos POA desde la API
        const tiposData = await poaAPI.getTiposPOA();
        setTiposPoa(tiposData);
        
        // Cargar tipos de proyecto desde la API - NUEVO
        const tiposProyectoData = await projectAPI.getTiposProyecto();
        setTiposProyecto(tiposProyectoData);
        
        // NO seleccionar automáticamente el primer tipo - se seleccionará según el proyecto
        
        // Cargar periodos desde la API
        const periodosData = await periodoAPI.getPeriodos();
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
      calcularPresupuestoRestante(proyectoSeleccionado, total)
        .then(({ presupuestoRestante }) => {
          setPresupuestoRestante(presupuestoRestante);
        });
    }
  }, [presupuestoPorPeriodo, proyectoSeleccionado]);

  // Función para determinar el tipo de POA basado en el tipo de proyecto - NUEVA
  const determinarTipoPOA = async (proyecto: Proyecto): Promise<TipoPOA | null> => {
    try {
      // Buscar el tipo de proyecto correspondiente
      const tipoProyecto = tiposProyecto.find(tp => tp.id_tipo_proyecto === proyecto.id_tipo_proyecto);
      
      if (!tipoProyecto) {
        console.warn('No se encontró el tipo de proyecto:', proyecto.id_tipo_proyecto);
        return null;
      }

      // Usar la función del API para obtener el tipo POA correspondiente
      const tipoPOA = await poaAPI.getTipoPOAByTipoProyecto(tipoProyecto.codigo_tipo);
      
      if (!tipoPOA) {
        console.warn('No se encontró un tipo POA para el tipo de proyecto:', tipoProyecto.codigo_tipo);
        // En caso de no encontrar coincidencia, usar el primer tipo disponible como fallback
        return tiposPoa.length > 0 ? tiposPoa[0] : null;
      }

      return tipoPOA;
    } catch (error) {
      console.error('Error determinando tipo POA:', error);
      // En caso de error, usar el primer tipo disponible como fallback
      return tiposPoa.length > 0 ? tiposPoa[0] : null;
    }
  };

  const calcularPresupuestoRestante = async (proyecto: Proyecto, presupuestoActualAsignado: number = 0) => {
    try {
      const poasExistentes = await poaAPI.getPOAsByProyecto(proyecto.id_proyecto);
      const presupuestoYaGastado = poasExistentes.reduce((total, poa) => {
        const presupuestoAsignado = parseFloat(poa.presupuesto_asignado?.toString() || '0');
        return total + (isNaN(presupuestoAsignado) ? 0 : presupuestoAsignado);
      }, 0);
      
      const presupuestoAprobado = parseFloat(proyecto.presupuesto_aprobado.toString());
      const presupuestoRestante = presupuestoAprobado - presupuestoYaGastado - presupuestoActualAsignado;
      
      return {
        presupuestoAprobado,
        presupuestoYaGastado,
        presupuestoRestante
      };
    } catch (error) {
      console.error('Error calculando presupuesto:', error);
      const presupuestoAprobado = parseFloat(proyecto.presupuesto_aprobado.toString());
      return {
        presupuestoAprobado,
        presupuestoYaGastado: 0,
        presupuestoRestante: presupuestoAprobado - presupuestoActualAsignado
      };
    }
  };

  const validarDisponibilidadProyecto = async (proyecto: Proyecto): Promise<{ esValido: boolean; razon?: string }> => {
    try {
      // Obtener todos los POAs existentes para este proyecto
      const poasExistentes = await poaAPI.getPOAsByProyecto(proyecto.id_proyecto);
      
      // Si no tiene POAs, está disponible
      if (poasExistentes.length === 0) {
        return { esValido: true };
      }

      // Calcular periodos totales del proyecto
      const periodosProyecto = calcularPeriodos(proyecto.fecha_inicio, proyecto.fecha_fin);
      
      // Si incluye fechas de prórroga, calcular periodos adicionales
      let periodosTotales = periodosProyecto;
      if (proyecto.fecha_prorroga_inicio && proyecto.fecha_prorroga_fin) {
        const periodosProrroga = calcularPeriodos(proyecto.fecha_prorroga_inicio, proyecto.fecha_prorroga_fin);
        // Combinar periodos evitando duplicados por año
        const aniosExistentes = new Set(periodosProyecto.map(p => p.anio));
        const periodosNuevos = periodosProrroga.filter(p => !aniosExistentes.has(p.anio));
        periodosTotales = [...periodosProyecto, ...periodosNuevos];
      }

      // Verificar si ya existen POAs para todos los periodos posibles
      const aniosPOAsExistentes = new Set(poasExistentes.map(poa => poa.anio_ejecucion));
      const aniosTotalesProyecto = new Set(periodosTotales.map(p => p.anio));
      
      // Si todos los años del proyecto ya tienen POAs asignados
      const todosLosAniosCubiertos = [...aniosTotalesProyecto]
        .filter((anio): anio is string => typeof anio === 'string' && anio !== undefined)
        .every(anio => aniosPOAsExistentes.has(anio));
      
      if (todosLosAniosCubiertos) {
        return { 
          esValido: false, 
          razon: `Este proyecto ya tiene POAs asignados para todos sus periodos (${[...aniosPOAsExistentes].sort().join(', ')})` 
        };
      }

      // Si llegamos aquí, el proyecto tiene algunos POAs pero no todos los periodos están cubiertos
      const aniosFaltantes = [...aniosTotalesProyecto]
        .filter((anio): anio is string => typeof anio === 'string' && anio !== undefined)
        .filter(anio => !aniosPOAsExistentes.has(anio));
      return { 
        esValido: true, 
        razon: `Periodos disponibles: ${aniosFaltantes.sort().join(', ')}` 
      };

    } catch (error) {
      console.error('Error validando disponibilidad del proyecto:', error);
      // En caso de error, permitir la selección
      return { esValido: true, razon: 'Error al validar, proceder con precaución' };
    }
  };

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
      
      // Crear el objeto periodo con un ID temporal único
      periodos.push({
        id_periodo: `temp-${anio}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        codigo_periodo: `PER-${anio}`,
        nombre_periodo: `Periodo Fiscal ${anio}`,
        fecha_inicio: inicioStr,
        fecha_fin: finStr,
        anio: anio.toString(),
        mes: mesStr
      });
    }
    
    return periodos;
  };

  // Opcional: Agregar una función mejorada para filtrar periodos ya utilizados
  const filtrarPeriodosDisponibles = (periodosCalculados: Periodo[], poasExistentes: POA[]): Periodo[] => {
    const aniosConPOA = new Set(poasExistentes.map(poa => poa.anio_ejecucion));
    return periodosCalculados.filter(periodo => !aniosConPOA.has(periodo.anio || ''));
  };

  // Seleccionar un proyecto de la búsqueda y establecer datos automáticamente
  const seleccionarProyecto = async (proyecto: Proyecto) => {
    setIdProyecto(proyecto.id_proyecto);
    //setBusquedaProyecto(`${proyecto.codigo_proyecto} - ${proyecto.titulo}`);
    //setMostrarBusqueda(false);
    setProyectoSeleccionado(proyecto);
    
    try {
      // DETERMINAR EL TIPO DE POA CORRECTO - MODIFICADO
      const tipoPOADeterminado = await determinarTipoPOA(proyecto);
      if (tipoPOADeterminado) {
        setIdTipoPoa(tipoPOADeterminado.id_tipo_poa);
        setTipoPoaSeleccionado(tipoPOADeterminado);
        console.log('Tipo POA asignado:', {
          id: tipoPOADeterminado.id_tipo_poa,
          codigo: tipoPOADeterminado.codigo_tipo,
          nombre: tipoPOADeterminado.nombre
        });
      } else {
        console.warn('No se pudo determinar el tipo POA para el proyecto');
        setError('No se pudo determinar el tipo de POA adecuado para este proyecto');
      }
      
      // Establecer el código POA base basado en el código del proyecto
      setCodigoPoaBase(`${proyecto.codigo_proyecto}-POA`);

      // Obtener POAs existentes para este proyecto
      const poasExistentes = await poaAPI.getPOAsByProyecto(proyecto.id_proyecto);
      
      // CALCULAR EL PRESUPUESTO YA GASTADO
      const presupuestoYaGastado = poasExistentes.reduce((total, poa) => {
        const presupuestoAsignado = parseFloat(poa.presupuesto_asignado?.toString() || '0');
        return total + (isNaN(presupuestoAsignado) ? 0 : presupuestoAsignado);
      }, 0);

      // Establecer el presupuesto aprobado y restante
      if (proyecto.presupuesto_aprobado) {
        const presupuestoAprobado = parseFloat(proyecto.presupuesto_aprobado.toString());
        
        // IMPORTANTE: Inicializar presupuestoTotalAsignado en 0 al seleccionar proyecto
        setPresupuestoTotalAsignado(0);
        
        // Calcular presupuesto restante considerando lo ya gastado
        const presupuestoRestanteCalculado = presupuestoAprobado - presupuestoYaGastado;
        setPresupuestoRestante(presupuestoRestanteCalculado);
        
        // Log para debugging
        console.log(`Proyecto: ${proyecto.codigo_proyecto}`);
        console.log(`Presupuesto aprobado: ${presupuestoAprobado.toLocaleString('es-CO')}`);
        console.log(`Presupuesto ya gastado: ${presupuestoYaGastado.toLocaleString('es-CO')}`);
        console.log(`Presupuesto restante: ${presupuestoRestanteCalculado.toLocaleString('es-CO')}`);
      }
      
      // Limpiar selecciones previas
      setPeriodosSeleccionados([]);
      setPresupuestoPorPeriodo({});
      setCodigoPorPeriodo({});
      setAnioPorPeriodo({});
      
      // Calcular periodos fiscales basados en fecha_inicio y fecha_fin del proyecto
      if (proyecto.fecha_inicio && proyecto.fecha_fin) {
        let periodosProyecto = calcularPeriodos(proyecto.fecha_inicio, proyecto.fecha_fin);
        
        // Si hay prórroga, agregar esos periodos también
        if (proyecto.fecha_prorroga_inicio && proyecto.fecha_prorroga_fin) {
          const periodosProrroga = calcularPeriodos(proyecto.fecha_prorroga_inicio, proyecto.fecha_prorroga_fin);
          const aniosExistentes = new Set(periodosProyecto.map(p => p.anio));
          const periodosNuevos = periodosProrroga.filter(p => !aniosExistentes.has(p.anio));
          periodosProyecto = [...periodosProyecto, ...periodosNuevos];
        }
        
        // Filtrar periodos que ya tienen POAs asignados
        const periodosDisponibles = filtrarPeriodosDisponibles(periodosProyecto, poasExistentes);
        setPeriodosCalculados(periodosDisponibles);
        
        // Mostrar información sobre POAs existentes si los hay
        if (poasExistentes.length > 0) {
          const aniosConPOA = poasExistentes.map(poa => poa.anio_ejecucion).sort();
          console.log(`Este proyecto ya tiene POAs para los años: ${aniosConPOA.join(', ')}`);
          console.log(`Total presupuesto asignado en POAs existentes: ${presupuestoYaGastado.toLocaleString('es-CO')}`);
        }
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

      // Inicializar valores para este periodo
      setPresupuestoPorPeriodo({
        ...presupuestoPorPeriodo, 
        [periodo.id_periodo]: ''
      });
      
      setCodigoPorPeriodo({
        ...codigoPorPeriodo,
        [periodo.id_periodo]: `${codigo_poa_base}-${periodo.anio || ''}`
      });
      
      setAnioPorPeriodo({
        ...anioPorPeriodo,
        [periodo.id_periodo]: periodo.anio || ''
      });
      
      // Establecer el periodo recién añadido como el actual
      setPeriodoActual(nuevosSeleccionados.length - 1);
      }
  };

  // Quitar un periodo de los seleccionados
  const quitarPeriodo = (index: number) => {
    const nuevosSeleccionados = [...periodosSeleccionados];
    //const periodoQuitado = nuevosSeleccionados[index];
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
      codigo_periodo: `PER-${hoy.getFullYear()}-${Math.floor(Math.random() * 999) + 1}`,
      nombre_periodo: `Periodo Fiscal ${hoy.getFullYear()}`,
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
      setIsLoading(true);
      
      // Llamar a la API para crear nuevo periodo
      const periodoData: PeriodoCreate = {
        codigo_periodo: nuevoPeriodo.codigo_periodo!,
        nombre_periodo: nuevoPeriodo.nombre_periodo!,
        fecha_inicio: nuevoPeriodo.fecha_inicio!,
        fecha_fin: nuevoPeriodo.fecha_fin!,
        anio: nuevoPeriodo.anio || new Date(nuevoPeriodo.fecha_inicio!).getFullYear().toString(),
        mes: nuevoPeriodo.mes || 'Enero-Diciembre'
      };
      
      const periodoCreado = await periodoAPI.crearPeriodo(periodoData);
      
      // Actualizar lista de periodos
      setPeriodos(prevPeriodos => [...prevPeriodos, periodoCreado]);
      
      // Cerrar modal
      setShowCrearPeriodo(false);
      
      // Seleccionar el nuevo periodo
      seleccionarPeriodo(periodoCreado);
      
      alert('Periodo creado con éxito');
    } catch (err) {
      alert('Error al crear periodo: ' + (err instanceof Error ? err.message : 'Error desconocido'));
      console.error('Error al crear periodo:', err);
    } finally {
      setIsLoading(false);
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
  const periodosSinPresupuesto = periodosSeleccionados.some(
    p => !presupuestoPorPeriodo[p.id_periodo] || parseFloat(presupuestoPorPeriodo[p.id_periodo]) <= 0
  );
  
  if (periodosSinPresupuesto) {
    setError('Todos los periodos seleccionados deben tener un presupuesto asignado');
    return;
  }
  
  // Validar que el presupuesto total no exceda el presupuesto aprobado
  if (proyectoSeleccionado && presupuestoTotalAsignado > parseFloat(proyectoSeleccionado.presupuesto_aprobado.toString())) {
    setError('El presupuesto total asignado excede el presupuesto aprobado del proyecto');
    return;
  }
  
  setIsLoading(true);
  setError(null);
  
  try {
    // Crear un POA para cada periodo seleccionado
    const poaCreados = [];
    // Mapeo para seguimiento de IDs: temporales -> permanentes
    const mapeoIdsPeriodos = new Map();
    // Primero, crear todos los periodos temporales
    const periodosACrear = periodosSeleccionados.filter(p => p.id_periodo.startsWith('temp-'));
    
    if (periodosACrear.length > 0) {
      console.log(`Creando ${periodosACrear.length} periodos temporales primero`);
      for (const periodo of periodosACrear) {
        try {
          // Verificar si ya existe un periodo con el mismo código
          try {
            // Construir el código de periodo que usaremos
            const anio = periodo.anio || new Date().getFullYear().toString();
            // Obtener el título del proyecto normalizándolo para el código
            const tituloProyectoNormalizado = proyectoSeleccionado?.titulo
              ? proyectoSeleccionado.titulo
                  .replace(/\s+/g, '-') // Convertir espacios en guiones
                  .replace(/[^a-zA-Z0-9-]/g, '') // Eliminar caracteres especiales
                  .toLowerCase() // Convertir a minúsculas
                  .substring(0, 20) // Limitar longitud para evitar códigos muy largos
              : '';
            
            const nuevoCodigo = `PER-${anio}-${tituloProyectoNormalizado}`;
            
            // Como no tenemos un método para buscar por código, verificaremos si existe consultando todos los periodos
            // Obtener todos los periodos disponibles y filtrar en el frontend
            const todosPeriodos = await periodoAPI.getPeriodos();
            const periodoExistente = todosPeriodos.find(p => p.codigo_periodo === nuevoCodigo);
            
            if (periodoExistente) {
              console.log(`Periodo con código '${nuevoCodigo}' ya existe. Usando ID existente:`, periodoExistente.id_periodo);
              mapeoIdsPeriodos.set(periodo.id_periodo, periodoExistente.id_periodo);
              continue; // Saltamos a la siguiente iteración sin crear un periodo nuevo
            }
            
          } catch (err) {
            // Si falla la búsqueda, asumimos que no existe y continuamos con la creación
            console.log(`Error al buscar periodos existentes:`, err);
          }
          
          // Si llegamos aquí, necesitamos crear un nuevo periodo
          // Asegúrate de que cada periodo tenga un código único incluyendo el nombre del proyecto
          const anio = periodo.anio || new Date().getFullYear().toString();
          // Obtener el título del proyecto normalizándolo para el código
          const tituloProyectoNormalizado = proyectoSeleccionado?.titulo
            ? proyectoSeleccionado.titulo
                .replace(/\s+/g, '-') // Convertir espacios en guiones
                .replace(/[^a-zA-Z0-9-]/g, '') // Eliminar caracteres especiales
                .toLowerCase() // Convertir a minúsculas
                .substring(0, 20) // Limitar longitud para evitar códigos muy largos
            : '';
          
          const periodoData: PeriodoCreate = {
            codigo_periodo: `PER-${anio}-${tituloProyectoNormalizado}`, // Formato: PER-AÑO-NOMBREPROYECTO
            nombre_periodo: periodo.nombre_periodo,
            fecha_inicio: periodo.fecha_inicio,
            fecha_fin: periodo.fecha_fin,
            anio: anio,
            mes: periodo.mes || 'Enero-Diciembre'
          };
          
          console.log("Creando periodo temporal:", periodoData);
          const periodoCreado = await periodoAPI.crearPeriodo(periodoData);
          console.log("Periodo creado exitosamente:", periodoCreado);
          
          // Guardar la relación entre ID temporal e ID permanente
          mapeoIdsPeriodos.set(periodo.id_periodo, periodoCreado.id_periodo);
        } catch (err) {
          console.error('Error al crear periodo temporal:', err);
          if (
            typeof err === 'object' &&
            err !== null &&
            'response' in err &&
            typeof (err as { response?: unknown }).response === 'object' &&
            (err as { response?: unknown }).response !== null
          ) {
            const response = (err as { response: any }).response;
            console.error('Respuesta del servidor:', response.data);
          }
          // Mostrar error al usuario
          setError(`Error al crear periodo ${periodo.nombre_periodo}: ${err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Error desconocido'}`);
          setIsLoading(false);
          return; // Detener el proceso si no podemos crear un periodo
        }
      }
    }
    
    // Ahora procesamos la creación de POAs con los IDs correctos
    for (const periodo of periodosSeleccionados) {
      try {
        // Determinar el ID correcto del periodo (temporal o existente)
        let periodoId = periodo.id_periodo;
        if (periodo.id_periodo.startsWith('temp-')) {
          periodoId = mapeoIdsPeriodos.get(periodo.id_periodo);
          // Si no tenemos un ID válido, omitir este periodo
          if (!periodoId) {
            console.error(`No se pudo obtener un ID válido para el periodo ${periodo.codigo_periodo}`);
            continue;
          }
        }
        
        // Verificar que el periodo exista realmente en la base de datos
        try {
          // Intentar obtener el periodo para verificar que existe
          await periodoAPI.getPeriodo(periodoId);
        } catch (err) {
          console.error(`El periodo con ID ${periodoId} no existe en la base de datos:`, err);
          setError(`El periodo ${periodo.nombre_periodo} no existe en la base de datos`);
          setIsLoading(false);
          return; // Detener el proceso
        }
        
        // Generar un código único para cada POA
        const timestamp = new Date().getTime();
        const codigoPoa = codigoPorPeriodo[periodo.id_periodo] || 
                         `${codigo_poa_base}-${periodo.anio || ''}-${timestamp.toString().slice(-5)}`;
        
        // Datos a enviar para crear POA
        const datosPOA: PoaCreate = {
          id_proyecto,
          id_tipo_poa,
          codigo_poa: codigoPoa,
          anio_ejecucion: anioPorPeriodo[periodo.id_periodo] || periodo.anio || '',
          presupuesto_asignado: parseFloat(presupuestoPorPeriodo[periodo.id_periodo]),
          id_periodo: periodoId,
          fecha_creacion: new Date().toISOString().split('Z')[0],
          id_estado_poa: null  // Campo requerido según el error 422
        };
        
        console.log("Enviando datos de POA:", datosPOA);  
        // Llamar a la API para crear el POA
        const nuevoPOA = await poaAPI.crearPOA(datosPOA);
        console.log("POA creado exitosamente:", nuevoPOA);
        poaCreados.push(nuevoPOA);
      } catch (err) {
        console.error('Error al crear POA:', err);
        if (
          typeof err === 'object' &&
          err !== null &&
          'response' in err &&
          typeof (err as { response?: unknown }).response === 'object' &&
          (err as { response?: unknown }).response !== null
        ) {
          const response = (err as { response: any }).response;
          console.error('Detalle del error:', response.data);
          console.error('Status:', response.status);
          
          // Mejor manejo de errores para mostrar el mensaje específico
          let mensajeError = 'Error al crear el POA';
          
          // Extraer el mensaje específico de error si existe
          if (
            'data' in response &&
            response.data &&
            'detail' in response.data
          ) {
            const responseData = response.data;
            if (Array.isArray(responseData.detail)) {
              // Si es un array de errores, tomamos el primer mensaje
              const primerError = responseData.detail[0];
              if (primerError.msg) {
                mensajeError = `${primerError.msg} - Campo: ${primerError.loc.join('.')}`;
              }
            } else {
              mensajeError = responseData.detail;
            }
          }
          
          setError(`Error: ${mensajeError}`);
        } else {
          setError(`Error de conexión al crear POA: ${err instanceof Error ? err.message : 'Error desconocido'}`);
        }
        setIsLoading(false);
        return; // Detener el proceso
      }
    }
    
    // Mostrar mensaje de éxito
    if (poaCreados.length > 0) {
      alert(`Se crearon ${poaCreados.length} POAs correctamente`);
      
      // Redirección a lista de POAs
      navigate('/agregar-actividad');
      //window.location.href = '/poas';
    } else {
      setError('No se pudo crear ningún POA. Revise los logs para más detalles.');
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error al crear los POAs';
    setError(errorMessage);
    console.error('Error general al crear POAs:', err);
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
            <BusquedaProyecto 
              proyectos={proyectos}
              isLoading={isLoading}
              seleccionarProyecto={seleccionarProyecto}
              validarProyecto={validarDisponibilidadProyecto}
              mostrarValidacion={true}
            />
            
            {/* Información sobre el proyecto seleccionado */}
            {proyectoSeleccionado && (
              <ProyectoSeleccionadoCard 
                proyectoSeleccionado={proyectoSeleccionado} 
                periodosCalculados={periodosCalculados} 
              />
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
                    </ListGroup>

                      {/* Sección para crear periodo colapsable */}
                      <div className="nuevo-periodo-section mt-3">
                        <h6
                          className="nuevo-periodo-title d-flex align-items-center justify-content-between"
                          onClick={() => setNuevoPeriodoOpen(!nuevoPeriodoOpen)}
                          style={{ cursor: 'pointer', padding: '8px', border: '1px solid #dee2e6', borderRadius: '4px' }}
                        >
                          <span>Crear periodo por prórroga <span className="text-muted fs-6">(Opcional)</span></span>
                          <span className="ms-2">
                            {nuevoPeriodoOpen ? (
                              <i className="bi bi-chevron-up"></i>
                            ) : (
                              <i className="bi bi-chevron-down"></i>
                            )}
                          </span>
                        </h6>
                        
                        <Collapse in={nuevoPeriodoOpen}>
                          <div className="mt-2">
                            <div className="d-grid gap-2">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={handleAbrirModalPeriodo}
                              >
                                <i className="bi bi-plus-circle me-1"></i> Crear Nuevo Periodo
                              </Button>
                              <small className="text-muted">
                                Utilice esta opción únicamente en caso de prórroga del proyecto.
                              </small>
                            </div>
                          </div>
                        </Collapse>
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
                              <Form.Control 
                                type="text" 
                                value={tipoPoaSeleccionado 
                                  ? `${tipoPoaSeleccionado.codigo_tipo} - ${tipoPoaSeleccionado.nombre}` 
                                  : 'Tipo no seleccionado'} 
                                readOnly 
                                className="bg-light"
                              />
                              {/* Mantener el id_tipo_poa como campo oculto para el submit */}
                              <input type="hidden" name="id_tipo_poa" value={id_tipo_poa} />
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
                </>
              )}
              
              {/* Botones de acción */}
              <Row>
                <Col md={12} className="d-flex justify-content-end gap-2">
                  <Button variant="secondary" type="button" href="/dashboard">
                    Cancelar
                  </Button>
                  <Button 
                    variant="primary" 
                    type="submit"
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
            <CrearPeriodoModal 
              show={showCrearPeriodo}
              nuevoPeriodo={nuevoPeriodo}
              onHide={() => setShowCrearPeriodo(false)}
              onChange={handleChangePeriodo}
              onSave={handleGuardarPeriodo}
            />
            
          </Card.Body>
        </Card>
      </Container>
    );
  };
  
  export default CrearPOA;
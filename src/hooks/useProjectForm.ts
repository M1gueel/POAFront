import { useState, useEffect } from 'react';
import { Proyecto, TipoProyecto, EstadoProyecto } from '../interfaces/project';
import { projectService } from '../services/projectService';
import { 
  validateDirectorName, 
  validateBudget, 
  validateEndDate,
  validateProjectFormRequiredFields
} from '../validators/projectValidators';

interface UseProjectFormProps {
  initialTipoProyecto: TipoProyecto | null;
}

export const useProjectForm = ({ initialTipoProyecto }: UseProjectFormProps) => {
  // Form states
  const [codigo_proyecto, setCodigo_proyecto] = useState('');
  const [codigoModificadoManualmente, setCodigoModificadoManualmente] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [tipoProyecto] = useState<TipoProyecto | null>(initialTipoProyecto);
  const [id_estado_proyecto, setId_estado_proyecto] = useState('');
  const [id_director_proyecto, setId_director_proyecto] = useState('');
  const [directorError, setDirectorError] = useState<string | null>(null);
  const [presupuesto_aprobado, setPresupuesto_aprobado] = useState('');
  const [presupuestoError, setPresupuestoError] = useState<string | null>(null);
  const [fecha_inicio, setFecha_inicio] = useState('');
  const [fecha_fin, setFecha_fin] = useState('');
  const [fechaFinError, setFechaFinError] = useState<string | null>(null);
  const [fechaFinMaxima, setFechaFinMaxima] = useState<string>('');
  
  // Prorroga states
  const [prorrogaOpen, setProrrogaOpen] = useState(false);
  const [fecha_prorroga, setFecha_prorroga] = useState('');
  const [fecha_prorroga_inicio, setFecha_prorroga_inicio] = useState('');
  const [fecha_prorroga_fin, setFecha_prorroga_fin] = useState('');
  const [tiempo_prorroga_meses, setTiempo_prorroga_meses] = useState('');
  const [calculandoProrroga, setCalculandoProrroga] = useState(false);
  
  // Options lists
  const [estadosProyecto, setEstadosProyecto] = useState<EstadoProyecto[]>([]);
  
  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener la fecha de hoy en formato YYYY-MM-DD
  const obtenerFechaHoy = (): string => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  };

  // Función para calcular diferencia en meses entre dos fechas
  const calcularDiferenciaMeses = (fechaInicio: string, fechaFin: string): number => {
    if (!fechaInicio || !fechaFin) return 0;
    
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    let meses = (fin.getFullYear() - inicio.getFullYear()) * 12;
    meses += fin.getMonth() - inicio.getMonth();
    
    // Ajustar si el día del mes final es menor que el inicial
    if (fin.getDate() < inicio.getDate()) {
      meses--;
    }
    
    return Math.max(0, meses);
  };

  // Función para agregar meses a una fecha
  const agregarMeses = (fecha: string, meses: number): string => {
    if (!fecha || !meses) return '';
    
    const fechaObj = new Date(fecha);
    fechaObj.setMonth(fechaObj.getMonth() + meses);
    
    return fechaObj.toISOString().split('T')[0];
  };

  // Manejador para cambios en el código del proyecto
  const handleCodigoProyectoChange = (value: string) => {
    setCodigo_proyecto(value);
    setCodigoModificadoManualmente(true);
  };

  // Update project code when start date changes
  const actualizarCodigoProyectoDesdefecha = (fecha: string) => {
    if (fecha && tipoProyecto && !codigoModificadoManualmente) {
      const codigo = projectService.generarCodigoProyecto(tipoProyecto, fecha);
      setCodigo_proyecto(codigo);
    }
  };

  // Manejadores de prórroga
  const handleFechaProrrogaChange = (value: string) => {
    setFecha_prorroga(value);
  };

  const handleFechaProrrogaInicioChange = (value: string) => {
    setCalculandoProrroga(true);
    setFecha_prorroga_inicio(value);
    
    // Si hay fecha de fin de prórroga, calcular meses
    if (fecha_prorroga_fin && value) {
      const meses = calcularDiferenciaMeses(value, fecha_prorroga_fin);
      setTiempo_prorroga_meses(meses.toString());
    }
    setCalculandoProrroga(false);
  };

  const handleFechaProrrogaFinChange = (value: string) => {
    setCalculandoProrroga(true);
    setFecha_prorroga_fin(value);
    
    // Si hay fecha de inicio de prórroga, calcular meses
    if (fecha_prorroga_inicio && value) {
      const meses = calcularDiferenciaMeses(fecha_prorroga_inicio, value);
      setTiempo_prorroga_meses(meses.toString());
    }
    setCalculandoProrroga(false);
  };

  const handleTiempoProrrogaMesesChange = (value: string) => {
    setCalculandoProrroga(true);
    setTiempo_prorroga_meses(value);
    
    // Si hay fecha de inicio de prórroga y meses, calcular fecha de fin
    if (fecha_prorroga_inicio && value && parseInt(value) > 0) {
      const nuevaFechaFin = agregarMeses(fecha_prorroga_inicio, parseInt(value));
      setFecha_prorroga_fin(nuevaFechaFin);
    }
    setCalculandoProrroga(false);
  };

  // Manejador personalizado para abrir/cerrar la sección de prórroga
  const handleSetProrrogaOpen = (open: boolean) => {
    setProrrogaOpen(open);
    
    // Solo inicializar valores cuando se abre la sección (open = true)
    if (open && !fecha_prorroga) {
      // Establecer fecha de prórroga como hoy
      setFecha_prorroga(obtenerFechaHoy());
      
      // Establecer fecha de inicio de prórroga como la fecha de fin del proyecto
      if (fecha_fin) {
        setFecha_prorroga_inicio(fecha_fin);
      }
    }
  };

  // Efecto para actualizar fecha de inicio de prórroga cuando cambia fecha_fin
  // Solo si la sección está abierta
  useEffect(() => {
    if (prorrogaOpen && fecha_fin && !calculandoProrroga) {
      setFecha_prorroga_inicio(fecha_fin);
      
      // Recalcular meses si hay fecha de fin de prórroga
      if (fecha_prorroga_fin) {
        const meses = calcularDiferenciaMeses(fecha_fin, fecha_prorroga_fin);
        setTiempo_prorroga_meses(meses.toString());
      }
    }
  }, [fecha_fin, prorrogaOpen, calculandoProrroga]);

  // Load initial data
  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const estadosData = await projectService.getEstadosProyecto();
        setEstadosProyecto(estadosData);
        setId_estado_proyecto('');
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error(err);
        setIsLoading(false);
      }
    };
    
    cargarDatos();
  }, []);

  // Calculate end date when start date changes
  useEffect(() => {
    if (fecha_inicio && tipoProyecto?.duracion_meses) {
      const nuevaFechaFinMaxima = projectService.calcularFechaFinMaxima(fecha_inicio, tipoProyecto.duracion_meses);
      setFechaFinMaxima(nuevaFechaFinMaxima);
      
      if (!fecha_fin || new Date(fecha_fin) > new Date(nuevaFechaFinMaxima)) {
        setFecha_fin(nuevaFechaFinMaxima);
      }
    }
  }, [fecha_inicio, tipoProyecto]);

  // Handle director field change
  const handleDirectorChange = (value: string) => {
    setId_director_proyecto(value);
    
    if (value.trim() !== '') {
      if (!validateDirectorName(value)) {
        setDirectorError('El formato debe ser: Nombre Apellido como mínimo y hasta un maximo de 8 palabras para Nombres complejos');
      } else {
        setDirectorError(null);
      }
    } else {
      setDirectorError(null);
    }
  };

  // Handle budget field change
  const handlePresupuestoChange = (value: string) => {
    setPresupuesto_aprobado(value);
    const error = validateBudget(value, tipoProyecto);
    setPresupuestoError(error);
  };

  // Handle start date change
  const handleFechaInicioChange = (value: string) => {
    setFecha_inicio(value);
    actualizarCodigoProyectoDesdefecha(value);
    
    setFecha_fin('');
    setFechaFinError(null);
  };

  // Handle end date change
  const handleFechaFinChange = (value: string) => {
    setFecha_fin(value);
    
    const error = validateEndDate(value, fecha_inicio, tipoProyecto?.duracion_meses); 
    setFechaFinError(error);
  };

  // Submit form handler
  const handleSubmit = async () => {
    // Validation of required fields
    const validationError = validateProjectFormRequiredFields(
      codigo_proyecto,
      titulo,
      tipoProyecto,
      id_estado_proyecto,
      id_director_proyecto,
      fecha_inicio
    );
    
    if (validationError) {
      setError(validationError);
      return false;
    }

    // Validate budget if entered
    const budgetError = validateBudget(presupuesto_aprobado, tipoProyecto);
    if (budgetError) {
      setError(budgetError);
      return false;
    }
    
    // Validate end date
    const endDateError = validateEndDate(fecha_fin, fecha_inicio, tipoProyecto?.duracion_meses);
    if (endDateError) {
      setError(endDateError);
      return false;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare data to send to backend
      const proyecto: Partial<Proyecto> = {
        codigo_proyecto,
        titulo,
        id_tipo_proyecto: tipoProyecto!.id_tipo_proyecto,
        id_estado_proyecto,
        id_director_proyecto,
        presupuesto_aprobado: presupuesto_aprobado ? parseFloat(presupuesto_aprobado) : 0,
        fecha_inicio,
        fecha_fin,
      };
      
      console.log("Enviando datos:", proyecto);
      
      // Send data to backend via service layer
      await projectService.crearProyecto(proyecto as Proyecto);
      
      alert('Proyecto creado con éxito');
      setIsLoading(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear el proyecto';
      console.error(errorMessage, err);
      setError(errorMessage);
      setIsLoading(false);
      return false;
    }
  };

  return {
    // Form states
    codigo_proyecto,
    setCodigo_proyecto: handleCodigoProyectoChange,
    titulo,
    setTitulo,
    tipoProyecto,
    id_estado_proyecto,
    setId_estado_proyecto,
    id_director_proyecto,
    directorError,
    presupuesto_aprobado,
    presupuestoError,
    fecha_inicio,
    fecha_fin,
    fechaFinError,
    fechaFinMaxima,
    
    // Prorroga states
    prorrogaOpen,
    setProrrogaOpen: handleSetProrrogaOpen, // Usar el manejador personalizado
    fecha_prorroga,
    setFecha_prorroga: handleFechaProrrogaChange,
    fecha_prorroga_inicio,
    setFecha_prorroga_inicio: handleFechaProrrogaInicioChange,
    fecha_prorroga_fin,
    setFecha_prorroga_fin: handleFechaProrrogaFinChange,
    tiempo_prorroga_meses,
    setTiempo_prorroga_meses: handleTiempoProrrogaMesesChange,
    
    // Lists
    estadosProyecto,
    
    // Status
    isLoading,
    error,
    setError,
    
    // Handlers
    handleDirectorChange,
    handlePresupuestoChange,
    handleFechaInicioChange,
    handleFechaFinChange,
    handleSubmit
  };
};
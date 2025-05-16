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
  
  // Options lists
  const [estadosProyecto, setEstadosProyecto] = useState<EstadoProyecto[]>([]);
  
  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setCodigo_proyecto: handleCodigoProyectoChange, // Ahora exportamos esta función
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
    setProrrogaOpen,
    fecha_prorroga,
    setFecha_prorroga,
    fecha_prorroga_inicio,
    setFecha_prorroga_inicio,
    fecha_prorroga_fin,
    setFecha_prorroga_fin,
    tiempo_prorroga_meses,
    setTiempo_prorroga_meses,
    
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
import { useState, useEffect } from 'react';
import { Proyecto, TipoProyecto, EstadoProyecto } from '../interfaces/project';
import { projectService } from '../services/projectService';
import { projectAPI } from '../api/projectAPI';
import { 
  validateDirectorName, 
  validateBudget, 
  validateEndDate,
  validateProjectFormRequiredFields
} from '../validators/projectValidators';

interface UseProjectFormProps {
  initialTipoProyecto: TipoProyecto | null;
  initialProyecto?: Proyecto | null; // Para edición
  isEditing?: boolean; // Para distinguir entre crear y editar
}

export const useProjectForm = ({ initialTipoProyecto, initialProyecto, isEditing = false }: UseProjectFormProps) => {
  // Form states
  const [codigo_proyecto, setCodigo_proyecto] = useState('');
  const [codigoModificadoManualmente, setCodigoModificadoManualmente] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [tipoProyecto, setTipoProyecto] = useState<TipoProyecto | null>(initialTipoProyecto);
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

  // Update tipoProyecto when initialTipoProyecto changes
  useEffect(() => {
    setTipoProyecto(initialTipoProyecto);
    
    // Revalidar presupuesto y fecha fin cuando cambie el tipo de proyecto
    if (initialTipoProyecto && presupuesto_aprobado) {
      const budgetError = validateBudget(presupuesto_aprobado, initialTipoProyecto);
      setPresupuestoError(budgetError);
    }
    
    if (initialTipoProyecto && fecha_fin && fecha_inicio) {
      const endDateError = validateEndDate(fecha_fin, fecha_inicio, initialTipoProyecto.duracion_meses);
      setFechaFinError(endDateError);
    }
  }, [initialTipoProyecto, presupuesto_aprobado, fecha_fin, fecha_inicio]);

  // Load initial data
  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const estadosData = await projectService.getEstadosProyecto();
        setEstadosProyecto(estadosData);
        
        // Si estamos editando, cargar los datos del proyecto
        if (isEditing && initialProyecto) {
          setCodigo_proyecto(initialProyecto.codigo_proyecto);
          setTitulo(initialProyecto.titulo);
          setId_estado_proyecto(initialProyecto.id_estado_proyecto);
          setId_director_proyecto(initialProyecto.id_director_proyecto);
          setPresupuesto_aprobado(initialProyecto.presupuesto_aprobado?.toString() || '');
          setFecha_inicio(initialProyecto.fecha_inicio);
          setFecha_fin(initialProyecto.fecha_fin);
          
          // Cargar datos de prórroga si existen
          if (initialProyecto.fecha_prorroga || initialProyecto.fecha_prorroga_inicio || initialProyecto.fecha_prorroga_fin) {
            setProrrogaOpen(true);
            setFecha_prorroga(initialProyecto.fecha_prorroga || '');
            setFecha_prorroga_inicio(initialProyecto.fecha_prorroga_inicio || '');
            setFecha_prorroga_fin(initialProyecto.fecha_prorroga_fin || '');
            
            // Solo cargar tiempo_prorroga_meses si existe explícitamente en los datos
            // No calcularlo automáticamente para mantener consistencia con CrearProyecto
            if (initialProyecto.tiempo_prorroga_meses) {
              setTiempo_prorroga_meses(initialProyecto.tiempo_prorroga_meses.toString());
            }
          }
          
          // Marcar el código como modificado manualmente para evitar que se regenere
          setCodigoModificadoManualmente(true);
        } else {
          setId_estado_proyecto('');
        }
        
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error(err);
        setIsLoading(false);
      }
    };
    
    cargarDatos();
  }, [isEditing, initialProyecto]);

  // Calculate end date when start date changes
  useEffect(() => {
    if (fecha_inicio && tipoProyecto?.duracion_meses) {
      const nuevaFechaFinMaxima = projectService.calcularFechaFinMaxima(fecha_inicio, tipoProyecto.duracion_meses);
      setFechaFinMaxima(nuevaFechaFinMaxima);
      
      // Tanto en modo creación como edición, establecer automáticamente la fecha fin máxima
      // cuando se cambia la fecha de inicio
      if (!fecha_fin || new Date(fecha_fin) > new Date(nuevaFechaFinMaxima)) {
        setFecha_fin(nuevaFechaFinMaxima);
      }
      
      // Validar si existe una fecha de fin
      if (fecha_fin) {
        const error = validateEndDate(fecha_fin, fecha_inicio, tipoProyecto.duracion_meses);
        setFechaFinError(error);
      }
    }
  }, [fecha_inicio, tipoProyecto, isEditing, fecha_fin]);

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
    
    // Validar inmediatamente el presupuesto
    if (value && tipoProyecto) {
      const error = validateBudget(value, tipoProyecto);
      setPresupuestoError(error);
    } else {
      setPresupuestoError(null);
    }
  };

  // Handle start date change
  const handleFechaInicioChange = (value: string) => {
    setFecha_inicio(value);
    
    // Solo generar código automáticamente si no estamos en modo edición
    if (!isEditing) {
      actualizarCodigoProyectoDesdefecha(value);
    }
    
    // Limpiar fecha de fin para que se establezca automáticamente la nueva fecha máxima
    // Esto permite que el useEffect se ejecute y establezca la nueva fecha fin máxima
    setFecha_fin('');
    
    // Limpiar cualquier error previo de fecha de fin
    setFechaFinError(null);
  };

  // Handle end date change
  const handleFechaFinChange = (value: string) => {
    setFecha_fin(value);
    
    // Validar inmediatamente la fecha de fin
    if (value && fecha_inicio && tipoProyecto?.duracion_meses) {
      const error = validateEndDate(value, fecha_inicio, tipoProyecto.duracion_meses); 
      setFechaFinError(error);
    } else {
      setFechaFinError(null);
    }
  };

  // Submit form handler
  const handleSubmit = async () => {
    // Reset error state
    setError(null);
    
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

    // Validate director name format
    if (!validateDirectorName(id_director_proyecto)) {
      setDirectorError('El formato debe ser: Nombre Apellido como mínimo y hasta un máximo de 8 palabras para nombres complejos');
      setError('Por favor corrija el formato del nombre del director');
      return false;
    }

    // Validate budget if entered
    if (presupuesto_aprobado) {
      const budgetError = validateBudget(presupuesto_aprobado, tipoProyecto);
      if (budgetError) {
        setPresupuestoError(budgetError);
        setError(budgetError);
        return false;
      }
    }
    
    // Validate end date
    if (fecha_fin && fecha_inicio && tipoProyecto?.duracion_meses) {
      const endDateError = validateEndDate(fecha_fin, fecha_inicio, tipoProyecto.duracion_meses);
      if (endDateError) {
        setFechaFinError(endDateError);
        setError(endDateError);
        return false;
      }
    }
    
    // Validate that end date is after start date
    if (fecha_fin && fecha_inicio) {
      const startDateObj = new Date(fecha_inicio);
      const endDateObj = new Date(fecha_fin);
      
      if (endDateObj < startDateObj) {
        const error = 'La fecha de fin no puede ser anterior a la fecha de inicio';
        setFechaFinError(error);
        setError(error);
        return false;
      }
    }
    
    setIsLoading(true);
    
    try {
      // Prepare data to send to backend
      let proyectoData: Partial<Proyecto>;
      
      if (isEditing && initialProyecto) {
        // Para edición, preparar solo los campos que se pueden modificar
        proyectoData = {
          codigo_proyecto,
          titulo,
          id_tipo_proyecto: tipoProyecto!.id_tipo_proyecto,
          id_estado_proyecto,
          id_director_proyecto,
          presupuesto_aprobado: presupuesto_aprobado ? parseFloat(presupuesto_aprobado) : 0,
          fecha_inicio,
          fecha_fin,
          // Mantener la fecha de creación original
          fecha_creacion: initialProyecto.fecha_creacion
        };
        
        // Solo incluir campos de prórroga si tienen valores válidos
        if (fecha_prorroga && fecha_prorroga.trim() !== '') {
          proyectoData.fecha_prorroga = fecha_prorroga;
        }
        if (fecha_prorroga_inicio && fecha_prorroga_inicio.trim() !== '') {
          proyectoData.fecha_prorroga_inicio = fecha_prorroga_inicio;
        }
        if (fecha_prorroga_fin && fecha_prorroga_fin.trim() !== '') {
          proyectoData.fecha_prorroga_fin = fecha_prorroga_fin;
        }
        if (tiempo_prorroga_meses && parseInt(tiempo_prorroga_meses) > 0) {
          proyectoData.tiempo_prorroga_meses = parseInt(tiempo_prorroga_meses);
        }
      } else {
        // Para creación, incluir todos los campos necesarios
        proyectoData = {
          codigo_proyecto,
          titulo,
          id_tipo_proyecto: tipoProyecto!.id_tipo_proyecto,
          id_estado_proyecto,
          id_director_proyecto,
          presupuesto_aprobado: presupuesto_aprobado ? parseFloat(presupuesto_aprobado) : 0,
          fecha_inicio,
          fecha_fin
        };
        
        // Solo incluir campos de prórroga si tienen valores válidos (igual que en edición)
        if (fecha_prorroga && fecha_prorroga.trim() !== '') {
          proyectoData.fecha_prorroga = fecha_prorroga;
        }
        if (fecha_prorroga_inicio && fecha_prorroga_inicio.trim() !== '') {
          proyectoData.fecha_prorroga_inicio = fecha_prorroga_inicio;
        }
        if (fecha_prorroga_fin && fecha_prorroga_fin.trim() !== '') {
          proyectoData.fecha_prorroga_fin = fecha_prorroga_fin;
        }
        if (tiempo_prorroga_meses && parseInt(tiempo_prorroga_meses) > 0) {
          proyectoData.tiempo_prorroga_meses = parseInt(tiempo_prorroga_meses);
        }
      }
      
      console.log("Enviando datos:", proyectoData);
      
      if (isEditing && initialProyecto) {
        // Editar proyecto existente
        await projectAPI.editarProyecto(initialProyecto.id_proyecto, proyectoData as Omit<Proyecto, 'id_proyecto'>);
        alert('Proyecto actualizado con éxito');
      } else {
        // Crear nuevo proyecto
        await projectService.crearProyecto(proyectoData as Proyecto);
        alert('Proyecto creado con éxito');
      }
      
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Error completo:', err);
      
      let errorMessage = isEditing ? 'Error al actualizar el proyecto' : 'Error al crear el proyecto';
      
      // Manejo mejorado de errores para obtener información detallada
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as any).response;
        console.error('Response status:', response?.status);
        console.error('Response data:', response?.data);
        
        if (response?.status === 422) {
          // Error de validación del servidor
          if (response.data && response.data.detail) {
            if (Array.isArray(response.data.detail)) {
              // FastAPI devuelve errores de validación como array
              const errorDetails = response.data.detail.map((error: any) => 
                `${error.loc.join('.')}: ${error.msg}`
              ).join(', ');
              errorMessage = `Error de validación: ${errorDetails}`;
            } else {
              errorMessage = `Error de validación: ${response.data.detail}`;
            }
          } else {
            errorMessage = 'Error de validación: Los datos enviados no son válidos';
          }
        } else if (response?.data?.message) {
          errorMessage = response.data.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
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
    isEditing, // Agregar esta propiedad
    
    // Handlers
    handleDirectorChange,
    handlePresupuestoChange,
    handleFechaInicioChange,
    handleFechaFinChange,
    handleSubmit
  };
};
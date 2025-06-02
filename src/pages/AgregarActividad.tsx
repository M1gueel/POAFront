import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card, Row, Col, ListGroup, Spinner, Tabs, Tab, Toast, Alert, Modal, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Proyecto } from '../interfaces/project';
import { Periodo } from '../interfaces/periodo';
import { poaAPI } from '../api/poaAPI';
import { projectAPI } from '../api/projectAPI';
import { actividadAPI } from '../api/actividadAPI';
import { tareaAPI } from '../api/tareaAPI';

import BusquedaProyecto from '../components/BusquedaProyecto';

// Componente para exportar POA
import ExportarPOA from '../components/ExportarPOA';

// Interfaces para actividades
import { ActividadCreate, ActividadForm, POAConActividades, ActividadConTareas, POAConActividadesYTareas } from '../interfaces/actividad';

// Interfaces para tareas
import { DetalleTarea, ItemPresupuestario, Tarea, TareaCreate, TareaForm } from '../interfaces/tarea';

// Importamos la lista de actividades
import { getActividadesPorTipoPOA, ActividadOpciones } from '../utils/listaActividades';

// Interfaces adicionales para logging
interface TareaResponse {
  id_tarea: string;
  total: number;
  [key: string]: any;
}

interface ProgramacionMensualCreate {
  id_tarea: string;
  mes: string;
  valor: string;
}

const AgregarActividad: React.FC = () => {
  const navigate = useNavigate();

  // Estados para el proyecto
  const [id_proyecto, setIdProyecto] = useState('');
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);

  // Estados para POAs y periodos
  const [poasProyecto, setPoasProyecto] = useState<any[]>([]);
  const [periodosProyecto, setPeriodosProyecto] = useState<Periodo[]>([]);
  
  // Estados para la pestaña activa de POA
  const [activePoaTab, setActivePoaTab] = useState('');

  // Estado para los POAs con actividades seleccionadas y tareas
  const [poasConActividades, setPoasConActividades] = useState<POAConActividadesYTareas[]>([]);

  // Estado para almacenar las actividades disponibles según el tipo de POA
  const [actividadesDisponiblesPorPoa, setActividadesDisponiblesPorPoa] = useState<{[key: string]: ActividadOpciones[]}>({});

  // Estados para modales de tareas
  const [showTareaModal, setShowTareaModal] = useState(false);
  const [currentPoa, setCurrentPoa] = useState<string>('');
  const [currentActividad, setCurrentActividad] = useState<string>('');
  const [currentTarea, setCurrentTarea] = useState<TareaForm | null>(null);
  const [isEditingTarea, setIsEditingTarea] = useState(false);

  // Estado para el modal de selección de actividades
  const [showActividadModal, setShowActividadModal] = useState(false);
  const [actividadesDisponiblesModal, setActividadesDisponiblesModal] = useState<ActividadOpciones[]>([]);
  const [actividadSeleccionadaModal, setActividadSeleccionadaModal] = useState<string>('');

  //Estado para detalles filtrados en el modal
  const [detallesFiltrados, setDetallesFiltrados] = useState<DetalleTarea[]>([]);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);

  const [actividadesSeleccionadasPorPoa, setActividadesSeleccionadasPorPoa] = useState<{[key: string]: string[]}>({});

  // Estados para mensajes y carga
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Cargando datos...');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true);
      setLoadingMessage('Cargando proyectos...');
      setError(null);
      
      try {
        // Obtener proyectos desde la API
        const proyectosData = await projectAPI.getProyectos();
        setProyectos(proyectosData);
        // ELIMINAR: setProyectosFiltrados(proyectosData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarDatos();
  }, []);

  // Inicializar las actividades disponibles por tipo de POA cuando cambian los POAs del proyecto
  useEffect(() => {
    const nuevasActividadesDisponibles: {[key: string]: ActividadOpciones[]} = {};
    const nuevasActividadesSeleccionadas: {[key: string]: string[]} = {};

    poasProyecto.forEach(poa => {
    const tipoPOA = poa.tipo_poa || 'PIM'; // Valor por defecto si no hay tipo
    nuevasActividadesDisponibles[poa.id_poa] = getActividadesPorTipoPOA(tipoPOA);
    nuevasActividadesSeleccionadas[poa.id_poa] = [];
  });
    
    setActividadesDisponiblesPorPoa(nuevasActividadesDisponibles);
    setActividadesSeleccionadasPorPoa(nuevasActividadesSeleccionadas);
    // Si no hay pestaña activa, seleccionar la primera
    
  }, [poasProyecto]);

  // Inicializar la estructura de poasConActividades cuando cambian los POAs y precarga las actividades
  useEffect(() => {
    const cargarDetallesTarea = async () => {
      if (poasProyecto.length === 0) return;
      
      setIsLoading(true);
      setLoadingMessage('Cargando detalles de tareas...');
      
      try {
        const nuevosPoasConActividades: POAConActividadesYTareas[] = [];
        
        // Para cada POA, cargar sus detalles de tarea
        for (const poa of poasProyecto) {
          const detallesTarea = await tareaAPI.getDetallesTareaPorPOA(poa.id_poa);
          
          // Precargamos todas las actividades disponibles para este POA
          const actividadesPreCargadas: ActividadConTareas[] = [];
          const actividadesPorTipo = getActividadesPorTipoPOA(poa.tipo_poa || 'PVIF');
          
          // Creamos una actividad precargada para cada actividad disponible
          actividadesPorTipo.forEach((act, index) => {
            actividadesPreCargadas.push({
              actividad_id: `pre-${poa.id_poa}-${act.id}-${Date.now()}-${index}`,
              codigo_actividad: act.id,
              tareas: []
            });
          });
          
          nuevosPoasConActividades.push({
            id_poa: poa.id_poa,
            codigo_poa: poa.codigo_poa,
            tipo_poa: poa.tipo_poa || 'PVIF',
            presupuesto_asignado: parseFloat(poa.presupuesto_asignado),
            actividades: actividadesPreCargadas, // Actividades precargadas
            detallesTarea // Guardamos los detalles de tarea disponibles
          });
        }
        
        setPoasConActividades(nuevosPoasConActividades);
        
        // Si no hay pestaña activa, seleccionar la primera
        if (!activePoaTab && nuevosPoasConActividades.length > 0) {
          setActivePoaTab(nuevosPoasConActividades[0].id_poa);
        }
        
      } catch (err) {
        console.error('Error al cargar detalles de tarea:', err);
        setError('Error al cargar los detalles de tareas');
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarDetallesTarea();
  }, [poasProyecto]);

  // Seleccionar un proyecto y cargar sus POAs
  const seleccionarProyecto = async (proyecto: Proyecto) => {
    setIdProyecto(proyecto.id_proyecto);
    setProyectoSeleccionado(proyecto);
    
    try {
      setIsLoading(true);
      setLoadingMessage('Cargando POAs del proyecto...');
      
      // Cargar los POAs del proyecto seleccionado
      const poasData = await poaAPI.getPOAsByProyecto(proyecto.id_proyecto);
      setPoasProyecto(poasData);
      // Limpiar cache de items presupuestarios al cambiar de proyecto
      cacheItemsPresupuestarios.clear();
      
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
    const poa = poasConActividades.find(p => p.id_poa === poaId);
    if (!poa) return;
    
    // Obtener actividades disponibles para este POA
    const actividadesDisponibles = actividadesDisponiblesPorPoa[poaId] || [];
    
    // Obtener códigos de actividades ya seleccionadas
    const actividadesYaSeleccionadas = poa.actividades.map(act => act.codigo_actividad).filter(codigo => codigo !== "");
    
    // Filtrar actividades no utilizadas
    const actividadesNoUtilizadas = actividadesDisponibles.filter(
      act => !actividadesYaSeleccionadas.includes(act.id)
    );
    
    // Si no hay actividades disponibles, mostrar mensaje
    if (actividadesNoUtilizadas.length === 0) {
      setError('No hay más actividades disponibles para agregar');
      return;
    }
    
    // Mostrar modal para seleccionar actividad
    setShowActividadModal(true);
    setCurrentPoa(poaId);
    setActividadesDisponiblesModal(actividadesNoUtilizadas);
  };

  // Confirmar la selección de actividad en el modal
  const confirmarSeleccionActividad = () => {
    const poaId = currentPoa;
    if (!poaId || !actividadSeleccionadaModal) {
      setError('Debe seleccionar una actividad');
      return;
    }

    const poa = poasConActividades.find(p => p.id_poa === poaId);
    if (!poa) return;
    
    // Verificar que la actividad no esté ya agregada
    const actividadYaExiste = poa.actividades.some(act => act.codigo_actividad === actividadSeleccionadaModal);
    if (actividadYaExiste) {
      setError('Esta actividad ya ha sido agregada');
      return;
    }

    // Buscar la actividad precargada que corresponde al código seleccionado
    const actividadPrecargada = poa.actividades.find(act => 
      act.codigo_actividad === "" && act.actividad_id.startsWith(`pre-${poaId}`)
    );

    if (!actividadPrecargada) {
      setError('No se encontró una actividad disponible para configurar');
      return;
    }

    // Si es el primer POA, replicar la selección a todos los POAs
    const isFirstPoa = poasConActividades.length > 0 && poasConActividades[0].id_poa === poaId;
    
    // Actualizar el estado de POAs con actividades
    const nuevosPoasConActividades = poasConActividades.map(poaActual => {
      if (poaActual.id_poa === poaId || (isFirstPoa && poaActual.id_poa !== poaId)) {
        // Buscar la actividad precargada correspondiente en este POA
        const actPrecargadaLocal = poaActual.actividades.find(act => 
          act.codigo_actividad === "" && 
          act.actividad_id.includes(actividadSeleccionadaModal.replace('ACT-', ''))
        );
        
        if (actPrecargadaLocal) {
          // Actualizar la actividad precargada con el código seleccionado
          const actividadesActualizadas = poaActual.actividades.map(act => 
            act.actividad_id === actPrecargadaLocal.actividad_id
              ? { ...act, codigo_actividad: actividadSeleccionadaModal }
              : act
          );
          
          // Ordenar según el orden de actividades disponibles
          const actividadesDisponibles = actividadesDisponiblesPorPoa[poaActual.id_poa] || [];
          actividadesActualizadas.sort((a, b) => {
            const indexA = actividadesDisponibles.findIndex(act => act.id === a.codigo_actividad);
            const indexB = actividadesDisponibles.findIndex(act => act.id === b.codigo_actividad);
            return indexA - indexB;
          });
          
          return {
            ...poaActual,
            actividades: actividadesActualizadas
          };
        }
      }
      return poaActual;
    });
    
    setPoasConActividades(nuevosPoasConActividades);
    
    // Cerrar el modal y limpiar la selección
    setShowActividadModal(false);
    setActividadSeleccionadaModal('');
    
    // Hacer scroll a la actividad actualizada
    setTimeout(() => {
      const activityElement = document.getElementById(`actividad-${actividadPrecargada.actividad_id}`);
      if (activityElement) {
        activityElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };


  // Eliminar actividad de un POA específico
  const eliminarActividad = (poaId: string, actividadId: string) => {
    const poa = poasConActividades.find(p => p.id_poa === poaId);
    if (!poa) return;
    
    const actividad = poa.actividades.find(a => a.actividad_id === actividadId);
    if (!actividad) return;
    
    // Si es el primer POA, eliminar la actividad de todos los POAs
    const isFirstPoa = poasConActividades.length > 0 && poasConActividades[0].id_poa === poaId;
    
    // Actualizar el estado de POAs con actividades
    const nuevosPoasConActividades = poasConActividades.map(poaActual => {
      if (poaActual.id_poa === poaId || (isFirstPoa && poaActual.id_poa !== poaId)) {
        return {
          ...poaActual,
          actividades: poaActual.actividades.map(act => 
            act.actividad_id === actividadId || 
            (isFirstPoa && act.codigo_actividad === actividad.codigo_actividad)
              ? { ...act, codigo_actividad: "", tareas: [] } // Resetear en lugar de eliminar
              : act
          )
        };
      }
      return poaActual;
    });
    
    setPoasConActividades(nuevosPoasConActividades);
    setSuccess('Actividad eliminada correctamente');
};
  
  // Manejar cambios en la selección de actividad para un POA específico
  /* 
  const handleActividadSeleccionChange = (poaId: string, actividadId: string, codigoActividad: string) => {
    // Primero encontramos la actividad correspondiente al código seleccionado
    //const actividadesDisponibles = actividadesDisponiblesPorPoa[poaId] || [];
    //const actividadSeleccionada = actividadesDisponibles.find(act => act.id === codigoActividad);
    
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
*/
  // Mostrar modal para agregar/editar tarea
  const mostrarModalTarea = async (poaId: string, actividadId: string, tarea?: TareaForm) => {
    setCurrentPoa(poaId);
    setCurrentActividad(actividadId);
    
    // Obtener información de la actividad y POA
    const poa = poasConActividades.find(p => p.id_poa === poaId);
    const actividad = poa?.actividades.find(act => act.actividad_id === actividadId);
    
    if (tarea) {
      // Editar tarea existente
      setCurrentTarea(tarea);
      setIsEditingTarea(true);
    } else {
      // Crear nueva tarea
      setCurrentTarea({
        tempId: Date.now().toString(),
        id_detalle_tarea: '',
        nombre: '',
        detalle_descripcion: '',
        cantidad: 1,
        precio_unitario: 0,
        codigo_item: 'N/A',
        total: 0,
        gastos_mensuales: new Array(12).fill(0), // AGREGAR ESTA LÍNEA
      });
      setIsEditingTarea(false);
    }
    
    // Filtrar detalles de tarea según la actividad seleccionada
    if (poa && actividad && actividad.codigo_actividad) {
      setCargandoDetalles(true);
      try {
        const detallesFiltradosParaActividad = await filtrarDetallesPorActividadConConsultas(
          poa.detallesTarea,
          actividad.codigo_actividad,
          poa.tipo_poa,
          (id: string) => getItemPresupuestarioConCache(id, tareaAPI.getItemPresupuestarioPorId)
        );
        setDetallesFiltrados(detallesFiltradosParaActividad);
      } catch (error) {
        console.error('Error al filtrar detalles:', error);
        setDetallesFiltrados(poa.detallesTarea); // Fallback: mostrar todos
      } finally {
        setCargandoDetalles(false);
      }
    } else {
      // Si no hay actividad seleccionada, mostrar todos los detalles
      setDetallesFiltrados(poa?.detallesTarea || []);
    }
    
    setShowTareaModal(true);
  };

    const toggleTareaExpansion = (poaId: string, actividadId: string, tareaId: string) => {
    setPoasConActividades(prev => 
      prev.map(poa => 
        poa.id_poa === poaId
          ? {
              ...poa,
              actividades: poa.actividades.map(act => 
                act.actividad_id === actividadId
                  ? {
                      ...act,
                      tareas: act.tareas.map(tarea => 
                        tarea.tempId === tareaId
                          ? { ...tarea, expanded: !tarea.expanded }
                          : tarea
                      )
                    }
                  : act
              )
            }
          : poa
      )
    );
  };


  const handleDetalleTareaChange = async (idDetalleTarea: string) => {
  if (!currentTarea || !currentPoa) return;
  
  console.log("handleDetalleTareaChange llamado con ID:", idDetalleTarea);
  console.log("currentPoa:", currentPoa);
  console.log("currentTarea existe:", !!currentTarea);

  const poa = poasConActividades.find(p => p.id_poa === currentPoa);
  if (!poa) return;
  
  const detalleTarea = poa.detallesTarea.find(dt => dt.id_detalle_tarea === idDetalleTarea);
  
  if (detalleTarea) {
    console.log("=== DETALLE DE TAREA ENCONTRADO ===");
    console.log("detalleTarea completo:", detalleTarea);
    console.log("id_item_presupuestario:", detalleTarea.id_item_presupuestario);
    console.log("nombre del detalle:", detalleTarea.nombre);
    console.log("descripcion del detalle:", detalleTarea.descripcion);

    setIsLoading(true);
    setLoadingMessage('Cargando información del ítem presupuestario...');
    
    try {
      // Preparar la tarea actualizada con la información básica
      let tareaActualizada = {
        ...currentTarea,
        id_detalle_tarea: idDetalleTarea,
        nombre: detalleTarea.nombre || '',
        detalle_descripcion: detalleTarea.descripcion || '',
        detalle: detalleTarea,
        saldo_disponible: currentTarea.total || 0,
        codigo_item: 'N/A', // Valor por defecto
      };

      // Obtener el tipo de POA actual
      const poaActual = poasConActividades.find(p => p.id_poa === currentPoa);
      const tipoPoa = poaActual?.tipo_poa || 'PVIF'; // Valor por defecto si no hay tipo
      
      // Solo intentar cargar el ítem presupuestario si hay un ID válido
      if (detalleTarea.id_item_presupuestario) {
        try {
          console.log("=== CONSULTANDO ÍTEM PRESUPUESTARIO ===");
          console.log("ID a consultar:", detalleTarea.id_item_presupuestario);
          console.log("Tipo del ID:", typeof detalleTarea.id_item_presupuestario);

          const item = await tareaAPI.getItemPresupuestarioPorId(detalleTarea.id_item_presupuestario);
          console.log("=== RESPUESTA DEL API ÍTEM PRESUPUESTARIO ===");
          console.log("Respuesta completa del item presupuestario:", item);
          console.log("Estructura de la respuesta:", {
            tieneCodigoDirecto: !!item.codigo,
            tieneData: !!item,
            tieneCodigo: item ? !!item.codigo : false,
            keys: Object.keys(item)
          });

          if (item) {
            // Verificar diferentes posibles ubicaciones del código
            let codigoItem = 'N/D';

            console.log("=== EXTRAYENDO CÓDIGO DEL ÍTEM ===");
            if (item.codigo) {
              codigoItem = item.codigo;
              console.log("✓ Código encontrado en item.codigo:", codigoItem);
            } else if (item && item.codigo) {
              codigoItem = item.codigo;
              console.log("✓ Código encontrado en item.data.codigo:", codigoItem);
            } else {
              console.log("✗ Código NO encontrado");
              console.log("Estructura completa del item:", JSON.stringify(item, null, 2));
              console.log("¿Tiene propiedad codigo?", item.hasOwnProperty('codigo'));
              console.log("Valor de item.codigo:", item.codigo);
              console.log("Todas las propiedades del item:", Object.getOwnPropertyNames(item));
            }

            console.log("Código final asignado:", codigoItem);
            
            // Obtener el número de tarea según el tipo de POA
            const numeroTarea = obtenerNumeroTarea(item, tipoPoa);

            tareaActualizada = {
              ...tareaActualizada,
              itemPresupuestario: item,
              codigo_item: codigoItem,
              numero_tarea: numeroTarea,
              // Si hay número de tarea, usarlo como prefijo en el nombre
              nombre: numeroTarea ? `${numeroTarea} - ${detalleTarea.nombre || ''}` : (detalleTarea.nombre || '')
            };
          }
        } catch (itemError) {
          console.error('=== ERROR AL CARGAR ÍTEM PRESUPUESTARIO ===');
          console.error('Error completo:', itemError);
          if (typeof itemError === 'object' && itemError !== null && 'response' in itemError) {
            // @ts-ignore
            console.error('Respuesta del error:', itemError.response);
            // @ts-ignore
            console.error('Status del error:', itemError.response?.status);
            // @ts-ignore
            console.error('Data del error:', itemError.response?.data);
          }
          tareaActualizada = {
            ...tareaActualizada,
            codigo_item: 'Error'
          };
        }
      }
      
      // Actualizar el estado una sola vez con toda la información
      setCurrentTarea(tareaActualizada);
      
    } catch (err) {
      console.error('Error general en handleDetalleTareaChange:', err);
      setError('Error al procesar el detalle de tarea');
    } finally {
      setIsLoading(false);
    }
  }
};

  // Guardar tarea (nueva o editada)
    const guardarTarea = () => {
      if (!currentTarea || !currentPoa || !currentActividad) return;
      
      // Validar datos de la tarea
      if (!currentTarea.id_detalle_tarea) {
        setError('Debe seleccionar un detalle de tarea');
        return;
      }
      
      if (!currentTarea.nombre) {
        setError('El nombre de la tarea es obligatorio');
        return;
      }
      
      if (!currentTarea.cantidad || currentTarea.cantidad <= 0) {
        setError('La cantidad debe ser mayor que cero');
        return;
      }
      
      if (!currentTarea.precio_unitario || currentTarea.precio_unitario <= 0) {
        setError('El precio unitario debe ser mayor que cero');
        return;
      }

      // Validar que haya planificación mensual
      const totalPlanificado = currentTarea.gastos_mensuales?.reduce((sum, val) => sum + (val || 0), 0) || 0;
      if (totalPlanificado === 0) {
        setError('Debe planificar al menos un mes con valor mayor a cero');
        return;
      }

      // Crear objeto de tarea para guardar en el estado local
      const tareaCompleta = {
        ...currentTarea,
        cantidad: Math.floor(currentTarea.cantidad),
        precio_unitario: parseFloat(currentTarea.precio_unitario.toString()),
        // No calculamos total ni saldo_disponible aquí, lo hace el backend
      };

      // Actualizar las tareas en el estado local
      setPoasConActividades(prev => 
        prev.map(poa => 
          poa.id_poa === currentPoa
            ? {
                ...poa,
                actividades: poa.actividades.map(act => 
                  act.actividad_id === currentActividad
                    ? {
                        ...act,
                        tareas: isEditingTarea
                          ? act.tareas.map(t => t.tempId === currentTarea.tempId ? tareaCompleta : t)
                          : [...act.tareas, tareaCompleta]
                      }
                    : act
                )
              }
            : poa
        )
      );

      setShowTareaModal(false);
      setCurrentTarea(null);
      setSuccess(isEditingTarea ? 'Tarea actualizada correctamente' : 'Tarea agregada correctamente');
    };

  // Eliminar tarea
  const eliminarTarea = (poaId: string, actividadId: string, tareaId: string) => {
    const nuevosPoasConActividades = poasConActividades.map(poa => {
      if (poa.id_poa === poaId) {
        const nuevasActividades = poa.actividades.map(act => {
          if (act.actividad_id === actividadId) {
            return {
              ...act,
              tareas: act.tareas.filter(t => t.tempId !== tareaId)
            };
          }
          return act;
        });
        return { ...poa, actividades: nuevasActividades };
      }
      return poa;
    });
    
    setPoasConActividades(nuevosPoasConActividades);
    setSuccess('Tarea eliminada correctamente');
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
      // Filtrar solo actividades con código seleccionado
      const actividadesConCodigo = poa.actividades.filter(act => act.codigo_actividad && act.codigo_actividad !== "");
      
      if (actividadesConCodigo.length === 0) {
        setError(`Debe seleccionar al menos una actividad en el POA ${poa.codigo_poa}`);
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
    setLoadingMessage('Guardando actividades y tareas...');
    setError(null);
    setSuccess(null);
    
    try {
      // Paso 1: Crear actividades
      console.log('=== INICIANDO CREACIÓN DE ACTIVIDADES ===');
      const actividadesCreadas: { [key: string]: string } = {};
      let totalActividadesCreadas = 0;

      // Para cada POA, crear sus actividades seleccionadas
      for (const poa of poasConActividades) {
        console.log(`📁 Procesando POA: ${poa.codigo_poa} (ID: ${poa.id_poa})`);
        console.log(`   Tipo POA: ${poa.tipo_poa}`);
        
        // Filtrar solo las actividades que tienen código seleccionado
        const actividadesConCodigo = poa.actividades.filter(act => act.codigo_actividad && act.codigo_actividad !== "");
        console.log(`   Actividades a crear: ${actividadesConCodigo.length}`);
        
        // Preparar las actividades para este POA específico
        const actividadesParaEnviar: ActividadCreate[] = actividadesConCodigo.map((actPoa, index) => {
          const descripcion = getDescripcionActividad(poa.id_poa, actPoa.codigo_actividad);
          console.log(`   📋 Actividad ${index + 1}:`);
          console.log(`      Código: ${actPoa.codigo_actividad}`);
          console.log(`      Descripción: ${descripcion}`);
          console.log(`      Tareas asociadas: ${actPoa.tareas.length}`);
          console.log(`      ID temporal: ${actPoa.actividad_id}`);
          
          return {
            descripcion_actividad: descripcion,
            total_por_actividad: 0,
            saldo_actividad: 0
          };
        });

        // Validar planificación mensual antes de crear actividades
        console.log('🔍 Validando planificación mensual...');
        for (const actividad of actividadesConCodigo) {
          console.log(`   Validando actividad: ${actividad.codigo_actividad}`);
          for (const tarea of actividad.tareas) {
            const totalPlanificado = tarea.gastos_mensuales?.reduce((sum, val) => sum + (val || 0), 0) || 0;
            console.log(`      Tarea "${tarea.nombre}": Total planificado = ${totalPlanificado}`);
            if (totalPlanificado === 0) {
              console.error(`❌ ERROR: Tarea sin planificación mensual: ${tarea.nombre}`);
              setError(`La tarea "${tarea.nombre}" debe tener planificación mensual`);
              setActivePoaTab(poa.id_poa);
              return;
            }
          }
        }
        
        // Crear las actividades para este POA solo si hay actividades para enviar
        if (actividadesParaEnviar.length > 0) {
          console.log(`🚀 Enviando ${actividadesParaEnviar.length} actividades al API...`);
          
          try {
            const actividadesRespuesta = await actividadAPI.crearActividadesPorPOA(poa.id_poa, actividadesParaEnviar);
            console.log('✅ Respuesta del API para actividades:', actividadesRespuesta);
            
            // Guardar mapeo de IDs temporales a IDs reales - CORREGIDO
            if (actividadesRespuesta && Array.isArray(actividadesRespuesta)) {
              actividadesConCodigo.forEach((act, index) => {
                if (actividadesRespuesta[index] && actividadesRespuesta[index].id_actividad) {
                  const idReal = actividadesRespuesta[index].id_actividad;
                  actividadesCreadas[act.actividad_id] = idReal;
                  totalActividadesCreadas++;
                  
                  console.log(`   📝 Mapeo creado: ${act.actividad_id} → ${idReal}`);
                  console.log(`      Actividad: ${act.codigo_actividad}`);
                  console.log(`      Índice: ${index}`);
                } else {
                  console.error(`   ❌ No se pudo mapear actividad en índice ${index}:`, actividadesRespuesta[index]);
                }
              });
            } else {
              console.error('❌ Respuesta de actividades no es un array válido:', actividadesRespuesta);
            }
            
          } catch (error) {
            console.error(`❌ ERROR al crear actividades para POA ${poa.codigo_poa}:`, error);
            throw error;
          }
        }
      }

      console.log(`✅ ACTIVIDADES CREADAS: ${totalActividadesCreadas} total`);
      console.log('📋 Mapeo completo de IDs:', actividadesCreadas);

      // Actualizar el estado con los IDs reales de actividades
      console.log('🔄 Actualizando estado local con IDs reales...');
      const poasActualizados = poasConActividades.map(poa => {
      const actividadesActualizadas = poa.actividades.map(act => {
        // Solo actualizar actividades que tienen código seleccionado Y tienen ID real mapeado
        if (act.codigo_actividad && act.codigo_actividad !== "" && actividadesCreadas[act.actividad_id]) {
          console.log(`🔗 Asignando ID real a actividad: ${act.codigo_actividad}`);
          console.log(`   ID temporal: ${act.actividad_id}`);
          console.log(`   ID real: ${actividadesCreadas[act.actividad_id]}`);
          return {
            ...act,
            id_actividad_real: actividadesCreadas[act.actividad_id]
          };
        } else {
          // Log para debugging
          if (act.codigo_actividad && act.codigo_actividad !== "") {
            console.warn(`⚠️ Actividad ${act.codigo_actividad} no tiene ID real mapeado`);
            console.warn(`   ID temporal: ${act.actividad_id}`);
            console.warn(`   ¿Existe en mapeo?`, actividadesCreadas.hasOwnProperty(act.actividad_id));
            console.warn(`   Mapeo disponible:`, Object.keys(actividadesCreadas));
          }
        }
        return act;
      });
      return { ...poa, actividades: actividadesActualizadas };
    });

      setPoasConActividades(poasActualizados);

      // Paso 2: Crear tareas para cada actividad
      console.log('\n=== INICIANDO CREACIÓN DE TAREAS ===');
      setLoadingMessage('Guardando tareas...');

      let totalTareasCreadas = 0;
      let totalProgramacionesCreadas = 0;

      // Para cada POA
      for (const poa of poasActualizados) {
        console.log(`\n📁 Procesando tareas para POA: ${poa.codigo_poa}`);
        
        // Para cada actividad

        // Debug: Verificar el estado antes de procesar tareas
        console.log(`📊 Estado del POA antes de crear tareas:`);
        console.log(`   Actividades totales: ${poa.actividades.length}`);
        poa.actividades.forEach((act, idx) => {
          console.log(`   ${idx + 1}. Código: ${act.codigo_actividad}, ID temporal: ${act.actividad_id}, ID real: ${act.id_actividad_real}, Tareas: ${act.tareas.length}`);
        });

        for (const actividad of poa.actividades) {
          console.log(`\n📋 Procesando actividad: ${actividad.codigo_actividad}`);

          // Verificar si realmente tiene ID real antes de continuar
          if (!actividad.id_actividad_real) {
            console.error(`❌ CRÍTICO: Actividad ${actividad.codigo_actividad} sin ID real, saltando creación de tareas`);
            console.error(`   ID temporal: ${actividad.actividad_id}`);
            console.error(`   Mapeo existente:`, actividadesCreadas);
            continue; // Saltar a la siguiente actividad
          }

          console.log(`   ID temporal: ${actividad.actividad_id}`);
          console.log(`   ID real: ${actividad.id_actividad_real}`);
          console.log(`   Tareas a crear: ${actividad.tareas.length}`);
          
          // Si la actividad tiene ID real y tareas
          if (actividad.id_actividad_real && actividad.tareas.length > 0) {
            
            // Crear tareas secuencialmente
            for (let i = 0; i < actividad.tareas.length; i++) {
              const tarea = actividad.tareas[i];
              console.log(`\n   🔨 Creando tarea ${i + 1}/${actividad.tareas.length}:`);
              console.log(`      Nombre: ${tarea.nombre}`);
              console.log(`      Detalle ID: ${tarea.id_detalle_tarea}`);
              console.log(`      Cantidad: ${tarea.cantidad}`);
              console.log(`      Precio unitario: ${tarea.precio_unitario}`);
              
              try {
                const tareaDatos: TareaCreate = {
                  id_detalle_tarea: tarea.id_detalle_tarea,
                  nombre: tarea.nombre,
                  detalle_descripcion: tarea.detalle_descripcion,
                  cantidad: tarea.cantidad,
                  precio_unitario: tarea.precio_unitario
                };
                
                console.log(`      📡 Enviando tarea al API...`);
                console.log(`      Datos enviados:`, tareaDatos);
                
                // Crear la tarea
                const tareaCreada = await tareaAPI.crearTarea(actividad.id_actividad_real!, tareaDatos);

                if (!tareaCreada || !tareaCreada.id_tarea) {
                  console.error(`❌ ERROR: No se recibió ID de tarea válido`);
                  console.error(`   Respuesta completa:`, tareaCreada);
                  throw new Error(`No se pudo obtener ID de la tarea creada: ${tarea.nombre}`);
                }

                totalTareasCreadas++;
                
                console.log(`      ✅ Tarea creada exitosamente:`);
                console.log(`         ID tarea: ${tareaCreada.id_tarea}`);
                console.log(`         Total: ${tareaCreada.total}`);
                
                // Crear la programación mensual para esta tarea
                console.log(`      📅 Creando programación mensual...`);
                if (tarea.gastos_mensuales && tarea.gastos_mensuales.length === 12) {
                  console.log(`         Gastos mensuales:`, tarea.gastos_mensuales);
                  
                  for (let index = 0; index < tarea.gastos_mensuales.length; index++) {
                    const valor = tarea.gastos_mensuales[index];
                    if (valor > 0) {
                      const mesNumero = index + 1;
                      const añoActual = new Date().getFullYear();
                      const mesFormateado = `${mesNumero.toString().padStart(2, '0')}-${añoActual}`;
                      
                      const programacionDatos = {
                        id_tarea: tareaCreada.id_tarea,
                        mes: mesFormateado,
                        valor: valor.toString()
                      };
                      
                      console.log(`         📝 Mes ${mesNumero} (${mesFormateado}): $${valor}`);
                      console.log(`            Datos programación:`, programacionDatos);
                      
                      try {
                        await tareaAPI.crearProgramacionMensual(programacionDatos);
                        totalProgramacionesCreadas++;
                        console.log(`            ✅ Programación creada para mes ${mesNumero}`);
                      } catch (progError) {
                        console.error(`            ❌ ERROR en programación mes ${mesNumero}:`, progError);
                        throw progError;
                      }
                    }
                  }
                } else {
                  console.warn(`      ⚠️  Sin gastos mensuales válidos para tarea: ${tarea.nombre}`);
                }
                
              } catch (error) {
                console.error(`      ❌ ERROR al crear tarea ${tarea.nombre}:`, error);
                console.error(`         Actividad ID: ${actividad.id_actividad_real}`);
                console.error(`         Error completo:`, error);
                throw new Error(`Error al crear la tarea "${tarea.nombre}": ${error}`);
              }
            }
          } else {
            if (!actividad.id_actividad_real) {
              console.warn(`   ⚠️  Actividad sin ID real: ${actividad.codigo_actividad}`);
            }
            if (actividad.tareas.length === 0) {
              console.warn(`   ⚠️  Actividad sin tareas: ${actividad.codigo_actividad}`);
            }
          }
        }
      }

      console.log('\n=== RESUMEN FINAL ===');
      console.log(`✅ Actividades creadas: ${totalActividadesCreadas}`);
      console.log(`✅ Tareas creadas: ${totalTareasCreadas}`);
      console.log(`✅ Programaciones mensuales creadas: ${totalProgramacionesCreadas}`);
      console.log(`📊 POAs procesados: ${poasProyecto.length}`);

      setSuccess(`Se han creado exitosamente ${totalActividadesCreadas} actividades, ${totalTareasCreadas} tareas y ${totalProgramacionesCreadas} programaciones mensuales para ${poasProyecto.length} POAs del proyecto`);

      // Opcional: redirigir a otra página después de un tiempo
      setTimeout(() => {
        navigate('/poas');
      }, 3000);
    } catch (err) {
      console.error('Error al crear actividades y tareas:', err);
      setError(err instanceof Error ? err.message : 'Error al crear las actividades y tareas');
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular total para una actividad
  const calcularTotalActividad = (poaId: string, actividadId: string) => {
    const poa = poasConActividades.find(p => p.id_poa === poaId);
    if (!poa) return 0;
    
    const actividad = poa.actividades.find(a => a.actividad_id === actividadId);
    if (!actividad) return 0;
    
    return actividad.tareas.reduce((sum, tarea) => sum + (tarea.total || 0), 0);
  };

  // Función para obtener el número de tarea según el tipo de POA
  const obtenerNumeroTarea = (itemPresupuestario: any, tipoPoa: string): string => {
    if (!itemPresupuestario || !itemPresupuestario.nombre) return '';
    
    // El nombre contiene tres números separados por "; " en el orden: PIM, PTT, PVIF
    const numeros = itemPresupuestario.nombre.split('; ');
    
    if (numeros.length !== 3) return '';
    
    let indice = 0;
    switch (tipoPoa) {
      case 'PIM':
        indice = 0;
        break;
      case 'PTT':
        indice = 1;
        break;
      case 'PVIF':
        indice = 2;
        break;
      default:
        indice = 2; // Por defecto PVIF
    }
    
    const numero = numeros[indice];
    return numero === '0' ? '' : numero;
  };

  // Función para obtener el número de actividad del código de actividad
  // Función para obtener el número de actividad del código de actividad
  const obtenerNumeroActividad = (codigoActividad: string): string => {
    // Manejar diferentes formatos de códigos de actividad
    if (codigoActividad.includes('PIM')) {
      // Para PIM: "ACT-PIM-1" -> "1"
      const partes = codigoActividad.split('-');
      return partes[partes.length - 1] || '';
      
    } else if (codigoActividad.includes('PTT')) {
      // Para PTT: "ACT-PTT-1" -> "1"
      const partes = codigoActividad.split('-');
      return partes[partes.length - 1] || '';
    } else {
      // Para formatos estándar: "ACT-1" -> "1"
      const partes = codigoActividad.split('-');
      return partes[partes.length - 1] || '';
    }
  };

  // Función para mapear códigos de actividad a números según el tipo de POA
  const mapearCodigoActividadANumero = (codigoActividad: string, tipoPoa: string): string => {
    // Mapeo específico según el tipo de POA y las listas del segundo archivo
    const mapeos: { [key: string]: { [key: string]: string } } = {
      'PIM': {
        'ACT-PIM-1': '1', 'ACT-PIM-2': '2', 'ACT-PIM-3': '3', 'ACT-PIM-4': '4', 'ACT-PIM-5': '5', 'ACT-PIM-6': '6',
        'ACT-PIM-7': '7', 'ACT-PIM-8': '8', 'ACT-PIM-9': '9', 'ACT-PIM-10': '10', 'ACT-PIM-11': '11', 'ACT-PIM-12': '12'
      },
      'PTT': {
        'ACT-PTT-1': '1', 'ACT-PTT-2': '2', 'ACT-PTT-3': '3', 'ACT-PTT-4': '4',
        'ACT-PTT-5': '5', 'ACT-PTT-6': '6', 'ACT-PTT-7': '7', 'ACT-PTT-8': '8'
      },
      'PVIF': {
        'ACT-1': '1', 'ACT-2': '2', 'ACT-3': '3', 'ACT-4': '4',
        'ACT-5': '5', 'ACT-6': '6', 'ACT-7': '7', 'ACT-8': '8'
      },
      'PVIS': {
        'ACT-1': '1', 'ACT-2': '2', 'ACT-3': '3', 'ACT-4': '4',
        'ACT-5': '5', 'ACT-6': '6', 'ACT-7': '7', 'ACT-8': '8'
      },
      'PIGR': {
        'ACT-1': '1', 'ACT-2': '2', 'ACT-3': '3', 'ACT-4': '4',
        'ACT-5': '5', 'ACT-6': '6', 'ACT-7': '7', 'ACT-8': '8'
      },
      'PIS': {
       'ACT-1': '1', 'ACT-2': '2', 'ACT-3': '3', 'ACT-4': '4',
        'ACT-5': '5', 'ACT-6': '6', 'ACT-7': '7', 'ACT-8': '8'
      },
      'PIIF': {
        'ACT-1': '1', 'ACT-2': '2', 'ACT-3': '3', 'ACT-4': '4',
        'ACT-5': '5', 'ACT-6': '6', 'ACT-7': '7', 'ACT-8': '8'
      }
    };

    return mapeos[tipoPoa]?.[codigoActividad] || obtenerNumeroActividad(codigoActividad);
  };

  // Función para filtrar detalles de tarea según la actividad y tipo de POA
  // Ahora hace consultas individuales para obtener los items presupuestarios
  const filtrarDetallesPorActividadConConsultas = async (
    detallesTarea: DetalleTarea[], 
    codigoActividad: string, 
    tipoPoa: string,
    getItemPresupuestarioPorId: (id: string) => Promise<ItemPresupuestario>
  ): Promise<DetalleTarea[]> => {
    const numeroActividad = mapearCodigoActividadANumero(codigoActividad, tipoPoa);
    
    console.log("=== DEBUG FILTRADO CON CONSULTAS ===");
    console.log("Código actividad:", codigoActividad);
    console.log("Número actividad extraído:", numeroActividad);
    console.log("Tipo POA:", tipoPoa);
    console.log("Total detalles a filtrar:", detallesTarea.length);
    
    if (!numeroActividad) {
      console.log("No se pudo extraer número de actividad");
      return detallesTarea; // Retorna todos si no puede filtrar
    }

    // Validación adicional para asegurar que el número es válido
    if (!/^\d+$/.test(numeroActividad)) {
      console.log("Número de actividad no es válido:", numeroActividad);
      return detallesTarea;
    }
    
    // Procesar cada detalle de forma asíncrona
    const detallesConItems = await Promise.allSettled(
      detallesTarea.map(async (detalle) => {
        console.log("=== PROCESANDO DETALLE ===");
        console.log("ID detalle:", detalle.id_detalle_tarea);
        console.log("Nombre detalle:", detalle.nombre);
        console.log("ID item presupuestario:", detalle.id_item_presupuestario);
        
        try {
          // Obtener el item presupuestario usando la función proporcionada
          const itemPresupuestario = await getItemPresupuestarioPorId(detalle.id_item_presupuestario);
          
          console.log("✅ Item presupuestario obtenido:", itemPresupuestario);
          console.log("Nombre del item:", itemPresupuestario.nombre);
          
          // Verificar formato del nombre (debe ser "X.Y; A.B; C.D")
          if (!itemPresupuestario.nombre || typeof itemPresupuestario.nombre !== 'string') {
            console.log("❌ Nombre del item presupuestario no válido");
            return { detalle, incluir: false, itemPresupuestario: null };
          }
          
          // Obtener los números del nombre (formato: "X.Y; A.B; C.D")
          const numeros = itemPresupuestario.nombre.split('; ');
          console.log("Números extraídos:", numeros);
          
          if (numeros.length !== 3) {
            console.log("❌ Formato incorrecto de números, esperado 3 partes separadas por '; '");
            return { detalle, incluir: false, itemPresupuestario };
          }
          
          // Determinar qué posición revisar según el tipo de POA
          let indice = 0;
          switch (tipoPoa) {
            case 'PIM':
              indice = 0;
              break;
            case 'PTT':
              indice = 1;
              break;
            case 'PVIF':
            case 'PVIS':
            case 'PIGR':
            case 'PIS':
            case 'PIIF':
              indice = 2;
              break;
            default:
              indice = 2;
          }
          
          const numeroTarea = numeros[indice];
          console.log(`Número de tarea para ${tipoPoa} (índice ${indice}):`, numeroTarea);
          
          // Si es "0", no está disponible para este tipo de POA
          if (numeroTarea === '0') {
            console.log("❌ Tarea no disponible para este tipo de POA (valor = 0)");
            return { detalle, incluir: false, itemPresupuestario };
          }
          
          // Verificar si el número de la tarea comienza con el número de actividad
          const coincide = numeroTarea.startsWith(numeroActividad + '.');
          console.log(`¿${numeroTarea} comienza con ${numeroActividad}.?`, coincide);
          
          if (coincide) {
            console.log("✅ Detalle incluido en filtro");
          } else {
            console.log("❌ Detalle excluido del filtro");
          }
          
          return { detalle, incluir: coincide, itemPresupuestario, numeroTarea };
          
        } catch (error) {
          console.error(`❌ Error al obtener item presupuestario para ${detalle.nombre}:`, error);
          return { detalle, incluir: false, itemPresupuestario: null, error };
        }
      })
    );
    
    // Filtrar solo los que se resolvieron correctamente y deben incluirse
    const filtrados = detallesConItems
      .filter(result => result.status === 'fulfilled' && result.value.incluir)
      .map(result => (result as PromiseFulfilledResult<any>).value);
    
    console.log("=== RESULTADO FILTRADO ===");
    console.log("Detalles filtrados:", filtrados.length);
    filtrados.forEach((item, index) => {
      console.log(`${index + 1}. ${item.detalle.nombre} - Tarea: ${item.numeroTarea}`);
    });
    
    // Ordenar los resultados filtrados según el número de tarea
    const filtradosOrdenados = filtrados.sort((a, b) => {
      const valorA = parseFloat(a.numeroTarea);
      const valorB = parseFloat(b.numeroTarea);
      
      console.log(`Comparando orden: ${a.numeroTarea} (${valorA}) vs ${b.numeroTarea} (${valorB})`);
      
      return valorA - valorB; // Orden ascendente
    });
    
    console.log("=== RESULTADO FINAL ORDENADO ===");
    console.log("Total detalles ordenados:", filtradosOrdenados.length);
    
    // Retornar solo los detalles, no los objetos con metadata
    return filtradosOrdenados.map(item => item.detalle);
  };

  /*
  // Función auxiliar para obtener el número de tarea haciendo consulta individual
  const obtenerNumeroTareaConConsulta = async (
    idItemPresupuestario: string, 
    tipoPoa: string,
    getItemPresupuestarioPorId: (id: string) => Promise<ItemPresupuestario>
  ): Promise<string> => {
    try {
      const itemPresupuestario = await getItemPresupuestarioPorId(idItemPresupuestario);
      
      if (!itemPresupuestario?.nombre) return '';
      
      const numeros = itemPresupuestario.nombre.split('; ');
      if (numeros.length !== 3) return '';
      
      let indice = 0;
      switch (tipoPoa) {
        case 'PIM':
          indice = 0;
          break;
        case 'PTT':
          indice = 1;
          break;
        case 'PVIF':
        case 'PVIS':
        case 'PIGR':
        case 'PIS':
        case 'PIIF':
          indice = 2;
          break;
        default:
          indice = 0;
      }
      
      return numeros[indice];
    } catch (error) {
      console.error('Error al obtener número de tarea:', error);
      return '';
    }
  };
  */

  // Cache simple para evitar consultas repetidas
  const cacheItemsPresupuestarios = new Map<string, ItemPresupuestario>();

  const getItemPresupuestarioConCache = async (
    id: string,
    getItemPresupuestarioPorId: (id: string) => Promise<ItemPresupuestario>
  ): Promise<ItemPresupuestario> => {
    if (cacheItemsPresupuestarios.has(id)) {
      console.log(`📋 Usando cache para item: ${id}`);
      return cacheItemsPresupuestarios.get(id)!;
    }
    
    console.log(`🔍 Consultando item desde API: ${id}`);
    const item = await getItemPresupuestarioPorId(id);
    cacheItemsPresupuestarios.set(id, item);
    return item;
  };
    

  

  return (
    <Container className="py-4">
      <Card className="shadow-lg">
        <Card.Header className="bg-primary bg-gradient text-white p-3">
          <h2 className="mb-0 fw-bold text-center">Crear Actividades y Tareas para Proyecto</h2>
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
              proyectos={proyectos}
              isLoading={isLoading}
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
                      <h5 className="mb-0">POAs del Proyecto</h5>
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

            {proyectoSeleccionado && poasProyecto.length > 0 && (
              <Row className="mb-4">
                <Col md={12} className="d-flex justify-content-end">
                  <ExportarPOA 
                    codigoProyecto={proyectoSeleccionado.codigo_proyecto}
                    poas={poasProyecto.map(poa => ({
                      id_poa: poa.id_poa,
                      codigo_poa: poa.codigo_poa,
                      anio_ejecucion: poa.anio_ejecucion,
                      //tipo_poa: poa.tipo_poa || 'No especificado',
                      presupuesto_asignado: parseFloat(poa.presupuesto_asignado)
                    }))}
                    onExport={() => setSuccess("POA exportado correctamente")}
                  />
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
                      >
                        {poasConActividades.map((poa) => (
                          <Tab 
                            key={poa.id_poa} 
                            eventKey={poa.id_poa} 
                            title={`${poa.codigo_poa} - ${poa.tipo_poa}`}
                          >
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h6>Presupuesto Asignado: ${poa.presupuesto_asignado.toLocaleString('es-CO')}</h6>
                              <Button 
                                variant="success" 
                                size="sm" 
                                onClick={() => agregarActividad(poa.id_poa)}
                              >
                                <i className="bi bi-plus-circle me-1"></i> Agregar Actividad
                              </Button>
                            </div>

                            {/* Lista de Actividades con Tareas */}
                            {/* Reemplazar la parte del formulario para seleccionar actividad */}
                            {poa.actividades.map((actividad, indexActividad) => (
                              <Card 
                                key={actividad.actividad_id} 
                                className="mb-4 border-primary"
                                id={`actividad-${actividad.actividad_id}`}
                              >
                                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                                  <div className="d-flex align-items-center">
                                    <h6 className="mb-0 text-primary me-2">Actividad ({indexActividad + 1}):</h6>
                                    <span>{getDescripcionActividad(poa.id_poa, actividad.codigo_actividad)}</span>
                                  </div>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => eliminarActividad(poa.id_poa, actividad.actividad_id)}
                                  >
                                    <i className="bi bi-trash"></i> Eliminar
                                  </Button>
                                </Card.Header>

                                <Card.Body className="p-3">
                                  <hr className="my-3" />


                                  {/* Sección de Tareas - Se mantiene igual */}
                                  <div className="mt-3">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                      <h6>Tareas asignadas</h6>
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => mostrarModalTarea(poa.id_poa, actividad.actividad_id)}
                                      >
                                        <i className="bi bi-plus-circle me-1"></i> Agregar Tarea
                                      </Button>
                                    </div>
                                    {actividad.tareas.length === 0 ? (
                                      <p className="text-muted small">No hay tareas definidas para esta actividad.</p>
                                    ) : (
                                      <div className="table-responsive">
                                        <table className="table table-sm table-hover table-bordered">
                                          <thead className="table-light">
                                            <tr>
                                              <th style={{width: '30px'}}></th>
                                              <th>#</th>
                                              <th>Nombre</th>
                                              <th>Código Ítem</th>
                                              <th>Descripción</th>
                                              <th className="text-end">Cantidad</th>
                                              <th className="text-end">Precio Unit.</th>
                                              <th className="text-end">Total</th>
                                              <th className="text-center">Acciones</th>
                                            </tr>
                                          </thead>

                                          <tbody>
                                            {actividad.tareas.map((tarea, indexTarea) => (
                                              <React.Fragment key={tarea.tempId}>
                                                <tr>
                                                  <td className="text-center">
                                                    <Button
                                                      variant="link"
                                                      size="sm"
                                                      className="p-0 text-decoration-none"
                                                      onClick={() => toggleTareaExpansion(poa.id_poa, actividad.actividad_id, tarea.tempId)}
                                                    >
                                                      <i className={`bi ${tarea.expanded ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
                                                    </Button>
                                                  </td>
                                                  <td>{indexTarea + 1}</td>
                                                  <td>{tarea.nombre}</td>
                                                  <td>{tarea.codigo_item || 'N/A'}</td>
                                                  <td>{tarea.detalle_descripcion}</td>
                                                  <td className="text-end">{tarea.cantidad}</td>
                                                  <td className="text-end">${tarea.precio_unitario.toFixed(2)}</td>
                                                  <td className="text-end">${tarea.total?.toFixed(2)}</td>
                                                  <td className="text-center">
                                                    <Button
                                                      variant="outline-secondary"
                                                      size="sm"
                                                      className="me-1"
                                                      onClick={() => mostrarModalTarea(poa.id_poa, actividad.actividad_id, tarea)}
                                                    >
                                                      <i className="bi bi-pencil"></i>
                                                    </Button>
                                                    <Button
                                                      variant="outline-danger"
                                                      size="sm"
                                                      onClick={() => eliminarTarea(poa.id_poa, actividad.actividad_id, tarea.tempId)}
                                                    >
                                                      <i className="bi bi-trash"></i>
                                                    </Button>
                                                  </td>
                                                </tr>

                                                {/* Parte explandible de la tabla */}
                                                {tarea.expanded && (
                                                  <tr className="bg-light">
                                                    <td></td>
                                                    <td colSpan="8">
                                                      <div className="p-3">
                                                        <h6 className="mb-3">
                                                          <i className="bi bi-calendar-month me-2"></i>
                                                          Distribución Mensual de Gastos
                                                        </h6>
                                                        <div className="row g-2">
                                                          {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((mes, idx) => (
                                                            <div key={mes} className="col-xl-1 col-lg-2 col-md-3 col-sm-4 col-6">
                                                              <div className="text-center border rounded p-2">
                                                                <small className="d-block text-muted fw-bold">{mes}</small>
                                                                <div className="mt-1">
                                                                  <span className={`badge ${(tarea.gastos_mensuales?.[idx] || 0) > 0 ? 'bg-success' : 'bg-secondary'}`}>
                                                                    ${tarea.gastos_mensuales?.[idx]?.toFixed(0) || '0'}
                                                                  </span>
                                                                </div>
                                                              </div>
                                                            </div>
                                                          ))}
                                                        </div>
                                                        <div className="mt-3 text-end">
                                                          {(() => {
                                                            const totalPlanificado = tarea.gastos_mensuales?.reduce((sum, val) => sum + (val || 0), 0) || 0;
                                                            const totalTarea = tarea.total || 0;
                                                            const excedeLimite = totalPlanificado > totalTarea;
                                                            
                                                            return (
                                                              <div>
                                                                <p className="mb-1">
                                                                  <strong style={{ color: 'black' }}>
                                                                    Total planificado: ${totalPlanificado.toFixed(2)}
                                                                  </strong>
                                                                </p>
                                                                {excedeLimite && (
                                                                  <small className="text-danger">
                                                                    ⚠️ El total planificado no puede exceder ${totalTarea.toFixed(2)}
                                                                  </small>
                                                                )}
                                                              </div>
                                                            );
                                                          })()}
                                                        </div>
                                                      </div>
                                                    </td>
                                                  </tr>
                                                )}
                                              </React.Fragment>
                                            ))}
                                          </tbody>
                                          <tfoot className="table-light">
                                            <tr>
                                              <th colSpan={6} className="text-end">Total Actividad:</th>
                                              <th className="text-end">${calcularTotalActividad(poa.id_poa, actividad.actividad_id).toFixed(2)}</th>
                                              <th></th>
                                            </tr>
                                          </tfoot>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                </Card.Body>
                              </Card>
                            ))}
                          </Tab>
                        ))}
                      </Tabs>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Botones de acción */}
            {proyectoSeleccionado && poasProyecto.length > 0 && (
              <Row className="mt-4">
                <Col className="d-flex justify-content-center">
                  <Button variant="secondary" className="me-2" onClick={() => navigate('/poas')}>
                    Cancelar
                  </Button>
                  <Button variant="primary" type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                        Guardando...
                      </>
                    ) : (
                      'Guardar Actividades y Tareas'
                    )}
                  </Button>
                </Col>
              </Row>
            )}

            {/* Modal para seleccionar actividad */}
            <Modal show={showActividadModal} onHide={() => setShowActividadModal(false)}>
              <Modal.Header closeButton>
                <Modal.Title>Seleccionar Actividad</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {error && (
                  <Alert variant="danger" onClose={() => setError(null)} dismissible>
                    {error}
                  </Alert>
                )}
                
                <Form.Group className="mb-3">
                  <Form.Label>Actividades Disponibles</Form.Label>
                  <Form.Select
                    value={actividadSeleccionadaModal}
                    onChange={(e) => setActividadSeleccionadaModal(e.target.value)}
                  >
                    <option value="">Seleccione una actividad...</option>
                    {actividadesDisponiblesModal.map(act => (
                      <option key={act.id} value={act.id}>
                        {act.descripcion}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowActividadModal(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" onClick={confirmarSeleccionActividad}>
                  Agregar Actividad
                </Button>
              </Modal.Footer>
            </Modal>

            {/* Modal para agregar/editar tareas */}
            <Modal show={showTareaModal} onHide={() => setShowTareaModal(false)} size='lg'>
              <Modal.Header closeButton>
                <Modal.Title>{isEditingTarea ? 'Editar Tarea' : 'Agregar Nueva Tarea'}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {error && (
                  <Alert variant="danger" onClose={() => setError(null)} dismissible>
                    {error}
                  </Alert>
                )}
                
                <Form.Group className="mb-3">
                  <Form.Label>Detalle de Tarea</Form.Label>
                  <Form.Select
                    value={currentTarea?.id_detalle_tarea || ''}
                    onChange={async (e) => {
                      console.log("Seleccionando detalle de tarea:", e.target.value);
                      await handleDetalleTareaChange(e.target.value);
                    }}
                    disabled={cargandoDetalles}
                  >
                    <option value="">
                      {cargandoDetalles ? 'Cargando detalles...' : 'Seleccione un detalle...'}
                    </option>
                    {detallesFiltrados.map(dt => {
                      // Para mostrar el número de tarea en la opción, podrías hacer otra consulta
                      // o mantenerlo simple por ahora
                      return (
                        <option key={dt.id_detalle_tarea} value={dt.id_detalle_tarea}>
                          {dt.nombre}
                        </option>
                      );
                    })}
                  </Form.Select>
                  {cargandoDetalles && (
                    <Form.Text className="text-muted">
                      Filtrando detalles según la actividad seleccionada...
                    </Form.Text>
                  )}
                </Form.Group>
                
                {/* Campo para mostrar el código del ítem */}
                <Form.Group className="mb-3">
                  <Form.Label>Código del Ítem</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentTarea?.codigo_item || ''}
                    disabled
                    onChange={() => {
                      console.log("Código del ítem actual:", currentTarea?.codigo_item);
                    }}
                  />
                  <Form.Text className="text-muted">
                    Este código se asigna automáticamente según el detalle de tarea.
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Nombre de la Tarea *</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentTarea?.nombre || ''}
                    onChange={(e) => setCurrentTarea(prev => prev ? {...prev, nombre: e.target.value} : null)}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Descripción</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={currentTarea?.detalle_descripcion || ''}
                    onChange={(e) => setCurrentTarea(prev => prev ? {...prev, detalle_descripcion: e.target.value} : null)}
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Cantidad *</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        step="1"
                        value={currentTarea?.cantidad === 0 ? '' : currentTarea?.cantidad || ''}
                        onChange={(e) => {
                          const rawValue = e.target.value;
                          // Si está vacío, establecer a vacío para permitir borrar
                          if (rawValue === '') {
                            setCurrentTarea(prev => prev ? {...prev, cantidad: 0} : null);
                            return;
                          }
                          // Solo permitir enteros positivos
                          const value = parseInt(rawValue, 10);
                          if (!isNaN(value)) {
                            setCurrentTarea(prev => {
                              if (!prev) return prev;
                              const nuevaCantidad = value;
                              const nuevoTotal = nuevaCantidad * (prev.precio_unitario || 0);
                              // También actualizamos el saldo disponible para que sea igual al total
                              return {
                                ...prev,
                                cantidad: nuevaCantidad,
                                total: nuevoTotal,
                                saldo_disponible: nuevoTotal
                              };
                            });
                          }
                        }}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Precio Unitario *</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>$</InputGroup.Text>
                        <Form.Control
                          type="text"
                          value={currentTarea?.precio_unitario === 0 ? '' : currentTarea?.precio_unitario || ''}
                          onChange={(e) => {
                            const rawValue = e.target.value;
                            
                            // Si está vacío, establecer a vacío para permitir borrar
                            if (rawValue === '') {
                              setCurrentTarea(prev => prev ? {...prev, precio_unitario: 0} : null);
                              return;
                            }
                            
                            // Validación mejorada: permite punto decimal y limita a 2 decimales
                            // Primero verifica si el valor es un formato válido de número con máximo 2 decimales
                            const isValidFormat = /^\d*\.?\d{0,2}$/.test(rawValue);
                            
                            if (isValidFormat) {
                              // Usamos este valor para almacenar en el estado
                              //const inputValue = rawValue;
                              
                              // Para cálculos, convertimos a número (si termina en punto, consideramos 0 decimales)
                              const numericValue = rawValue.endsWith('.') 
                                ? parseFloat(rawValue + '0') 
                                : parseFloat(rawValue) || 0;
                              
                                setCurrentTarea(prev => {
                                if (!prev) return prev;
                                const nuevoTotal = (prev.cantidad || 0) * numericValue;

                                return {
                                  ...prev,
                                  precio_unitario: numericValue, // Guardamos como número (no string)
                                  total: nuevoTotal,
                                  saldo_disponible: nuevoTotal
                                };
                                });
                            }
                          }}
                          required
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Total</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>$</InputGroup.Text>
                    <Form.Control
                      type="text"
                      value={currentTarea?.total ? currentTarea.total.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                      disabled
                    />
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Este valor se calcula automáticamente (Cantidad × Precio Unitario).
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Saldo Disponible</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>$</InputGroup.Text>
                    <Form.Control
                      type="text"
                      value={currentTarea?.saldo_disponible === 0 ? '' : currentTarea?.saldo_disponible || ''}
                      onChange={(e) => {
                        const rawValue = e.target.value;
                        // Si está vacío, establecer a vacío para permitir borrar
                        if (rawValue === '') {
                          setCurrentTarea(prev => prev ? {...prev, saldo_disponible: 0} : null);
                          return;
                        }
                        
                        // Permitir solo números con hasta 2 decimales
                        if (/^\d*\.?\d{0,2}$/.test(rawValue)) {
                          setCurrentTarea(prev => {
                            if (!prev) return prev;
                            return {
                              ...prev,
                              saldo_disponible: rawValue === '' ? 0 : parseFloat(rawValue) || 0
                            };
                          });
                        }
                      }}
                    />
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Por defecto es igual al total, pero puede ser modificado.
                  </Form.Text>
                  <Form.Group className="mb-3">
                    <hr className="my-3" />
                      <div className="text-center mb-3">
                        <Form.Label className="h6 fw-bold">Distribución Mensual de Gastos</Form.Label>
                      </div>
                    <div className="row g-2">
                      {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((mes, index) => (
                        <div key={mes} className="col-md-3 col-sm-6 mb-2">
                          <Form.Label className="small fw-bold">{mes}</Form.Label>
                          <InputGroup size="sm">
                            <InputGroup.Text>$</InputGroup.Text>
                            <Form.Control
                              type="number"
                              step="0.01"
                              min="0"
                              value={currentTarea?.gastos_mensuales?.[index] || ''}
                              onChange={(e) => {
                                const valor = parseFloat(e.target.value) || 0;
                                setCurrentTarea(prev => {
                                  if (!prev) return prev;
                                  const gastosMensuales = [...(prev.gastos_mensuales || new Array(12).fill(0))];
                                  gastosMensuales[index] = valor;
                                  return {
                                    ...prev,
                                    gastos_mensuales: gastosMensuales
                                  };
                                });
                              }}
                            />
                          </InputGroup>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-end">
                      <Form.Text className="text-muted">
                        <strong>Total planificado: ${currentTarea?.gastos_mensuales?.reduce((sum, val) => sum + (val || 0), 0)?.toFixed(2) || '0.00'}</strong>
                      </Form.Text>
                    </div>
                  </Form.Group>
                </Form.Group>
                
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowTareaModal(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" onClick={guardarTarea}>
                  {isEditingTarea ? 'Actualizar Tarea' : 'Agregar Tarea'}
                </Button>
              </Modal.Footer>
            </Modal>

            {/* Indicador de carga */}
            {isLoading && (
              <div className="position-fixed top-0 left-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75" style={{ zIndex: 1050 }}>
                <div className="text-center">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">{loadingMessage}</p>
                </div>
              </div>
            )}
          </Form>
                </Card.Body>
              </Card>
            </Container>
  );
}

export default AgregarActividad;
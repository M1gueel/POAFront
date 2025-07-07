import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card, Row, Col, ListGroup, Spinner, Tabs, Tab, Alert, Modal, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Proyecto } from '../interfaces/project';
import { Periodo } from '../interfaces/periodo';
import { POA, TipoPOA } from '../interfaces/poa';
import { poaAPI } from '../api/poaAPI';
import { projectAPI } from '../api/projectAPI';
import { actividadAPI } from '../api/actividadAPI';
import { tareaAPI } from '../api/tareaAPI';

import BusquedaProyecto from '../components/BusquedaProyecto';
import ExportarPOA from '../components/ExportarPOA';

import '../styles/AgregarActividad.css'

// Interfaces para actividades
import { ActividadCreate, ActividadConTareas, POAConActividadesYTareas } from '../interfaces/actividad';
// Interfaces para tareas
import { DetalleTarea, ItemPresupuestario, TareaCreate, TareaForm, ProgramacionMensualCreate } from '../interfaces/tarea';
// Importar la lista de actividades
import { getActividadesPorTipoPOA, ActividadOpciones } from '../utils/listaActividades';
//Importar la asignación de precio unitario
import { manejarCambioDescripcionConPrecio, esContratacionServiciosProfesionales, obtenerPrecioPorDescripcion } from '../utils/asignarCantidad';

// ¡IMPORTAR LAS FUNCIONES DE TOAST!
import { showError, showSuccess, showWarning, showInfo } from '../utils/toast';

// Extender la interfaz POA para incluir los datos del tipo
interface POAExtendido extends POA {
  tipo_poa?: string;
  tipoPOAData?: TipoPOA;
}

const AgregarActividad: React.FC = () => {
  const navigate = useNavigate();

  // Estados para el proyecto
  const [, setIdProyecto] = useState('');
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);

  // Estados para POAs y periodos - CORREGIDO: usar POAExtendido
  const [poasProyecto, setPoasProyecto] = useState<POAExtendido[]>([]);
  const [, setPeriodosProyecto] = useState<Periodo[]>([]);

  // Estados para la pestaña activa de POA
  const [activePoaTab, setActivePoaTab] = useState('');

  // Estado para los POAs con actividades seleccionadas y tareas
  const [poasConActividades, setPoasConActividades] = useState<POAConActividadesYTareas[]>([]);

  // Estado para almacenar las actividades disponibles según el tipo de POA
  const [, setActividadesDisponiblesPorPoa] = useState<{ [key: string]: ActividadOpciones[] }>({});

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

  const [, setActividadesSeleccionadasPorPoa] = useState<{ [key: string]: string[] }>({});

  // Estados para mensajes y carga
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Cargando datos...');
  const [taskErrors, setTaskErrors] = useState<{ [key: string]: string }>({});

  // Estados para controlar el botón de exportar
  const [datosGuardados, setDatosGuardados] = useState(false);
  const [actividadesYTareasCreadas, setActividadesYTareasCreadas] = useState<any[]>([]);

  // Estado para total del POA real vs gastado
  const [showActividades, setShowActividades] = useState(false);

  // FUNCIÓN PARA LIMPIAR ERRORES ESPECÍFICOS
  const clearTaskError = (field: string) => {
    setTaskErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const setTaskError = (field: string, message: string) => {
    setTaskErrors(prev => ({
      ...prev,
      [field]: message
    }));
  };

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true);
      setLoadingMessage('Cargando proyectos...');

      try {
        // Obtener proyectos desde la API
        const proyectosData = await projectAPI.getProyectos();
        setProyectos(proyectosData);
        showInfo('Proyectos cargados exitosamente');
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // NUEVA FUNCIÓN: Cargar información del tipo de POA
  const cargarTipoPOA = async (poa: POA): Promise<POAExtendido> => {
    try {
      const tipoPOAData = await poaAPI.getTipoPOA(poa.id_tipo_poa);
      return {
        ...poa,
        tipo_poa: tipoPOAData.codigo_tipo, // Usar el código del tipo
        tipoPOAData: tipoPOAData
      };
    } catch (error) {
      console.error(`Error al cargar tipo POA para ${poa.id_poa}:`, error);
      return {
        ...poa,
        tipo_poa: 'PVIF', // Valor por defecto
        tipoPOAData: undefined
      };
    }
  };

  // Inicializar las actividades disponibles por tipo de POA cuando cambian los POAs del proyecto
  useEffect(() => {
    const nuevasActividadesDisponibles: { [key: string]: ActividadOpciones[] } = {};
    const nuevasActividadesSeleccionadas: { [key: string]: string[] } = {};

    poasProyecto.forEach(poa => {
      const tipoPOA = poa.tipo_poa || 'PVIF'; // Valor por defecto si no hay tipo      
      const actividadesPorTipo = getActividadesPorTipoPOA(tipoPOA);

      nuevasActividadesDisponibles[poa.id_poa] = actividadesPorTipo;
      nuevasActividadesSeleccionadas[poa.id_poa] = [];
    });

    setActividadesDisponiblesPorPoa(nuevasActividadesDisponibles);
    setActividadesSeleccionadasPorPoa(nuevasActividadesSeleccionadas);
  }, [poasProyecto]);

  // Inicializar la estructura de poasConActividades cuando cambian los POAs y precarga las actividades
  useEffect(() => {
    const cargarDetallesTareaYPrecargar = async () => {
      if (poasProyecto.length === 0) return;

      setIsLoading(true);
      setLoadingMessage('Cargando detalles de tareas...');

      try {
        const nuevosPoasConActividades: POAConActividadesYTareas[] = [];

        // Para cada POA, cargar sus detalles de tarea
        for (const poa of poasProyecto) {
          const detallesTarea = await tareaAPI.getDetallesTareaPorPOA(poa.id_poa);

          // Usar el tipo correcto del POA para obtener las actividades
          const tipoPOA = poa.tipo_poa || 'PVIF';
          const actividadesPorTipo = getActividadesPorTipoPOA(tipoPOA);

          // Crear las actividades precargadas con sus tareas
          const actividadesConTareasPrecargadas: ActividadConTareas[] = [];

          for (const [index, actividad] of actividadesPorTipo.entries()) {
            // Obtener las tareas para esta actividad específica
            const tareasPrecargadas = await precargarTareasParaActividad(
              detallesTarea,
              actividad.id,
              tipoPOA,
              poa.id_poa
            );

            actividadesConTareasPrecargadas.push({
              actividad_id: `pre-${poa.id_poa}-${actividad.id}-${Date.now()}-${index}`,
              codigo_actividad: actividad.id,
              tareas: tareasPrecargadas
            });
          }

          nuevosPoasConActividades.push({
            id_poa: poa.id_poa,
            codigo_poa: poa.codigo_poa,
            tipo_poa: tipoPOA,
            presupuesto_asignado: parseFloat(poa.presupuesto_asignado.toString()),
            actividades: actividadesConTareasPrecargadas,
            detallesTarea
          });
        }

        setPoasConActividades(nuevosPoasConActividades);

        // Si no hay pestaña activa, seleccionar la primera
        if (!activePoaTab && nuevosPoasConActividades.length > 0) {
          setActivePoaTab(nuevosPoasConActividades[0].id_poa);
        }

      } catch (err) {
        showError('Error al cargar los detalles de tareas');
      } finally {
        setIsLoading(false);
      }
    };

    try {
      cargarDetallesTareaYPrecargar();
    } catch (err) {
      showError('Error al cargar los detalles de tareas');
      setIsLoading(false);
    }
  }, [poasProyecto]);

  // FUNCIÓN CORREGIDA: Seleccionar un proyecto y cargar sus POAs
  const seleccionarProyecto = async (proyecto: Proyecto) => {
    setIdProyecto(proyecto.id_proyecto);
    setProyectoSeleccionado(proyecto);

    try {
      setIsLoading(true);
      setLoadingMessage('Cargando POAs del proyecto...');

      // Cargar los POAs del proyecto seleccionado
      const poasData = await poaAPI.getPOAsByProyecto(proyecto.id_proyecto);

      // CORRECCIÓN: Cargar información del tipo de POA para cada POA
      setLoadingMessage('Cargando información de tipos de POA...');
      const poasConTipo: POAExtendido[] = [];

      for (const poa of poasData) {
        const poaConTipo = await cargarTipoPOA(poa);
        poasConTipo.push(poaConTipo);
      }

      setPoasProyecto(poasConTipo);

      // Limpiar cache de items presupuestarios al cambiar de proyecto
      cacheItemsPresupuestarios.clear();

      // Extraer los periodos de los POAs
      const periodos: Periodo[] = [];
      for (const poa of poasConTipo) {
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
      showError('Error al cargar los POAs asociados al proyecto');
      setIsLoading(false);
    }
  };

  // Agregar nueva actividad en un POA específico
  const agregarActividad = async (poaId: string) => {
    const poa = poasConActividades.find(p => p.id_poa === poaId);
    if (!poa) return;

    // Obtener actividades disponibles usando el tipo correcto del POA
    const actividadesDisponibles = getActividadesPorTipoPOA(poa.tipo_poa);

    // Obtener códigos de actividades ya seleccionadas (que no estén vacías)
    const actividadesYaSeleccionadas = poa.actividades
      .map(act => act.codigo_actividad)
      .filter(codigo => codigo && codigo !== "");

    // Filtrar actividades no utilizadas
    const actividadesNoUtilizadas = actividadesDisponibles.filter(
      act => !actividadesYaSeleccionadas.includes(act.id)
    );

    // Si no hay actividades disponibles, mostrar mensaje
    if (actividadesNoUtilizadas.length === 0) {
      showWarning('No hay más actividades disponibles para agregar');
      return;
    }

    // Mostrar modal para seleccionar actividad
    setShowActividadModal(true);
    setCurrentPoa(poaId);
    setActividadesDisponiblesModal(actividadesNoUtilizadas);
  };

  // Confirmar la selección de actividad en el modal
  const confirmarSeleccionActividad = async () => {
    const poaId = currentPoa;
    if (!poaId || !actividadSeleccionadaModal) {
      showError('Debe seleccionar una actividad');
      return;
    }

    const poa = poasConActividades.find(p => p.id_poa === poaId);
    if (!poa) return;

    // Verificar que la actividad no esté ya agregada
    const actividadYaExiste = poa.actividades.some(act =>
      act.codigo_actividad === actividadSeleccionadaModal
    );

    if (actividadYaExiste) {
      showError('Esta actividad ya ha sido agregada');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Cargando tareas para la actividad...');

    try {
      // Buscar una actividad vacía (sin código) para usar
      let actividadPrecargada = poa.actividades.find(act =>
        !act.codigo_actividad || act.codigo_actividad === ""
      );

      // Si no hay actividad vacía, crear una nueva con sus tareas
      if (!actividadPrecargada) {
        const tareasPrecargadas = await precargarTareasParaActividad(
          poa.detallesTarea,
          actividadSeleccionadaModal,
          poa.tipo_poa,
          poaId
        );

        const nuevaActividad: ActividadConTareas = {
          actividad_id: `new-${poaId}-${actividadSeleccionadaModal}-${Date.now()}`,
          codigo_actividad: actividadSeleccionadaModal,
          tareas: tareasPrecargadas
        };

        // Actualizar el POA con la nueva actividad
        const nuevosPoasConActividades = poasConActividades.map(poaActual => {
          if (poaActual.id_poa === poaId) {
            return {
              ...poaActual,
              actividades: [...poaActual.actividades, nuevaActividad]
            };
          }
          return poaActual;
        });

        setPoasConActividades(nuevosPoasConActividades);
        actividadPrecargada = nuevaActividad;
      } else {
        // Usar actividad precargada existente, actualizando sus tareas si es necesario
        const tareasPrecargadas = await precargarTareasParaActividad(
          poa.detallesTarea,
          actividadSeleccionadaModal,
          poa.tipo_poa,
          poaId
        );

        // Actualizar la actividad precargada con el código y las tareas
        const nuevosPoasConActividades = poasConActividades.map(poaActual => {
          if (poaActual.id_poa === poaId) {
            const actividadesActualizadas = poaActual.actividades.map(act =>
              act.actividad_id === actividadPrecargada!.actividad_id
                ? {
                  ...act,
                  codigo_actividad: actividadSeleccionadaModal,
                  tareas: tareasPrecargadas
                }
                : act
            );

            return {
              ...poaActual,
              actividades: actividadesActualizadas
            };
          }
          return poaActual;
        });

        setPoasConActividades(nuevosPoasConActividades);
      }

      // Si es el primer POA, replicar la selección a todos los POAs
      const isFirstPoa = poasConActividades.length > 0 && poasConActividades[0].id_poa === poaId;

      if (isFirstPoa) {
        // Replicar a otros POAs
        const nuevosPoasConActividades = poasConActividades.map(async (poaActual) => {
          if (poaActual.id_poa !== poaId) {
            let actPrecargadaLocal = poaActual.actividades.find(act =>
              !act.codigo_actividad || act.codigo_actividad === ""
            );

            if (!actPrecargadaLocal) {
              // Crear nueva actividad para este POA
              const tareasPrecargadas = await precargarTareasParaActividad(
                poaActual.detallesTarea,
                actividadSeleccionadaModal,
                poaActual.tipo_poa,
                poaActual.id_poa
              );

              actPrecargadaLocal = {
                actividad_id: `new-${poaActual.id_poa}-${actividadSeleccionadaModal}-${Date.now()}`,
                codigo_actividad: actividadSeleccionadaModal,
                tareas: tareasPrecargadas
              };

              return {
                ...poaActual,
                actividades: [...poaActual.actividades, actPrecargadaLocal]
              };
            } else {
              // Actualizar actividad existente
              const tareasPrecargadas = await precargarTareasParaActividad(
                poaActual.detallesTarea,
                actividadSeleccionadaModal,
                poaActual.tipo_poa,
                poaActual.id_poa
              );

              const actividadesActualizadas = poaActual.actividades.map(act =>
                act.actividad_id === actPrecargadaLocal!.actividad_id
                  ? {
                    ...act,
                    codigo_actividad: actividadSeleccionadaModal,
                    tareas: tareasPrecargadas
                  }
                  : act
              );

              return {
                ...poaActual,
                actividades: actividadesActualizadas
              };
            }
          }
          return poaActual;
        });

        // Esperar a que todas las promesas se resuelvan
        const poasActualizados = await Promise.all(nuevosPoasConActividades);
        setPoasConActividades(poasActualizados);
      }

      // Cerrar el modal y limpiar la selección
      setShowActividadModal(false);
      setActividadSeleccionadaModal('');

      // Hacer scroll a la actividad actualizada
      setTimeout(() => {
        const activityElement = document.getElementById(`actividad-${actividadPrecargada?.actividad_id}`);
        if (activityElement) {
          activityElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);

    } catch (error) {
      showError('Error al cargar las tareas de la actividad');
      console.error('Error en confirmarSeleccionActividad:', error);
    } finally {
      setIsLoading(false);
    }
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
    showSuccess('Actividad eliminada correctamente');
  };


  // Función para obtener el número de tarea según el tipo de POA
  // ACTUALIZADA: Ahora usa el campo 'caracteristicas' de DetalleTarea
  const obtenerNumeroTarea = (detalleTarea: DetalleTarea, tipoPoa: string): string => {
    if (!detalleTarea || !detalleTarea.caracteristicas) return '';

    // El campo caracteristicas contiene tres números separados por "; " en el orden: PIM, PTT, PVIF
    const numeros = detalleTarea.caracteristicas.split('; ');

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
        indice = 2; // Por defecto PVIF
    }

    const numero = numeros[indice];
    return numero === '0' ? '' : numero;
  };

  // Mostrar modal para agregar/editar tarea
  const mostrarModalTarea = async (poaId: string, actividadId: string, tarea?: TareaForm) => {
    // Limpiar errores cuando se abre el modal
    setTaskErrors({});
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
        lineaPaiViiv: undefined,
        cantidad: 0,
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

        // NUEVO: Agrupar detalles duplicados
        const detallesAgrupados = await agruparDetallesDuplicados(
          detallesFiltradosParaActividad,
          (id: string) => getItemPresupuestarioConCache(id, tareaAPI.getItemPresupuestarioPorId)
        );

        setDetallesFiltrados(detallesAgrupados);
      } catch (error) {
        setDetallesFiltrados(poa.detallesTarea);
      } finally {
        setCargandoDetalles(false);
      }
    } else {
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

    const detalleTarea = detallesFiltrados.find(dt => dt.id_detalle_tarea === idDetalleTarea);

    if (detalleTarea) {
      setIsLoading(true);
      setLoadingMessage('Cargando información del ítem presupuestario...');

      try {
        const poaActual = poasConActividades.find(p => p.id_poa === currentPoa);
        const tipoPoa = poaActual?.tipo_poa || 'PVIF';

        // Preparar la tarea actualizada con la información básica
        let tareaActualizada = {
          ...currentTarea,
          id_detalle_tarea: idDetalleTarea,
          nombre: detalleTarea.nombre || '',
          detalle_descripcion: detalleTarea.descripcion || '',
          detalle: detalleTarea,
          saldo_disponible: currentTarea.total || 0,
          codigo_item: 'N/A',
        };

        // Si tiene múltiples items, usar el primero por defecto
        if (detalleTarea.tiene_multiples_items && detalleTarea.items_presupuestarios && detalleTarea.items_presupuestarios.length > 0) {
          const itemPorDefecto = detalleTarea.items_presupuestarios[0];
          const numeroTarea = obtenerNumeroTarea(detalleTarea, tipoPoa);

          tareaActualizada = {
            ...tareaActualizada,
            itemPresupuestario: itemPorDefecto,
            codigo_item: itemPorDefecto.codigo || 'N/D',
            numero_tarea: numeroTarea,
            id_item_presupuestario_seleccionado: itemPorDefecto.id_item_presupuestario,
            nombre: numeroTarea ? `${numeroTarea} - ${detalleTarea.nombre || ''}` : (detalleTarea.nombre || '')
          };
        } else if (detalleTarea.item_presupuestario) {
          // Un solo item, usar directamente
          const numeroTarea = obtenerNumeroTarea(detalleTarea, tipoPoa);

          tareaActualizada = {
            ...tareaActualizada,
            itemPresupuestario: detalleTarea.item_presupuestario,
            codigo_item: detalleTarea.item_presupuestario.codigo || 'N/D',
            numero_tarea: numeroTarea,
            nombre: numeroTarea ? `${numeroTarea} - ${detalleTarea.nombre || ''}` : (detalleTarea.nombre || '')
          };
        }

        // NUEVA LÓGICA: Si tiene múltiples descripciones, establecer la primera y aplicar precio automático
        if (detalleTarea.tiene_multiples_descripciones && detalleTarea.descripciones_disponibles && detalleTarea.descripciones_disponibles.length > 0) {
          const primeraDescripcion = detalleTarea.descripciones_disponibles[0];

          // Establecer la primera descripción
          tareaActualizada = {
            ...tareaActualizada,
            descripcion_seleccionada: primeraDescripcion,
            detalle_descripcion: primeraDescripcion
          };

          // Aplicar precio automático si es contratación de servicios profesionales
          const esServiciosProfesionales = tareaActualizada.detalle?.nombre?.toLowerCase().includes('contratación de servicios profesionales');
          if (esServiciosProfesionales) {
            const precio = obtenerPrecioPorDescripcion(primeraDescripcion);
            if (precio !== null) {
              const nuevoTotal = (tareaActualizada.cantidad || 0) * precio;
              tareaActualizada = {
                ...tareaActualizada,
                precio_unitario: precio,
                total: nuevoTotal,
                saldo_disponible: nuevoTotal
              };
            }
          }
        }

        setCurrentTarea(tareaActualizada);

      } catch (err) {
        showError('Error al procesar el detalle de tarea');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Nueva función para manejar el cambio del item presupuestario seleccionado
  const handleItemPresupuestarioChange = async (idItemPresupuestario: string) => {
    if (!currentTarea || !currentTarea.detalle) return;

    const item = currentTarea.detalle.items_presupuestarios?.find(
      item => item.id_item_presupuestario === idItemPresupuestario
    );

    if (item) {
      const poaActual = poasConActividades.find(p => p.id_poa === currentPoa);
      const tipoPoa = poaActual?.tipo_poa || 'PVIF';
      const numeroTarea = obtenerNumeroTarea(currentTarea.detalle, tipoPoa);

      setCurrentTarea(prev => ({
        ...prev!,
        itemPresupuestario: item,
        codigo_item: item.codigo || 'N/D',
        numero_tarea: numeroTarea,
        id_item_presupuestario_seleccionado: idItemPresupuestario,
        nombre: numeroTarea ? `${numeroTarea} - ${currentTarea.detalle!.nombre || ''}` : (currentTarea.detalle!.nombre || '')
      }));
    }
  };

  // Nueva función para manejar el cambio de descripción seleccionada
  const handleDescripcionChange = (descripcionSeleccionada: string) => {
    if (!currentTarea) return;

    try {
      const tareaActualizada = manejarCambioDescripcionConPrecio(
        descripcionSeleccionada,
        currentTarea
      );

      setCurrentTarea(tareaActualizada);

      // Limpiar errores si es necesario
      if (descripcionSeleccionada) {
        clearTaskError('descripcion');
      }

      // Limpiar error de precio si se actualizó automáticamente
      if (tareaActualizada.precio_unitario > 0) {
        clearTaskError('precio_unitario');
      }
    } catch (error) {
      console.error('Error al procesar cambio de descripción:', error);
      // Fallback: actualizar solo la descripción sin cambios de precio
      setCurrentTarea(prev => ({
        ...prev!,
        descripcion_seleccionada: descripcionSeleccionada,
        detalle_descripcion: descripcionSeleccionada
      }));
    }
  };

  // Guardar tarea (nueva o editada)
  const guardarTarea = () => {
    if (!currentTarea || !currentPoa || !currentActividad) return;

    // Limpiar errores previos
    setTaskErrors({});

    let hasErrors = false;

    // Validar datos de la tarea
    if (!currentTarea.id_detalle_tarea) {
      setTaskError('detalle_tarea', 'Debe seleccionar un detalle de tarea');
      hasErrors = true;
    }

    if (!currentTarea.nombre) {
      setTaskError('nombre', 'El nombre de la tarea es obligatorio');
      hasErrors = true;
    }

    if (!currentTarea.cantidad || currentTarea.cantidad <= 0) {
      setTaskError('cantidad', 'La cantidad debe ser mayor que cero');
      hasErrors = true;
    }

    if (!currentTarea.precio_unitario || currentTarea.precio_unitario <= 0) {
      setTaskError('precio_unitario', 'El precio unitario debe ser mayor que cero');
      hasErrors = true;
    }

    // Nueva validación para items múltiples
    if (currentTarea.detalle?.tiene_multiples_items && !currentTarea.id_item_presupuestario_seleccionado) {
      setTaskError('item_presupuestario', 'Debe seleccionar un código de ítem presupuestario');
      hasErrors = true;
    }

    // Validar que haya planificación mensual
    const totalPlanificado = currentTarea.gastos_mensuales?.reduce((sum, val) => sum + (val || 0), 0) || 0;
    if (totalPlanificado === 0) {
      setTaskError('gastos_mensuales', 'Debe planificar al menos un mes con valor mayor a cero');
      hasErrors = true;
    }
    if (totalPlanificado > (currentTarea.total || 0)) {
      setTaskError('gastos_mensuales', 'La planificación mensual supera el total disponible de la tarea');
      hasErrors = true;
    }

    // Si hay errores, no continuar
    if (hasErrors) {
      return;
    }

    // Crear objeto de tarea para guardar en el estado local
    const tareaCompleta = {
      ...currentTarea,
      cantidad: Math.floor(currentTarea.cantidad),
      precio_unitario: parseFloat(currentTarea.precio_unitario.toString()),
      // Para items múltiples, usar el seleccionado; sino usar el del detalle original
      id_detalle_tarea: currentTarea.detalle?.tiene_multiples_items
        ? currentTarea.id_detalle_tarea // Mantener el ID del detalle agrupado
        : currentTarea.id_detalle_tarea
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
    showSuccess(isEditingTarea ? 'Tarea actualizada correctamente' : 'Tarea agregada correctamente');
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
    showSuccess('Tarea eliminada correctamente');
  };

  // Obtener la descripción de una actividad a partir de su código
  const getDescripcionActividad = (poaId: string, codigoActividad: string) => {
    // CORRECCIÓN: Obtener el POA para usar su tipo correcto
    const poa = poasConActividades.find(p => p.id_poa === poaId);
    if (!poa) return 'POA no encontrado';

    // Usar el tipo del POA para obtener las actividades correctas
    const actividadesDisponibles = getActividadesPorTipoPOA(poa.tipo_poa);
    const actividad = actividadesDisponibles.find(act => act.id === codigoActividad);

    return actividad ? actividad.descripcion : 'Seleccione una actividad';
  };

  // Validar el formulario
  const validarFormulario = (): boolean => {
    // Validar que haya un proyecto seleccionado
    if (!proyectoSeleccionado) {
      showError('Debe seleccionar un proyecto');
      return false;
    }

    // Validar que el proyecto tenga POAs
    if (poasProyecto.length === 0) {
      showError('El proyecto seleccionado no tiene POAs asociados');
      return false;
    }

    // Validar que haya al menos una actividad definida
    const hayActividadesDefinidas = poasConActividades.some(poa => poa.actividades.length > 0);
    if (!hayActividadesDefinidas) {
      showError('Debe definir al menos una actividad');
      return false;
    }


    // Validar que todas las actividades tengan una tarea seleccionada en cada POA
    for (const poa of poasConActividades) {
      // Filtrar solo actividades con código seleccionado
      const actividadesConCodigo = poa.actividades.filter(act => act.codigo_actividad && act.codigo_actividad !== "");

      if (actividadesConCodigo.length === 0) {
        showError(`Debe seleccionar al menos una actividad en el POA ${poa.codigo_poa}`);
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

    try {
      // Mostrar toast de progreso
      const toastId = toast.loading('Guardando actividades y tareas...');

      // Paso 1: Crear actividades
      const actividadesCreadas: { [key: string]: string } = {};
      const mapeoActividadesTemp: { [key: string]: { poaId: string, actividadTemp: ActividadConTareas } } = {};
      let totalActividadesCreadas = 0;

      // Para cada POA, crear sus actividades seleccionadas
      for (const poa of poasConActividades) {
        // Filtrar solo las actividades que tienen código seleccionado
        const actividadesConCodigo = poa.actividades.filter(act => act.codigo_actividad && act.codigo_actividad !== "");

        const actividadesParaCrear: ActividadCreate[] = actividadesConCodigo.map((actPoa) => {
          const descripcion = getDescripcionActividad(poa.id_poa, actPoa.codigo_actividad);

          // NOTA: No enviamos total_por_actividad ni saldo_actividad porque
          // el backend los calcula automáticamente al crear las tareas
          return {
            descripcion_actividad: descripcion
          };
        });

        // Validar planificación mensual antes de crear actividades
        for (const actividad of actividadesConCodigo) {
          for (const tarea of actividad.tareas) {
            const totalPlanificado = tarea.gastos_mensuales?.reduce((sum, val) => sum + (val || 0), 0) || 0;
            if (totalPlanificado === 0 && tarea.cantidad > 0) {
              toast.update(toastId, {
                render: `La tarea "${tarea.nombre}" debe tener planificación mensual`,
                type: "error",
                isLoading: false,
                autoClose: 5000
              });
              setActivePoaTab(poa.id_poa);
              return;
            }
          }
        }

        // Crear las actividades para este POA
        console.log(`Creando ${actividadesParaCrear.length} actividades para POA ${poa.codigo_poa}`);

        // Crear las actividades para este POA solo si hay actividades para enviar
        const actividadesCreadasResponse = await actividadAPI.crearActividadesPorPOA(poa.id_poa, actividadesParaCrear);

        console.log('Respuesta del endpoint:', actividadesCreadasResponse);

        // CORRECCIÓN: Acceder correctamente a los IDs de las actividades creadas
        let idsActividades: string[] = [];

        if (actividadesCreadasResponse.ids_actividades && Array.isArray(actividadesCreadasResponse.ids_actividades)) {
          idsActividades = actividadesCreadasResponse.ids_actividades;
        } else if (Array.isArray(actividadesCreadasResponse)) {
          // Si la respuesta es directamente un array de objetos con id_actividad
          idsActividades = actividadesCreadasResponse.map(act => act.id_actividad);
        } else {
          throw new Error(`Respuesta inválida del servidor para POA ${poa.codigo_poa}`);
        }

        // Verificar que se crearon todas las actividades esperadas
        if (idsActividades.length !== actividadesConCodigo.length) {
          throw new Error(`Se esperaban ${actividadesConCodigo.length} actividades, pero se crearon ${idsActividades.length} para POA ${poa.codigo_poa}`);
        }

        // Mapear correctamente los IDs temporales a los IDs reales
        actividadesConCodigo.forEach((act, index) => {
          const idActividadReal = idsActividades[index];

          if (!idActividadReal) {
            throw new Error(`No se pudo obtener el ID de la actividad ${index + 1} para POA ${poa.codigo_poa}`);
          }

          // Guardar el mapeo ID temporal -> ID real
          actividadesCreadas[act.actividad_id] = idActividadReal;
          mapeoActividadesTemp[act.actividad_id] = {
            poaId: poa.id_poa,
            actividadTemp: act
          };
          totalActividadesCreadas++;

          console.log(`Mapeado: ${act.actividad_id} -> ${idActividadReal}`);
        });
      }

      console.log(`Total actividades creadas: ${totalActividadesCreadas}`);
      console.log('Mapeo de actividades:', actividadesCreadas);

      // Paso 2: Crear tareas para cada actividad
      setLoadingMessage('Guardando tareas...');

      let totalTareasCreadas = 0;
      let totalProgramacionesCreadas = 0;

      // Para cada entrada en el mapeo de actividades creadas
      for (const [actividadTempId, { actividadTemp }] of Object.entries(mapeoActividadesTemp)) {
        const idActividadReal = actividadesCreadas[actividadTempId];

        console.log(`Procesando actividad temporal ${actividadTempId} -> real ${idActividadReal}`);

        if (!idActividadReal || actividadTemp.tareas.length === 0) {
          console.log(`Saltando actividad ${actividadTempId}: sin ID real o sin tareas`);
          continue;
        }

        console.log(`Creando ${actividadTemp.tareas.length} tareas para actividad ${idActividadReal}`);

        // Crear tareas secuencialmente para esta actividad
        for (let i = 0; i < actividadTemp.tareas.length; i++) {
          const tarea = actividadTemp.tareas[i];

          try {
            const tareaDatos: TareaCreate = {
              id_detalle_tarea: tarea.id_detalle_tarea,
              nombre: tarea.nombre,
              detalle_descripcion: tarea.detalle_descripcion,
              cantidad: tarea.cantidad,
              precio_unitario: tarea.precio_unitario,
              total: tarea.total || (tarea.cantidad * tarea.precio_unitario),
              saldo_disponible: tarea.total || (tarea.cantidad * tarea.precio_unitario),
              lineaPaiViiv: tarea.lineaPaiViiv || undefined
            };

            // Logs para debugging - datos que se envían
            console.log("=== CREANDO TAREA ===");
            console.log("ID Actividad:", idActividadReal);
            console.log("Datos de tarea:", tareaDatos);
            console.log("URL completa:", `/actividades/${idActividadReal}/tareas`);

            // Verificar que el UUID es válido
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            console.log("UUID válido:", uuidRegex.test(idActividadReal));

            // Crear la tarea usando el ID REAL de la actividad de la BD
            const tareaCreada = await tareaAPI.crearTarea(idActividadReal, tareaDatos);

            // Log de respuesta exitosa
            console.log("=== RESPUESTA TAREA CREADA ===");
            console.log("Tarea creada completa:", tareaCreada);
            console.log("ID de tarea recibido:", tareaCreada?.id_tarea);
            console.log("Tipo de ID tarea:", typeof tareaCreada?.id_tarea);

            // Validación crítica: verificar que se obtuvo el ID de la tarea
            if (!tareaCreada || !tareaCreada.id_tarea) {
              throw new Error(`Error crítico: No se pudo obtener el ID de la tarea creada "${tarea.nombre}" para actividad ${idActividadReal}`);
            }

            console.log(`Tarea creada exitosamente: ID=${tareaCreada.id_tarea}, Nombre="${tarea.nombre}", Actividad=${idActividadReal}`);
            totalTareasCreadas++;

            // Crear la programación mensual para esta tarea usando el ID real de la tarea
            if (tarea.gastos_mensuales && tarea.gastos_mensuales.length === 12) {
              for (let index = 0; index < tarea.gastos_mensuales.length; index++) {
                const valor = tarea.gastos_mensuales[index];
                if (valor > 0) {
                  const mesNumero = index + 1;
                  const añoActual = new Date().getFullYear();
                  const mesFormateado = `${mesNumero.toString().padStart(2, '0')}-${añoActual}`;

                  const programacionDatos: ProgramacionMensualCreate = {
                    id_tarea: tareaCreada.id_tarea, // Usar el ID real de la tarea creada
                    mes: mesFormateado,
                    valor: valor // Mantener como number según la interfaz
                  };
                  try {
                    await tareaAPI.crearProgramacionMensual(programacionDatos);
                    totalProgramacionesCreadas++;
                  } catch (progError) {
                    throw progError;
                  }
                }
              }
            }
          } catch (error: any) {
            console.error(`Error al procesar tarea "${tarea.nombre}" de actividad ${idActividadReal}:`, error);
            throw new Error(`Error al crear la tarea "${tarea.nombre}": ${error}`);
          }
        }
      }

      toast.update(toastId, {
        render: `Se han creado exitosamente ${totalActividadesCreadas} actividades para ${poasProyecto.length} POAs del proyecto`,
        type: "success",
        isLoading: false,
        autoClose: 5000
      });

      // Preparar los datos para enviar al componente ExportarPOA
      // NOTA: Los totales calculados aquí son solo para visualización
      const datosParaExportar = poasConActividades.map((poa) => {
        const actividadesConCodigo = poa.actividades.filter(act => act.codigo_actividad && act.codigo_actividad !== "");

        return {
          id_poa: poa.id_poa,
          codigo_poa: poa.codigo_poa,
          tipo_poa: poa.tipo_poa,
          presupuesto_asignado: poa.presupuesto_asignado,
          actividades: actividadesConCodigo.map((actividad) => ({
            codigo_actividad: actividad.codigo_actividad,
            descripcion_actividad: getDescripcionActividad(poa.id_poa, actividad.codigo_actividad),
            total_por_actividad: actividad.tareas.reduce((sum, tarea) => sum + (tarea.total || 0), 0), // Solo para visualización
            tareas: actividad.tareas.map((tarea) => ({
              nombre: tarea.nombre,
              detalle_descripcion: tarea.detalle_descripcion,
              cantidad: tarea.cantidad,
              precio_unitario: tarea.precio_unitario,
              total: tarea.total || (tarea.cantidad * tarea.precio_unitario),
              codigo_item: tarea.codigo_item || tarea.itemPresupuestario,
              gastos_mensuales: tarea.gastos_mensuales || []
            }))
          }))
        };
      });

      // Actualizar los estados
      setActividadesYTareasCreadas(datosParaExportar);
      setDatosGuardados(true);

      // Mostrar mensaje de éxito y actualizar toast
      toast.update(toastId, {
        render: `Se crearon ${totalActividadesCreadas} actividades con ${totalTareasCreadas} tareas y ${totalProgramacionesCreadas} programaciones mensuales`,
        type: "success",
        isLoading: false,
        autoClose: 5000
      });

      showSuccess(`Datos guardados exitosamente. ${totalActividadesCreadas} actividades, ${totalTareasCreadas} tareas y ${totalProgramacionesCreadas} programaciones mensuales creadas.`);


    } catch (err) {
      showError(err instanceof Error ? err.message : 'Error al crear las actividades y tareas');
    } finally {
      setIsLoading(false);
    }
  };



  // Calcular total para una actividad (solo para mostrar en el frontend)
  // NOTA: Este cálculo es únicamente para la visualización en el frontend.
  // El backend calcula automáticamente el total real cuando se crean las tareas.
  const calcularTotalActividad = (poaId: string, actividadId: string) => {
    const poa = poasConActividades.find(p => p.id_poa === poaId);
    if (!poa) return 0;

    const actividad = poa.actividades.find(a => a.actividad_id === actividadId);
    if (!actividad) return 0;

    return actividad.tareas.reduce((sum, tarea) => sum + (tarea.total || 0), 0);
  };


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
  // ACTUALIZADA: Ahora usa el campo 'caracteristicas' de DetalleTarea
  const filtrarDetallesPorActividadConConsultas = async (
    detallesTarea: DetalleTarea[],
    codigoActividad: string,
    tipoPoa: string,
    getItemPresupuestarioPorId: (id: string) => Promise<ItemPresupuestario>
  ): Promise<DetalleTarea[]> => {
    const numeroActividad = mapearCodigoActividadANumero(codigoActividad, tipoPoa);

    if (!numeroActividad) {
      return detallesTarea; // Retorna todos si no puede filtrar
    }

    // Validación adicional para asegurar que el número es válido
    if (!/^\d+$/.test(numeroActividad)) {
      return detallesTarea;
    }

    console.log(`=== FILTRANDO DETALLES PARA ACTIVIDAD ${numeroActividad} (USANDO CARACTERISTICAS) ===`);
    console.log(`Tipo POA: ${tipoPoa}, Total detalles: ${detallesTarea.length}`);

    // Procesar cada detalle de forma asíncrona
    const detallesConItems = await Promise.allSettled(
      detallesTarea.map(async (detalle, index) => {
        try {
          // Obtener el item presupuestario usando la función proporcionada
          const itemPresupuestario = await getItemPresupuestarioPorId(detalle.id_item_presupuestario);

          console.log(`\n--- Procesando detalle ${index + 1} ---`);
          console.log(`Detalle: ${detalle.nombre}`);
          console.log(`Descripción: ${detalle.descripcion || 'N/A'}`);
          console.log(`Características: ${detalle.caracteristicas || 'N/A'}`);

          // NUEVA LÓGICA: Usar el campo 'caracteristicas' directamente
          if (!detalle.caracteristicas || typeof detalle.caracteristicas !== 'string') {
            console.log('❌ No hay características válidas');
            return { detalle, incluir: false, itemPresupuestario: null };
          }

          // Obtener los números del campo caracteristicas (formato: "X.Y; A.B; C.D")
          const numeros = detalle.caracteristicas.split('; ');

          if (numeros.length !== 3) {
            console.log('❌ Formato de características inválido');
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
          console.log(`Número de tarea desde características: ${numeroTarea}`);

          // Si es "0", no está disponible para este tipo de POA
          if (numeroTarea === '0') {
            console.log('❌ No disponible para este tipo de POA (valor = 0)');
            return { detalle, incluir: false, itemPresupuestario };
          }

          // Verificar si el número de la tarea comienza con el número de actividad
          const coincide = numeroTarea.startsWith(numeroActividad + '.');
          console.log(`¿Coincide con actividad ${numeroActividad}? ${coincide ? '✅' : '❌'}`);

          if (coincide) {
            const detalleEspecifico = {
              ...detalle,
              item_presupuestario: itemPresupuestario,
              numero_tarea_especifica: numeroTarea
            };

            return { detalle: detalleEspecifico, incluir: true, itemPresupuestario, numeroTarea };
          }

          return { detalle, incluir: false, itemPresupuestario, numeroTarea };

        } catch (error) {
          console.error('Error al procesar detalle:', error);
          return { detalle, incluir: false, itemPresupuestario: null, error };
        }
      })
    );

    // Filtrar solo los que se resolvieron correctamente y deben incluirse
    const filtrados = detallesConItems
      .filter(result => result.status === 'fulfilled' && result.value.incluir)
      .map(result => (result as PromiseFulfilledResult<any>).value);

    console.log(`\n=== RESULTADO FILTRADO ===`);
    console.log(`Total detalles filtrados: ${filtrados.length}`);
    filtrados.forEach((item, index) => {
      console.log(`${index + 1}. ${item.detalle.nombre} - ${item.detalle.descripcion || 'Sin descripción'} - Tarea: ${item.numeroTarea}`);
    });

    // Ordenar los resultados filtrados según el número de tarea
    const filtradosOrdenados = filtrados.sort((a, b) => {
      const valorA = parseFloat(a.numeroTarea);
      const valorB = parseFloat(b.numeroTarea);

      return valorA - valorB; // Orden ascendente
    });

    // Retornar solo los detalles, no los objetos con metadata
    return filtradosOrdenados.map(item => item.detalle);
  };

  // Función para agrupar detalles de tarea con el mismo nombre y item presupuestario
  const agruparDetallesDuplicados = async (
    detallesFiltrados: DetalleTarea[],
    getItemPresupuestarioPorId: (id: string) => Promise<ItemPresupuestario>
  ): Promise<DetalleTarea[]> => {
    // PRIMERA FASE: Agrupar por nombre y descripción (lógica existente para items)
    const gruposPorNombre = new Map<string, DetalleTarea[]>();

    detallesFiltrados.forEach(detalle => {
      const clave = `${detalle.nombre}|${detalle.descripcion || ''}`;
      if (!gruposPorNombre.has(clave)) {
        gruposPorNombre.set(clave, []);
      }
      gruposPorNombre.get(clave)!.push(detalle);
    });

    // Procesar grupos de items múltiples
    const detallesConItemsProcessados: DetalleTarea[] = [];

    for (const [, detallesGrupo] of gruposPorNombre.entries()) {
      if (detallesGrupo.length === 1) {
        // Solo un detalle, procesar normalmente
        const detalle = detallesGrupo[0];
        try {
          const item = await getItemPresupuestarioPorId(detalle.id_item_presupuestario);
          detallesConItemsProcessados.push({
            ...detalle,
            item_presupuestario: item,
            tiene_multiples_items: false
          });
        } catch (error) {
          detallesConItemsProcessados.push({
            ...detalle,
            tiene_multiples_items: false
          });
        }
      } else {
        // Múltiples detalles con mismo nombre, obtener todos los items
        const items: ItemPresupuestario[] = [];

        for (const detalle of detallesGrupo) {
          try {
            const item = await getItemPresupuestarioPorId(detalle.id_item_presupuestario);
            items.push(item);
          } catch (error) {
            throw error;
          }
        }

        // Crear un solo detalle con múltiples items
        const detalleBase = detallesGrupo[0];
        detallesConItemsProcessados.push({
          ...detalleBase,
          items_presupuestarios: items,
          tiene_multiples_items: true,
          item_presupuestario: items[0]
        });
      }
    }

    // SEGUNDA FASE: Agrupar por nombre e item presupuestario (NUEVA LÓGICA para descripciones)
    const gruposPorNombreEItem = new Map<string, DetalleTarea[]>();

    detallesConItemsProcessados.forEach(detalle => {
      const itemId = detalle.tiene_multiples_items
        ? detalle.items_presupuestarios?.[0]?.id_item_presupuestario || detalle.id_item_presupuestario
        : detalle.id_item_presupuestario;
      const clave = `${detalle.nombre}|${itemId}`;

      if (!gruposPorNombreEItem.has(clave)) {
        gruposPorNombreEItem.set(clave, []);
      }
      gruposPorNombreEItem.get(clave)!.push(detalle);
    });

    // Procesar grupos de descripciones múltiples
    const detallesFinales: DetalleTarea[] = [];

    for (const [, detallesGrupo] of gruposPorNombreEItem.entries()) {
      if (detallesGrupo.length === 1) {
        // Solo un detalle, mantener como está
        detallesFinales.push({
          ...detallesGrupo[0],
          tiene_multiples_descripciones: false
        });
      } else {
        // Múltiples detalles con mismo nombre e item, pero diferentes descripciones
        const descripciones = detallesGrupo
          .map(d => d.descripcion || '')
          .filter((desc, index, arr) => arr.indexOf(desc) === index) // Eliminar duplicados
          .filter(desc => desc.trim() !== ''); // Eliminar vacías

        if (descripciones.length > 1) {
          // Crear un solo detalle con múltiples descripciones
          const detalleBase = detallesGrupo[0];
          detallesFinales.push({
            ...detalleBase,
            descripciones_disponibles: descripciones,
            tiene_multiples_descripciones: true,
            descripcion: descripciones[0] // Descripción por defecto
          });
        } else {
          // Mismo nombre, item y descripción: mantener solo uno
          detallesFinales.push({
            ...detallesGrupo[0],
            tiene_multiples_descripciones: false
          });
        }
      }
    }

    return detallesFinales;
  };


  // Cache simple para evitar consultas repetidas
  const cacheItemsPresupuestarios = new Map<string, ItemPresupuestario>();

  const getItemPresupuestarioConCache = async (
    id: string,
    getItemPresupuestarioPorId: (id: string) => Promise<ItemPresupuestario>
  ): Promise<ItemPresupuestario> => {
    if (cacheItemsPresupuestarios.has(id)) {
      return cacheItemsPresupuestarios.get(id)!;
    }

    const item = await getItemPresupuestarioPorId(id);
    cacheItemsPresupuestarios.set(id, item);
    return item;
  };

  const precargarTareasParaActividad = async (
    detallesTarea: DetalleTarea[],
    codigoActividad: string,
    tipoPOA: string,
    poaId: string
  ): Promise<TareaForm[]> => {
    try {
      // Filtrar detalles de tarea para esta actividad específica
      const detallesFiltrados = await filtrarDetallesPorActividadConConsultas(
        detallesTarea,
        codigoActividad,
        tipoPOA,
        (id: string) => getItemPresupuestarioConCache(id, tareaAPI.getItemPresupuestarioPorId)
      );

      // Agrupar detalles duplicados
      const detallesAgrupados = await agruparDetallesDuplicados(
        detallesFiltrados,
        (id: string) => getItemPresupuestarioConCache(id, tareaAPI.getItemPresupuestarioPorId)
      );

      // Crear tareas precargadas para cada detalle agrupado
      const tareasPrecargadas: TareaForm[] = [];

      for (const [index, detalle] of detallesAgrupados.entries()) {
        const numeroTarea = obtenerNumeroTarea(detalle, tipoPOA);
        const nombreTarea = numeroTarea ? `${numeroTarea} - ${detalle.nombre || ''}` : (detalle.nombre || '');

        // Crear la tarea precargada básica
        let tareaPrecargada: TareaForm = {
          tempId: `pre-${poaId}-${codigoActividad}-${detalle.id_detalle_tarea}-${Date.now()}-${index}`,
          id_detalle_tarea: detalle.id_detalle_tarea,
          nombre: nombreTarea,
          detalle_descripcion: detalle.descripcion || '',
          detalle: detalle,
          numero_tarea: numeroTarea,
          codigo_item: detalle.item_presupuestario?.codigo || 'N/A',
          cantidad: 0,
          precio_unitario: 0,
          total: 0,
          gastos_mensuales: new Array(12).fill(0),
          saldo_disponible: 0,
          expanded: false // Inicialmente colapsada
        };

        // Manejar items múltiples
        if (detalle.tiene_multiples_items && detalle.items_presupuestarios && detalle.items_presupuestarios.length > 0) {
          const itemPorDefecto = detalle.items_presupuestarios[0];
          tareaPrecargada = {
            ...tareaPrecargada,
            itemPresupuestario: itemPorDefecto,
            codigo_item: itemPorDefecto.codigo || 'N/D',
            id_item_presupuestario_seleccionado: itemPorDefecto.id_item_presupuestario
          };
        } else if (detalle.item_presupuestario) {
          tareaPrecargada = {
            ...tareaPrecargada,
            itemPresupuestario: detalle.item_presupuestario
          };
        }

        // Manejar descripciones múltiples
        if (detalle.tiene_multiples_descripciones && detalle.descripciones_disponibles && detalle.descripciones_disponibles.length > 0) {
          const primeraDescripcion = detalle.descripciones_disponibles[0];
          tareaPrecargada = {
            ...tareaPrecargada,
            descripcion_seleccionada: primeraDescripcion,
            detalle_descripcion: primeraDescripcion
          };

          // Aplicar precio automático si es contratación de servicios profesionales
          const esServiciosProfesionales = detalle.nombre?.toLowerCase().includes('contratación de servicios profesionales');
          if (esServiciosProfesionales) {
            const precio = obtenerPrecioPorDescripcion(primeraDescripcion);
            if (precio !== null) {
              tareaPrecargada = {
                ...tareaPrecargada,
                precio_unitario: precio
              };
            }
          }
        }

        tareasPrecargadas.push(tareaPrecargada);
      }

      return tareasPrecargadas;

    } catch (error) {
      console.error('Error al precargar tareas para actividad:', codigoActividad, error);
      return []; // Retornar array vacío en caso de error
    }
  };

  return (
    <Container className="py-4 main-content-with-sidebar">
      <Card className="shadow-lg">
        <Card.Header className="bg-primary bg-gradient text-white p-3">
          <h2 className="mb-0 fw-bold text-center">Crear Actividades y Tareas para Proyecto</h2>
        </Card.Header>
        <Card.Body className="p-4">
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
                        {poasProyecto.map((poa) => (
                          <ListGroup.Item key={poa.id_poa} className="mb-2">
                            <Row>
                              <Col md={6}>
                                <p className="mb-1"><strong>Código POA:</strong> {poa.codigo_poa}</p>
                                <p className="mb-1"><strong>Año Ejecución:</strong> {poa.anio_ejecucion}</p>
                                <p className="mb-1"><strong>Tipo:</strong> {poa.tipo_poa || 'No especificado'}</p>
                              </Col>
                              <Col md={6}>
                                <p className="mb-1"><strong>Presupuesto Asignado:</strong> ${parseFloat(poa.presupuesto_asignado.toString()).toLocaleString('es-CO')}</p>
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
                                              <th style={{ width: '30px' }}></th>
                                              <th>#</th>
                                              <th>Nombre</th>
                                              <th>Código Ítem</th>
                                              <th>Descripción</th>
                                              <th className="text-">Línea PAI VIIV</th>
                                              <th className="text-center">Cantidad</th>
                                              <th className="text-center">Precio Unit.</th>
                                              <th className="text-center">Total</th>
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
                                                  <td className="text-center">{tarea.lineaPaiViiv}</td>
                                                  <td className="text-center">{tarea.cantidad === 0 ? '' : tarea.cantidad}</td>
                                                  <td className="text-center">{tarea.precio_unitario === 0 ? '' : `$${tarea.precio_unitario.toFixed(2)}`}</td>
                                                  <td className="text-center">{tarea.total === 0 ? '' : `$${tarea.total?.toFixed(2)}`}</td>
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
                                                    <td colSpan={8}>
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
                  <Button variant="secondary" className="me-2" onClick={() => navigate('/Dashboard')}>
                    Cancelar
                  </Button>

                  {/* Botón de Exportar POAs - Solo habilitado después de guardar */}
                  {datosGuardados && (
                    <div className="me-2">
                      <ExportarPOA
                        codigoProyecto={proyectoSeleccionado.codigo_proyecto}
                        poas={poasProyecto.map(poa => ({
                          id_poa: poa.id_poa,
                          codigo_poa: poa.codigo_poa,
                          anio_ejecucion: poa.anio_ejecucion,
                          presupuesto_asignado: poa.presupuesto_asignado
                        }))}
                        actividadesYTareas={actividadesYTareasCreadas} // NUEVO PROP
                        onExport={() => showSuccess("POA exportado correctamente")}
                      />
                    </div>
                  )}
                  {!datosGuardados && (
                    <div className="me-2">
                      <div title="Debe guardar las actividades y tareas primero">
                        <Button variant="success" disabled className="d-flex align-items-center">
                          <i className="fas fa-file-excel me-2"></i>
                          Exportar POAs
                        </Button>
                      </div>
                    </div>
                  )}

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
                <Form.Group className="mb-3">
                  <Form.Label>Detalle de Tarea</Form.Label>
                  <Form.Select
                    value={currentTarea?.id_detalle_tarea || ''}
                    onChange={async (e) => {
                      await handleDetalleTareaChange(e.target.value);
                      if (e.target.value) {
                        clearTaskError('detalle_tarea');
                      }
                    }}
                    disabled={cargandoDetalles}
                    isInvalid={!!taskErrors.detalle_tarea}
                  >
                    <option value="">
                      {cargandoDetalles ? 'Cargando detalles...' : 'Seleccione un detalle...'}
                    </option>
                    {detallesFiltrados.map(dt => (
                      <option key={dt.id_detalle_tarea} value={dt.id_detalle_tarea}>
                        {dt.nombre}
                      </option>
                    ))}
                  </Form.Select>
                  {taskErrors.detalle_tarea && (
                    <Form.Control.Feedback type="invalid">
                      {taskErrors.detalle_tarea}
                    </Form.Control.Feedback>
                  )}
                  {cargandoDetalles && (
                    <Form.Text className="text-muted">
                      Filtrando detalles según la actividad seleccionada...
                    </Form.Text>
                  )}
                </Form.Group>

                {/* Campo para mostrar/seleccionar el código del ítem */}
                <Form.Group className="mb-3">
                  <Form.Label>Código del Ítem</Form.Label>
                  {currentTarea?.detalle?.tiene_multiples_items ? (
                    <Form.Select
                      value={currentTarea?.id_item_presupuestario_seleccionado || ''}
                      onChange={(e) => {
                        handleItemPresupuestarioChange(e.target.value);
                        if (e.target.value) {
                          clearTaskError('item_presupuestario');
                        }
                      }}
                      isInvalid={!!taskErrors.item_presupuestario}
                    >
                      <option value="">Seleccione un código...</option>
                      {currentTarea.detalle.items_presupuestarios?.map((item) => (
                        <option key={item.id_item_presupuestario} value={item.id_item_presupuestario}>
                          {item.codigo}
                        </option>
                      ))}
                    </Form.Select>
                  ) : (
                    <Form.Control
                      type="text"
                      value={currentTarea?.codigo_item || ''}
                      disabled
                    />
                  )}
                  {taskErrors.item_presupuestario && (
                    <Form.Control.Feedback type="invalid">
                      {taskErrors.item_presupuestario}
                    </Form.Control.Feedback>
                  )}
                  <Form.Text className="text-muted">
                    {currentTarea?.detalle?.tiene_multiples_items
                      ? "Seleccione el código específico para esta tarea."
                      : "Este código se asigna automáticamente según el detalle de tarea."
                    }
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Nombre de la Tarea *</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentTarea?.nombre || ''}
                    onChange={(e) => {
                      setCurrentTarea(prev => prev ? { ...prev, nombre: e.target.value } : null);
                      if (e.target.value.trim()) {
                        clearTaskError('nombre');
                      }
                    }}
                    required
                    isInvalid={!!taskErrors.nombre}
                  />
                  {taskErrors.nombre && (
                    <Form.Control.Feedback type="invalid">
                      {taskErrors.nombre}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Descripción</Form.Label>
                  {currentTarea?.detalle?.tiene_multiples_descripciones ? (
                    <Form.Select
                      value={currentTarea?.descripcion_seleccionada || currentTarea?.detalle_descripcion || ''}
                      onChange={(e) => handleDescripcionChange(e.target.value)}
                    >
                      <option value="">Seleccione una descripción...</option>
                      {currentTarea.detalle.descripciones_disponibles?.map((descripcion, index) => (
                        <option key={index} value={descripcion}>
                          {descripcion}
                        </option>
                      ))}
                    </Form.Select>
                  ) : (
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={currentTarea?.detalle_descripcion || ''}
                      onChange={(e) => handleDescripcionChange(e.target.value)}
                    />
                  )}
                  <Form.Text className="text-muted">
                    {currentTarea?.detalle?.tiene_multiples_descripciones
                      ? "Seleccione la descripción específica para esta tarea."
                      : "Puede editar la descripción de la tarea."
                    }
                    {/* Mostrar información adicional si es contratación de servicios profesionales */}
                    {esContratacionServiciosProfesionales(currentTarea) && (
                      <div className="mt-1">
                        <small className="text-info">
                          <i className="fas fa-info-circle me-1"></i>
                          El precio unitario se actualizará automáticamente según la descripción seleccionada.
                        </small>
                      </div>
                    )}
                  </Form.Text>
                </Form.Group>

                {/* NUEVO CAMPO: Línea PAI VIIV */}
                <Form.Group className="mb-3">
                  <Form.Label>Línea PAI VIIV</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    step="1"
                    value={currentTarea?.lineaPaiViiv === 0 ? '' : currentTarea?.lineaPaiViiv || ''}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      if (rawValue === '') {
                        setCurrentTarea(prev => prev ? { ...prev, lineaPaiViiv: undefined } : null);
                        return;
                      }
                      const value = parseInt(rawValue, 10);
                      if (!isNaN(value) && value > 0) {
                        setCurrentTarea(prev => prev ? { ...prev, lineaPaiViiv: value } : null);
                      }
                    }}
                    placeholder="Ingrese el número de línea PAI VIIV"
                  />
                  <Form.Text className="text-muted">
                    Número de línea correspondiente al Plan de Acción Institucional VIIV (opcional).
                  </Form.Text>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Cantidad *</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        step="1"
                        value={currentTarea?.cantidad === 0 ? '0' : currentTarea?.cantidad || ''}
                        onChange={(e) => {
                          const rawValue = e.target.value;
                          if (rawValue === '') {
                            setCurrentTarea(prev => prev ? { ...prev, cantidad: 0 } : null);
                            return;
                          }
                          const value = parseInt(rawValue, 10);
                          if (!isNaN(value) && value > 0) {
                            setCurrentTarea(prev => {
                              if (!prev) return prev;
                              const nuevaCantidad = value;
                              const nuevoTotal = nuevaCantidad * (prev.precio_unitario || 0);
                              return {
                                ...prev,
                                cantidad: nuevaCantidad,
                                total: nuevoTotal,
                                saldo_disponible: nuevoTotal
                              };
                            });
                            clearTaskError('cantidad');
                          }
                        }}
                        required
                        isInvalid={!!taskErrors.cantidad}
                      />
                      {taskErrors.cantidad && (
                        <Form.Control.Feedback type="invalid">
                          {taskErrors.cantidad}
                        </Form.Control.Feedback>
                      )}
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
                            // Solo permitir edición si NO es contratación de servicios profesionales
                            if (esContratacionServiciosProfesionales(currentTarea)) {
                              return; // No hacer nada si es servicios profesionales
                            }

                            const rawValue = e.target.value;

                            if (rawValue === '') {
                              setCurrentTarea(prev => prev ? { ...prev, precio_unitario: 0 } : null);
                              return;
                            }

                            const isValidFormat = /^\d*\.?\d{0,2}$/.test(rawValue);

                            if (isValidFormat) {
                              const numericValue = rawValue.endsWith('.')
                                ? parseFloat(rawValue + '0')
                                : parseFloat(rawValue) || 0;

                              setCurrentTarea(prev => {
                                if (!prev) return prev;
                                const nuevoTotal = (prev.cantidad || 0) * numericValue;

                                return {
                                  ...prev,
                                  precio_unitario: numericValue,
                                  total: nuevoTotal,
                                  saldo_disponible: nuevoTotal
                                };
                              });

                              if (numericValue > 0) {
                                clearTaskError('precio_unitario');
                              }
                            }
                          }}
                          readOnly={esContratacionServiciosProfesionales(currentTarea)}
                          style={{
                            backgroundColor: esContratacionServiciosProfesionales(currentTarea) ? '#f8f9fa' : 'white',
                            cursor: esContratacionServiciosProfesionales(currentTarea) ? 'not-allowed' : 'text'
                          }}
                          required
                          isInvalid={!!taskErrors.precio_unitario}
                        />
                      </InputGroup>
                      {taskErrors.precio_unitario && (
                        <Form.Control.Feedback type="invalid">
                          {taskErrors.precio_unitario}
                        </Form.Control.Feedback>
                      )}
                      {/* Mostrar información adicional cuando es readonly */}
                      {esContratacionServiciosProfesionales(currentTarea) && (
                        <Form.Text className="text-muted">
                          <i className="fas fa-lock me-1"></i>
                          Precio establecido automáticamente según la descripción seleccionada.
                        </Form.Text>
                      )}
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
                          setCurrentTarea(prev => prev ? { ...prev, saldo_disponible: 0 } : null);
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
                    {/* Para la sección de gastos mensuales */}
                    {taskErrors.gastos_mensuales && (
                      <div className="mt-2">
                        <Alert variant="danger" className="py-2">
                          <small>{taskErrors.gastos_mensuales}</small>
                        </Alert>
                      </div>
                    )}
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
      {/* Sidebar fijo del presupuesto */}
      {proyectoSeleccionado && poasConActividades.length > 0 && (
        <div className="budget-sidebar p-2">
          {/* Información del POA activo */}
          {(() => {
            const poaActivo = poasConActividades.find(poa => poa.id_poa === activePoaTab);

            if (!poaActivo) return null;

            const totalPlanificado = poaActivo.actividades.reduce((total, actividad) =>
              total + calcularTotalActividad(poaActivo.id_poa, actividad.actividad_id), 0
            );

            const presupuestoAsignado = poaActivo.presupuesto_asignado;
            const saldoDisponible = presupuestoAsignado - totalPlanificado;
            const porcentajeUsado = (totalPlanificado / presupuestoAsignado) * 100;

            return (
              <>
                {/* Header compacto */}
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-calculator text-primary me-2"></i>
                  <h6 className="mb-0 text-primary fw-bold fs-7">{poaActivo.codigo_poa}</h6>
                </div>

                {/* Información presupuestaria compacta */}
                <div className="bg-light rounded p-2 mb-2">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>Asignado:</small>
                    <span className="fw-bold text-success" style={{ fontSize: '0.75rem' }}>
                      ${presupuestoAsignado.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>Planificado:</small>
                    <span className="fw-bold text-primary" style={{ fontSize: '0.75rem' }}>
                      ${totalPlanificado.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>Disponible:</small>
                    <span className={`fw-bold ${saldoDisponible >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.75rem' }}>
                      ${saldoDisponible.toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>

                {/* Barra de progreso compacta */}
                <div className="mb-2">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>Uso:</small>
                    <small className={`fw-bold ${porcentajeUsado > 100 ? 'text-danger' : 'text-primary'}`} style={{ fontSize: '0.7rem' }}>
                      {porcentajeUsado.toFixed(1)}%
                    </small>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div
                      className={`progress-bar ${porcentajeUsado > 100 ? 'bg-danger' : 'bg-success'}`}
                      role="progressbar"
                      style={{ width: `${Math.min(porcentajeUsado, 100)}%` }}
                      aria-valuenow={porcentajeUsado}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                    </div>
                  </div>
                  {porcentajeUsado > 100 && (
                    <small className="text-danger" style={{ fontSize: '0.65rem' }}>
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      Presupuesto excedido
                    </small>
                  )}
                </div>

                {/* Botón desplegable para actividades */}
                <div className="mb-2">
                  <button
                    className="btn btn-outline-primary btn-sm w-100 d-flex align-items-center justify-content-between"
                    onClick={() => setShowActividades(!showActividades)}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  >
                    <span>
                      <i className="bi bi-list-task me-1"></i>
                      Actividades ({poaActivo.actividades.length})
                    </span>
                    <i className={`bi bi-chevron-${showActividades ? 'up' : 'down'}`}></i>
                  </button>

                  {/* Desglose por actividades (desplegable) */}
                  {showActividades && (
                    <div className="mt-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {poaActivo.actividades.map((actividad, index) => {
                        const totalActividad = calcularTotalActividad(poaActivo.id_poa, actividad.actividad_id);
                        const descripcionActividad = getDescripcionActividad(poaActivo.id_poa, actividad.codigo_actividad);

                        return (
                          <div key={actividad.actividad_id} className="border-bottom pb-1 mb-1">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1 me-2">
                                <small className="text-muted d-block" style={{ fontSize: '0.65rem' }}>
                                  Act. {index + 1}
                                </small>
                                <small className="text-dark" style={{ fontSize: '0.65rem' }}>
                                  {descripcionActividad ?
                                    (descripcionActividad.length > 30 ?
                                      `${descripcionActividad.substring(0, 30)}...` :
                                      descripcionActividad
                                    ) :
                                    'Sin descripción'
                                  }
                                </small>
                              </div>
                              <div className="text-end">
                                <span className="badge bg-primary" style={{ fontSize: '0.6rem' }}>
                                  ${totalActividad.toLocaleString('es-CO')}
                                </span>
                                <br />
                                <small className="text-muted" style={{ fontSize: '0.6rem' }}>
                                  {actividad.tareas.length} tarea{actividad.tareas.length !== 1 ? 's' : ''}
                                </small>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Alertas compactas */}
                {saldoDisponible < 0 && (
                  <Alert variant="danger" className="py-1 px-2 mb-0" style={{ fontSize: '0.7rem' }}>
                    <small>
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      <strong>Advertencia:</strong> Presupuesto excedido.
                    </small>
                  </Alert>
                )}

                {saldoDisponible >= 0 && saldoDisponible < (presupuestoAsignado * 0.1) && totalPlanificado > 0 && (
                  <Alert variant="warning" className="py-1 px-2 mb-0" style={{ fontSize: '0.7rem' }}>
                    <small>
                      <i className="bi bi-info-circle me-1"></i>
                      <strong>Aviso:</strong> Menos del 10% disponible.
                    </small>
                  </Alert>
                )}
              </>
            );
          })()}
        </div>
      )}
    </Container>
  );
}

export default AgregarActividad;
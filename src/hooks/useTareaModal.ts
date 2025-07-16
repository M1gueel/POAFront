import { useState } from 'react';
import { TareaForm, DetalleTarea, ItemPresupuestario } from '../interfaces/tarea';
import { obtenerNumeroTarea, filtrarDetallesPorActividadConConsultas, agruparDetallesDuplicados } from '../utils/tareaUtils';
import { manejarCambioDescripcionConPrecio, esContratacionServiciosProfesionales, obtenerPrecioPorDescripcion } from '../utils/asignarCantidad';
import { showSuccess } from '../utils/toast';

export const useTareaModal = () => {
  // Estados para modales de tareas
  const [showTareaModal, setShowTareaModal] = useState(false);
  const [currentPoa, setCurrentPoa] = useState<string>('');
  const [currentActividad, setCurrentActividad] = useState<string>('');
  const [currentTarea, setCurrentTarea] = useState<TareaForm | null>(null);
  const [isEditingTarea, setIsEditingTarea] = useState(false);
  const [detallesFiltrados, setDetallesFiltrados] = useState<DetalleTarea[]>([]);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);
  const [taskErrors, setTaskErrors] = useState<{ [key: string]: string }>({});

  // Funciones para manejo de errores
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

  // Mostrar modal para agregar/editar tarea
  const mostrarModalTarea = async (
    poaId: string, 
    actividadId: string, 
    tarea?: TareaForm,
    poa?: any,
    actividad?: any,
    getItemPresupuestarioConCache?: (id: string) => Promise<ItemPresupuestario>
  ) => {
    setTaskErrors({});
    setCurrentPoa(poaId);
    setCurrentActividad(actividadId);

    if (tarea) {
      setCurrentTarea(tarea);
      setIsEditingTarea(true);
    } else {
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
        gastos_mensuales: new Array(12).fill(0),
      });
      setIsEditingTarea(false);
    }

    // Filtrar detalles de tarea según la actividad seleccionada
    if (poa && actividad && actividad.codigo_actividad && getItemPresupuestarioConCache) {
      setCargandoDetalles(true);
      try {
        const detallesFiltradosParaActividad = await filtrarDetallesPorActividadConConsultas(
          poa.detallesTarea,
          actividad.codigo_actividad,
          poa.tipo_poa,
          getItemPresupuestarioConCache
        );

        const detallesAgrupados = await agruparDetallesDuplicados(
          detallesFiltradosParaActividad,
          getItemPresupuestarioConCache
        );

        setDetallesFiltrados(detallesAgrupados);
      } catch (error) {
        setDetallesFiltrados(poa.detallesTarea);
      } finally {
        setCargandoDetalles(false);
      }
    }

    setShowTareaModal(true);
  };

  // Manejar cambio de detalle de tarea
  const handleDetalleTareaChange = async (
    idDetalleTarea: string,
    poasConActividades: any[],
    getItemPresupuestarioConCache?: (id: string, fn: any) => Promise<ItemPresupuestario>
  ) => {
    if (!currentTarea || !currentPoa || !getItemPresupuestarioConCache) return;

    const detalleTarea = detallesFiltrados.find(dt => dt.id_detalle_tarea === idDetalleTarea);

    if (detalleTarea) {
      try {
        const poaActual = poasConActividades.find(p => p.id_poa === currentPoa);
        const tipoPoa = poaActual?.tipo_poa || 'PVIF';

        let tareaActualizada = {
          ...currentTarea,
          id_detalle_tarea: idDetalleTarea,
          nombre: detalleTarea.nombre || '',
          detalle_descripcion: detalleTarea.descripcion || '',
          detalle: detalleTarea,
          saldo_disponible: currentTarea.total || 0,
          codigo_item: 'N/A',
        };

        // Manejar múltiples items
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
          const numeroTarea = obtenerNumeroTarea(detalleTarea, tipoPoa);
          tareaActualizada = {
            ...tareaActualizada,
            itemPresupuestario: detalleTarea.item_presupuestario,
            codigo_item: detalleTarea.item_presupuestario.codigo || 'N/D',
            numero_tarea: numeroTarea,
            nombre: numeroTarea ? `${numeroTarea} - ${detalleTarea.nombre || ''}` : (detalleTarea.nombre || '')
          };
        }

        // Manejar múltiples descripciones
        if (detalleTarea.tiene_multiples_descripciones && detalleTarea.descripciones_disponibles && detalleTarea.descripciones_disponibles.length > 0) {
          const primeraDescripcion = detalleTarea.descripciones_disponibles[0];
          
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
        console.error('Error al procesar el detalle de tarea:', err);
      }
    }
  };

  // Manejar cambio del item presupuestario seleccionado
  const handleItemPresupuestarioChange = async (idItemPresupuestario: string, poasConActividades: any[]) => {
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

  // Manejar cambio de descripción seleccionada
  const handleDescripcionChange = (descripcionSeleccionada: string) => {
    if (!currentTarea) return;

    try {
      const tareaActualizada = manejarCambioDescripcionConPrecio(
        descripcionSeleccionada,
        currentTarea
      );

      setCurrentTarea(tareaActualizada);

      if (descripcionSeleccionada) {
        clearTaskError('descripcion');
      }

      if (tareaActualizada.precio_unitario > 0) {
        clearTaskError('precio_unitario');
      }
    } catch (error) {
      console.error('Error al procesar cambio de descripción:', error);
      setCurrentTarea(prev => ({
        ...prev!,
        descripcion_seleccionada: descripcionSeleccionada,
        detalle_descripcion: descripcionSeleccionada
      }));
    }
  };

  // Validar y guardar tarea
  const validarYGuardarTarea = (onSave: (tarea: TareaForm) => void) => {
    if (!currentTarea || !currentPoa || !currentActividad) return;

    setTaskErrors({});
    let hasErrors = false;

    // Validaciones
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

    if (currentTarea.detalle?.tiene_multiples_items && !currentTarea.id_item_presupuestario_seleccionado) {
      setTaskError('item_presupuestario', 'Debe seleccionar un código de ítem presupuestario');
      hasErrors = true;
    }

    // Validar planificación mensual
    const totalPlanificado = currentTarea.gastos_mensuales?.reduce((sum, val) => sum + (val || 0), 0) || 0;
    if (totalPlanificado != (currentTarea.total || 0)) {
      const diferencia = (currentTarea.total || 0) - totalPlanificado;
      const mensaje = `La planificación mensual no coincide con el total asignado a la tarea. Diferencia: ${diferencia > 0 ? `faltan ${diferencia}` : `se excedió por ${Math.abs(diferencia)}`}`;
      setTaskError('gastos_mensuales', mensaje);
      hasErrors = true;
    }

    if (hasErrors) return;

    // Crear objeto de tarea para guardar
    const tareaCompleta = {
      ...currentTarea,
      cantidad: Math.floor(currentTarea.cantidad),
      precio_unitario: parseFloat(currentTarea.precio_unitario.toString()),
      id_detalle_tarea: currentTarea.detalle?.tiene_multiples_items
        ? currentTarea.id_detalle_tarea
        : currentTarea.id_detalle_tarea
    };

    onSave(tareaCompleta);
    setShowTareaModal(false);
    setCurrentTarea(null);
    showSuccess(isEditingTarea ? 'Tarea actualizada correctamente' : 'Tarea agregada correctamente');
  };

  return {
    // Estados
    showTareaModal,
    currentPoa,
    currentActividad,
    currentTarea,
    isEditingTarea,
    detallesFiltrados,
    cargandoDetalles,
    taskErrors,

    // Setters
    setShowTareaModal,
    setCurrentTarea,

    // Funciones
    mostrarModalTarea,
    handleDetalleTareaChange,
    handleItemPresupuestarioChange,
    handleDescripcionChange,
    validarYGuardarTarea,
    clearTaskError,
    setTaskError,

    // Utilidades
    esContratacionServiciosProfesionales: () => esContratacionServiciosProfesionales(currentTarea)
  };
};

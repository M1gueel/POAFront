// utils/asignarCantidad.ts
import { TareaForm } from '../interfaces/tarea';

// Mapeo de descripciones a precios unitarios para servicios profesionales
const PRECIOS_SERVICIOS_PROFESIONALES: { [key: string]: number } = {
  "Asistente de investigación": 986,
  "Servicios profesionales 1": 1212,
  "Servicios profesionales 2": 1412,
  "Servicios profesionales 3": 1676
};

/**
 * Verifica si una tarea corresponde a "Contratación de servicios profesionales"
 */
export const esContratacionServiciosProfesionales = (tarea: TareaForm | null): boolean => {
  if (!tarea || !tarea.detalle) return false;
  
  const nombreDetalle = tarea.detalle.nombre.toLowerCase();
  return nombreDetalle.includes('contratación de servicios profesionales') ||
         nombreDetalle === 'contratación de servicios profesionales';
};

/**
 * Obtiene el precio unitario según la descripción para servicios profesionales
 */
export const obtenerPrecioPorDescripcion = (descripcion: string): number | null => {
  if (!descripcion) return null;

  // Buscar coincidencia exacta primero
  if (PRECIOS_SERVICIOS_PROFESIONALES[descripcion]) {
    return PRECIOS_SERVICIOS_PROFESIONALES[descripcion];
  }

  // Buscar coincidencia parcial (por si hay variaciones en el texto)
  const descripcionLower = descripcion.toLowerCase().trim();
  for (const [key, precio] of Object.entries(PRECIOS_SERVICIOS_PROFESIONALES)) {
    const keyLower = key.toLowerCase();
    if (descripcionLower.includes(keyLower) || keyLower.includes(descripcionLower)) {
      return precio;
    }
  }

  return null;
};

/**
 * Calcula el total basado en cantidad y precio unitario
 */
const calcularTotal = (cantidad: number, precioUnitario: number): number => {
  return (cantidad || 0) * (precioUnitario || 0);
};

/**
 * Aplica el precio automático si la tarea es de servicios profesionales
 * y actualiza los totales correspondientes
 */
const aplicarPrecioAutomatico = (
  tarea: TareaForm,
  descripcion: string
): TareaForm => {
  // Si no es una tarea de servicios profesionales, retornar sin cambios
  if (!esContratacionServiciosProfesionales(tarea)) {
    return tarea;
  }

  const nuevoPrecio = obtenerPrecioPorDescripcion(descripcion);
  
  // Si no hay precio definido para esta descripción, retornar sin cambios
  if (nuevoPrecio === null) {
    return tarea;
  }

  // Calcular nuevo total
  const nuevoTotal = calcularTotal(tarea.cantidad, nuevoPrecio);

  // Retornar tarea actualizada con nuevo precio y totales
  return {
    ...tarea,
    precio_unitario: nuevoPrecio,
    total: nuevoTotal,
    saldo_disponible: nuevoTotal
  };
};

/**
 * Función principal para manejar el cambio de descripción con actualización automática de precio
 */
export const manejarCambioDescripcionConPrecio = (
  descripcionSeleccionada: string,
  tareaActual: TareaForm
): TareaForm => {
  if (!tareaActual) {
    throw new Error('No hay tarea actual para procesar');
  }

  // Actualizar la descripción en la tarea
  let tareaActualizada: TareaForm = {
    ...tareaActual,
    descripcion_seleccionada: descripcionSeleccionada,
    detalle_descripcion: descripcionSeleccionada
  };

  // Aplicar precio automático si corresponde
  tareaActualizada = aplicarPrecioAutomatico(tareaActualizada, descripcionSeleccionada);

  return tareaActualizada;
};

/**
 * Función para agregar nuevas reglas de precio (para futuras extensiones)
 */
export const agregarReglaPrecio = (descripcion: string, precio: number): void => {
  PRECIOS_SERVICIOS_PROFESIONALES[descripcion] = precio;
};

// Exportar el mapeo de precios para referencia (solo lectura)
export const PRECIOS_REFERENCIA = Object.freeze({ ...PRECIOS_SERVICIOS_PROFESIONALES });
import { tareaAPI } from '../api/tareaAPI';
import { getActividadesPorTipoPOA } from './listaActividades';
import { Actividad } from '../interfaces/actividad';

/**
 * Función para extraer el número de actividad del formato "(1) Descripción"
 */
const extraerNumeroActividad = (descripcionActividad: string): number | null => {
  const match = descripcionActividad.match(/^\((\d+)\)/);
  return match ? parseInt(match[1]) : null;
};

/**
 * Función para obtener el tipo de POA desde el código
 */
export const obtenerTipoPOA = (codigoPOA: string): string => {
  // Extraer el tipo del código POA (ej: "PIM-2024-001" -> "PIM")
  const partes = codigoPOA.split('-');
  return partes[0] || '';
};

/**
 * Función para determinar qué actividad de configuración corresponde a una actividad del backend
 * Maneja casos de actividades con descripción duplicada usando el número de actividad y las tareas
 */
const encontrarActividadConfiguracion = async (
  actividad: Actividad,
  actividadesConfiguracion: any[]
): Promise<number> => {
  // Buscar actividades de configuración con la misma descripción
  const actividadesCoincidentes = actividadesConfiguracion.filter(
    actConfig => actConfig.descripcion === actividad.descripcion_actividad
  );

  // Si hay solo una coincidencia, usar esa
  if (actividadesCoincidentes.length === 1) {
    return actividadesConfiguracion.indexOf(actividadesCoincidentes[0]);
  }

  // Si hay múltiples coincidencias, usar el número de actividad y las tareas para distinguir
  if (actividadesCoincidentes.length > 1) {
    try {
      // Obtener las tareas de esta actividad
      const tareasActividad = await tareaAPI.getTareasPorActividad(actividad.id_actividad);
      
      if (tareasActividad.length > 0) {
        // Obtener el primer carácter del nombre de la primera tarea
        const primerCaracterTarea = tareasActividad[0].nombre?.charAt(0);
        
        if (primerCaracterTarea && /^\d+$/.test(primerCaracterTarea)) {
          const numeroTarea = parseInt(primerCaracterTarea);
          
          // Buscar la actividad de configuración que corresponde a este número
          for (let i = 0; i < actividadesCoincidentes.length; i++) {
            const actConfig = actividadesCoincidentes[i];
            const indiceEnConfiguracion = actividadesConfiguracion.indexOf(actConfig);
            
            // El número de actividad en configuración es indiceEnConfiguracion + 1
            if (numeroTarea === indiceEnConfiguracion + 1) {
              return indiceEnConfiguracion;
            }
          }
        }
      }
      
      // Si no se puede determinar por las tareas, usar el número de actividad si está presente
      const numeroActividad = extraerNumeroActividad(actividad.descripcion_actividad);
      if (numeroActividad !== null) {
        // Buscar la actividad de configuración que corresponde a este número
        for (const actConfig of actividadesCoincidentes) {
          const indiceEnConfiguracion = actividadesConfiguracion.indexOf(actConfig);
          if (numeroActividad === indiceEnConfiguracion + 1) {
            return indiceEnConfiguracion;
          }
        }
      }
      
    } catch (error) {
      console.warn(`No se pudieron obtener tareas para determinar orden de actividad ${actividad.id_actividad}:`, error);
    }
    
    // Si no se puede determinar, usar la primera coincidencia
    return actividadesConfiguracion.indexOf(actividadesCoincidentes[0]);
  }

  // Si no hay coincidencias, retornar un valor alto para que vaya al final
  return actividadesConfiguracion.length;
};

/**
 * Función principal para ordenar actividades según la configuración del tipo de POA
 * Maneja casos especiales de actividades con descripción duplicada
 * 
 * @param actividades - Array de actividades obtenidas del backend
 * @param codigoPOA - Código del POA para determinar el tipo
 * @returns Array de actividades ordenadas según la configuración
 */
export const ordenarActividadesSegunConfiguracion = async (
  actividades: Actividad[],
  codigoPOA: string
): Promise<Actividad[]> => {
  try {
    const tipoPOA = obtenerTipoPOA(codigoPOA);
    const actividadesConfiguracion = getActividadesPorTipoPOA(tipoPOA);
    
    // Obtener el índice de ordenamiento para cada actividad
    const actividadesConIndice = await Promise.all(
      actividades.map(async (actividad) => ({
        actividad,
        indiceOrden: await encontrarActividadConfiguracion(actividad, actividadesConfiguracion)
      }))
    );

    // Ordenar por el índice obtenido
    const actividadesOrdenadas = actividadesConIndice
      .sort((a, b) => a.indiceOrden - b.indiceOrden)
      .map(item => item.actividad);

    return actividadesOrdenadas;
  } catch (error) {
    console.error('Error al ordenar actividades:', error);
    // En caso de error, retornar las actividades sin ordenar
    return actividades;
  }
};

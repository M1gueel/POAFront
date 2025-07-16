import { useState, useEffect } from 'react';
import { Proyecto } from '../interfaces/project';
import { projectAPI } from '../api/projectAPI';
import { actividadAPI } from '../api/actividadAPI';
import { poaAPI } from '../api/poaAPI';
import { showError, showInfo } from '../utils/toast';

export const useProyectoManager = () => {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true);

      try {
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

  // Función para validar si un proyecto tiene POAs disponibles (sin actividades)
  const validarProyectoSinActividades = async (proyecto: Proyecto): Promise<{ esValido: boolean; razon?: string }> => {
    try {
      const poasData = await poaAPI.getPOAsByProyecto(proyecto.id_proyecto);

      if (poasData.length === 0) {
        return {
          esValido: false,
          razon: 'Este proyecto no tiene POAs asociados'
        };
      }

      let poasConActividades = 0;
      const verificaciones = await Promise.all(
        poasData.map(async (poa) => {
          try {
            const actividades = await actividadAPI.getActividadesPorPOA(poa.id_poa);
            return actividades.length > 0;
          } catch (error) {
            console.error(`Error verificando actividades para POA ${poa.id_poa}:`, error);
            return false;
          }
        })
      );

      poasConActividades = verificaciones.filter(Boolean).length;

      if (poasConActividades === poasData.length) {
        return {
          esValido: false,
          razon: `Todos los POAs (${poasData.length}) de este proyecto ya tienen actividades asignadas`
        };
      }

      const poasDisponibles = poasData.length - poasConActividades;
      return {
        esValido: true,
        razon: `${poasDisponibles} de ${poasData.length} POAs disponibles`
      };

    } catch (error) {
      console.error('Error validando proyecto:', error);
      return {
        esValido: true,
        razon: 'Error al validar disponibilidad'
      };
    }
  };

  // Función para validar si un proyecto tiene POAs con actividades existentes
  const validarProyectoConActividades = async (proyecto: Proyecto): Promise<{ esValido: boolean; razon?: string }> => {
    try {
      const poasData = await poaAPI.getPOAsByProyecto(proyecto.id_proyecto);

      if (poasData.length === 0) {
        return {
          esValido: false,
          razon: 'Este proyecto no tiene POAs asociados'
        };
      }

      let poasConActividades = 0;
      const verificaciones = await Promise.all(
        poasData.map(async (poa) => {
          try {
            const actividades = await actividadAPI.getActividadesPorPOA(poa.id_poa);
            return actividades.length > 0;
          } catch (error) {
            console.error(`Error verificando actividades para POA ${poa.id_poa}:`, error);
            return false;
          }
        })
      );

      poasConActividades = verificaciones.filter(Boolean).length;

      if (poasConActividades === 0) {
        return {
          esValido: false,
          razon: 'Este proyecto no tiene POAs con actividades creadas'
        };
      }

      return {
        esValido: true,
        razon: `${poasConActividades} de ${poasData.length} POAs con actividades`
      };

    } catch (error) {
      console.error('Error validando proyecto:', error);
      return {
        esValido: false,
        razon: 'Error al validar disponibilidad'
      };
    }
  };

  const seleccionarProyecto = (proyecto: Proyecto) => {
    setProyectoSeleccionado(proyecto);
  };

  const limpiarProyectoSeleccionado = () => {
    setProyectoSeleccionado(null);
  };

  return {
    // Estados
    proyectos,
    proyectoSeleccionado,
    isLoading,

    // Funciones
    seleccionarProyecto,
    limpiarProyectoSeleccionado,
    validarProyectoSinActividades,
    validarProyectoConActividades
  };
};

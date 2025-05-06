import { API } from './userAPI';
import { Actividad, Tarea, DetalleTarea, ActividadCreate, TareaCreate, TareaUpdate } from '../interfaces/actividad';

export const actividadAPI = {
    
    // Obtener actividades por POA
    getActividadesPorPOA: async (idPoa: string): Promise<Actividad[]> => {
        const response = await API.get(`/poas/${idPoa}/actividades`);
        return response.data;
    },

    // Crear actividades en lote para un POA
    crearActividadesPorPOA: async (idPoa: string, actividades: ActividadCreate[]): Promise<any> => {
        try {
            const response = await API.post(`/poas/${idPoa}/actividades`, {
                actividades: actividades
            });
            return response.data;
        } catch (error) {
            console.error("Error al crear actividades:", error);
            if (error.response) {
                console.error("Respuesta del servidor:", error.response.data);
                console.error("Status:", error.response.status);
            }
            throw error;
        }
    },

    // Eliminar una actividad
    eliminarActividad: async (idActividad: string): Promise<any> => {
        try {
            const response = await API.delete(`/actividades/${idActividad}`);
            return response.data;
        } catch (error) {
            console.error("Error al eliminar actividad:", error);
            throw error;
        }
    },

      // Editar una actividad
    editarActividad: async (idActividad: string, datos: { descripcion_actividad: string }): Promise<Actividad> => {
        try {
            const response = await API.put(`/actividades/${idActividad}`, datos);
            return response.data;
        } catch (error) {
            console.error("Error al editar actividad:", error);
            throw error;
        }
    },

    // Obtener tareas por actividad
    getTareasPorActividad: async (idActividad: string): Promise<Tarea[]> => {
        const response = await API.get(`/actividades/${idActividad}/tareas`);
        return response.data;
    },

    // Crear una tarea para una actividad
    crearTarea: async (idActividad: string, tareaData: TareaCreate): Promise<Tarea> => {
        try {
            const response = await API.post(`/actividades/${idActividad}/tareas`, tareaData);
            return response.data;
        } catch (error) {
            console.error("Error al crear tarea:", error);
            if (error.response) {
                console.error("Respuesta del servidor:", error.response.data);
                console.error("Status:", error.response.status);
            }
            throw error;
        }
    },

    // Eliminar una tarea
    eliminarTarea: async (idTarea: string): Promise<any> => {
        try {
            const response = await API.delete(`/tareas/${idTarea}`);
            return response.data;
        } catch (error) {
            console.error("Error al eliminar tarea:", error);
            throw error;
        }
    },

    // Editar una tarea
    editarTarea: async (idTarea: string, tareaData: TareaUpdate): Promise<any> => {
        try {
            const response = await API.put(`/tareas/${idTarea}`, tareaData);
            return response.data;
        } catch (error) {
            console.error("Error al editar tarea:", error);
            throw error;
        }
    },

    // Obtener detalles de tarea por POA
    getDetallesTareaPorPOA: async (idPoa: string): Promise<DetalleTarea[]> => {
        const response = await API.get(`/poas/${idPoa}/detalles_tarea`);
        return response.data;
    }
};
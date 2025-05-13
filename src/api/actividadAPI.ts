import { API } from './userAPI';
import { Actividad, ActividadCreate } from '../interfaces/actividad';

export const actividadAPI = {
    
    // Obtener actividades por POA
    getActividadesPorPOA: async (idPoa: string): Promise<Actividad[]> => {
        try {
            const response = await API.get(`/poas/${idPoa}/actividades`);
            return response.data;
        } catch (error) {
            console.error("Error al obtener actividades por POA:", error);
            if (error.response) {
                console.error("Respuesta del servidor:", error.response.data);
                console.error("Status:", error.response.status);
            }
            throw error;
        }
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
    
};
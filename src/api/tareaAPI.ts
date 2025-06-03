import { DetalleTarea, Tarea, TareaCreate, TareaUpdate, ItemPresupuestario, ProgramacionMensualCreate } from "../interfaces/tarea";
import { API } from "./userAPI";

    
export const tareaAPI = {

    // Obtener item presupuestario por id
    getItemPresupuestarioPorId: async (idItemPresupuestario: string): Promise<ItemPresupuestario> => {
        try {
            console.log(`Consultando item presupuestario con ID: ${idItemPresupuestario}`);
            const response = await API.get(`/item-presupuestario/${idItemPresupuestario}`);
            console.log("Respuesta completa:", response);
            
            // Verificar explícitamente si el campo código está presente
            if (response.data && !response.data.codigo) {
            console.warn("Código no encontrado en la respuesta:", response.data);
            }
            
            return response.data;
        } catch (error) {
            console.error("Error al obtener item presupuestario:", error);
            if (error.response) {
            console.error("Respuesta del servidor:", error.response.data);
            console.error("Status:", error.response.status);
            }
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
    },

    // Crear programación mensual
    crearProgramacionMensual: async (programacionData: ProgramacionMensualCreate): Promise<ProgramacionMensualOut> => {
        try {
            console.log("Creando programación mensual:", programacionData);
            const response = await API.post("/programacion-mensual", programacionData);
            console.log("Programación mensual creada exitosamente:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error al crear programación mensual:", error);
            if (error.response) {
                console.error("Respuesta del servidor:", error.response.data);
                console.error("Status:", error.response.status);
                
                // Manejar el error específico de duplicación
                if (error.response.status === 400 && 
                    error.response.data?.detail === "Ya existe programación para ese mes y tarea.") {
                    throw new Error("Ya existe una programación para ese mes y tarea");
                }
            }
            throw error;
        }
    },


}

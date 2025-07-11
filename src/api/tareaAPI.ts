import { DetalleTarea, Tarea, TareaCreate, TareaUpdate, ItemPresupuestario, ProgramacionMensualCreate, ProgramacionMensualOut } from "../interfaces/tarea";
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

    // Obtener item presupuestario de una tarea específica
    getItemPresupuestarioDeTarea: async (idTarea: string): Promise<ItemPresupuestario> => {
        try {
            console.log(`Consultando item presupuestario de tarea con ID: ${idTarea}`);
            const response = await API.get(`/tareas/${idTarea}/item-presupuestario`);
            console.log("Item presupuestario de tarea obtenido:", response.data);
            return response.data as ItemPresupuestario;
        } catch (error) {
            console.error("Error al obtener item presupuestario de tarea:", error);
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as any;
                console.error("Respuesta del servidor:", axiosError.response.data);
                console.error("Status:", axiosError.response.status);
                
                // Manejar errores específicos
                if (axiosError.response.status === 404) {
                    if (axiosError.response.data?.detail === "Tarea no encontrada") {
                        throw new Error("Tarea no encontrada");
                    } else if (axiosError.response.data?.detail === "Item presupuestario no asociado a esta tarea") {
                        throw new Error("Item presupuestario no asociado a esta tarea");
                    }
                }
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

    // Obtener programación mensual por tarea
    getProgramacionMensualPorTarea: async (idTarea: string): Promise<ProgramacionMensualOut[]> => {
        try {
            console.log(`Consultando programación mensual para tarea ID: ${idTarea}`);
            const response = await API.get(`/tareas/${idTarea}/programacion-mensual`);
            console.log("Programación mensual obtenida:", response.data);
            return response.data as ProgramacionMensualOut[];
        } catch (error) {
            console.error("Error al obtener programación mensual:", error);
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as any;
                console.error("Respuesta del servidor:", axiosError.response.data);
                console.error("Status:", axiosError.response.status);
                
                // Manejar error específico de tarea no encontrada
                if (axiosError.response.status === 404) {
                    throw new Error("Tarea no encontrada");
                }
            }
            throw error;
        }
    },

}

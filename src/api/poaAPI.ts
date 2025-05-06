import { API } from './userAPI';
import { POA, EstadoPOA, TipoPOA, PoaCreate } from '../interfaces/poa';
// Ya no importamos Periodo de poa.ts

export const poaAPI = {
    // Obtener todos los estados de POA
    getEstadosPOA: async (): Promise<EstadoPOA[]> => {
        const response = await API.get('/estados-poa/');
        return response.data;
    },

    // Obtener todos los tipos de POA
    getTiposPOA: async (): Promise<TipoPOA[]> => {
        const response = await API.get('/tipos-poa/');
        return response.data;
    },

    // Obtener tipo POA por id
    getTipoPOA: async (id: string): Promise<TipoPOA> => {
        const response = await API.get(`/tipos-poa/${id}`);
        return response.data;
    },

    // Crear un nuevo POA
    crearPOA: async (poaData: PoaCreate): Promise<POA> => {
        const datosAEnviar = {
            ...poaData,
            fecha_creacion: poaData.fecha_creacion ? poaData.fecha_creacion.split('Z')[0] : new Date().toISOString().split('Z')[0], // Eliminar la información de zona horaria
            //id_estado_poa: poaData.id_estado_poa || null // Asegurarse de que este campo sea nulo si no se proporciona
        };
        
        console.log("POA data being sent to API:", datosAEnviar);

        try {
            const response = await API.post('/poas/', datosAEnviar);
            console.log("Respuesta del servidor:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error detallado al crear POA:", error);
            if (error.response) {
                console.error("Respuesta del servidor:", error.response.data);
                console.error("Status:", error.response.status);
            }
            throw error;
        }
    },

    // Obtener todos los POAs
    getPOAs: async (): Promise<POA[]> => {
        const response = await API.get('/poas/');
        return response.data;
    },

    // Obtener un POA específico
    getPOA: async (id: string): Promise<POA> => {
        const response = await API.get(`/poas/${id}`);
        return response.data;
    },

    // Editar un POA existente
    editarPOA: async (id: string, poaData: Partial<PoaCreate>): Promise<POA> => {
        const response = await API.put(`/poas/${id}`, poaData);
        return response.data;
    },

    // Función para obtener el tipo POA correspondiente a un tipo de proyecto
    getTipoPOAByTipoProyecto: async (codigo_tipo: string): Promise<TipoPOA | undefined> => {
        // Obtener todos los tipos de POA
        const tiposPOA = await poaAPI.getTiposPOA();
        
        // Buscar el tipo POA que corresponda al nombre del tipo de proyecto
        return tiposPOA.find(tipoPOA => 
            tipoPOA.codigo_tipo.toLowerCase().includes(codigo_tipo.toLowerCase())
        );
    },

    // Obtener POAs por Proyecto
    getPOAsByProyecto: async (idProyecto: string): Promise<POA[]> => {
        try {
            const response = await API.get(`/proyectos/${idProyecto}/poas`);
            return response.data;
        } catch (error) {
            console.error("Error al obtener POAs por proyecto:", error);
            if (error.response) {
                console.error("Respuesta del servidor:", error.response.data);
                console.error("Status:", error.response.status);
            }
            throw error;
        }
    },
};
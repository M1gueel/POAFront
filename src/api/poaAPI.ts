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
        // Añadir fecha de creación automáticamente
        const datosAEnviar = {
            ...poaData,
            fecha_creacion: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
        };
        
        console.log("POA data being sent to API:", datosAEnviar);
        const response = await API.post('/poas/', datosAEnviar);
        return response.data;
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

    // Función para generar código POA a partir del código de tipo POA
    generarCodigoPOA: async (idTipoPOA: string, sufijo?: string): Promise<string> => {
        // Obtener el tipo POA para extraer su código
        const tiposPOA = await poaAPI.getTiposPOA();
        const tipoPOA = tiposPOA.find(tipo => tipo.id_tipo_poa === idTipoPOA);
        
        if (!tipoPOA) {
            throw new Error("Tipo de POA no encontrado");
        }
        
        // Generar el código con el formato deseado: codigoTipo-sufijo
        const codigoBase = tipoPOA.codigo_tipo;
        return sufijo ? `${codigoBase}-${sufijo}` : `${codigoBase}-`;
    },

    // Función para obtener el tipo POA correspondiente a un tipo de proyecto
    getTipoPOAByTipoProyecto: async (codigo_tipo: string): Promise<TipoPOA | undefined> => {
        // Obtener todos los tipos de POA
        const tiposPOA = await poaAPI.getTiposPOA();
        
        // Buscar el tipo POA que corresponda al nombre del tipo de proyecto
        return tiposPOA.find(tipoPOA => 
            tipoPOA.codigo_tipo.toLowerCase().includes(codigo_tipo.toLowerCase())
        );
    }
};
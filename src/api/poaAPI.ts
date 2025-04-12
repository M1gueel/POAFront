import { API } from './userAPI';
import { POA, EstadoPOA, TipoPOA } from '../interfaces/poa';
import { Periodo } from '../interfaces/periodo'; // Asumiendo que tienes esta interfaz
// TODO: crear la interfaz Periodo en el archivo interfaces/periodo.ts
//TODO: crear una api para periodos y agregar los métodos necesarios para obtener, crear y editar periodos


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

    // Obtener todos los periodos
    getPeriodos: async (): Promise<Periodo[]> => {
        const response = await API.get('/periodos/');
        return response.data;
    },

    // Obtener un periodo específico
    getPeriodo: async (id: string): Promise<Periodo> => {
        const response = await API.get(`/periodos/${id}`);
        return response.data;
    },

    // Crear un nuevo periodo
    crearPeriodo: async (periodoData: Omit<Periodo, 'id_periodo'>): Promise<Periodo> => {
        const response = await API.post('/periodos/', periodoData);
        return response.data;
    },

    //TODO: Pasar este metodo a la api de proyectos y crear los endpoints en el backend
    // Obtener proyectos (para asociar al POA)
    getProyectos: async (filtro?: { codigo?: string, titulo?: string }): Promise<any[]> => {
        let url = '/proyectos/';
        
        // Si existe implementación de filtrado en el backend, se podría usar así:
        // if (filtro?.codigo || filtro?.titulo) {
        //     const params = new URLSearchParams();
        //     if (filtro.codigo) params.append('codigo', filtro.codigo);
        //     if (filtro.titulo) params.append('titulo', filtro.titulo);
        //     url += `?${params.toString()}`;
        // }
        
        const response = await API.get(url);
        
        // Filtrado en el cliente (en caso de que el backend no lo soporte)
        let proyectos = response.data;
        if (filtro) {
            proyectos = proyectos.filter((proyecto: any) => {
                const matchCodigo = !filtro.codigo || 
                    proyecto.codigo_proyecto.toLowerCase().includes(filtro.codigo.toLowerCase());
                const matchTitulo = !filtro.titulo || 
                    proyecto.titulo.toLowerCase().includes(filtro.titulo.toLowerCase());
                return matchCodigo && matchTitulo;
            });
        }
        
        return proyectos;
    },

    // Crear un nuevo POA
    crearPOA: async (poaData: Omit<POA, 'id_poa' | 'fecha_creacion' | 'id_estado_poa'>): Promise<POA> => {
        // Añadir fecha de creación automáticamente
        const datosAEnviar = {
            ...poaData,
            fecha_creacion: new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD
        };
        
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
    editarPOA: async (id: string, poaData: Omit<POA, 'id_poa'>): Promise<POA> => {
        const response = await API.put(`/poas/${id}`, poaData);
        return response.data;
    },

    //TODO: Eliminar las funciones de aqui, por que solo se deben pasar datos
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

    
    //TODO: Se necesita un endpoint para evitar esto
    // Función para obtener el tipo POA correspondiente a un tipo de proyecto
    getTipoPOAByTipoProyecto: async (tipoProyectoNombre: string): Promise<TipoPOA | undefined> => {
        // Obtener todos los tipos de POA
        const tiposPOA = await poaAPI.getTiposPOA();
        
        // Buscar el tipo POA que corresponda al nombre del tipo de proyecto
        // Esta lógica dependerá de cómo se relacionan en tu sistema
        // Por ejemplo, si los nombres son iguales o siguen algún patrón
        return tiposPOA.find(tipoPOA => 
            tipoPOA.nombre.toLowerCase().includes(tipoProyectoNombre.toLowerCase())
        );
    }
};
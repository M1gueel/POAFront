import { API } from './userAPI';
import { TipoProyecto } from '../interfaces/project';

export const projectAPI = {
    // Obtener todos los tipos de proyecto
    getTiposProyecto: async (): Promise<TipoProyecto[]> => {
        const response = await API.get('/tipos-proyecto/');
        return response.data;
    },
    
};
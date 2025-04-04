import axios from 'axios';

// Configura la URL base para todas las peticiones
const API = axios.create({
  baseURL: 'http://localhost:8000', // Ajusta según tu configuración
});

// Interceptor para incluir el token en las peticiones
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Servicios de autenticación
export const authService = {
  login: async (email: string, password: string) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const response = await API.post('/login', formData);
    return response.data;
  },
  
  register: async (userData: any) => {
    const response = await API.post('/register', userData);
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await API.get('/perfil');
    return response.data;
  }
};

// Servicios para proyectos
export const proyectoService = {
  createProyecto: async (proyectoData: any) => {
    const response = await API.post('/proyectos/', proyectoData);
    return response.data;
  },
  
  getProyectos: async () => {
    const response = await API.get('/proyectos/');
    return response.data;
  },
  
  getProyectoById: async (id: string) => {
    const response = await API.get(`/proyectos/${id}`);
    return response.data;
  }
};

// Servicios para POAs
export const poaService = {
  createPoa: async (poaData: any) => {
    const response = await API.post('/poas/', poaData);
    return response.data;
  },
  
  getPoas: async () => {
    const response = await API.get('/poas/');
    return response.data;
  }
};

// Servicios para periodos
export const periodoService = {
  createPeriodo: async (periodoData: any) => {
    const response = await API.post('/periodos/', periodoData);
    return response.data;
  },
  
  getPeriodos: async () => {
    const response = await API.get('/periodos/');
    return response.data;
  },
  
  updatePeriodo: async (id: string, periodoData: any) => {
    const response = await API.put(`/periodos/${id}`, periodoData);
    return response.data;
  }
};
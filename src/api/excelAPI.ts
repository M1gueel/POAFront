import { API } from "./userAPI";
export const excelAPI = {
  // Subir archivo Excel para transformar y cargar actividades/tareas
  subirExcel: async (formData: FormData): Promise<any> => {
    try {
      const response = await API.post("/transformar_excel/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw error;
    }
  },
  getLogsCargaExcel: async (
    params: {
      fecha_inicio?: string;
      fecha_fin?: string;
    } = {}
  ): Promise<any[]> => {
    const response = await API.get("/logs-carga-excel/", { params });
    return response.data as any[];
  },
};

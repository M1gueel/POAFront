export interface Proyecto {
  id_proyecto: string;
  codigo_proyecto: string;
  titulo: string;
}

export interface TipoProyecto {
    id_tipo_proyecto: string;
    codigo_tipo: string;
    nombre: string;
    descripcion: string;
  }

export  interface Periodo {
    id_periodo: string;
    codigo_periodo: string;
    nombre_periodo: string;
    fecha_inicio: string;
    fecha_fin: string;
    anio?: string;
    mes?: string;
  }
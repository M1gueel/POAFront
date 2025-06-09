export interface Proyecto {
  id_proyecto: string;
  codigo_proyecto: string;
  titulo: string;
  id_tipo_proyecto: string;
  id_estado_proyecto: string;
  id_director_proyecto: string;
  presupuesto_aprobado: number;
  fecha_creacion: string;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_prorroga: string;
  fecha_prorroga_inicio: string;
  fecha_prorroga_fin: string;
}

export interface TipoProyecto {
  prefijo: any;
  id_tipo_proyecto: string;
  codigo_tipo: string;
  nombre: string;
  descripcion: string;
  duracion_meses: number;
  cantidad_periodos: number;
  presupuesto_maximo: number;
}

export interface EstadoProyecto {
  id_estado_proyecto: string;
  nombre: string;
  descripcion: string;
}

export interface DirectorProyecto {
  id_usuario: string;
  nombre_usuario: string;
}
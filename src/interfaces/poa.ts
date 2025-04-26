export interface POA {
  id_poa: string;
  id_proyecto: string;
  codigo_poa: string;
  fecha_creacion: string;
  id_estado_poa: string;
  id_tipo_poa: string;
  anio_ejecucion: string;
  presupuesto_asignado: number;
}

export interface EstadoPOA {
  id_estado_poa: string;
  nombre: string;
  descripcion: string;
}

export interface TipoPOA {
  id_tipo_poa: string;
  codigo_tipo: string;
  nombre: string;
  descripcion: string;
  duracion_meses: number;
  cantidad_periodos: number;
  presupuesto_maximo: number;
}

export interface PoaCreate {
  id_proyecto: string;
  codigo_poa: string;
  id_tipo_poa: string;
  id_periodo: string;
  anio_ejecucion: string;
  presupuesto_asignado: number;
}
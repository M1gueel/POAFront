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
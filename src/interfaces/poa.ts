export interface POA {
  id_poa: string;       // UUID
  id_proyecto: string;  // UUID
  codigo_poa: string;
  fecha_creacion: string;
  id_estado_poa: string;  // UUID
  id_tipo_poa: string;   // UUID
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
  id_proyecto: string;  // Debe ser un UUID válido
  id_periodo: string;   // Debe ser un UUID válido
  codigo_poa: string;
  id_tipo_poa: string;  // Debe ser un UUID válido
  anio_ejecucion: string;
  presupuesto_asignado: number;  // Se convierte a Decimal en el backend
  fecha_creacion?: string;  // Se añade automáticamente en poaAPI.ts
  id_estado_poa: string | null; // Añadir este campo
}
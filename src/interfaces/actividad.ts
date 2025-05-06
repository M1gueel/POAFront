export interface Actividad {
    id_actividad: string;
    id_poa: string;
    descripcion_actividad: string;
    total_por_actividad: number;
    saldo_actividad: number;
}

export interface ActividadCreate {
    descripcion_actividad: string;
    total_por_actividad: number;
    saldo_actividad: number;
}

export interface ActividadForm {
    id: string;
    descripcion_actividad: string;
  }

export interface POAConActividades {
    id_poa: string;
    codigo_poa: string;
    presupuesto_asignado: number;
    actividades: Array<{
      actividad_id: string;
      total_por_actividad: number;
    }>;
  }

export interface ItemPresupuestario {
    id_item_presupuestario: string;
    codigo: string;
    nombre: string;
}

export interface DetalleTarea {
    id_detalle_tarea: string;
    id_item_presupuestario: string;
    nombre: string;
    descripcion?: string;
    caracteristicas?: string;
    item_presupuestario?: ItemPresupuestario;
}

export interface Tarea {
    id_tarea: string;
    id_actividad: string;
    id_detalle_tarea: string;
    nombre: string;
    detalle_descripcion?: string;
    cantidad: number;
    precio_unitario: number;
    total: number;
    saldo_disponible: number;
    detalle_tarea?: DetalleTarea;
}

export interface TareaCreate {
    id_detalle_tarea: string;
    nombre: string;
    detalle_descripcion?: string;
    cantidad: number;
    precio_unitario: number;
}

export interface TareaUpdate {
    nombre?: string;
    detalle_descripcion?: string;
    cantidad?: number;
    precio_unitario?: number;
    total?: number;
    saldo_disponible?: number;
}

export interface TipoPoaDetalleTarea {
    id_tipo_poa_detalle_tarea: string;
    id_tipo_poa: string;
    id_detalle_tarea: string;
}

export interface LimiteActividadesTipoPoa {
    id_limite: string;
    id_tipo_poa: string;
    limite_actividades: number;
    descripcion?: string;
}
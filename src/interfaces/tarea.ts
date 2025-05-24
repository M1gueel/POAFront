
export interface ItemPresupuestario {
    id_item_presupuestario: string;
    codigo: string;
    nombre: string;
    descripcion: string;
}

//TODO: Comprobar si el ultimo campo es correcto o si me srive para obtener el 012506 o 010504
export interface DetalleTarea {
    id_detalle_tarea: string;
    id_item_presupuestario: string;
    nombre: string;
    descripcion?: string;
    caracteristicas?: string;
    codigo_item?: string;
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

// Agrega este campo a la interfaz TareaForm en el archivo interfaces/tarea.ts
export interface TareaForm {
  tempId: string;
  id_detalle_tarea: string;
  nombre: string;
  detalle_descripcion: string;
  cantidad: number;
  precio_unitario: number;
  detalle?: DetalleTarea;
  itemPresupuestario?: ItemPresupuestario;
  codigo_item?: string; // Nuevo campo para el código del ítem
  total?: number;
  saldo_disponible?: number;
  numero_tarea?: string;
}
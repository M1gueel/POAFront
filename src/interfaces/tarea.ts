
export interface ItemPresupuestario {
    id_item_presupuestario: string;
    codigo: string;
    nombre: string;
    descripcion: string;
}

export interface DetalleTarea {
    id_detalle_tarea: string;
    id_item_presupuestario: string;
    nombre: string;
    descripcion?: string;
    caracteristicas?: string;
    codigo_item?: string;
    item_presupuestario?: ItemPresupuestario;
    // Campos existentes para múltiples items
    items_presupuestarios?: ItemPresupuestario[];
    tiene_multiples_items?: boolean;
    // NUEVOS campos para múltiples descripciones
    descripciones_disponibles?: string[];
    tiene_multiples_descripciones?: boolean;
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
    lineaPaiViiv?: number;
}

export interface TareaCreate {
    id_detalle_tarea: string;
    nombre: string;
    detalle_descripcion?: string;
    cantidad: number; // Cambiar a string
    precio_unitario: number; // Cambiar a string
    total: number; // Cambiar a string
    saldo_disponible?: number; // Cambiar a string
    lineaPaiViiv?: number;
}

export interface TareaUpdate {
    nombre?: string;
    detalle_descripcion?: string;
    cantidad?: number;
    precio_unitario?: number;
    total?: number;
    saldo_disponible?: number;
    lineaPaiViiv?: number;
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

export interface TareaForm {
  tempId: string;
  id_detalle_tarea: string;
  nombre: string;
  detalle_descripcion: string;
  cantidad: number;
  precio_unitario: number;
  total?: number;
  saldo_disponible?: number;
  gastos_mensuales?: number[];
  expanded?: boolean;
  detalle?: DetalleTarea;
  itemPresupuestario?: ItemPresupuestario;
  codigo_item?: string;
  numero_tarea?: string;
  id_item_presupuestario_seleccionado?: string;
  // NUEVO campo para la descripción seleccionada
  descripcion_seleccionada?: string;
  lineaPaiViiv?: number;
}

// Nueva interfaz para la respuesta del backend
export interface TareaResponse {
  id_tarea: string;
  nombre: string;
  detalle_descripcion: string;
  cantidad: string; // Backend devuelve como string
  precio_unitario: string; // Backend devuelve como string
  total: string; // Backend devuelve como string
  saldo_disponible: string; // Backend devuelve como string
  lineaPaiViiv?: number;
}

// Interface para programación mensual
export interface ProgramacionMensualCreate {
  id_tarea: string;
  mes: string; // Formato "MM-YYYY"
  valor: number; // Backend espera decimal como number
}

export interface TareaFormExtended extends TareaForm {
  tempId: string;
  gastos_mensuales: number[]; // Array de 12 elementos para los meses
  expanded?: boolean;
  saldo_disponible?: number;
  detalle?: DetalleTarea;
  itemPresupuestario?: ItemPresupuestario;
  numero_tarea?: string;
}


// Tipo para actualizar programación mensual
export interface ProgramacionMensualUpdate {
    valor: number;      // Solo se puede actualizar el valor
}

// Tipo para la respuesta de programación mensual
export interface ProgramacionMensualOut {
    id_programacion: string;  // UUID como string
    id_tarea: string;        // UUID como string
    mes: string;             // Formato "MM-AAAA"
    valor: number;           // Decimal como number
}
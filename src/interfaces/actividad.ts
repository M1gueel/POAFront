export interface Actividad {
    id_actividad: string;
    id_poa: string;
    descripcion_actividad: string;
    total_por_actividad: number;
    saldo_actividad: number;
}

export interface ActividadForm {
    id: string;
    codigo_actividad: string; // Código de la actividad seleccionada de la lista
    descripcion_actividad: string;
}

export interface ActividadCreate {
    descripcion_actividad: string;
    total_por_actividad: number; // Este valor siempre será 0 inicialmente
    saldo_actividad: number; // Este valor siempre será 0 inicialmente
}

export interface ActividadForm {
    id: string;
    descripcion_actividad: string;
  }

export interface POAConActividades {
    id_poa: string;
    codigo_poa: string;
    tipo_poa: string; // Agregamos el tipo de POA para determinar las actividades disponibles
    presupuesto_asignado: number;
    actividades: {
        actividad_id: string;
        codigo_actividad: string;
    }[];
  }

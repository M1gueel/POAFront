export interface Periodo {
    id_periodo: string;
    codigo_periodo: string;
    nombre_periodo: string;
    fecha_inicio: string;
    fecha_fin: string;
    anio?: string;
    mes?: string;
  }
  
  export interface PeriodoCreate {
    codigo_periodo: string;
    nombre_periodo: string;
    fecha_inicio: string;
    fecha_fin: string;
    anio: string;
    mes: string;
  }
  
  // export interface PoaPeriodo {
  //   id_poa_periodo: string;
  //   id_poa: string;
  //   id_periodo: string;
  // }
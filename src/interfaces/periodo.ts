export interface Periodo {
  id_periodo: string;    // UUID o temp-id para periodos no guardados
  codigo_periodo: string;
  nombre_periodo: string;
  fecha_inicio: string;  // Formato ISO
  fecha_fin: string;     // Formato ISO
  anio?: string;
  mes?: string;
}
  
export interface PeriodoCreate {
  codigo_periodo: string;
  nombre_periodo: string;
  fecha_inicio: string;  // Formato ISO
  fecha_fin: string;     // Formato ISO
  anio: string;
  mes: string;
}
  
  // export interface PoaPeriodo {
  //   id_poa_periodo: string;
  //   id_poa: string;
  //   id_periodo: string;
  // }
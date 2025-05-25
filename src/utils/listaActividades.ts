// Este archivo contiene la lista de actividades para cada tipo de POA
export interface ActividadOpciones {
  id: string;
  descripcion: string;
}

export interface ListaActividadesPorTipo {
  [key: string]: ActividadOpciones[];
}

// Actividades para PIM, PIGR, PIS y PIIF
const actividadesPIM_PIGR_PIS_PIIF: ActividadOpciones[] = [
  {
    id: "ACT-1",
    descripcion: "Actividades donde se involucre personal para el desarrollo del proyecto"
  },
  {
    id: "ACT-2",
    descripcion: "Actividades donde se involucre personal para el desarrollo del proyecto"
  },
  {
    id: "ACT-3",
    descripcion: "Actividades donde sea necesario la adquisición de equipos informaticos"
  },
  {
    id: "ACT-4",
    descripcion: "Actividades donde sea necesario la adquisición de equipos especializados y maquinaria"
  },
  {
    id: "ACT-5",
    descripcion: "Actividades que requieran insumos materiales y reactivos necesarios para la construcción del prototipo"
  },
  {
    id: "ACT-6",
    descripcion: "Actividades donde se involucren pago de publicaciones"
  },
    {
    id: "ACT-7",
    descripcion: "Actividades donde se involucren pago de inscripción para participación en eventos académicos"
  },
  {
    id: "ACT-8",
    descripcion: "Actividades donde se involucren salidas de campo y de muestreo, ponencias nacionales, asistencia a eventos académicos (Salidas Nacionales, talleres, conferencias u otros eventos académicos)"
  },
  {
    id: "ACT-9",
    descripcion: "Actividades donde sea necesario la contratación de servicios especializados, analisis de laboratorios"
  },
    {
    id: "ACT-10",
    descripcion: "Actividades donde se involucre la utilización de literatura especializada"
  },
  {
    id: "ACT-11",
    descripcion: "Actividades donde se involucren salidas al exterior para participación en eventos académicos o presentación de resultados del proyecto(Salidas al Exterior)"
  },
  {
    id: "ACT-12",
    descripcion: "Actividades donde se involucren la atención a delegados (investigadores colaboradores externos)"
  }
];

// Actividades para PTT
const actividadesPTT: ActividadOpciones[] = [
  {
    id: "ACT-PTT-1",
    descripcion: "Actividades donde se involucre personal para el desarrollo del proyecto"
  },
  {
    id: "ACT-PTT-2",
    descripcion: "Actividades donde sea necesario la adquisición de equipos especializados y maquinaria"
  },
  {
    id: "ACT-PTT-3",
    descripcion: "Actividades que requieran insumos materiales y reactivos necesarios para la construcción del prototipo"
  },
  {
    id: "ACT-PTT-4",
    descripcion: "Actividades donde se involucre la difusión del proyecto"
  },
  {
    id: "ACT-PTT-5",
    descripcion: "Actividades donde se involucren salidas de campo y de muestreo, ponencias nacionales, asistencia a eventos académicos (Salidas Nacionales, talleres, conferencias u otros eventos académicos)"
  },
  {
    id: "ACT-PTT-6",
    descripcion: "Actividades donde se involucre el diseño, construcción, implementación, seguimiento y mejora continua"
  },
  {
    id: "ACT-PTT-7",
    descripcion: "Actividades donde sea necesario la adquisición de equipos informaticos"
  },
  {
    id: "ACT-PTT-8",
    descripcion: "Actividades donde se involucre la gestión de la propiedad intelectual"
  }
];

// Actividades para PVIF y PVIS
const actividadesPVIF_PVIS: ActividadOpciones[] = [
  {
    id: "ACT-PVIF-1",
    descripcion: "Actividades donde se involucre personal para el desarrollo del proyecto"
  },
  {
    id: "ACT-PVIF-2",
    descripcion: "Actividades donde se involucre personal para el desarrollo del proyecto: Caracterización de Residuos Sólidos y tipología de unidades educativas. Implementación de capacitación"
  },
  {
    id: "ACT-PVIF-3",
    descripcion: "Actividades donde sea necesario la adquisición de equipos informaticos"
  },
  {
    id: "ACT-PVIF-4",
    descripcion: "Actividades donde sea necesario la adquisición de equipos especializados y maquinaria"
  },
  {
    id: "ACT-PVIF-5",
    descripcion: "Actividades que requieran insumos materiales y reactivos necesarios para la construcción del prototipo"
  },
  {
    id: "ACT-PVIF-6",
    descripcion: "Actividades donde se involucre la difusión del proyecto"
  },
  {
    id: "ACT-PVIF-7",
    descripcion: "Actividades donde se involucren pago de inscripción para participación en eventos académicos"
  },
  {
    id: "ACT-PVIF-8",
    descripcion: "Actividades donde se involucren salidas de campo y de muestreo, ponencias nacionales, asistencia a eventos académicos (Salidas Nacionales, talleres, conferencias u otros eventos académicos)"
  }
];

// Mapeo de tipos de POA a sus actividades correspondientes
export const listaActividadesPorTipo: ListaActividadesPorTipo = {
  "PIM": actividadesPIM_PIGR_PIS_PIIF,
  "PIGR": actividadesPIM_PIGR_PIS_PIIF,
  "PIS": actividadesPIM_PIGR_PIS_PIIF,
  "PIIF": actividadesPIM_PIGR_PIS_PIIF,
  "PTT": actividadesPTT,
  "PVIF": actividadesPVIF_PVIS,
  "PVIS": actividadesPVIF_PVIS,
  // Agregar más tipos de POA según sea necesario
};

// Función de utilidad para obtener las actividades según el tipo de POA
export const getActividadesPorTipoPOA = (tipoPOA: string): ActividadOpciones[] => {
  return listaActividadesPorTipo[tipoPOA] || [];
};
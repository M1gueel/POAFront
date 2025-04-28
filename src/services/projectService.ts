import { projectAPI } from '../api/projectAPI';
import { EstadoProyecto, Proyecto, TipoProyecto } from '../interfaces/project';

export const projectService = {
  /**
   * Get all project states from API
   */
  getEstadosProyecto: async (): Promise<EstadoProyecto[]> => {
    try {
      return await projectAPI.getEstadosProyecto();
    } catch (error) {
      console.error('Error fetching project states:', error);
      throw error;
    }
  },

  /**
   * Create a new project
   */
  crearProyecto: async (proyectoData: Proyecto): Promise<Proyecto> => {
    try {
      return await projectAPI.crearProyecto(proyectoData);
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  /**
   * Calculate maximum end date based on start date and duration
   */
  calcularFechaFinMaxima: (fechaInicio: string, duracionMeses: number): string => {
    if (!fechaInicio || !duracionMeses) return '';
    
    const fechaInicioObj = new Date(fechaInicio);
    const fechaFinObj = new Date(fechaInicioObj);
    
    // Set the exact day after adding months
    fechaFinObj.setMonth(fechaInicioObj.getMonth() + duracionMeses);
    
    // Adjust to ensure it's the same day of the month (or last day if target month is shorter)
    if (fechaFinObj.getDate() !== fechaInicioObj.getDate()) {
      // If we're on a different day, it means the target month doesn't have that day
      // Go back to the last day of the previous month
      fechaFinObj.setDate(0);
    }
    
    // Format to YYYY-MM-DD for date input value
    return fechaFinObj.toISOString().split('T')[0];
  },

  /**
   * Generate project code based on project type and start date
   */
  generarCodigoProyecto: (tipoProyecto: TipoProyecto, fechaInicio: string): string => {
    if (!fechaInicio || !tipoProyecto?.codigo_tipo) return '';
    
    const fechaObj = new Date(fechaInicio);
    const anio = fechaObj.getFullYear().toString().slice(-2);
    const mes = ("0" + (fechaObj.getMonth() + 1)).slice(-2);
    
    return `${tipoProyecto.codigo_tipo}-${anio}-${mes}`;
  },

  /**
   * Validate director name format
   * @param nombre Director's name to validate
   * @returns True if valid, false otherwise
   */
  validarNombreDirector: (nombre: string): boolean => {
    const pattern = /^[A-Za-zÀ-ÖØ-öø-ÿ]+ [A-Za-zÀ-ÖØ-öø-ÿ]+( [A-Za-zÀ-ÖØ-öø-ÿ]+)?( [A-Za-zÀ-ÖØ-öø-ÿ]+)?$/;
    return pattern.test(nombre.trim());
  },

  /**
   * Validate project budget based on project type maximum
   * @param presupuesto Budget value to validate
   * @param tipoProyecto Project type containing maximum budget
   * @returns Error message or null if valid
   */
  validarPresupuesto: (presupuesto: string, tipoProyecto: TipoProyecto | null): string | null => {
    if (!presupuesto) return null;
    
    const valorPresupuesto = parseFloat(presupuesto);
    
    if (valorPresupuesto <= 0) {
      return 'El presupuesto debe ser un valor positivo';
    }
    
    if (tipoProyecto?.presupuesto_maximo && valorPresupuesto > tipoProyecto.presupuesto_maximo) {
      return `El presupuesto no puede exceder ${tipoProyecto.presupuesto_maximo.toLocaleString('es-CO')} para este tipo de proyecto`;
    }
    
    return null;
  },
  
  /**
   * Validate end date based on project type maximum duration
   */
  validarFechaFin: (fechaFin: string, fechaInicio: string, duracionMeses: number): string | null => {
    if (!fechaFin || !fechaInicio) return null;
    
    const fechaFinMaxima = projectService.calcularFechaFinMaxima(fechaInicio, duracionMeses);
    
    if (new Date(fechaFin) > new Date(fechaFinMaxima)) {
      return `La fecha de fin no puede exceder la duración máxima de ${duracionMeses} meses desde la fecha de inicio`;
    }
    
    return null;
  }
};
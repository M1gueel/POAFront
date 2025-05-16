// src/validators/projectValidators.ts
import { TipoProyecto } from '../interfaces/project';

/**
 * Validates the director name format
 * Format: 1-2 first names followed by 1-2 last names
 */

export const validateDirectorName = (name: string): boolean => {
  // Elimina espacios adicionales al inicio y final
  const trimmedName = name.trim();
  
  // Verifica que no esté vacío
  if (!trimmedName) return false;
  
  // Divide el nombre en palabras
  const words = trimmedName.split(/\s+/);
  const wordCount = words.length;
  
  // Verifica que tenga al menos 2 palabras y máximo 8
  if (wordCount < 2 || wordCount > 8) return false;
  
  // Verifica que cada palabra contenga solo caracteres válidos para nombres
  // Incluye caracteres latinos, acentos, ñ y ü
  const validWordPattern = /^[A-Za-zÀ-ÖØ-öø-ÿ]+$/;
  
  return words.every(word => validWordPattern.test(word));
};

/**
 * Validates the project budget based on project type maximum
 */
export const validateBudget = (
  budget: string,
  tipoProyecto: TipoProyecto | null
): string | null => {
  if (!budget) return null;
  
  const budgetValue = parseFloat(budget);
  
  if (isNaN(budgetValue)) {
    return 'El presupuesto debe ser un número válido';
  }
  
  if (budgetValue <= 0) {
    return 'El presupuesto debe ser un valor positivo';
  }
  
  if (tipoProyecto?.presupuesto_maximo && budgetValue > tipoProyecto.presupuesto_maximo) {
    return `El presupuesto no puede exceder ${tipoProyecto.presupuesto_maximo.toLocaleString('es-CO')} para este tipo de proyecto`;
  }
  
  return null;
};

/**
 * Validates the end date based on start date and maximum duration
 */
export const validateEndDate = (
  endDate: string,
  startDate: string,
  maxDurationMonths: number | undefined
): string | null => {
  if (!endDate || !startDate || !maxDurationMonths) return null;
  
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  
  if (endDateObj < startDateObj) {
    return 'La fecha de fin no puede ser anterior a la fecha de inicio';
  }
  
  const maxEndDateObj = new Date(startDateObj);
  maxEndDateObj.setMonth(startDateObj.getMonth() + maxDurationMonths);
  
  // Adjust for month length differences
  if (maxEndDateObj.getDate() !== startDateObj.getDate()) {
    maxEndDateObj.setDate(0);
  }
  
  if (endDateObj > maxEndDateObj) {
    return `La fecha de fin no puede exceder la duración máxima de ${maxDurationMonths} meses desde la fecha de inicio`;
  }
  
  return null;
};

/**
 * Validates all required fields for the project form
 */
export const validateProjectFormRequiredFields = (
  codigo_proyecto: string,
  titulo: string,
  tipoProyecto: TipoProyecto | null,
  id_estado_proyecto: string,
  id_director_proyecto: string,
  fecha_inicio: string
): string | null => {
  if (!codigo_proyecto || !titulo || !tipoProyecto || !id_estado_proyecto || !id_director_proyecto || !fecha_inicio) {
    return 'Por favor complete todos los campos obligatorios';
  }
  
  if (!validateDirectorName(id_director_proyecto)) {
    return 'El formato del nombre del director debe ser: Nombre Apellido o Nombre1 Nombre2 Apellido1 Apellido2';
  }
  
  return null;
};
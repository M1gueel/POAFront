import { Proyecto } from '../interfaces/project';
import { POA } from '../interfaces/poa';

export interface POAWithProject extends POA {
  proyecto?: Proyecto;
}

export interface FilterState {
  searchTerm: string;
  sortBy: 'anio' | 'presupuesto' | 'titulo' | 'codigo';
  sortOrder: 'asc' | 'desc';
  yearFilter: string;
  minBudget: string;
  maxBudget: string;
}

export interface ColumnFilters {
  [key: string]: FilterState;
}
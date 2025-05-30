import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { poaAPI } from '../api/poaAPI';
import { projectAPI } from '../api/projectAPI';
import { POA, EstadoPOA } from '../interfaces/poa';
import { Proyecto } from '../interfaces/project';
import '../styles/Dashboard.css';

interface POAWithProject extends POA {
  proyecto?: Proyecto;
}

interface FilterState {
  searchTerm: string;
  sortBy: 'anio' | 'presupuesto' | 'titulo' | 'codigo';
  sortOrder: 'asc' | 'desc';
  yearFilter: string;
  minBudget: string;
  maxBudget: string;
}

interface ColumnFilters {
  [key: string]: FilterState;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [estadosPOA, setEstadosPOA] = useState<EstadoPOA[]>([]);
  const [poasWithProjects, setPOAsWithProjects] = useState<POAWithProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros por columna
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({});
  const [showFilters, setShowFilters] = useState<{[key: string]: boolean}>({});

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Obtener estados POA y POAs en paralelo
        const [estadosResponse, poasResponse] = await Promise.all([
          poaAPI.getEstadosPOA(),
          poaAPI.getPOAs()
        ]);

        setEstadosPOA(estadosResponse);

        // Inicializar filtros para cada estado
        const initialFilters: ColumnFilters = {};
        estadosResponse.forEach(estado => {
          initialFilters[estado.id_estado_poa] = {
            searchTerm: '',
            sortBy: 'anio',
            sortOrder: 'desc',
            yearFilter: '',
            minBudget: '',
            maxBudget: ''
          };
        });
        setColumnFilters(initialFilters);

        // Obtener proyectos para cada POA
        const poasWithProjectsData: POAWithProject[] = [];
        
        for (const poa of poasResponse) {
          try {
            // Obtener todos los proyectos y filtrar por el ID del POA
            const proyectos = await projectAPI.getProyectos();
            const proyecto = proyectos.find(p => p.id_proyecto === poa.id_proyecto);
            
            poasWithProjectsData.push({
              ...poa,
              proyecto: proyecto
            });
          } catch (projectError) {
            console.warn(`No se pudo obtener el proyecto para POA ${poa.codigo_poa}:`, projectError);
            poasWithProjectsData.push(poa);
          }
        }

        setPOAsWithProjects(poasWithProjectsData);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Función para actualizar filtros de una columna específica
  const updateColumnFilter = (estadoId: string, filterKey: keyof FilterState, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [estadoId]: {
        ...prev[estadoId],
        [filterKey]: value
      }
    }));
  };

  // Función para alternar visibilidad de filtros
  const toggleFilters = (estadoId: string) => {
    setShowFilters(prev => ({
      ...prev,
      [estadoId]: !prev[estadoId]
    }));
  };

  // Función para limpiar filtros de una columna
  const clearFilters = (estadoId: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [estadoId]: {
        searchTerm: '',
        sortBy: 'anio',
        sortOrder: 'desc',
        yearFilter: '',
        minBudget: '',
        maxBudget: ''
      }
    }));
  };

  // Filtrar y ordenar POAs por estado con memoización
  const getFilteredPOAsByEstado = useMemo(() => {
    return (idEstado: string): POAWithProject[] => {
      const filters = columnFilters[idEstado];
      if (!filters) return [];

      let filteredPOAs = poasWithProjects.filter(poa => poa.id_estado_poa === idEstado);

      // Aplicar búsqueda por texto
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredPOAs = filteredPOAs.filter(poa => 
          poa.proyecto?.titulo?.toLowerCase().includes(searchLower) ||
          poa.codigo_poa.toLowerCase().includes(searchLower)
        );
      }

      // Aplicar filtro por año
      if (filters.yearFilter) {
        filteredPOAs = filteredPOAs.filter(poa => 
          poa.anio_ejecucion.toString() === filters.yearFilter
        );
      }

      // Aplicar filtro por presupuesto mínimo
      if (filters.minBudget) {
        const minBudget = parseFloat(filters.minBudget);
        filteredPOAs = filteredPOAs.filter(poa => 
          (poa.presupuesto_asignado || 0) >= minBudget
        );
      }

      // Aplicar filtro por presupuesto máximo
      if (filters.maxBudget) {
        const maxBudget = parseFloat(filters.maxBudget);
        filteredPOAs = filteredPOAs.filter(poa => 
          (poa.presupuesto_asignado || 0) <= maxBudget
        );
      }

      // Aplicar ordenamiento
      filteredPOAs.sort((a, b) => {
        let comparison = 0;
        
        switch (filters.sortBy) {
          case 'anio':
            comparison = Number(a.anio_ejecucion) - Number(b.anio_ejecucion);
            break;
          case 'presupuesto':
            comparison = (a.presupuesto_asignado || 0) - (b.presupuesto_asignado || 0);
            break;
          case 'titulo':
            comparison = (a.proyecto?.titulo || '').localeCompare(b.proyecto?.titulo || '');
            break;
          case 'codigo':
            comparison = a.codigo_poa.localeCompare(b.codigo_poa);
            break;
        }

        return filters.sortOrder === 'asc' ? comparison : -comparison;
      });

      return filteredPOAs;
    };
  }, [poasWithProjects, columnFilters]);

  // Manejar navegación a agregar actividad
  const handleAddActivities = (poaId: string) => {
    navigate('/agregar-actividad', { state: { poaId } });
  };

  // Obtener años únicos para el filtro
  const getUniqueYears = useMemo(() => {
    const years = [...new Set(poasWithProjects.map(poa => Number(poa.anio_ejecucion)))];
    return years.sort((a, b) => b - a);
  }, [poasWithProjects]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Error</h4>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header mb-4">
        <h1 className="dashboard-title">SGP -Gestión de Planes Operativos Anuales</h1>
      </div>

      <div className="kanban-board">
        <div className="row g-3">
          {estadosPOA.map((estado, index) => {
            const poasEnEstado = getFilteredPOAsByEstado(estado.id_estado_poa);
            const filters = columnFilters[estado.id_estado_poa] || {
              searchTerm: '',
              sortBy: 'anio' as const,
              sortOrder: 'desc' as const,
              yearFilter: '',
              minBudget: '',
              maxBudget: ''
            };
            
            return (
              <div 
                key={estado.id_estado_poa} 
                className={`col-xl-4 col-lg-6 col-md-6 col-sm-12 ${index >= 3 ? 'col-xl-6' : ''}`}
              >
                <div className="kanban-column">
                  <div className="kanban-column-header">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5 className="column-title mb-0">{estado.nombre}</h5>
                      <span className="badge bg-secondary column-count">
                        {poasEnEstado.length}
                      </span>
                    </div>
                    
                    {/* Barra de búsqueda */}
                    <div className="search-container mb-2">
                      <div className="input-group input-group-sm">
                        <span className="input-group-text">
                          <i className="bi bi-search"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Buscar por proyecto o código..."
                          value={filters.searchTerm}
                          onChange={(e) => updateColumnFilter(estado.id_estado_poa, 'searchTerm', e.target.value)}
                        />
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => toggleFilters(estado.id_estado_poa)}
                          title="Filtros avanzados"
                        >
                          <i className={`bi bi-funnel${showFilters[estado.id_estado_poa] ? '-fill' : ''}`}></i>
                        </button>
                      </div>
                    </div>

                    {/* Filtros avanzados colapsables */}
                    {showFilters[estado.id_estado_poa] && (
                      <div className="advanced-filters mb-2 p-2 bg-light rounded">
                        {/* Ordenamiento */}
                        <div className="row g-2 mb-2">
                          <div className="col-6">
                            <select
                              className="form-select form-select-sm"
                              value={filters.sortBy}
                              onChange={(e) => updateColumnFilter(estado.id_estado_poa, 'sortBy', e.target.value)}
                            >
                              <option value="anio">Ordenar por Año</option>
                              <option value="presupuesto">Ordenar por Presupuesto</option>
                              <option value="titulo">Ordenar por Título</option>
                              <option value="codigo">Ordenar por Código</option>
                            </select>
                          </div>
                          <div className="col-6">
                            <select
                              className="form-select form-select-sm"
                              value={filters.sortOrder}
                              onChange={(e) => updateColumnFilter(estado.id_estado_poa, 'sortOrder', e.target.value)}
                            >
                              <option value="asc">Ascendente</option>
                              <option value="desc">Descendente</option>
                            </select>
                          </div>
                        </div>

                        {/* Filtro por año */}
                        <div className="mb-2">
                          <select
                            className="form-select form-select-sm"
                            value={filters.yearFilter}
                            onChange={(e) => updateColumnFilter(estado.id_estado_poa, 'yearFilter', e.target.value)}
                          >
                            <option value="">Todos los años</option>
                            {getUniqueYears.map(year => (
                              <option key={year} value={year.toString()}>{year}</option>
                            ))}
                          </select>
                        </div>

                        {/* Filtros de presupuesto */}
                        <div className="row g-2 mb-2">
                          <div className="col-6">
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              placeholder="Presup. mín."
                              value={filters.minBudget}
                              onChange={(e) => updateColumnFilter(estado.id_estado_poa, 'minBudget', e.target.value)}
                            />
                          </div>
                          <div className="col-6">
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              placeholder="Presup. máx."
                              value={filters.maxBudget}
                              onChange={(e) => updateColumnFilter(estado.id_estado_poa, 'maxBudget', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Botón limpiar filtros */}
                        <button
                          className="btn btn-sm btn-outline-secondary w-100"
                          onClick={() => clearFilters(estado.id_estado_poa)}
                        >
                          <i className="bi bi-x-circle me-1"></i>
                          Limpiar Filtros
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="kanban-column-body">
                    {poasEnEstado.length === 0 ? (
                      <div className="empty-column">
                        <p className="text-muted mb-0">
                          {filters.searchTerm || filters.yearFilter || filters.minBudget || filters.maxBudget
                            ? 'No hay POAs que coincidan con los filtros'
                            : 'No hay POAs en este estado'
                          }
                        </p>
                      </div>
                    ) : (
                      poasEnEstado.map((poa) => (
                        <div key={poa.id_poa} className="kanban-card">
                          <div className="card-header">
                            <h6 className="card-title">
                              {poa.proyecto?.titulo || 'Proyecto no encontrado'}
                            </h6>
                            <small className="text-muted">
                              Código: {poa.codigo_poa}
                            </small>
                          </div>
                          
                          <div className="card-body">
                            <div className="card-info">
                              <div className="info-item">
                                <strong>Año de Ejecución:</strong>
                                <span>{poa.anio_ejecucion}</span>
                              </div>
                              <div className="info-item">
                                <strong>Presupuesto:</strong>
                                <span className="text-success">
                                  ${poa.presupuesto_asignado?.toLocaleString() || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="card-footer">
                            <button
                              className="btn btn-primary btn-sm w-100"
                              onClick={() => handleAddActivities(poa.id_poa)}
                            >
                              <i className="bi bi-plus-circle me-1"></i>
                              Añadir Actividades
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {estadosPOA.length === 0 && (
        <div className="text-center mt-5">
          <div className="alert alert-warning">
            <h5>No hay estados POA configurados</h5>
            <p>Contacte al administrador para configurar los estados POA.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
import React, { useState, useEffect, useMemo } from 'react';
import { Table, Modal, Button, Form, InputGroup, Spinner, Alert, Badge } from 'react-bootstrap';
import { projectAPI } from '../api/projectAPI';
import { poaAPI } from '../api/poaAPI';
import { Proyecto, EstadoProyecto } from '../interfaces/project';
import { POA } from '../interfaces/poa';
import VerPOA from '../components/VerPOA';
import 'react-toastify/dist/ReactToastify.css';

// ¡IMPORTAR LAS FUNCIONES DE TOAST!
import { showError, showInfo } from '../utils/toast';

// Importar el archivo CSS para el modal de pantalla completa
import '../styles/FullscreenModal.css';

// Interfaces para este componente
interface ProyectoConPOAs extends Proyecto {
  poas?: POA[];
  estadoProyecto?: EstadoProyecto;
}

interface FilterState {
  searchTerm: string;
  sortBy: 'codigo' | 'titulo' | 'estado' | 'presupuesto' | 'anio';
  sortOrder: 'asc' | 'desc';
  estadoFilter: string;
  minBudget: string;
  maxBudget: string;
  yearFilter: string;
}

const VerProyectos: React.FC = () => {
  const [proyectos, setProyectos] = useState<ProyectoConPOAs[]>([]);
  const [estadosProyecto, setEstadosProyecto] = useState<EstadoProyecto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    sortBy: 'codigo',
    sortOrder: 'asc',
    estadoFilter: '',
    minBudget: '',
    maxBudget: '',
    yearFilter: ''
  });
  
  // Estados para modal
  const [showModal, setShowModal] = useState(false);
  const [selectedPOA, setSelectedPOA] = useState<POA | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Obtener proyectos y estados en paralelo
        const [proyectosResponse, estadosResponse] = await Promise.all([
          projectAPI.getProyectos(),
          projectAPI.getEstadosProyecto()
        ]);

        // Crear estados proyecto con descripción vacía para evitar errores de tipo
        const estadosConDescripcion: EstadoProyecto[] = estadosResponse.map(estado => ({
          ...estado,
          descripcion: '' // Agregar descripción vacía
        }));

        setEstadosProyecto(estadosConDescripcion);

        // Obtener POAs para cada proyecto
        const proyectosConPOAs: ProyectoConPOAs[] = [];
        
        for (const proyecto of proyectosResponse) {
          try {
            const poas = await poaAPI.getPOAsByProyecto(proyecto.id_proyecto);
            const estadoProyecto = estadosConDescripcion.find(e => e.id_estado_proyecto === proyecto.id_estado_proyecto);
            
            proyectosConPOAs.push({
              ...proyecto,
              poas: poas,
              estadoProyecto: estadoProyecto
            });
            showInfo('POAs del Poryecto obtenidos exitosamente');
          } catch (projectError) {
            console.warn(`No se pudieron obtener POAs para proyecto ${proyecto.codigo_proyecto}:`, projectError);
            showError('No se pudieron obtener POAs para proyecto');
            const estadoProyecto = estadosConDescripcion.find(e => e.id_estado_proyecto === proyecto.id_estado_proyecto);
            proyectosConPOAs.push({
              ...proyecto,
              poas: [],
              estadoProyecto: estadoProyecto
            });
          }
        }

        setProyectos(proyectosConPOAs);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos de proyectos');
        showError(err instanceof Error ? err.message : 'Error al cargar los datos de proyectos');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Función para actualizar filtros
  const updateFilter = (filterKey: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      sortBy: 'codigo',
      sortOrder: 'asc',
      estadoFilter: '',
      minBudget: '',
      maxBudget: '',
      yearFilter: ''
    });
  };

  // Filtrar y ordenar proyectos con memoización
  const filteredProyectos = useMemo(() => {
    let filteredProyectos = [...proyectos];

    // Aplicar búsqueda por texto
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredProyectos = filteredProyectos.filter(proyecto => 
        proyecto.titulo.toLowerCase().includes(searchLower) ||
        proyecto.codigo_proyecto.toLowerCase().includes(searchLower)
      );
    }

    // Aplicar filtro por estado
    if (filters.estadoFilter) {
      filteredProyectos = filteredProyectos.filter(proyecto => 
        proyecto.id_estado_proyecto === filters.estadoFilter
      );
    }

    // Aplicar filtro por presupuesto mínimo
    if (filters.minBudget) {
      const minBudget = parseFloat(filters.minBudget);
      filteredProyectos = filteredProyectos.filter(proyecto => 
        (proyecto.presupuesto_aprobado || 0) >= minBudget
      );
    }

    // Aplicar filtro por presupuesto máximo
    if (filters.maxBudget) {
      const maxBudget = parseFloat(filters.maxBudget);
      filteredProyectos = filteredProyectos.filter(proyecto => 
        (proyecto.presupuesto_aprobado || 0) <= maxBudget
      );
    }

    // Aplicar filtro por año (basado en años de los POAs)
    if (filters.yearFilter) {
      filteredProyectos = filteredProyectos.filter(proyecto => 
        proyecto.poas?.some(poa => poa.anio_ejecucion === filters.yearFilter)
      );
    }

    // Aplicar ordenamiento
    filteredProyectos.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'codigo':
          comparison = a.codigo_proyecto.localeCompare(b.codigo_proyecto);
          break;
        case 'titulo':
          comparison = a.titulo.localeCompare(b.titulo);
          break;
        case 'estado':
          comparison = (a.estadoProyecto?.nombre || '').localeCompare(b.estadoProyecto?.nombre || '');
          break;
        case 'presupuesto':
          comparison = (a.presupuesto_aprobado || 0) - (b.presupuesto_aprobado || 0);
          break;
        case 'anio':
          const aYear = Math.max(...(a.poas?.map(poa => parseInt(poa.anio_ejecucion)) || [0]));
          const bYear = Math.max(...(b.poas?.map(poa => parseInt(poa.anio_ejecucion)) || [0]));
          comparison = aYear - bYear;
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filteredProyectos;
  }, [proyectos, filters]);

  // Obtener años únicos para el filtro
  const getUniqueYears = useMemo(() => {
    const years = new Set<string>();
    proyectos.forEach(proyecto => {
      proyecto.poas?.forEach(poa => {
        years.add(poa.anio_ejecucion);
      });
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [proyectos]);

  // Función para abrir modal con POA seleccionado
  const openPOAModal = (poa: POA) => {
    setSelectedPOA(poa);
    setShowModal(true);
    showInfo('Abriendo detalles del POA');
  };

  // Función para cerrar modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedPOA(null);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error</Alert.Heading>
        <p>{error}</p>
      </Alert>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Gestión de Proyectos</h1>
        <Badge bg="info" className="fs-6">
          {filteredProyectos.length} proyecto{filteredProyectos.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            {/* Búsqueda */}
            <div className="col-md-4">
              <Form.Label>Buscar</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar por proyecto o código..."
                  value={filters.searchTerm}
                  onChange={(e) => updateFilter('searchTerm', e.target.value)}
                />
              </InputGroup>
            </div>

            {/* Filtro por estado */}
            <div className="col-md-2">
              <Form.Label>Estado</Form.Label>
              <Form.Select
                value={filters.estadoFilter}
                onChange={(e) => updateFilter('estadoFilter', e.target.value)}
              >
                <option value="">Todos los estados</option>
                {estadosProyecto.map(estado => (
                  <option key={estado.id_estado_proyecto} value={estado.id_estado_proyecto}>
                    {estado.nombre}
                  </option>
                ))}
              </Form.Select>
            </div>

            {/* Filtro por año */}
            <div className="col-md-2">
              <Form.Label>Año</Form.Label>
              <Form.Select
                value={filters.yearFilter}
                onChange={(e) => updateFilter('yearFilter', e.target.value)}
              >
                <option value="">Todos los años</option>
                {getUniqueYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </Form.Select>
            </div>

            {/* Ordenamiento */}
            <div className="col-md-2">
              <Form.Label>Ordenar por</Form.Label>
              <Form.Select
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
              >
                <option value="codigo">Código</option>
                <option value="titulo">Título</option>
                <option value="estado">Estado</option>
                <option value="presupuesto">Presupuesto</option>
                <option value="anio">Año</option>
              </Form.Select>
            </div>

            {/* Orden */}
            <div className="col-md-1">
              <Form.Label>Orden</Form.Label>
              <Form.Select
                value={filters.sortOrder}
                onChange={(e) => updateFilter('sortOrder', e.target.value)}
              >
                <option value="asc">↑</option>
                <option value="desc">↓</option>
              </Form.Select>
            </div>

            {/* Botón limpiar */}
            <div className="col-md-1 d-flex align-items-end">
              <Button variant="outline-secondary" onClick={clearFilters} className="w-100">
                <i className="bi bi-x-circle"></i>
              </Button>
            </div>
          </div>

          {/* Filtros de presupuesto */}
          <div className="row g-3 mt-2">
            <div className="col-md-3">
              <Form.Label>Presupuesto mínimo</Form.Label>
              <Form.Control
                type="number"
                placeholder="0"
                value={filters.minBudget}
                onChange={(e) => updateFilter('minBudget', e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <Form.Label>Presupuesto máximo</Form.Label>
              <Form.Control
                type="number"
                placeholder="Sin límite"
                value={filters.maxBudget}
                onChange={(e) => updateFilter('maxBudget', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="card-body p-0">
          <Table responsive hover className="mb-0">
            <thead className="table-dark">
              <tr>
                <th>Proyecto</th>
                <th>Código del Proyecto</th>
                <th>Estado del Proyecto</th>
                <th>POA's Asignados</th>
                <th>Año de Ejecución</th>
                <th>Presupuesto Aprobado</th>
              </tr>
            </thead>
            <tbody>
              {filteredProyectos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    <div className="text-muted">
                      {filters.searchTerm || filters.estadoFilter || filters.yearFilter || filters.minBudget || filters.maxBudget
                        ? 'No hay proyectos que coincidan con los filtros aplicados'
                        : 'No hay proyectos disponibles'
                      }
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProyectos.map((proyecto) => {
                  const yearsRange = proyecto.poas && proyecto.poas.length > 0 
                    ? Array.from(new Set(proyecto.poas.map(poa => poa.anio_ejecucion))).sort().join(', ')
                    : 'N/A';

                  return (
                    <tr key={proyecto.id_proyecto}>
                      <td>
                        <div className="fw-semibold">{proyecto.titulo}</div>
                      </td>
                      <td>
                        <code className="bg-light px-2 py-1 rounded">{proyecto.codigo_proyecto}</code>
                      </td>
                      <td>
                        <Badge 
                          bg={proyecto.estadoProyecto?.nombre === 'Activo' ? 'success' : 
                              proyecto.estadoProyecto?.nombre === 'Inactivo' ? 'danger' : 'secondary'}
                        >
                          {proyecto.estadoProyecto?.nombre || 'Sin estado'}
                        </Badge>
                      </td>
                      <td>
                        {proyecto.poas && proyecto.poas.length > 0 ? (
                          <div className="d-flex flex-wrap gap-1">
                            {proyecto.poas.map((poa) => (
                              <Button
                                key={poa.id_poa}
                                variant="outline-primary"
                                size="sm"
                                onClick={() => openPOAModal(poa)}
                                className="text-decoration-none"
                              >
                                {poa.codigo_poa}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted">Sin POAs asignados</span>
                        )}
                      </td>
                      <td>{yearsRange}</td>
                      <td>
                        <span className="fw-semibold text-success">
                          ${proyecto.presupuesto_aprobado?.toLocaleString() || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>
      </div>

      {/* Modal para mostrar detalles del POA - ACTUALIZADO */}
      <Modal 
        show={showModal} 
        onHide={closeModal} 
        dialogClassName="modal-90w"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Detalles del POA</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPOA && <VerPOA poa={selectedPOA} onClose={closeModal} />}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default VerProyectos;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { poaAPI } from '../api/poaAPI';
import { projectAPI } from '../api/projectAPI';
import { POA, EstadoPOA } from '../interfaces/poa';
import { Proyecto } from '../interfaces/project';
import '../styles/Dashboard.css';

interface POAWithProject extends POA {
  proyecto?: Proyecto;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [estadosPOA, setEstadosPOA] = useState<EstadoPOA[]>([]);
  const [poasWithProjects, setPOAsWithProjects] = useState<POAWithProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  // Filtrar POAs por estado
  const getPOAsByEstado = (idEstado: string): POAWithProject[] => {
    return poasWithProjects.filter(poa => poa.id_estado_poa === idEstado);
  };

  // Manejar navegación a agregar actividad
  const handleAddActivities = (poaId: string) => {
    navigate('/agregar-actividad', { state: { poaId } });
  };

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
        <h1 className="dashboard-title">Gestión de Planes Operativos Anuales</h1>
      </div>

      <div className="kanban-board">
        <div className="row g-3">
          {estadosPOA.map((estado, index) => {
            const poasEnEstado = getPOAsByEstado(estado.id_estado_poa);
            
            return (
              <div 
                key={estado.id_estado_poa} 
                className={`col-xl-4 col-lg-6 col-md-6 col-sm-12 ${index >= 3 ? 'col-xl-6' : ''}`}
              >
                <div className="kanban-column">
                  <div className="kanban-column-header">
                    <h5 className="column-title">{estado.nombre}</h5>
                    <span className="badge bg-secondary column-count">
                      {poasEnEstado.length}
                    </span>
                  </div>
                  
                  <div className="kanban-column-body">
                    {poasEnEstado.length === 0 ? (
                      <div className="empty-column">
                        <p className="text-muted mb-0">No hay POAs en este estado</p>
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
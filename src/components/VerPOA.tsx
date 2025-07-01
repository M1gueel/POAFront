import React, { useState, useEffect } from 'react';
import { Button, Alert, Table, Spinner, Badge } from 'react-bootstrap';
import { POA } from '../interfaces/poa';
import { Actividad } from '../interfaces/actividad';
import { Tarea, ProgramacionMensualOut } from '../interfaces/tarea';
import { actividadAPI } from '../api/actividadAPI';
import { tareaAPI } from '../api/tareaAPI';

interface VerPOAProps {
  poa: POA;
  onClose: () => void;
}

interface ActividadConTareas extends Actividad {
  tareas: Tarea[];
}

interface TareaConProgramacion extends Tarea {
  gastos_mensuales: number[];
}

interface ActividadConTareasYProgramacion extends Actividad {
  tareas: TareaConProgramacion[];
}

const VerPOA: React.FC<VerPOAProps> = ({ poa, onClose }) => {
  const [actividades, setActividades] = useState<ActividadConTareasYProgramacion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Nombres de los meses para las columnas
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  useEffect(() => {
    const cargarDatosPOA = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Obtener actividades del POA
        const actividadesData = await actividadAPI.getActividadesPorPOA(poa.id_poa);
        
        // 2. Para cada actividad, obtener sus tareas
        const actividadesConTareas: ActividadConTareasYProgramacion[] = [];
        
        for (const actividad of actividadesData) {
          try {
            // Obtener tareas de la actividad
            const tareasData = await tareaAPI.getTareasPorActividad(actividad.id_actividad);
            
            // 3. Para cada tarea, obtener su programación mensual
            const tareasConProgramacion: TareaConProgramacion[] = [];
            
            for (const tarea of tareasData) {
              try {
                // Obtener programación mensual de la tarea
                const programacionData = await tareaAPI.getProgramacionMensualPorTarea(tarea.id_tarea);
                
                // Crear array de 12 meses inicializado en 0
                const gastosMensuales = Array(12).fill(0);
                
                // Llenar el array con los datos de programación
                programacionData.forEach((programacion: ProgramacionMensualOut) => {
                  // El mes viene en formato "MM-YYYY", extraemos el mes
                  const mesNum = parseInt(programacion.mes.split('-')[0]) - 1; // -1 porque el array es 0-indexed
                  if (mesNum >= 0 && mesNum < 12) {
                    gastosMensuales[mesNum] = programacion.valor;
                  }
                });
                
                tareasConProgramacion.push({
                  ...tarea,
                  gastos_mensuales: gastosMensuales
                });
                
              } catch (tareaError) {
                console.warn(`No se pudo obtener programación para tarea ${tarea.id_tarea}:`, tareaError);
                // Si no hay programación, usar array de ceros
                tareasConProgramacion.push({
                  ...tarea,
                  gastos_mensuales: Array(12).fill(0)
                });
              }
            }
            
            actividadesConTareas.push({
              ...actividad,
              tareas: tareasConProgramacion
            });
            
          } catch (actividadError) {
            console.warn(`No se pudieron obtener tareas para actividad ${actividad.id_actividad}:`, actividadError);
            // Si no hay tareas, crear actividad con array vacío
            actividadesConTareas.push({
              ...actividad,
              tareas: []
            });
          }
        }
        
        setActividades(actividadesConTareas);
        
      } catch (err) {
        console.error('Error al cargar datos del POA:', err);
        setError('Error al cargar los datos del POA');
      } finally {
        setLoading(false);
      }
    };

    cargarDatosPOA();
  }, [poa.id_poa]);

  // Calcular totales
  const calcularTotalGeneral = () => {
    return actividades.reduce((total, actividad) => {
      const totalActividad = actividad.tareas.reduce((sum, tarea) => sum + (tarea.total || 0), 0);
      return total + totalActividad;
    }, 0);
  };

  const calcularTotalMes = (mesIndex: number) => {
    return actividades.reduce((total, actividad) => {
      const totalMesActividad = actividad.tareas.reduce((sum, tarea) => {
        return sum + (tarea.gastos_mensuales[mesIndex] || 0);
      }, 0);
      return total + totalMesActividad;
    }, 0);
  };

  const calcularTotalProgramacion = () => {
    return meses.reduce((total, _, index) => total + calcularTotalMes(index), 0);
  };

  // Calcular total por actividad
  const calcularTotalActividad = (actividad: ActividadConTareasYProgramacion) => {
    return actividad.tareas.reduce((sum, tarea) => sum + (tarea.total || 0), 0);
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary">
          <span className="visually-hidden">Cargando datos del POA...</span>
        </Spinner>
        <div className="mt-2">Cargando datos del POA...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5>Detalles del POA: {poa.codigo_poa}</h5>
          <Button variant="outline-secondary" size="sm" onClick={onClose}>
            <i className="bi bi-x"></i>
          </Button>
        </div>
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Detalles del POA: {poa.codigo_poa}</h5>
        <Button variant="outline-secondary" size="sm" onClick={onClose}>
          <i className="bi bi-x"></i>
        </Button>
      </div>
      
      {/* Información general del POA */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <strong>Código POA:</strong>
          <p>{poa.codigo_poa}</p>
        </div>
        <div className="col-md-3">
          <strong>Año de Ejecución:</strong>
          <p>{poa.anio_ejecucion}</p>
        </div>
        <div className="col-md-3">
          <strong>Presupuesto Asignado:</strong>
          <p className="text-success">${poa.presupuesto_asignado?.toLocaleString() || 'N/A'}</p>
        </div>
        <div className="col-md-3">
          <strong>Fecha de Creación:</strong>
          <p>{new Date(poa.fecha_creacion).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Resumen */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card bg-light">
            <div className="card-body text-center">
              <h6 className="card-title">Total Actividades</h6>
              <h4 className="text-primary">{actividades.length}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-light">
            <div className="card-body text-center">
              <h6 className="card-title">Total Tareas</h6>
              <h4 className="text-info">
                {actividades.reduce((total, act) => total + act.tareas.length, 0)}
              </h4>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-light">
            <div className="card-body text-center">
              <h6 className="card-title">Presupuesto Total</h6>
              <h4 className="text-success">${calcularTotalGeneral().toLocaleString()}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de actividades y tareas */}
      {actividades.length > 0 ? (
        <div className="table-responsive">
          <Table bordered hover size="sm" style={{ fontSize: '0.8rem' }}>
            <thead className="table-dark">
              <tr>
                <th rowSpan={2} style={{ verticalAlign: 'middle', minWidth: '200px' }}>
                  Actividades donde se involucre personal para el desarrollo del proyecto
                </th>
                <th rowSpan={2} style={{ verticalAlign: 'middle', minWidth: '200px' }}>
                  DESCRIPCIÓN DETALLE
                </th>
                <th rowSpan={2} style={{ verticalAlign: 'middle', minWidth: '100px' }}>
                  ÍTEM PRESUPUESTARIO
                </th>
                <th rowSpan={2} style={{ verticalAlign: 'middle', minWidth: '80px' }}>
                  CANTIDAD
                </th>
                <th rowSpan={2} style={{ verticalAlign: 'middle', minWidth: '100px' }}>
                  PRECIO UNITARIO
                </th>
                <th rowSpan={2} style={{ verticalAlign: 'middle', minWidth: '100px' }}>
                  TOTAL
                </th>
                <th rowSpan={2} style={{ verticalAlign: 'middle', minWidth: '100px', backgroundColor: '#D9D9D9' }}>
                  TOTAL POR ACTIVIDAD
                </th>
                <th colSpan={12} className="text-center" style={{ backgroundColor: '#DAEEF3' }}>
                  PROGRAMACIÓN DE EJECUCIÓN {poa.anio_ejecucion}
                </th>
                <th rowSpan={2} style={{ verticalAlign: 'middle', minWidth: '100px', backgroundColor: '#DAEEF3' }}>
                  SUMAN
                </th>
              </tr>
              <tr>
                {meses.map((mes) => (
                  <th key={mes} className="text-center" style={{ minWidth: '80px', backgroundColor: '#DAEEF3' }}>
                    {mes}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {actividades.map((actividad, actIndex) => (
                <React.Fragment key={actividad.id_actividad}>
                  {/* Fila de encabezado de actividad */}
                  <tr className="table-secondary">
                    <td className="fw-bold">
                      ({actIndex + 1}) {actividad.descripcion_actividad}
                    </td>
                    <td className="fw-bold">DESCRIPCIÓN O DETALLE</td>
                    <td className="fw-bold">ITEM PRESUPUESTARIO</td>
                    <td className="fw-bold">CANTIDAD</td>
                    <td className="fw-bold">PRECIO UNITARIO</td>
                    <td className="fw-bold">TOTAL</td>
                    <td className="fw-bold text-end" style={{ backgroundColor: '#D9D9D9' }}>
                      ${calcularTotalActividad(actividad).toLocaleString()}
                    </td>
                    {meses.map((mes) => (
                      <td key={mes} className="fw-bold text-center" style={{ backgroundColor: '#DAEEF3' }}>
                        {mes}
                      </td>
                    ))}
                    <td className="fw-bold text-center" style={{ backgroundColor: '#DAEEF3' }}>
                      SUMAN
                    </td>
                  </tr>

                  {/* Filas de tareas */}
                  {actividad.tareas.length > 0 ? (
                    actividad.tareas.map((tarea) => {
                      const totalProgramacion = tarea.gastos_mensuales.reduce((sum, val) => sum + (val || 0), 0);
                      
                      return (
                        <tr key={tarea.id_tarea}>
                          <td>{tarea.nombre}</td>
                          <td>{tarea.detalle_descripcion || tarea.nombre}</td>
                          <td>
                            <code className="bg-light px-1 rounded">
                              {tarea.detalle_tarea?.codigo_item || tarea.detalle_tarea?.item_presupuestario?.codigo || 'N/A'}
                            </code>
                          </td>
                          <td className="text-end">{tarea.cantidad}</td>
                          <td className="text-end">${tarea.precio_unitario?.toLocaleString() || '0'}</td>
                          <td className="text-end text-success">
                            <strong>${tarea.total?.toLocaleString() || '0'}</strong>
                          </td>
                          <td style={{ backgroundColor: '#f8f9fa' }}></td>
                          {tarea.gastos_mensuales.map((gasto, mesIndex) => (
                            <td key={mesIndex} className="text-end" style={{ backgroundColor: '#f0f8ff' }}>
                              {gasto > 0 ? `$${gasto.toLocaleString()}` : '0'}
                            </td>
                          ))}
                          <td className="text-end fw-bold" style={{ backgroundColor: '#f0f8ff' }}>
                            ${totalProgramacion.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={19} className="text-center text-muted">
                        Sin tareas asignadas
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              
              {/* Fila de totales */}
              <tr className="table-warning">
                <td colSpan={5} className="text-center fw-bold" style={{ backgroundColor: '#FCD5B4' }}>
                  TOTAL GENERAL POA
                </td>
                <td className="text-end fw-bold" style={{ backgroundColor: '#92D050' }}>
                  ${calcularTotalGeneral().toLocaleString()}
                </td>
                <td style={{ backgroundColor: '#D9D9D9' }}></td>
                {meses.map((_, mesIndex) => (
                  <td key={mesIndex} className="text-end fw-bold" style={{ backgroundColor: '#DAEEF3' }}>
                    ${calcularTotalMes(mesIndex).toLocaleString()}
                  </td>
                ))}
                <td className="text-end fw-bold" style={{ backgroundColor: '#92D050' }}>
                  ${calcularTotalProgramacion().toLocaleString()}
                </td>
              </tr>
            </tbody>
          </Table>
        </div>
      ) : (
        <Alert variant="info">
          <i className="bi bi-info-circle me-2"></i>
          Este POA no tiene actividades ni tareas asignadas.
        </Alert>
      )}

      {/* Información adicional */}
      {actividades.length > 0 && (
        <div className="mt-3">
          <small className="text-muted">
            <i className="bi bi-info-circle me-1"></i>
            La tabla muestra todas las actividades y tareas del POA con su programación mensual correspondiente al año {poa.anio_ejecucion}.
          </small>
        </div>
      )}
    </div>
  );
};

export default VerPOA;
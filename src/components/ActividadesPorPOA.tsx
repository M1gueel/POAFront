import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { POAConActividadesYTareas } from '../interfaces/actividad';
import { ActividadTareaService } from '../services/actividadTareaService';

interface ActividadesPorPOAProps {
  poa: POAConActividadesYTareas;
  onMostrarModalTarea: (poaId: string, actividadId: string, tarea?: any) => void;
  onEliminarTarea: (poaId: string, actividadId: string, tareaId: string) => void;
  onToggleTareaExpansion: (poaId: string, actividadId: string, tareaId: string) => void;
  calcularTotalActividad: (poaId: string, actividadId: string) => number;
  poasConActividades: POAConActividadesYTareas[];
}

const ActividadesPorPOA: React.FC<ActividadesPorPOAProps> = ({
  poa,
  onMostrarModalTarea,
  onEliminarTarea,
  onToggleTareaExpansion,
  calcularTotalActividad,
  poasConActividades
}) => {

  // Función auxiliar para formatear números de forma segura
  const formatCurrency = (value: any): string => {
    const numValue = typeof value === 'number' ? value : parseFloat(value?.toString() || '0');
    return isNaN(numValue) || numValue === 0 ? '' : `$${numValue.toFixed(2)}`;
  };

  return (
    <>
      {poa.actividades.map((actividad, indexActividad) => (
        <Card
          key={actividad.actividad_id}
          className="mb-4 border-primary"
          id={`actividad-${actividad.actividad_id}`}
        >
          <Card.Header className="bg-light d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <h6 className="mb-0 text-primary me-2">Actividad ({indexActividad + 1}):</h6>
              <span>{ActividadTareaService.getDescripcionActividad(poa.id_poa, actividad.codigo_actividad, poasConActividades)}</span>
            </div>
          </Card.Header>

          <Card.Body className="p-3 pt-2">
            <div className="mt-2">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6>Tareas asignadas</h6>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => onMostrarModalTarea(poa.id_poa, actividad.actividad_id)}
                >
                  <i className="bi bi-plus-circle me-1"></i> Agregar Tarea
                </Button>
              </div>
              {actividad.tareas.length === 0 ? (
                <p className="text-muted small">No hay tareas definidas para esta actividad.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm table-hover table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '30px' }}></th>
                        <th>#</th>
                        <th>Nombre</th>
                        <th>Código Ítem</th>
                        <th>Descripción</th>
                        <th className="text-center">Línea PAI VIIV</th>
                        <th className="text-center">Cantidad</th>
                        <th className="text-center">Precio Unit.</th>
                        <th className="text-center">Total</th>
                        <th className="text-center">Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {actividad.tareas.map((tarea, indexTarea) => (
                        <React.Fragment key={tarea.tempId}>
                          <tr>
                            <td className="text-center">
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 text-decoration-none"
                                onClick={() => onToggleTareaExpansion(poa.id_poa, actividad.actividad_id, tarea.tempId)}
                              >
                                <i className={`bi ${tarea.expanded ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
                              </Button>
                            </td>
                            <td>{indexTarea + 1}</td>
                            <td>{tarea.nombre}</td>
                            <td>{tarea.codigo_item || 'N/A'}</td>
                            <td>{tarea.detalle_descripcion}</td>
                            <td className="text-center">{tarea.lineaPaiViiv}</td>
                            <td className="text-center">{tarea.cantidad === 0 ? '' : tarea.cantidad}</td>
                            <td className="text-center">{formatCurrency(tarea.precio_unitario)}</td>
                            <td className="text-center">{formatCurrency(tarea.total)}</td>
                            <td className="d-flex align-items-center justify-content-center">
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                className="me-1 p-0 d-flex align-items-center justify-content-center"
                                style={{ width: '45px', height: '45px' }}
                                onClick={() => onMostrarModalTarea(poa.id_poa, actividad.actividad_id, tarea)}
                              >
                                <i className="bi bi-pencil" style={{ margin: 0 }}></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="me-1 p-0 d-flex align-items-center justify-content-center"
                                style={{ width: '45px', height: '45px' }}
                                onClick={() => onEliminarTarea(poa.id_poa, actividad.actividad_id, tarea.tempId)}
                              >
                                <i className="bi bi-trash" style={{ margin: 0 }}></i>
                              </Button>
                            </td>
                          </tr>

                          {/* Parte expandible de la tabla */}
                          {tarea.expanded && (
                            <tr className="bg-light">
                              <td></td>
                              <td colSpan={8}>
                                <div className="p-3">
                                  <h6 className="mb-3">
                                    <i className="bi bi-calendar-month me-2"></i>
                                    Distribución Mensual de Gastos
                                  </h6>
                                  <div className="row g-2">
                                    {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((mes, idx) => (
                                      <div key={mes} className="col-xl-1 col-lg-2 col-md-3 col-sm-4 col-6">
                                        <div className="text-center border rounded p-2">
                                          <small className="d-block text-muted fw-bold">{mes}</small>
                                          <div className="mt-1">
                                            <span className={`badge ${(tarea.gastos_mensuales?.[idx] || 0) > 0 ? 'bg-success' : 'bg-secondary'}`}>
                                              ${tarea.gastos_mensuales?.[idx]?.toFixed(0) || '0'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-3 text-end">
                                    {(() => {
                                      const totalPlanificado = tarea.gastos_mensuales?.reduce((sum, val) => sum + (val || 0), 0) || 0;
                                      const totalTarea = tarea.total || 0;
                                      const excedeLimite = totalPlanificado > totalTarea;

                                      return (
                                        <div>
                                          <p className="mb-1">
                                            <strong style={{ color: 'black' }}>
                                              Total planificado: ${totalPlanificado.toFixed(2)}
                                            </strong>
                                          </p>
                                          {excedeLimite && (
                                            <small className="text-danger">
                                              ⚠️ El total planificado no puede exceder ${totalTarea.toFixed(2)}
                                            </small>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                    <tfoot className="table-light">
                      <tr>
                        <th colSpan={6} className="text-end">Total Actividad:</th>
                        <th className="text-end">${calcularTotalActividad(poa.id_poa, actividad.actividad_id).toFixed(2)}</th>
                        <th></th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      ))}
    </>
  );
};

export default ActividadesPorPOA;

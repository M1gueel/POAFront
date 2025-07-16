import React from 'react';
import { Alert } from 'react-bootstrap';
import { POAConActividadesYTareas } from '../interfaces/actividad';
import { ActividadTareaService } from '../services/actividadTareaService';

interface SidebarPresupuestoProps {
  poasConActividades: POAConActividadesYTareas[];
  activePoaTab: string;
  calcularTotalActividad: (poaId: string, actividadId: string) => number;
  showActividades: boolean;
  setShowActividades: (show: boolean) => void;
}

const SidebarPresupuesto: React.FC<SidebarPresupuestoProps> = ({
  poasConActividades,
  activePoaTab,
  calcularTotalActividad,
  showActividades,
  setShowActividades
}) => {
  const poaActivo = poasConActividades.find(poa => poa.id_poa === activePoaTab);

  if (!poaActivo) return null;

  const totalPlanificado = poaActivo.actividades.reduce((total, actividad) =>
    total + calcularTotalActividad(poaActivo.id_poa, actividad.actividad_id), 0
  );

  const presupuestoAsignado = poaActivo.presupuesto_asignado;
  const saldoDisponible = presupuestoAsignado - totalPlanificado;
  const porcentajeUsado = (totalPlanificado / presupuestoAsignado) * 100;

  return (
    <div className="budget-sidebar p-2">
      {/* Header compacto */}
      <div className="d-flex align-items-center mb-2">
        <i className="bi bi-calculator text-primary me-2"></i>
        <h6 className="mb-0 text-primary fw-bold fs-7">{poaActivo.codigo_poa}</h6>
      </div>

      {/* Información presupuestaria compacta */}
      <div className="bg-light rounded p-2 mb-2">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <small className="text-muted" style={{ fontSize: '0.7rem' }}>Asignado:</small>
          <span className="fw-bold text-success" style={{ fontSize: '0.75rem' }}>
            ${presupuestoAsignado.toLocaleString('es-CO')}
          </span>
        </div>
        <div className="d-flex justify-content-between align-items-center mb-1">
          <small className="text-muted" style={{ fontSize: '0.7rem' }}>Planificado:</small>
          <span className="fw-bold text-primary" style={{ fontSize: '0.75rem' }}>
            ${totalPlanificado.toLocaleString('es-CO')}
          </span>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted" style={{ fontSize: '0.7rem' }}>Disponible:</small>
          <span className={`fw-bold ${saldoDisponible >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.75rem' }}>
            ${saldoDisponible.toLocaleString('es-CO')}
          </span>
        </div>
      </div>

      {/* Barra de progreso compacta */}
      <div className="mb-2">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <small className="text-muted" style={{ fontSize: '0.7rem' }}>Uso:</small>
          <small className={`fw-bold ${porcentajeUsado > 100 ? 'text-danger' : 'text-primary'}`} style={{ fontSize: '0.7rem' }}>
            {porcentajeUsado.toFixed(1)}%
          </small>
        </div>
        <div className="progress" style={{ height: '6px' }}>
          <div
            className={`progress-bar ${porcentajeUsado > 100 ? 'bg-danger' : 'bg-success'}`}
            role="progressbar"
            style={{ width: `${Math.min(porcentajeUsado, 100)}%` }}
            aria-valuenow={porcentajeUsado}
            aria-valuemin={0}
            aria-valuemax={100}
          >
          </div>
        </div>
        {porcentajeUsado > 100 && (
          <small className="text-danger" style={{ fontSize: '0.65rem' }}>
            <i className="bi bi-exclamation-triangle me-1"></i>
            Presupuesto excedido
          </small>
        )}
      </div>

      {/* Botón desplegable para actividades */}
      <div className="mb-2">
        <button
          className="btn btn-outline-primary btn-sm w-100 d-flex align-items-center justify-content-between"
          onClick={() => setShowActividades(!showActividades)}
          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
        >
          <span>
            <i className="bi bi-list-task me-1"></i>
            Actividades ({poaActivo.actividades.length})
          </span>
          <i className={`bi bi-chevron-${showActividades ? 'up' : 'down'}`}></i>
        </button>

        {/* Desglose por actividades (desplegable) */}
        {showActividades && (
          <div className="mt-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {poaActivo.actividades.map((actividad, index) => {
              const totalActividad = calcularTotalActividad(poaActivo.id_poa, actividad.actividad_id);
              const descripcionActividad = ActividadTareaService.getDescripcionActividad(poaActivo.id_poa, actividad.codigo_actividad, poasConActividades);

              return (
                <div key={actividad.actividad_id} className="border-bottom pb-1 mb-1">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1 me-2">
                      <small className="text-muted d-block" style={{ fontSize: '0.65rem' }}>
                        Act. {index + 1}
                      </small>
                      <small className="text-dark" style={{ fontSize: '0.65rem' }}>
                        {descripcionActividad ?
                          (descripcionActividad.length > 30 ?
                            `${descripcionActividad.substring(0, 30)}...` :
                            descripcionActividad
                          ) :
                          'Sin descripción'
                        }
                      </small>
                    </div>
                    <div className="text-end">
                      <span className="badge bg-primary" style={{ fontSize: '0.6rem' }}>
                        ${totalActividad.toLocaleString('es-CO')}
                      </span>
                      <br />
                      <small className="text-muted" style={{ fontSize: '0.6rem' }}>
                        {actividad.tareas.length} tarea{actividad.tareas.length !== 1 ? 's' : ''}
                      </small>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Alertas compactas */}
      {saldoDisponible < 0 && (
        <Alert variant="danger" className="py-1 px-2 mb-0" style={{ fontSize: '0.7rem' }}>
          <small>
            <i className="bi bi-exclamation-triangle me-1"></i>
            <strong>Advertencia:</strong> Presupuesto excedido.
          </small>
        </Alert>
      )}

      {saldoDisponible >= 0 && saldoDisponible < (presupuestoAsignado * 0.1) && totalPlanificado > 0 && (
        <Alert variant="warning" className="py-1 px-2 mb-0" style={{ fontSize: '0.7rem' }}>
          <small>
            <i className="bi bi-info-circle me-1"></i>
            <strong>Aviso:</strong> Menos del 10% disponible.
          </small>
        </Alert>
      )}
    </div>
  );
};

export default SidebarPresupuesto;

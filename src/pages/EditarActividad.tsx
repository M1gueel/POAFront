import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card, Row, Col, Tabs, Tab, Spinner, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import { useProyectoManager } from '../hooks/useProyectoManager';
import { useActividadManager } from '../hooks/useActividadManager';
import { useTareaModal } from '../hooks/useTareaModal';
import { ActividadTareaService } from '../services/actividadTareaService';

import BusquedaProyecto from '../components/BusquedaProyecto';
import InformacionProyecto from '../components/InformacionProyecto';
import InformacionPOAs from '../components/InformacionPOAs';
import TareaModal from '../components/TareaModal';
//import ExportarPOA from '../components/ExportarPOA';
import ActividadesPorPOA from '../components/ActividadesPorPOA';
import SidebarPresupuesto from '../components/SidebarPresupuesto';

import { POAConActividadesYTareas } from '../interfaces/actividad';
import { showError, showInfo } from '../utils/toast';
import '../styles/AgregarActividad.css';

const EditarActividad: React.FC = () => {
  const navigate = useNavigate();

  // Hooks personalizados reutilizados
  const {
    proyectos,
    proyectoSeleccionado,
    isLoading: proyectoLoading,
    seleccionarProyecto,
    validarProyectoConActividades // Diferente validación para editar
  } = useProyectoManager();

  const {
    poasProyecto,
    activePoaTab,
    poasConActividades,
    isLoading: actividadLoading,
    loadingMessage,
    setActivePoaTab,
    setPoasConActividades,
    cargarPoasConActividadesYTareasReales, // Nueva función para editar
    getItemPresupuestarioConCache
  } = useActividadManager();

  const {
    showTareaModal,
    currentPoa,
    currentActividad,
    currentTarea,
    isEditingTarea,
    detallesFiltrados,
    cargandoDetalles,
    taskErrors,
    setShowTareaModal,
    setCurrentTarea,
    mostrarModalTarea,
    handleDetalleTareaChange,
    handleItemPresupuestarioChange,
    handleDescripcionChange,
    validarYGuardarTarea,
    clearTaskError
  } = useTareaModal();

  // Estados específicos para editar
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showActividades, setShowActividades] = useState(false);
  const [actividadesOriginales, setActividadesOriginales] = useState<POAConActividadesYTareas[]>([]);

  const isLoading = proyectoLoading || actividadLoading;

  // Efecto para guardar actividades originales cuando se cargan
  useEffect(() => {
    if (poasConActividades.length > 0 && actividadesOriginales.length === 0) {
      setActividadesOriginales(JSON.parse(JSON.stringify(poasConActividades))); // Deep copy
    }
  }, [poasConActividades, actividadesOriginales.length]);

  // Función específica para cargar actividades y tareas existentes
  const cargarActividadesExistentes = async (proyectoId: string) => {
    try {
      showInfo('Cargando actividades y tareas existentes...');
      
      // Cargar POAs con actividades y tareas reales ordenadas
      await cargarPoasConActividadesYTareasReales(proyectoId);
      
    } catch (error) {
      showError('Error al cargar las actividades existentes');
    }
  };

  // Función para manejar la selección de proyecto
  const handleSeleccionarProyecto = async (proyecto: any) => {
    seleccionarProyecto(proyecto);
    await cargarActividadesExistentes(proyecto.id_proyecto);
  };

  // Función para guardar tarea (editada o nueva)
  const handleGuardarTarea = (tareaCompleta: any) => {
    setPoasConActividades(prev =>
      prev.map(poa =>
        poa.id_poa === currentPoa
          ? {
            ...poa,
            actividades: poa.actividades.map(act =>
              act.actividad_id === currentActividad
                ? {
                  ...act,
                  tareas: isEditingTarea
                    ? act.tareas.map(t => t.tempId === currentTarea?.tempId ? tareaCompleta : t)
                    : [...act.tareas, tareaCompleta] // Agregar nueva tarea
                }
                : act
            )
          }
          : poa
      )
    );
  };

  // Función para mostrar modal de tarea
  const handleMostrarModalTarea = async (poaId: string, actividadId: string, tarea?: any) => {
    const poa = poasConActividades.find(p => p.id_poa === poaId);
    const actividad = poa?.actividades.find(act => act.actividad_id === actividadId);

    await mostrarModalTarea(
      poaId,
      actividadId,
      tarea,
      poa,
      actividad,
      (id: string) => getItemPresupuestarioConCache(id, async (itemId: string) => {
        const { tareaAPI } = await import('../api/tareaAPI');
        return tareaAPI.getItemPresupuestarioPorId(itemId);
      })
    );
  };

  // Wrappers para compatibilidad
  const handleDetalleTareaChangeWrapper = async (idDetalleTarea: string) => {
    await handleDetalleTareaChange(
      idDetalleTarea,
      poasConActividades,
      (id: string) => getItemPresupuestarioConCache(id, async (itemId: string) => {
        const { tareaAPI } = await import('../api/tareaAPI');
        return tareaAPI.getItemPresupuestarioPorId(itemId);
      })
    );
  };

  const handleItemPresupuestarioChangeWrapper = async (idItemPresupuestario: string) => {
    await handleItemPresupuestarioChange(idItemPresupuestario, poasConActividades);
  };

  const handleValidarYGuardarTarea = () => {
    validarYGuardarTarea(handleGuardarTarea);
  };

  // Función para eliminar tareas (solo nuevas tareas agregadas en esta sesión)
  const eliminarTarea = (poaId: string, actividadId: string, tareaId: string) => {
    const poa = poasConActividades.find(p => p.id_poa === poaId);
    const actividad = poa?.actividades.find(act => act.actividad_id === actividadId);
    const tarea = actividad?.tareas.find(t => t.tempId === tareaId);
    
    // Solo permitir eliminar tareas que no tienen id_tarea_real (tareas nuevas)
    if (tarea && !tarea.id_tarea_real) {
      setPoasConActividades(prev =>
        prev.map(p =>
          p.id_poa === poaId
            ? {
              ...p,
              actividades: p.actividades.map(act =>
                act.actividad_id === actividadId
                  ? {
                    ...act,
                    tareas: act.tareas.filter(t => t.tempId !== tareaId)
                  }
                  : act
              )
            }
            : p
        )
      );
      showInfo('Tarea eliminada correctamente');
    } else {
      showError('No se pueden eliminar tareas existentes en modo edición. Solo se pueden eliminar tareas agregadas en esta sesión.');
    }
  };

  const toggleTareaExpansion = (poaId: string, actividadId: string, tareaId: string) => {
    setPoasConActividades(prev =>
      prev.map(poa =>
        poa.id_poa === poaId
          ? {
            ...poa,
            actividades: poa.actividades.map(act =>
              act.actividad_id === actividadId
                ? {
                  ...act,
                  tareas: act.tareas.map(tarea =>
                    tarea.tempId === tareaId
                      ? { ...tarea, expanded: !tarea.expanded }
                      : tarea
                  )
                }
                : act
            )
          }
          : poa
      )
    );
  };

  const calcularTotalActividad = (poaId: string, actividadId: string) => {
    const poa = poasConActividades.find(p => p.id_poa === poaId);
    if (!poa) return 0;

    const actividad = poa.actividades.find(a => a.actividad_id === actividadId);
    if (!actividad) return 0;

    return actividad.tareas.reduce((sum, tarea) => sum + (tarea.total || 0), 0);
  };

  // Función para verificar si hay cambios
  const hayTareasCambiadas = (): boolean => {
    if (actividadesOriginales.length === 0) return false;

    for (const poa of poasConActividades) {
      const poaOriginal = actividadesOriginales.find(p => p.id_poa === poa.id_poa);
      if (!poaOriginal) continue;

      for (const actividad of poa.actividades) {
        const actividadOriginal = poaOriginal.actividades.find(a => a.actividad_id === actividad.actividad_id);
        if (!actividadOriginal) continue;

        // Verificar si hay nuevas tareas agregadas (sin id_tarea_real)
        const tareasNuevas = actividad.tareas.filter(t => !t.id_tarea_real);
        if (tareasNuevas.length > 0) {
          return true;
        }

        // Verificar cambios en tareas existentes
        for (const tarea of actividad.tareas) {
          // Solo verificar tareas que tienen id_tarea_real (existentes)
          if (!tarea.id_tarea_real) continue;
          
          const tareaOriginal = actividadOriginal.tareas.find(t => t.id_tarea_real === tarea.id_tarea_real);
          if (!tareaOriginal) continue;

          // Comparar campos importantes
          if (
            tarea.cantidad !== tareaOriginal.cantidad ||
            tarea.precio_unitario !== tareaOriginal.precio_unitario ||
            tarea.detalle_descripcion !== tareaOriginal.detalle_descripcion ||
            tarea.lineaPaiViiv !== tareaOriginal.lineaPaiViiv ||
            JSON.stringify(tarea.gastos_mensuales) !== JSON.stringify(tareaOriginal.gastos_mensuales)
          ) {
            return true;
          }
        }
      }
    }

    return false;
  };

  // Función para manejar el envío del formulario (solo validar cambios)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!proyectoSeleccionado) {
      showError('Debe seleccionar un proyecto');
      return;
    }

    if (!hayTareasCambiadas()) {
      showError('No se detectaron cambios en las tareas');
      return;
    }

    setShowConfirmModal(true);
  };

  // Función para guardar cambios (actualizar tareas existentes)
  const handleGuardarCambios = async () => {
    const result = await ActividadTareaService.editarTareas(poasConActividades);

    if (result.success) {
      setShowConfirmModal(false);
      setShowSuccessModal(true);
    } else {
      setShowConfirmModal(false);
      showError(result.error || 'Error al actualizar las tareas');
    }
  };

  // Funciones para manejo de modales
  const handleCloseModals = () => {
    setShowConfirmModal(false);
    setShowSuccessModal(false);
  };

  const handleVolverDashboard = () => {
    navigate('/Dashboard');
  };

  return (
    <Container className="py-4 main-content-with-sidebar">
      <Card className="shadow-lg">
        <Card.Header className="bg-warning bg-gradient text-dark p-3">
          <h2 className="mb-0 fw-bold text-center">Editar Actividades y Tareas de Proyecto</h2>
        </Card.Header>
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit}>
            {/* Sección de Búsqueda de Proyecto */}
            <BusquedaProyecto
              proyectos={proyectos}
              isLoading={isLoading}
              seleccionarProyecto={handleSeleccionarProyecto}
              validarProyecto={validarProyectoConActividades} // Validación diferente
              mostrarValidacion={true}
            />

            {/* Información del Proyecto Seleccionado */}
            {proyectoSeleccionado && (
              <InformacionProyecto
                proyecto={proyectoSeleccionado}
                cantidadPoas={poasProyecto.length}
              />
            )}

            {/* Información de los POAs del Proyecto */}
            {proyectoSeleccionado && poasProyecto.length > 0 && (
              <InformacionPOAs poas={poasProyecto} />
            )}

            {/* Sección de actividades por POA */}
            {proyectoSeleccionado && poasProyecto.length > 0 && (
              <Row className="mb-4">
                <Col md={12}>
                  <Card>
                    <Card.Header className="bg-light">
                      <h5 className="mb-0">Editar Tareas por POA</h5>
                      <p className="text-muted small mb-0">
                        Solo se pueden modificar las tareas existentes. Las actividades no se pueden cambiar.
                      </p>
                    </Card.Header>
                    <Card.Body>
                      <Tabs
                        activeKey={activePoaTab}
                        onSelect={(k) => setActivePoaTab(k || '')}
                        className="mb-4"
                      >
                        {poasConActividades.map((poa) => (
                          <Tab
                            key={poa.id_poa}
                            eventKey={poa.id_poa}
                            title={`${poa.codigo_poa} - ${poa.tipo_poa}`}
                          >
                            <ActividadesPorPOA
                              poa={poa}
                              onMostrarModalTarea={handleMostrarModalTarea}
                              onEliminarTarea={eliminarTarea} // Función deshabilitada
                              onToggleTareaExpansion={toggleTareaExpansion}
                              calcularTotalActividad={calcularTotalActividad}
                              poasConActividades={poasConActividades}
                            />
                          </Tab>
                        ))}
                      </Tabs>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Botones de acción */}
            {proyectoSeleccionado && poasProyecto.length > 0 && (
              <Row className="mt-4">
                <Col className="d-flex justify-content-center">
                  <Button variant="secondary" className="me-2" onClick={() => navigate('/Dashboard')}>
                    Cancelar
                  </Button>

                  <Button 
                    variant="warning" 
                    type="submit" 
                    disabled={isLoading || !hayTareasCambiadas()}
                  >
                    {isLoading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                        Actualizando...
                      </>
                    ) : (
                      'Actualizar Tareas'
                    )}
                  </Button>
                </Col>
              </Row>
            )}

            {/* Modal de Confirmación */}
            <Modal show={showConfirmModal} onHide={handleCloseModals} centered>
              <Modal.Header closeButton>
                <Modal.Title>Confirmar Actualización</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p>¿Está seguro de que desea actualizar las tareas modificadas? Los cambios se aplicarán inmediatamente.</p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseModals}>
                  Cancelar
                </Button>
                <Button variant="warning" onClick={handleGuardarCambios} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Actualizando...
                    </>
                  ) : (
                    'Confirmar Actualización'
                  )}
                </Button>
              </Modal.Footer>
            </Modal>

            {/* Modal de Éxito */}
            <Modal show={showSuccessModal} onHide={handleCloseModals} centered>
              <Modal.Header closeButton>
                <Modal.Title>Actualización Exitosa</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p>Las tareas han sido actualizadas exitosamente</p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="primary" onClick={handleVolverDashboard}>
                  Volver al Inicio
                </Button>
              </Modal.Footer>
            </Modal>

            {/* Modal para editar tareas */}
            <TareaModal
              show={showTareaModal}
              onHide={() => setShowTareaModal(false)}
              isEditing={isEditingTarea}
              tarea={currentTarea}
              detallesFiltrados={detallesFiltrados}
              cargandoDetalles={cargandoDetalles}
              taskErrors={taskErrors}
              onTareaChange={setCurrentTarea}
              onDetalleTareaChange={handleDetalleTareaChangeWrapper}
              onItemPresupuestarioChange={handleItemPresupuestarioChangeWrapper}
              onDescripcionChange={handleDescripcionChange}
              onSave={handleValidarYGuardarTarea}
              clearTaskError={clearTaskError}
            />

            {/* Indicador de carga */}
            {isLoading && (
              <div className="position-fixed top-0 left-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75" style={{ zIndex: 1050 }}>
                <div className="text-center">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">{loadingMessage}</p>
                </div>
              </div>
            )}
          </Form>
        </Card.Body>
      </Card>

      {/* Sidebar fijo del presupuesto */}
      {proyectoSeleccionado && poasConActividades.length > 0 && (
        <SidebarPresupuesto
          poasConActividades={poasConActividades}
          activePoaTab={activePoaTab}
          calcularTotalActividad={calcularTotalActividad}
          showActividades={showActividades}
          setShowActividades={setShowActividades}
        />
      )}
    </Container>
  );
};

export default EditarActividad;

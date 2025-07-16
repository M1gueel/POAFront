import React from 'react';
import { Modal, Form, Button, InputGroup, Row, Col, Alert } from 'react-bootstrap';
import { TareaForm } from '../interfaces/tarea';
import { esContratacionServiciosProfesionales } from '../utils/asignarCantidad';

interface TareaModalProps {
  show: boolean;
  onHide: () => void;
  isEditing: boolean;
  tarea: TareaForm | null;
  detallesFiltrados: any[];
  cargandoDetalles: boolean;
  taskErrors: { [key: string]: string };
  onTareaChange: (tarea: TareaForm) => void;
  onDetalleTareaChange: (id: string) => void;
  onItemPresupuestarioChange: (id: string) => void;
  onDescripcionChange: (descripcion: string) => void;
  onSave: () => void;
  clearTaskError: (field: string) => void;
}

const TareaModal: React.FC<TareaModalProps> = ({
  show,
  onHide,
  isEditing,
  tarea,
  detallesFiltrados,
  cargandoDetalles,
  taskErrors,
  onTareaChange,
  onDetalleTareaChange,
  onItemPresupuestarioChange,
  onDescripcionChange,
  onSave,
  clearTaskError
}) => {

  const handleTareaFieldChange = (field: keyof TareaForm, value: any) => {
    if (!tarea) return;
    
    const updatedTarea = { ...tarea, [field]: value };
    
    // Recalcular total si cambia cantidad o precio
    if (field === 'cantidad' || field === 'precio_unitario') {
      const cantidad = field === 'cantidad' ? value : tarea.cantidad;
      const precio = field === 'precio_unitario' ? value : tarea.precio_unitario;
      updatedTarea.total = cantidad * precio;
      updatedTarea.saldo_disponible = updatedTarea.total;
    }
    
    onTareaChange(updatedTarea);
  };

  const handleGastoMensualChange = (index: number, valor: number) => {
    if (!tarea) return;
    
    const gastosMensuales = [...(tarea.gastos_mensuales || new Array(12).fill(0))];
    gastosMensuales[index] = valor;
    
    onTareaChange({
      ...tarea,
      gastos_mensuales: gastosMensuales
    });
  };

  if (!tarea) return null;

  return (
    <Modal show={show} onHide={onHide} size='lg'>
      <Modal.Header closeButton>
        <Modal.Title>{isEditing ? 'Editar Tarea' : 'Agregar Nueva Tarea'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>Detalle de Tarea</Form.Label>
          <Form.Select
            value={tarea.id_detalle_tarea || ''}
            onChange={(e) => {
              onDetalleTareaChange(e.target.value);
              if (e.target.value) {
                clearTaskError('detalle_tarea');
              }
            }}
            disabled={cargandoDetalles}
            isInvalid={!!taskErrors.detalle_tarea}
          >
            <option value="">
              {cargandoDetalles ? 'Cargando detalles...' : 'Seleccione un detalle...'}
            </option>
            {detallesFiltrados.map(dt => (
              <option key={dt.id_detalle_tarea} value={dt.id_detalle_tarea}>
                {dt.nombre}
              </option>
            ))}
          </Form.Select>
          {taskErrors.detalle_tarea && (
            <Form.Control.Feedback type="invalid">
              {taskErrors.detalle_tarea}
            </Form.Control.Feedback>
          )}
          {cargandoDetalles && (
            <Form.Text className="text-muted">
              Filtrando detalles según la actividad seleccionada...
            </Form.Text>
          )}
        </Form.Group>

        {/* Campo para mostrar/seleccionar el código del ítem */}
        <Form.Group className="mb-3">
          <Form.Label>Código del Ítem</Form.Label>
          {tarea.detalle?.tiene_multiples_items ? (
            <Form.Select
              value={tarea.id_item_presupuestario_seleccionado || ''}
              onChange={(e) => {
                onItemPresupuestarioChange(e.target.value);
                if (e.target.value) {
                  clearTaskError('item_presupuestario');
                }
              }}
              isInvalid={!!taskErrors.item_presupuestario}
            >
              <option value="">Seleccione un código...</option>
              {tarea.detalle.items_presupuestarios?.map((item) => (
                <option key={item.id_item_presupuestario} value={item.id_item_presupuestario}>
                  {item.codigo}
                </option>
              ))}
            </Form.Select>
          ) : (
            <Form.Control
              type="text"
              value={tarea.codigo_item || ''}
              disabled
            />
          )}
          {taskErrors.item_presupuestario && (
            <Form.Control.Feedback type="invalid">
              {taskErrors.item_presupuestario}
            </Form.Control.Feedback>
          )}
          <Form.Text className="text-muted">
            {tarea.detalle?.tiene_multiples_items
              ? "Seleccione el código específico para esta tarea."
              : "Este código se asigna automáticamente según el detalle de tarea."
            }
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Nombre de la Tarea *</Form.Label>
          <Form.Control
            type="text"
            value={tarea.nombre || ''}
            onChange={(e) => {
              handleTareaFieldChange('nombre', e.target.value);
              if (e.target.value.trim()) {
                clearTaskError('nombre');
              }
            }}
            required
            isInvalid={!!taskErrors.nombre}
          />
          {taskErrors.nombre && (
            <Form.Control.Feedback type="invalid">
              {taskErrors.nombre}
            </Form.Control.Feedback>
          )}
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Descripción</Form.Label>
          {tarea.detalle?.tiene_multiples_descripciones ? (
            <Form.Select
              value={tarea.descripcion_seleccionada || tarea.detalle_descripcion || ''}
              onChange={(e) => onDescripcionChange(e.target.value)}
            >
              <option value="">Seleccione una descripción...</option>
              {tarea.detalle.descripciones_disponibles?.map((descripcion, index) => (
                <option key={index} value={descripcion}>
                  {descripcion}
                </option>
              ))}
            </Form.Select>
          ) : (
            <Form.Control
              as="textarea"
              rows={2}
              value={tarea.detalle_descripcion || ''}
              onChange={(e) => onDescripcionChange(e.target.value)}
            />
          )}
          <Form.Text className="text-muted">
            {tarea.detalle?.tiene_multiples_descripciones
              ? "Seleccione la descripción específica para esta tarea."
              : "Puede editar la descripción de la tarea."
            }
            {esContratacionServiciosProfesionales(tarea) && (
              <div className="mt-1">
                <small className="text-info">
                  <i className="fas fa-info-circle me-1"></i>
                  El precio unitario se actualizará automáticamente según la descripción seleccionada.
                </small>
              </div>
            )}
          </Form.Text>
        </Form.Group>

        {/* Campo Línea PAI VIIV */}
        <Form.Group className="mb-3">
          <Form.Label>Línea PAI VIIV</Form.Label>
          <Form.Control
            type="number"
            min="1"
            step="1"
            value={tarea.lineaPaiViiv === 0 ? '' : tarea.lineaPaiViiv || ''}
            onChange={(e) => {
              const rawValue = e.target.value;
              if (rawValue === '') {
                handleTareaFieldChange('lineaPaiViiv', undefined);
                return;
              }
              const value = parseInt(rawValue, 10);
              if (!isNaN(value) && value > 0) {
                handleTareaFieldChange('lineaPaiViiv', value);
              }
            }}
            placeholder="Ingrese el número de línea PAI VIIV"
          />
          <Form.Text className="text-muted">
            Número de línea correspondiente al Plan de Acción Institucional VIIV (opcional).
          </Form.Text>
        </Form.Group>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Cantidad *</Form.Label>
              <Form.Control
                type="number"
                min="1"
                step="1"
                value={tarea.cantidad === 0 ? '0' : tarea.cantidad || ''}
                onChange={(e) => {
                  const rawValue = e.target.value;
                  if (rawValue === '') {
                    handleTareaFieldChange('cantidad', 0);
                    return;
                  }
                  const value = parseInt(rawValue, 10);
                  if (!isNaN(value) && value > 0) {
                    handleTareaFieldChange('cantidad', value);
                    clearTaskError('cantidad');
                  }
                }}
                required
                isInvalid={!!taskErrors.cantidad}
              />
              {taskErrors.cantidad && (
                <Form.Control.Feedback type="invalid">
                  {taskErrors.cantidad}
                </Form.Control.Feedback>
              )}
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Precio Unitario *</Form.Label>
              <InputGroup>
                <InputGroup.Text>$</InputGroup.Text>
                <Form.Control
                  type="text"
                  value={tarea.precio_unitario === 0 ? '' : tarea.precio_unitario || ''}
                  onChange={(e) => {
                    if (esContratacionServiciosProfesionales(tarea)) {
                      return;
                    }

                    const rawValue = e.target.value;

                    if (rawValue === '') {
                      handleTareaFieldChange('precio_unitario', 0);
                      return;
                    }

                    const isValidFormat = /^\d*\.?\d{0,2}$/.test(rawValue);

                    if (isValidFormat) {
                      const numericValue = rawValue.endsWith('.')
                        ? parseFloat(rawValue + '0')
                        : parseFloat(rawValue) || 0;

                      handleTareaFieldChange('precio_unitario', numericValue);

                      if (numericValue > 0) {
                        clearTaskError('precio_unitario');
                      }
                    }
                  }}
                  readOnly={esContratacionServiciosProfesionales(tarea)}
                  style={{
                    backgroundColor: esContratacionServiciosProfesionales(tarea) ? '#f8f9fa' : 'white',
                    cursor: esContratacionServiciosProfesionales(tarea) ? 'not-allowed' : 'text'
                  }}
                  required
                  isInvalid={!!taskErrors.precio_unitario}
                />
              </InputGroup>
              {taskErrors.precio_unitario && (
                <Form.Control.Feedback type="invalid">
                  {taskErrors.precio_unitario}
                </Form.Control.Feedback>
              )}
              {esContratacionServiciosProfesionales(tarea) && (
                <Form.Text className="text-muted">
                  <i className="fas fa-lock me-1"></i>
                  Precio establecido automáticamente según la descripción seleccionada.
                </Form.Text>
              )}
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label>Total</Form.Label>
          <InputGroup>
            <InputGroup.Text>$</InputGroup.Text>
            <Form.Control
              type="text"
              value={tarea.total ? tarea.total.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              disabled
            />
          </InputGroup>
          <Form.Text className="text-muted">
            Este valor se calcula automáticamente (Cantidad × Precio Unitario).
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Saldo Disponible</Form.Label>
          <InputGroup>
            <InputGroup.Text>$</InputGroup.Text>
            <Form.Control
              type="text"
              value={tarea.saldo_disponible === 0 ? '' : tarea.saldo_disponible || ''}
              onChange={(e) => {
                const rawValue = e.target.value;
                if (rawValue === '') {
                  handleTareaFieldChange('saldo_disponible', 0);
                  return;
                }

                if (/^\d*\.?\d{0,2}$/.test(rawValue)) {
                  handleTareaFieldChange('saldo_disponible', rawValue === '' ? 0 : parseFloat(rawValue) || 0);
                }
              }}
            />
          </InputGroup>
          <Form.Text className="text-muted">
            Por defecto es igual al total, pero puede ser modificado.
          </Form.Text>
          
          <Form.Group className="mb-3">
            <hr className="my-3" />
            <div className="text-center mb-3">
              <Form.Label className="h6 fw-bold">Distribución Mensual de Gastos</Form.Label>
            </div>
            <div className="row g-2">
              {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((mes, index) => (
                  <div key={mes} className="col-md-3 col-sm-6 mb-2">
                    <Form.Label className="small fw-bold">{mes}</Form.Label>
                    <InputGroup size="sm">
                      <InputGroup.Text>$</InputGroup.Text>
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0"
                        value={tarea.gastos_mensuales?.[index] || ''}
                        onChange={(e) => {
                          const valor = parseFloat(e.target.value) || 0;
                          handleGastoMensualChange(index, valor);
                        }}
                      />
                    </InputGroup>
                  </div>
                ))}
            </div>
            <div className="mt-2 text-end">
              <Form.Text className="text-muted">
                <strong>Total planificado: ${tarea.gastos_mensuales?.reduce((sum, val) => sum + (val || 0), 0)?.toFixed(2) || '0.00'}</strong>
              </Form.Text>
            </div>
            {taskErrors.gastos_mensuales && (
              <div className="mt-2">
                <Alert variant="danger" className="py-2">
                  <small>{taskErrors.gastos_mensuales}</small>
                </Alert>
              </div>
            )}
          </Form.Group>
        </Form.Group>

      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={onSave}>
          {isEditing ? 'Actualizar Tarea' : 'Agregar Tarea'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default TareaModal;

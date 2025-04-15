import React, { useState, useEffect } from 'react';
import { Form, Button, Modal, Row, Col, Alert } from 'react-bootstrap';
import { Periodo, TipoPOA } from '../interfaces/poa';
import { Proyecto,} from '../interfaces/project';

import { poaAPI } from '../api/poaAPI';

interface PeriodoModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (periodo: Periodo) => void;
  proyectoSeleccionado?: Proyecto;
  tipoPOASeleccionado?: TipoPOA;
}

const PeriodoModal: React.FC<PeriodoModalProps> = ({
  show,
  onHide,
  onSave,
  proyectoSeleccionado,
  tipoPOASeleccionado
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periodos, setPeriodos] = useState<Partial<Periodo>[]>([]);
  const [currentPeriodoIndex, setCurrentPeriodoIndex] = useState(0);

  // Al abrir el modal, inicializar los periodos basados en el proyecto y tipo POA
  useEffect(() => {
    if (show && proyectoSeleccionado && tipoPOASeleccionado) {
      inicializarPeriodos();
    }
  }, [show, proyectoSeleccionado, tipoPOASeleccionado]);

  // Inicializar los periodos según la duración del proyecto y cantidad de periodos del tipo POA
  const inicializarPeriodos = () => {
    if (!proyectoSeleccionado || !tipoPOASeleccionado) return;

    const cantidadPeriodos = tipoPOASeleccionado.cantidad_periodos || 1;
    const nuevoPeriodos: Partial<Periodo>[] = [];
    
    const fechaInicio = new Date(proyectoSeleccionado.fecha_inicio);
    const fechaFin = proyectoSeleccionado.fecha_fin ? new Date(proyectoSeleccionado.fecha_fin) : null;
    
    // Calcular el año fiscal para cada periodo
    for (let i = 0; i < cantidadPeriodos; i++) {
      const periodoAnioInicio = fechaInicio.getFullYear() + i;
      
      // Fecha de inicio del periodo: si es el primer periodo, usar la fecha de inicio del proyecto
      // Si no, usar el 1 de enero del año correspondiente
      const periodoFechaInicio = i === 0
        ? fechaInicio
        : new Date(periodoAnioInicio, 0, 1); // 1 de enero del año
      
      // Fecha de fin del periodo: 31 de diciembre del mismo año
      // Si es el último periodo y hay fecha fin del proyecto, usar esa fecha
      const esUltimoPeriodo = i === cantidadPeriodos - 1;
      const periodoFechaFin = (esUltimoPeriodo && fechaFin) 
        ? fechaFin
        : new Date(periodoAnioInicio, 11, 31); // 31 de diciembre
      
      nuevoPeriodos.push({
        codigo_periodo: `${periodoAnioInicio}-P${i + 1}`,
        nombre_periodo: `Periodo ${i + 1} (${periodoAnioInicio})`,
        fecha_inicio: periodoFechaInicio.toISOString().split('T')[0],
        fecha_fin: periodoFechaFin.toISOString().split('T')[0],
        anio: periodoAnioInicio.toString(),
        mes: i === 0 
          ? `${obtenerNombreMes(periodoFechaInicio.getMonth())}-Diciembre`
          : 'Enero-Diciembre'
      });
    }
    
    setPeriodos(nuevoPeriodos);
    setCurrentPeriodoIndex(0);
  };

  // Obtener el nombre del mes en español
  const obtenerNombreMes = (mes: number): string => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes];
  };

  // Manejar cambios en el formulario
  const handleChangePeriodo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPeriodos(prevPeriodos => {
      const nuevoPeriodos = [...prevPeriodos];
      nuevoPeriodos[currentPeriodoIndex] = {
        ...nuevoPeriodos[currentPeriodoIndex],
        [name]: value
      };
      return nuevoPeriodos;
    });
  };

  // Guardar el periodo actual
  const handleGuardarPeriodo = async () => {
    const periodoActual = periodos[currentPeriodoIndex];
    
    // Validación básica
    if (!periodoActual.codigo_periodo || !periodoActual.nombre_periodo || 
        !periodoActual.fecha_inicio || !periodoActual.fecha_fin) {
      setError('Todos los campos marcados con * son obligatorios');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Enviar a la API
      const periodoGuardado = await poaAPI.crearPeriodo(periodoActual as Omit<Periodo, 'id_periodo'>);
      
      // Actualizar el periodo con el ID generado
      setPeriodos(prevPeriodos => {
        const nuevoPeriodos = [...prevPeriodos];
        nuevoPeriodos[currentPeriodoIndex] = periodoGuardado;
        return nuevoPeriodos;
      });
      
      // Si hay más periodos, pasar al siguiente
      if (currentPeriodoIndex < periodos.length - 1) {
        setCurrentPeriodoIndex(currentPeriodoIndex + 1);
      } else {
        // Si es el último periodo, notificar y cerrar
        onSave(periodoGuardado);
        onHide();
      }
    } catch (err) {
      console.error('Error al guardar el periodo:', err);
      setError('Error al guardar el periodo. Inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Navegar entre periodos
  const navegarAPeriodo = (index: number) => {
    if (index >= 0 && index < periodos.length) {
      setCurrentPeriodoIndex(index);
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      backdrop="static" 
      size="lg"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {periodos.length > 1 
            ? `Crear Periodo ${currentPeriodoIndex + 1} de ${periodos.length}` 
            : 'Crear Nuevo Periodo'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {periodos.length > 0 && (
          <Form>
            {periodos.length > 1 && (
              <div className="mb-4 d-flex justify-content-center">
                <div className="btn-group">
                  {periodos.map((_, index) => (
                    <Button
                      key={index}
                      variant={index === currentPeriodoIndex ? "primary" : "outline-primary"}
                      onClick={() => navegarAPeriodo(index)}
                    >
                      Periodo {index + 1}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            <Form.Group className="mb-3" controlId="nuevoPeriodoCodigo">
              <Form.Label>Código del Periodo <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="codigo_periodo"
                value={periodos[currentPeriodoIndex]?.codigo_periodo || ''}
                onChange={handleChangePeriodo}
                placeholder="Ej: 2024-P1"
                required
              />
              <Form.Text className="text-muted">
                Se recomienda seguir el formato: YYYY-PX (Año-Periodo)
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="nuevoPeriodoNombre">
              <Form.Label>Nombre del Periodo <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="nombre_periodo"
                value={periodos[currentPeriodoIndex]?.nombre_periodo || ''}
                onChange={handleChangePeriodo}
                placeholder="Ej: Primer Periodo 2024"
                required
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="nuevoPeriodoFechaInicio">
                  <Form.Label>Fecha de Inicio <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="fecha_inicio"
                    value={periodos[currentPeriodoIndex]?.fecha_inicio || ''}
                    onChange={handleChangePeriodo}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3" controlId="nuevoPeriodoFechaFin">
                  <Form.Label>Fecha de Fin <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="fecha_fin"
                    value={periodos[currentPeriodoIndex]?.fecha_fin || ''}
                    onChange={handleChangePeriodo}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="nuevoPeriodoAnio">
                  <Form.Label>Año</Form.Label>
                  <Form.Control
                    type="text"
                    name="anio"
                    value={periodos[currentPeriodoIndex]?.anio || ''}
                    onChange={handleChangePeriodo}
                    placeholder="Ej: 2024"
                  />
                  <Form.Text className="text-muted">
                    Opcional, útil para prórroga
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3" controlId="nuevoPeriodoMes">
                  <Form.Label>Meses</Form.Label>
                  <Form.Control
                    type="text"
                    name="mes"
                    value={periodos[currentPeriodoIndex]?.mes || ''}
                    onChange={handleChangePeriodo}
                    placeholder="Ej: Enero-Marzo"
                  />
                  <Form.Text className="text-muted">
                    Opcional, útil para prórroga
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          onClick={handleGuardarPeriodo} 
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Guardando...
            </>
          ) : (
            currentPeriodoIndex < periodos.length - 1 ? 
              'Guardar y Continuar' : 'Guardar Periodo'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PeriodoModal;
import React from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { Periodo } from '../interfaces/periodo';

interface PeriodoModalProps {
  show: boolean;
  nuevoPeriodo: Partial<Periodo>;
  onHide: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
}

const CrearPeriodoModal: React.FC<PeriodoModalProps> = ({
  show,
  nuevoPeriodo,
  onHide,
  onChange,
  onSave
}) => {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Crear Nuevo Periodo</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3" controlId="codigo_periodo">
          <Form.Label>Código del Periodo</Form.Label>
          <Form.Control
            type="text"
            name="codigo_periodo"
            value={nuevoPeriodo.codigo_periodo || ''}
            onChange={onChange}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="nombre_periodo">
          <Form.Label>Nombre del Periodo</Form.Label>
          <Form.Control
            type="text"
            name="nombre_periodo"
            value={nuevoPeriodo.nombre_periodo || ''}
            onChange={onChange}
            required
          />
        </Form.Group>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="fecha_inicio">
              <Form.Label>Fecha de Inicio</Form.Label>
              <Form.Control
                type="date"
                name="fecha_inicio"
                value={nuevoPeriodo.fecha_inicio || ''}
                onChange={onChange}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="fecha_fin">
              <Form.Label>Fecha de Fin</Form.Label>
              <Form.Control
                type="date"
                name="fecha_fin"
                value={nuevoPeriodo.fecha_fin || ''}
                onChange={onChange}
                required
              />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="anio">
              <Form.Label>Año</Form.Label>
              <Form.Control
                type="text"
                name="anio"
                value={nuevoPeriodo.anio || ''}
                onChange={onChange}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="mes">
              <Form.Label>Mes/es</Form.Label>
              <Form.Control
                type="text"
                name="mes"
                value={nuevoPeriodo.mes || ''}
                onChange={onChange}
                placeholder="Ej: Enero-Diciembre"
              />
            </Form.Group>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={onSave}>
          Guardar Periodo
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CrearPeriodoModal;
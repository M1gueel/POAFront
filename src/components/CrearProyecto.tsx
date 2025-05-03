// src/components/CrearProyecto.tsx
import React, { useEffect } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { TipoProyecto } from '../interfaces/project';
import { useProjectForm } from '../Hooks/useProjectForm';
import { ProyectoFormHeader } from './proyecto/ProyectoFormHeader';
import { ProrrogaSection } from './proyecto/ProrrogaSection';
import '../styles/NuevoProyecto.css';

interface LocationState {
  tipoProyecto: TipoProyecto;
}

const CrearProyecto: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  
  // Initialize our custom hook
  const form = useProjectForm({ initialTipoProyecto: state?.tipoProyecto || null });

  // Effect to check if we have a valid project type
  useEffect(() => {
    if (!state?.tipoProyecto) {
      form.setError('Por favor seleccione un tipo de proyecto');
    }
  }, [state]);

  // Submit form handler that performs navigation after successful submission
  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const success = await form.handleSubmit();
    if (success) {
      navigate('/crearPOA');
    }
  };

  return (
    <div className="nuevo-proyecto-wrapper">
      <Card className="nuevo-proyecto-card">
        <ProyectoFormHeader tipoProyecto={form.tipoProyecto} error={form.error} />
        
        <Form className="py-3" onSubmit={onSubmit}>
          {/* Tipo de Proyecto */}
          <Form.Group controlId="tipo_proyecto" className="form-group-custom">
            <Form.Label className="form-label-custom">Tipo de Proyecto <span className="required-field">*</span></Form.Label>
            <Form.Control
              type="text"
              size="lg"
              value={form.tipoProyecto?.nombre || ''}
              readOnly
              className="form-control-custom form-control-readonly"
            />
            <Form.Text className="form-text-custom">
              El tipo de proyecto no puede ser modificado después de seleccionado.
            </Form.Text>
          </Form.Group>
          
          {/* Título */}
          <Form.Group controlId="titulo" className="form-group-custom">
            <Form.Label className="form-label-custom">Título <span className="required-field">*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingrese el título"
              size="lg"
              value={form.titulo}
              onChange={(e) => form.setTitulo(e.target.value)}
              required
              className="form-control-custom"
            />
          </Form.Group>

          {/* Fechas: Inicio y Fin */}
          <div className="row">
            <div className="col-md-6">
              <Form.Group controlId="fecha_inicio" className="form-group-custom">
                <Form.Label className="form-label-custom">Fecha de Inicio <span className="required-field">*</span></Form.Label>
                <Form.Control
                  type="date"
                  size="lg"
                  value={form.fecha_inicio}
                  onChange={(e) => form.handleFechaInicioChange(e.target.value)}
                  required
                  className="form-control-custom"
                />
                <Form.Text className="form-text-custom">
                  A partir de esta fecha se generará el código del proyecto y se calculará la fecha máxima de fin.
                </Form.Text>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group controlId="fecha_fin" className="form-group-custom">
                <Form.Label className="form-label-custom">Fecha de Fin</Form.Label>
                <Form.Control
                  type="date"
                  size="lg"
                  value={form.fecha_fin}
                  onChange={(e) => form.handleFechaFinChange(e.target.value)}
                  max={form.fechaFinMaxima}
                  isInvalid={!!form.fechaFinError}
                  className="form-control-custom"
                />
                {form.fechaFinError && (
                  <Form.Control.Feedback type="invalid">
                    {form.fechaFinError}
                  </Form.Control.Feedback>
                )}
                {form.tipoProyecto?.duracion_meses && form.fecha_inicio && (
                  <Form.Text className="form-text-custom">
                    Máximo {form.tipoProyecto.duracion_meses} meses desde la fecha de inicio
                  </Form.Text>
                )}
              </Form.Group>
            </div>
          </div>

          {/* Código y Estado */}
          <div className="row">
            <div className="col-md-6">
              <Form.Group controlId="codigo_proyecto" className="form-group-custom">
                <Form.Label className="form-label-custom">Código del Proyecto <span className="required-field">*</span></Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Se generará automáticamente"
                  size="lg"
                  value={form.codigo_proyecto}
                  readOnly
                  className="form-control-custom form-control-readonly"
                />
                <Form.Text className="form-text-custom">
                  Código automático según tipo de proyecto y fecha de inicio.
                </Form.Text>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group controlId="id_estado_proyecto" className="form-group-custom">
                <Form.Label className="form-label-custom">Estado del Proyecto <span className="required-field">*</span></Form.Label>
                <Form.Control
                  as="select"
                  size="lg"
                  value={form.id_estado_proyecto}
                  onChange={(e) => form.setId_estado_proyecto(e.target.value)}
                  disabled={form.isLoading}
                  required
                  className="form-control-custom"
                >
                  <option value="">Seleccione...</option>
                  {form.estadosProyecto.map(estado => (
                    <option key={estado.id_estado_proyecto} value={estado.id_estado_proyecto}>
                      {estado.nombre}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </div>
          </div>

          {/* Director del Proyecto */}
          <Form.Group controlId="id_director_proyecto" className="form-group-custom">
            <Form.Label className="form-label-custom">Director del Proyecto <span className="required-field">*</span></Form.Label>
            <Form.Control
              type='text'
              placeholder="Ej: Juan Pérez o Juan Carlos Pérez González"
              size="lg"
              value={form.id_director_proyecto}
              onChange={(e) => form.handleDirectorChange(e.target.value)}
              isInvalid={!!form.directorError}
              required
              className="form-control-custom"
            />
            {form.directorError && (
              <Form.Control.Feedback type="invalid">
                {form.directorError}
              </Form.Control.Feedback>
            )}
            <Form.Text className="form-text-custom">
              Ingrese al menos un nombre y un apellido, máximo dos nombres y dos apellidos.
            </Form.Text>
          </Form.Group>

          {/* Presupuesto */}
          <Form.Group controlId="presupuesto_aprobado" className="form-group-custom">
            <Form.Label className="form-label-custom">Presupuesto Aprobado</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              min="0.01" 
              placeholder="Ingrese el presupuesto"
              size="lg"
              value={form.presupuesto_aprobado}
              onChange={(e) => form.handlePresupuestoChange(e.target.value)}
              isInvalid={!!form.presupuestoError}
              className="form-control-custom"
            />
            {form.presupuestoError && (
              <Form.Control.Feedback type="invalid">
                {form.presupuestoError}
              </Form.Control.Feedback>
            )}
            <Form.Text className="form-text-custom">
              {form.tipoProyecto?.presupuesto_maximo ? 
                `El presupuesto debe ser un valor positivo y no debe exceder ${form.tipoProyecto.presupuesto_maximo.toLocaleString('es-CO')}` : 
                'El presupuesto debe ser un valor positivo'}
            </Form.Text>
          </Form.Group>

          {/* Sección de prórroga usando componente separado */}
          <ProrrogaSection 
            prorrogaOpen={form.prorrogaOpen}
            setProrrogaOpen={form.setProrrogaOpen}
            fecha_prorroga={form.fecha_prorroga}
            setFecha_prorroga={form.setFecha_prorroga}
            fecha_prorroga_inicio={form.fecha_prorroga_inicio}
            setFecha_prorroga_inicio={form.setFecha_prorroga_inicio}
            fecha_prorroga_fin={form.fecha_prorroga_fin}
            setFecha_prorroga_fin={form.setFecha_prorroga_fin}
            tiempo_prorroga_meses={form.tiempo_prorroga_meses}
            setTiempo_prorroga_meses={form.setTiempo_prorroga_meses}
            fecha_fin={form.fecha_fin}
          />
          
          {/* Botones */}
          <div className="button-group">
            <Button 
              variant="secondary" 
              type="button" 
              size="lg" 
              className="btn-custom btn-secondary-custom"
              onClick={() => navigate('/tipos-proyecto')}
            >
              Volver
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              size="lg" 
              className="btn-custom btn-primary-custom"
              disabled={form.isLoading}
            >
              {form.isLoading ? 'Cargando...' : 'Crear Proyecto'}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default CrearProyecto;
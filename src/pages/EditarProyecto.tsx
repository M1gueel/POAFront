// src/pages/EditarProyecto.tsx
import React, { useEffect, useState } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { Proyecto, TipoProyecto } from '../interfaces/project';
import { projectAPI } from '../api/projectAPI';
import { useProjectForm } from '../hooks/useProjectForm';
import { ProyectoFormHeader } from '../components/ProyectoFormHeader';
import { ProrrogaSection } from '../components/ProrrogaSection';
import BusquedaProyecto from '../components/BusquedaProyecto';
import '../styles/NuevoProyecto.css';

const EditarProyecto: React.FC = () => {
  const navigate = useNavigate();
  
  // Estados para la búsqueda de proyectos
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null);
  const [tipoProyectoSeleccionado, setTipoProyectoSeleccionado] = useState<TipoProyecto | null>(null);
  const [cargandoProyectos, setCargandoProyectos] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  
  // Estado para controlar qué tooltip está visible
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  // Initialize our custom hook with editing mode
  const form = useProjectForm({ 
    initialTipoProyecto: tipoProyectoSeleccionado, 
    initialProyecto: proyectoSeleccionado,
    isEditing: true 
  });

  // Cargar proyectos al montar el componente
  useEffect(() => {
    const cargarProyectos = async () => {
      setCargandoProyectos(true);
      setErrorBusqueda(null);
      
      try {
        const proyectosData = await projectAPI.getProyectos();
        setProyectos(proyectosData);
      } catch (error) {
        console.error('Error cargando proyectos:', error);
        setErrorBusqueda('Error al cargar los proyectos');
      } finally {
        setCargandoProyectos(false);
      }
    };

    cargarProyectos();
  }, []);

  // Cargar tipo de proyecto cuando se selecciona un proyecto
  useEffect(() => {
    const cargarTipoProyecto = async () => {
      if (!proyectoSeleccionado) return;

      try {
        const tiposProyecto = await projectAPI.getTiposProyecto();
        const tipoEncontrado = tiposProyecto.find(
          tipo => tipo.id_tipo_proyecto === proyectoSeleccionado.id_tipo_proyecto
        );
        setTipoProyectoSeleccionado(tipoEncontrado || null);
      } catch (error) {
        console.error('Error cargando tipo de proyecto:', error);
        setErrorBusqueda('Error al cargar el tipo de proyecto');
      }
    };

    cargarTipoProyecto();
  }, [proyectoSeleccionado]);

  // Manejar selección de proyecto
  const handleSeleccionarProyecto = (proyecto: Proyecto) => {
    setProyectoSeleccionado(proyecto);
    setErrorBusqueda(null);
  };

  // Submit form handler that performs navigation after successful submission
  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const success = await form.handleSubmit();
    if (success) {
      navigate('/ver-proyectos');
    }
  };

  // Función para obtener la descripción del estado seleccionado
  const getSelectedEstadoDescripcion = () => {
    const estadoSeleccionado = form.estadosProyecto.find(
      estado => estado.id_estado_proyecto === form.id_estado_proyecto
    );
    return estadoSeleccionado?.descripcion || '';
  };

  // Función para manejar el toggle de tooltips
  const toggleTooltip = (fieldName: string) => {
    setActiveTooltip(activeTooltip === fieldName ? null : fieldName);
  };

  // Componente para renderizar el ícono de ayuda con tooltip
  const HelpTooltip: React.FC<{ fieldName: string; content: string }> = ({ fieldName, content }) => (
    <div className="tooltip-container" style={{ display: 'inline-block', marginLeft: '8px' }}>
      <HelpCircle 
        size={16} 
        className="help-icon" 
        onClick={() => toggleTooltip(fieldName)}
        style={{ cursor: 'pointer' }}
      />
      {activeTooltip === fieldName && (
        <div className="tooltip tooltip-visible">
          {content}
        </div>
      )}
    </div>
  );

  // Si no hay proyecto seleccionado, mostrar búsqueda
  if (!proyectoSeleccionado) {
    return (
      <div className="nuevo-proyecto-wrapper">
        <Card className="nuevo-proyecto-card">
          <div className="nuevo-proyecto-header">
            <h2 className="nuevo-proyecto-title">Editar Proyecto</h2>
            <p className="nuevo-proyecto-subtitle">
              Seleccione el proyecto que desea editar
            </p>
          </div>
          
          {errorBusqueda && (
            <Alert variant="danger" className="mb-3">
              {errorBusqueda}
            </Alert>
          )}
          
          <BusquedaProyecto
            proyectos={proyectos}
            isLoading={cargandoProyectos}
            seleccionarProyecto={handleSeleccionarProyecto}
          />
          
          <div className="button-group mt-4">
            <Button 
              variant="secondary" 
              type="button" 
              size="lg" 
              className="btn-custom btn-secondary-custom"
              onClick={() => navigate('/ver-proyectos')}
            >
              Volver
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="nuevo-proyecto-wrapper">
      <Card className="nuevo-proyecto-card">
        <ProyectoFormHeader 
          tipoProyecto={tipoProyectoSeleccionado} 
          error={form.error}
          isEditing={true}
          proyectoSeleccionado={proyectoSeleccionado}
        />
        
        <Form className="py-3" onSubmit={onSubmit}>
          {/* Tipo de Proyecto */}
          <Form.Group controlId="tipo_proyecto" className="form-group-custom">
            <Form.Label className="form-label-custom">
              Tipo de Proyecto <span className="required-field">*</span>
              <HelpTooltip 
                fieldName="tipo_proyecto" 
                content="El tipo de proyecto no puede ser modificado después de creado." 
              />
            </Form.Label>
            <Form.Control
              type="text"
              size="lg"
              value={tipoProyectoSeleccionado?.nombre || ''}
              readOnly
              className="form-control-custom form-control-readonly"
              onFocus={() => toggleTooltip('tipo_proyecto')}
            />
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
                <Form.Label className="form-label-custom">
                  Fecha de Inicio <span className="required-field">*</span>
                  <HelpTooltip 
                    fieldName="fecha_inicio" 
                    content="Modificar esta fecha puede afectar el código del proyecto." 
                  />
                </Form.Label>
                <Form.Control
                  type="date"
                  size="lg"
                  value={form.fecha_inicio}
                  onChange={(e) => form.handleFechaInicioChange(e.target.value)}
                  required
                  className="form-control-custom"
                  onFocus={() => toggleTooltip('fecha_inicio')}
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group controlId="fecha_fin" className="form-group-custom">
                <Form.Label className="form-label-custom">
                  Fecha de Fin
                  {tipoProyectoSeleccionado?.duracion_meses && form.fecha_inicio && (
                    <HelpTooltip 
                      fieldName="fecha_fin" 
                      content={`Máximo ${tipoProyectoSeleccionado.duracion_meses} meses desde la fecha de inicio`} 
                    />
                  )}
                </Form.Label>
                <Form.Control
                  type="date"
                  size="lg"
                  value={form.fecha_fin}
                  onChange={(e) => form.handleFechaFinChange(e.target.value)}
                  max={form.fechaFinMaxima}
                  isInvalid={!!form.fechaFinError}
                  className="form-control-custom"
                  onFocus={() => tipoProyectoSeleccionado?.duracion_meses && form.fecha_inicio && toggleTooltip('fecha_fin')}
                />
                {form.fechaFinError && (
                  <Form.Control.Feedback type="invalid">
                    {form.fechaFinError}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </div>
          </div>

          {/* Código y Estado */}
          <div className="row">
            <div className="col-md-6">
              <Form.Group controlId="codigo_proyecto" className="form-group-custom">
                <Form.Label className="form-label-custom">
                  Código del Proyecto <span className="required-field">*</span>
                  <HelpTooltip 
                    fieldName="codigo_proyecto" 
                    content="El código puede ser modificado manualmente." 
                  />
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Código del proyecto"
                  size="lg"
                  value={form.codigo_proyecto}
                  onChange={(e) => form.setCodigo_proyecto(e.target.value)}
                  className="form-control-custom"
                  onFocus={() => toggleTooltip('codigo_proyecto')}
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group controlId="id_estado_proyecto" className="form-group-custom">
                <Form.Label className="form-label-custom">
                  Estado del Proyecto <span className="required-field">*</span>
                  {form.id_estado_proyecto && getSelectedEstadoDescripcion() && (
                    <div className="tooltip-container" style={{ display: 'inline-block', marginLeft: '8px' }}>
                      <HelpCircle size={16} className="help-icon" />
                      <div className="tooltip">
                        {getSelectedEstadoDescripcion()}
                      </div>
                    </div>
                  )}
                </Form.Label>
                <Form.Control
                  as="select"
                  size="lg"
                  value={form.id_estado_proyecto}
                  onChange={(e) => form.setId_estado_proyecto(e.target.value)}
                  disabled={form.isLoading}
                  required
                  className="form-control-custom"
                  onFocus={() => form.id_estado_proyecto && getSelectedEstadoDescripcion() && toggleTooltip('estado_proyecto')}
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
            <Form.Label className="form-label-custom">
              Director del Proyecto <span className="required-field">*</span>
              <HelpTooltip 
                fieldName="director_proyecto" 
                content="Ingrese al menos un nombre y un apellido, máximo dos nombres y dos apellidos." 
              />
            </Form.Label>
            <Form.Control
              type='text'
              placeholder="Ej: Juan Pérez o Juan Carlos Pérez González"
              size="lg"
              value={form.id_director_proyecto}
              onChange={(e) => form.handleDirectorChange(e.target.value)}
              isInvalid={!!form.directorError}
              required
              className="form-control-custom"
              onFocus={() => toggleTooltip('director_proyecto')}
            />
            {form.directorError && (
              <Form.Control.Feedback type="invalid">
                {form.directorError}
              </Form.Control.Feedback>
            )}
          </Form.Group>

          {/* Presupuesto */}
          <Form.Group controlId="presupuesto_aprobado" className="form-group-custom">
            <Form.Label className="form-label-custom">
              Presupuesto Aprobado
              <HelpTooltip 
                fieldName="presupuesto_aprobado" 
                content={tipoProyectoSeleccionado?.presupuesto_maximo ? 
                  `El presupuesto debe ser un valor positivo y no debe exceder ${tipoProyectoSeleccionado.presupuesto_maximo.toLocaleString('es-CO')}` : 
                  'El presupuesto debe ser un valor positivo'} 
              />
            </Form.Label>
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
              onFocus={() => toggleTooltip('presupuesto_aprobado')}
            />
            {form.presupuestoError && (
              <Form.Control.Feedback type="invalid">
                {form.presupuestoError}
              </Form.Control.Feedback>
            )}
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
              onClick={() => setProyectoSeleccionado(null)}
            >
              Cambiar Proyecto
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              size="lg" 
              className="btn-custom btn-primary-custom"
              disabled={form.isLoading}
            >
              {form.isLoading ? 'Actualizando...' : 'Actualizar Proyecto'}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default EditarProyecto;

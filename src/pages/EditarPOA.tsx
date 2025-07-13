import React from 'react';
import { Form, Button, Container, Card, Row, Col } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { usePOAForm } from '../hooks/usePOAForm';
import { POAFormHeader } from '../components/POAFormHeader';
import { PeriodoSelector } from '../components/PeriodoSelector';
import { PeriodoConfigurator } from '../components/PeriodoConfigurator';
import ProyectoSeleccionadoCard from '../components/ProyectoSeleccionadoCard';
import BusquedaProyecto from '../components/BusquedaProyecto';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/NuevoPOA.css';

const EditarPOA: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Initialize our custom hook for editing
  const form = usePOAForm({ isEditing: true });

  // Submit form handler that performs navigation after successful submission
  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const success = await form.handleSubmit();
    if (success) {
      navigate('/dashboard'); // Or wherever you want to redirect after editing
    }
  };

  return (
    <Container className="py-4">
      <Card className="shadow-lg">
        <POAFormHeader 
          error={form.error} 
          isEditing={true}
          poaId={id}
        />
        <Card.Body className="p-4">
          <Form onSubmit={onSubmit}>
            {/* Sección de Proyecto */}
            <BusquedaProyecto 
              proyectos={form.proyectos}
              isLoading={form.isLoading}
              seleccionarProyecto={form.seleccionarProyecto}
              validarProyecto={form.validarProyectoParaEdicion}
              mostrarValidacion={true}
              modoEdicion={true}
            />
            
            {/* Información sobre el proyecto seleccionado */}
            {form.proyectoSeleccionado && (
              <ProyectoSeleccionadoCard 
                proyectoSeleccionado={form.proyectoSeleccionado} 
                periodosCalculados={form.periodosCalculados} 
              />
            )}
            
            {/* Sección de Selección de Periodos */}
            {form.proyectoSeleccionado && (
              <PeriodoSelector
                periodosCalculados={form.periodosCalculados}
                periodosSeleccionados={form.periodosSeleccionados}
                seleccionarPeriodo={form.seleccionarPeriodo}
                quitarPeriodo={form.quitarPeriodo}
                showCrearPeriodo={form.showCrearPeriodo}
                setShowCrearPeriodo={form.setShowCrearPeriodo}
                nuevoPeriodo={form.nuevoPeriodo}
                handleChangePeriodo={form.handleChangePeriodo}
                handleGuardarPeriodo={form.handleGuardarPeriodo}
                handleAbrirModalPeriodo={form.handleAbrirModalPeriodo}
                presupuestoTotalAsignado={form.presupuestoTotalAsignado}
                presupuestoRestante={form.presupuestoRestante}
                isEditing={true}
              />
            )}
              
            {/* Sección de Configuración de POA */}
            {form.proyectoSeleccionado && form.periodosSeleccionados.length > 0 && (
              <PeriodoConfigurator
                periodosSeleccionados={form.periodosSeleccionados}
                periodoActual={form.periodoActual}
                setPeriodoActual={form.setPeriodoActual}
                presupuestoPorPeriodo={form.presupuestoPorPeriodo}
                codigoPorPeriodo={form.codigoPorPeriodo}
                anioPorPeriodo={form.anioPorPeriodo}
                anioPorPeriodoError={form.anioPorPeriodoError}
                setCodigoPorPeriodo={form.setCodigoPorPeriodo}
                setAnioPorPeriodo={form.setAnioPorPeriodo}
                handlePresupuestoChange={form.handlePresupuestoChange}
                presupuestoError={form.presupuestoError}
              />
            )}
              
            {/* Botones de acción */}
            <Row>
              <Col md={12} className="d-flex justify-content-end gap-2">
                <Button variant="secondary" type="button" onClick={() => navigate('/dashboard')}>
                  Cancelar
                </Button>
                <Button 
                  variant="warning" 
                  type="submit"
                  disabled={form.isLoading || !form.proyectoSeleccionado || form.periodosSeleccionados.length === 0}
                >
                  {form.isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Actualizando...
                    </>
                  ) : 'Actualizar POA'}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EditarPOA;

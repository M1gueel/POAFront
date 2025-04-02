import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card, Row, Col } from 'react-bootstrap';

// Interfaces para los tipos de datos que vendrán de la API
interface Proyecto {
  id: string;
  codigo_proyecto: string;
  titulo: string;
}

interface Periodo {
  id_periodo: string;
  codigo_periodo: string;
  nombre_periodo: string;
  fecha_inicio: string;
  fecha_fin: string;
  anio: string | null;
  mes: string | null;
}

interface EstadoPOA {
  id: string;
  nombre: string;
}

interface TipoPOA {
  id: string;
  nombre: string;
}

export interface POAFormProps {
  id_proyecto: string;
  id_periodo: string;
  id_estado_poa: string;
  id_tipo_poa: string;
}

const AgregarPOA: React.FC<Partial<POAFormProps>> = ({ 
  id_proyecto: initialIdProyecto = '', 
  id_periodo: initialIdPeriodo = '', 
  id_estado_poa: initialIdEstadoPoa = '', 
  id_tipo_poa: initialIdTipoPoa = '' 
}) => {
  // Estados para campos del formulario
  const [id_proyecto, setIdProyecto] = useState(initialIdProyecto);
  const [id_periodo, setIdPeriodo] = useState(initialIdPeriodo);
  const [id_estado_poa, setIdEstadoPoa] = useState(initialIdEstadoPoa);
  const [id_tipo_poa, setIdTipoPoa] = useState(initialIdTipoPoa);
  const [codigo_poa, setCodigoPoa] = useState('');
  const [anio_ejecucion, setAnioEjecucion] = useState('');
  const [presupuesto_asignado, setPresupuestoAsignado] = useState('');
  
  // Estados para las listas de opciones
  const [proyectoInfo, setProyectoInfo] = useState<Proyecto | null>(null);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [estadosPOA, setEstadosPOA] = useState<EstadoPOA[]>([]);
  const [tiposPOA, setTiposPOA] = useState<TipoPOA[]>([]);
  
  // Estado para controlar si se muestra el modal de agregar periodo
  const [mostrarFormularioPeriodo, setMostrarFormularioPeriodo] = useState(false);
  
  // Estados para mostrar mensajes de carga o error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lista de años disponibles
  const aniosDisponibles = ["2020", "2021", "2022", "2023", "2024", "2025", "2026"];

  // Efecto para cargar los datos cuando el componente se monte
  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Si tenemos un id_proyecto, cargar la información del proyecto
        if (id_proyecto) {
          const proyectoRes = await fetch(`/api/proyectos/${id_proyecto}`);
          if (!proyectoRes.ok) throw new Error('Error al cargar la información del proyecto');
          const proyectoData = await proyectoRes.json();
          setProyectoInfo(proyectoData);
        }

        // Cargar las demás listas necesarias
        const [periodosRes, estadosRes, tiposRes] = await Promise.all([
          fetch('/api/periodos'),
          fetch('/api/estados-poa'),
          fetch('/api/tipos-poa')
        ]);
        
        if (!periodosRes.ok) throw new Error('Error al cargar periodos');
        if (!estadosRes.ok) throw new Error('Error al cargar estados de POA');
        if (!tiposRes.ok) throw new Error('Error al cargar tipos de POA');
        
        const periodosData = await periodosRes.json();
        const estadosData = await estadosRes.json();
        const tiposData = await tiposRes.json();
        
        setPeriodos(periodosData);
        setEstadosPOA(estadosData);
        setTiposPOA(tiposData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarDatos();
  }, [id_proyecto]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Aquí puedes manejar el envío del formulario
    console.log({
      id_proyecto,
      id_periodo,
      codigo_poa,
      id_estado_poa,
      id_tipo_poa,
      anio_ejecucion,
      presupuesto_asignado,
    });
    
    // Aquí iría la lógica para enviar los datos al backend
  };

  // Función para abrir el formulario de creación de periodo
  const abrirFormularioPeriodo = () => {
    setMostrarFormularioPeriodo(true);
  };

  // Función para manejar la creación de un nuevo periodo
  const handleNuevoPeriodo = (nuevoPeriodo: Periodo) => {
    setPeriodos([...periodos, nuevoPeriodo]);
    setIdPeriodo(nuevoPeriodo.id_periodo);
    setMostrarFormularioPeriodo(false);
  };

  // Función para obtener el nombre del tipo de POA
  const getTipoPOANombre = () => {
    const tipoPOA = tiposPOA.find(t => t.id === id_tipo_poa);
    return tipoPOA ? tipoPOA.nombre : 'Tipo no encontrado';
  };

  return (
    <Container className="d-flex justify-content-center align-items-start py-5" style={{ minHeight: '100vh' }}>
      <Card className="p-5 shadow-lg" style={{ width: '80%', maxWidth: '900px' }}>
        <div className="text-center mb-4 bg-primary bg-gradient text-white p-3 rounded-3 shadow-sm">
          <h2 className="mb-0 fw-bold">Agregar POA</h2>
        </div>
        
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        <Form className="py-3" onSubmit={handleSubmit}>
          {/* Información del proyecto (solo lectura) */}
          <Form.Group controlId="proyecto_info" className="mb-4">
            <Form.Label className="fw-semibold">Proyecto</Form.Label>
            <Form.Control
              type="text"
              size="lg"
              value={proyectoInfo ? `${proyectoInfo.codigo_proyecto} - ${proyectoInfo.titulo}` : 'Cargando información del proyecto...'}
              disabled
            />
            <Form.Control type="hidden" value={id_proyecto} />
          </Form.Group>
          
          {/* Mostrar información del tipo de POA si ya viene predefinido */}
          {initialIdTipoPoa ? (
            <Form.Group controlId="tipo_poa_info" className="mb-4">
              <Form.Label className="fw-semibold">Tipo de POA</Form.Label>
              <Form.Control
                type="text"
                size="lg"
                value={getTipoPOANombre()}
                disabled
              />
              <Form.Control type="hidden" value={id_tipo_poa} />
            </Form.Group>
          ) : (
            <Form.Group controlId="id_tipo_poa" className="mb-4">
              <Form.Label className="fw-semibold">Tipo de POA</Form.Label>
              <Form.Control
                as="select"
                size="lg"
                value={id_tipo_poa}
                onChange={(e) => setIdTipoPoa(e.target.value)}
                disabled={isLoading}
              >
                <option value="">Seleccione un tipo de POA...</option>
                {tiposPOA.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
          )}

          <Form.Group controlId="codigo_poa" className="mb-4">
            <Form.Label className="fw-semibold">Código del POA</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingrese el código"
              size="lg"
              value={codigo_poa}
              onChange={(e) => setCodigoPoa(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="id_periodo" className="mb-4">
            <Form.Label className="fw-semibold">Periodo</Form.Label>
            <Row>
              <Col>
                <Form.Control
                  as="select"
                  size="lg"
                  value={id_periodo}
                  onChange={(e) => setIdPeriodo(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">Seleccione un periodo...</option>
                  {periodos.map(periodo => (
                    <option key={periodo.id_periodo} value={periodo.id_periodo}>
                      {periodo.codigo_periodo} - {periodo.nombre_periodo} ({periodo.anio ? periodo.anio : 'Sin año'})
                    </option>
                  ))}
                </Form.Control>
              </Col>
              <Col xs="auto">
                <Button 
                  variant="outline-primary" 
                  size="lg" 
                  onClick={abrirFormularioPeriodo}
                >
                  Nuevo Periodo
                </Button>
              </Col>
            </Row>
          </Form.Group>

          <Form.Group controlId="id_estado_poa" className="mb-4">
            <Form.Label className="fw-semibold">Estado del POA</Form.Label>
            <Form.Control
              as="select"
              size="lg"
              value={id_estado_poa}
              onChange={(e) => setIdEstadoPoa(e.target.value)}
              disabled={isLoading}
            >
              <option value="">Seleccione un estado...</option>
              {estadosPOA.map(estado => (
                <option key={estado.id} value={estado.id}>
                  {estado.nombre}
                </option>
              ))}
            </Form.Control>
          </Form.Group>

          <Form.Group controlId="anio_ejecucion" className="mb-4">
            <Form.Label className="fw-semibold">Año de Ejecución</Form.Label>
            <Form.Control
              as="select"
              size="lg"
              value={anio_ejecucion}
              onChange={(e) => setAnioEjecucion(e.target.value)}
            >
              <option value="">Seleccione el año de ejecución...</option>
              {aniosDisponibles.map(anio => (
                <option key={anio} value={anio}>
                  {anio}
                </option>
              ))}
            </Form.Control>
          </Form.Group>

          <Form.Group controlId="presupuesto_asignado" className="mb-4">
            <Form.Label className="fw-semibold">Presupuesto Asignado</Form.Label>
            <Form.Control
              type="number"
              placeholder="Ingrese el presupuesto"
              size="lg"
              value={presupuesto_asignado}
              onChange={(e) => setPresupuestoAsignado(e.target.value)}
            />
          </Form.Group>

          <div className="text-center mt-5 d-flex justify-content-center gap-4">
            <Button variant="secondary" type="button" size="lg" className="px-4 py-2">
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              size="lg" 
              className="px-4 py-2"
              disabled={isLoading}
            >
              {isLoading ? 'Cargando...' : 'Agregar POA'}
            </Button>
          </div>
        </Form>
      </Card>

      {/* Este componente representaría el formulario para crear un nuevo periodo */}
      {mostrarFormularioPeriodo && (
        <div className="modal-backdrop show" style={{ display: 'block' }}>
          <div className="modal show" style={{ display: 'block' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">Crear Nuevo Periodo</h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={() => setMostrarFormularioPeriodo(false)}
                  />
                </div>
                <div className="modal-body">
                  <p className="text-muted">
                    Aquí se integraría el componente para crear un nuevo periodo. 
                    Una vez creado, se añadiría a la lista de periodos disponibles.
                  </p>
                  {/* 
                    TODO:Aquí iría la implementación del formulario similar a:
                    <CrearPeriodo onPeriodoCreado={handleNuevoPeriodo} onCancel={() => setMostrarFormularioPeriodo(false)} />
                  */}
                  <div className="d-flex justify-content-end mt-3">
                    <Button 
                      variant="secondary" 
                      className="me-2"
                      onClick={() => setMostrarFormularioPeriodo(false)}
                    >
                      Cancelar
                    </Button>
                    <Button variant="primary">
                      Crear Periodo
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default AgregarPOA;
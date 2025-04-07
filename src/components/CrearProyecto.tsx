import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { TipoProyecto, EstadoProyecto, DirectorProyecto } from '../interfaces/project';

interface LocationState {
  tipoProyecto: TipoProyecto;
}

const CrearProyecto: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  // Estados para campos del formulario
  const [codigo_proyecto, setCodigo_proyecto] = useState('');
  const [titulo, setTitulo] = useState('');
  const [tipoProyecto, setTipoProyecto] = useState<TipoProyecto | null>(null);
  const [id_estado_proyecto, setId_estado_proyecto] = useState('');
  const tipoProyectoId = tipoProyecto?.id_tipo_proyecto;
  const [presupuesto_aprobado, setPresupuesto_aprobado] = useState('');
  const [fecha_inicio, setFecha_inicio] = useState('');
  const [fecha_fin, setFecha_fin] = useState('');
  const [fecha_prorroga, setFecha_prorroga] = useState('');
  const [tiempo_prorroga_meses, setTiempo_prorroga_meses] = useState('');
  
  // Estados para las listas de opciones
  const [estadosProyecto, setEstadosProyecto] = useState<EstadoProyecto[]>([]);
  const [directoresProyecto, setDirectoresProyecto] = useState<DirectorProyecto[]>([]);
  
  // Estados para mensajes de carga o error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generar código aleatorio para el proyecto
  const generateRandomCode = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
  };

  // Efecto para inicializar el tipo de proyecto desde la navegación
  useEffect(() => {
    if (state && state.tipoProyecto) {
      setTipoProyecto(state.tipoProyecto);
      // Generar código de proyecto basado en el tipo
      setCodigo_proyecto(`${state.tipoProyecto.codigo_tipo}-${generateRandomCode()}`);
    } else {
      // Si no hay datos en state, redirigir a la selección de tipo
      setError('Por favor seleccione un tipo de proyecto');
      // Opcionalmente, redirigir después de un tiempo
      // setTimeout(() => navigate('/tipos-proyecto'), 3000);
    }
  }, [state, navigate]);

  // Efecto para cargar los datos al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Aquí irían las llamadas a la API para cargar datos
        // Simulación de carga de datos
        setTimeout(() => {
          // Datos de ejemplo
          const mockEstadosProyecto: EstadoProyecto[] = [
            { id_estado_proyecto: '1', nombre: 'Nuevo' },
            { id_estado_proyecto: '2', nombre: 'En Revisión' },
            { id_estado_proyecto: '3', nombre: 'Aprobado' },
            { id_estado_proyecto: '4', nombre: 'En Ejecución' },
            { id_estado_proyecto: '5', nombre: 'Finalizado' }
          ];
          
          const mockDirectoresProyecto: DirectorProyecto[] = [
            { id_usuario: '1', nombre_usuario: 'Juan Pérez' },
            { id_usuario: '2', nombre_usuario: 'María García' },
            { id_usuario: '3', nombre_usuario: 'Carlos Rodríguez' },
            { id_usuario: '4', nombre_usuario: 'Ana Martínez' }
          ];
          
          setEstadosProyecto(mockEstadosProyecto);
          setDirectoresProyecto(mockDirectoresProyecto);
          setIsLoading(false);
        }, 500);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error(err);
        setIsLoading(false);
      }
    };
    
    cargarDatos();
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validación de campos requeridos
    if (!codigo_proyecto || !titulo || !tipoProyecto || !id_estado_proyecto) {
      setError('Por favor complete los campos obligatorios');
      return;
    }
    
    // Aquí iría la lógica para enviar datos al backend
    console.log('Enviando datos del formulario...', {
      codigo_proyecto,
      titulo,
      id_tipo_proyecto: tipoProyecto.id_tipo_proyecto,
      id_estado_proyecto,
      //id_director_proyecto,
      presupuesto_aprobado,
      fecha_inicio,
      fecha_fin,
      fecha_prorroga,
      tiempo_prorroga_meses
    });
    
    // Mostrar mensaje de éxito
    alert('Proyecto creado con éxito');
  };

  return (
    <Container className="d-flex justify-content-center align-items-start py-5" style={{ minHeight: '100vh' }}>
      <Card className="p-5 shadow-lg" style={{ width: '80%', maxWidth: '900px' }}>
        <div className="text-center mb-4 bg-primary bg-gradient text-white p-3 rounded-3 shadow-sm">
          <h2 className="mb-0 fw-bold">Nuevo Proyecto</h2>
          {tipoProyecto && <p className="mt-2 mb-0">Tipo: {tipoProyecto.nombre}</p>}
        </div>
        
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        <Form className="py-3" onSubmit={handleSubmit}>
          <Form.Group controlId="tipo_proyecto" className="mb-4">
            <Form.Label className="fw-semibold">Tipo de Proyecto <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              size="lg"
              value={tipoProyecto?.nombre || ''}
              readOnly
              className="bg-light"
            />
            <Form.Text className="text-muted">
              El tipo de proyecto no puede ser modificado después de seleccionado.
            </Form.Text>
          </Form.Group>
          
          <Form.Group controlId="codigo_proyecto" className="mb-4">
            <Form.Label className="fw-semibold">Código del Proyecto <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="Código generado automáticamente"
              size="lg"
              value={codigo_proyecto}
              onChange={(e) => setCodigo_proyecto(e.target.value)}
              readOnly
              className="bg-light"
            />
            <Form.Text className="text-muted">
              El código se genera automáticamente según el tipo de proyecto seleccionado.
            </Form.Text>
          </Form.Group>
                    
          <Form.Group controlId="titulo" className="mb-4">
            <Form.Label className="fw-semibold">Título <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingrese el título"
              size="lg"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group controlId="id_estado_proyecto" className="mb-4">
            <Form.Label className="fw-semibold">Estado del Proyecto <span className="text-danger">*</span></Form.Label>
            <Form.Control
              as="select"
              size="lg"
              value={id_estado_proyecto}
              onChange={(e) => setId_estado_proyecto(e.target.value)}
              disabled={isLoading}
              required
            >
              <option value="">Seleccione...</option>
              {estadosProyecto.map(estado => (
                <option key={estado.id_estado_proyecto} value={estado.id_estado_proyecto}>
                  {estado.nombre}
                </option>
              ))}
            </Form.Control>
          </Form.Group>

          <Form.Group controlId="id_director_proyecto" className="mb-4">
            <Form.Label className="fw-semibold">Director del Proyecto</Form.Label>
            <Form.Control
              as="select"
              size="lg"
              //value={id_director_proyecto}
              //onChange={(e) => setId_director_proyecto(e.target.value)}
              disabled={isLoading}
            >
              <option value="">Seleccione...</option>
              {directoresProyecto.map(director => (
                <option key={director.id_usuario} value={director.id_usuario}>
                  {director.nombre_usuario}
                </option>
              ))}
            </Form.Control>
          </Form.Group>

          <Form.Group controlId="presupuesto_aprobado" className="mb-4">
            <Form.Label className="fw-semibold">Presupuesto Aprobado</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              placeholder="Ingrese el presupuesto"
              size="lg"
              value={presupuesto_aprobado}
              onChange={(e) => setPresupuesto_aprobado(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="fecha_inicio" className="mb-4">
            <Form.Label className="fw-semibold">Fecha de Inicio</Form.Label>
            <Form.Control
              type="date"
              size="lg"
              value={fecha_inicio}
              onChange={(e) => setFecha_inicio(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="fecha_fin" className="mb-4">
            <Form.Label className="fw-semibold">Fecha de Fin</Form.Label>
            <Form.Control
              type="date"
              size="lg"
              value={fecha_fin}
              onChange={(e) => setFecha_fin(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="fecha_prorroga" className="mb-4">
            <Form.Label className="fw-semibold">Fecha de Prórroga</Form.Label>
            <Form.Control
              type="date"
              size="lg"
              value={fecha_prorroga}
              onChange={(e) => setFecha_prorroga(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="tiempo_prorroga_meses" className="mb-4">
            <Form.Label className="fw-semibold">Tiempo de Prórroga (meses)</Form.Label>
            <Form.Control
              type="number"
              placeholder="Ingrese el tiempo de prórroga"
              size="lg"
              value={tiempo_prorroga_meses}
              onChange={(e) => setTiempo_prorroga_meses(e.target.value)}
            />
          </Form.Group>
                
          <div className="text-center mt-5 d-flex justify-content-center gap-4">
            <Button 
              variant="secondary" 
              type="button" 
              size="lg" 
              className="px-4 py-2"
              onClick={() => navigate('/tipos-proyecto')}
            >
              Volver
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              size="lg" 
              className="px-4 py-2"
              disabled={isLoading}
            >
              {isLoading ? 'Cargando...' : 'Crear Proyecto'}
            </Button>
          </div>
        </Form>
      </Card>
    </Container>
  );
};

export default CrearProyecto;
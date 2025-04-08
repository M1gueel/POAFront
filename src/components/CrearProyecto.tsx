import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { TipoProyecto, EstadoProyecto } from '../interfaces/project';
import { projectAPI } from '../api/projectAPI';
import { authAPI, rolAPI, userAPI } from '../api/userAPI';
import { UserProfile } from '../interfaces/user';

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
  const [director_nombre, setDirector_nombre] = useState(''); // Cambio: ahora es un campo de texto
  const [presupuesto_aprobado, setPresupuesto_aprobado] = useState('');
  const [fecha_inicio, setFecha_inicio] = useState('');
  const [fecha_fin, setFecha_fin] = useState('');
  const [fecha_prorroga, setFecha_prorroga] = useState('');
  const [fecha_prorroga_inicio, setFecha_prorroga_inicio] = useState(''); // Nuevo campo
  const [fecha_prorroga_fin, setFecha_prorroga_fin] = useState(''); // Nuevo campo
  const [tiempo_prorroga_meses, setTiempo_prorroga_meses] = useState('');
  // campo para el usuario 
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Estados para las listas de opciones
  const [estadosProyecto, setEstadosProyecto] = useState<EstadoProyecto[]>([]);
  
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
    }
  }, [state, navigate]);

  // Efecto para cargar los datos al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Cargar los estados de proyecto desde la API
        const estadosData = await projectAPI.getEstadosProyecto();
        setEstadosProyecto(estadosData);
        
        // Seleccionar el primer estado por defecto si existe
        if (estadosData.length > 0) {
          setId_estado_proyecto(estadosData[0].id_estado_proyecto);
        }
        
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error(err);
        setIsLoading(false);
      }
    };
    
    cargarDatos();
  }, []);

  // Efecto para cargar el usuario actual y su rol
  useEffect(() => {
    const cargarUsuarioActual = async () => {
      try {
        const perfilUsuario = await userAPI.getPerfilUsuario();
        setCurrentUser(perfilUsuario);
        // El director va a ser el usuario actual
        setDirector_nombre(perfilUsuario.nombre);
      } catch (err) {
        console.error("Error al cargar el usuario actual:", err);
        setError("No se pudo cargar el usuario actual. Por favor, recarga la página.");
      }
    };
    
    cargarUsuarioActual();
  }, []);

  // Función para crear un usuario director
  // const crearUsuarioDirector = async (nombre: string): Promise<string> => {
  //   try {
  //     // Generar email a partir del nombre (quitar espacios)
  //     const email = `${nombre.replace(/\s+/g, '')}@epn.edu.ec`.toLowerCase();
      
  //     // Buscar el ID del rol de Director de Proyecto
  //     const roles = await rolAPI.getRoles(); 
  //     const rolDirector = roles.find(r => r.nombre_rol === "Director de Proyecto");
      
  //     if (!rolDirector) {
  //       throw new Error("No se encontró el rol de Director de Proyecto");
  //     }
      
  //     // Registrar el nuevo usuario
  //     await authAPI.register({
  //       nombre_usuario: nombre,
  //       email: email,
  //       password: "12345",
  //       id_rol: rolDirector.id_rol
  //     });
      
  //     // Obtener el ID del usuario recién creado
  //     // Simulación - En un caso real necesitaríamos una API para obtener el ID por email
  //     // Esta parte requeriría un endpoint adicional o devolver el ID al crear el usuario
      
  //     // Por ahora, retornamos un ID simulado (esto deberá ser reemplazado)
  //     return "temp-user-id";
  //   } catch (error) {
  //     console.error("Error al crear el usuario director:", error);
  //     throw error;
  //   }
  // };

  // Función para manejar el envío del formulario
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validación de campos requeridos
    if (!codigo_proyecto || !titulo || !tipoProyecto || !id_estado_proyecto) {
      setError('Por favor complete los campos obligatorios');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Preparar datos para enviar al backend
      const proyectoData = {
        codigo_proyecto, // Sin acento
        titulo,
        id_tipo_proyecto: tipoProyecto.id_tipo_proyecto,
        id_estado_proyecto,
        // No incluimos id_director_proyecto, el backend usará el usuario actual
        presupuesto_aprobado: presupuesto_aprobado ? parseFloat(presupuesto_aprobado) : 0,
        fecha_inicio,
        fecha_fin,
        // Solo incluir campos de prórroga si tienen valor
        ...(fecha_prorroga ? { fecha_prorroga } : {}),
        ...(fecha_prorroga_inicio ? { fecha_prorroga_inicio } : {}),
        ...(fecha_prorroga_fin ? { fecha_prorroga_fin } : {}),
        // El backend agregará la fecha de creación
      };
      
      console.log("Enviando datos:", proyectoData); // Para depuración
      
      // Enviar datos al backend
      await projectAPI.crearProyecto(proyectoData);
      
      // Mostrar mensaje de éxito
      alert('Proyecto creado con éxito');
      navigate('/proyectos');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear el proyecto';
      console.error(errorMessage, err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
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

          <Form.Group controlId="director_nombre" className="mb-4">
            <Form.Label className="fw-semibold">Director del Proyecto <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              size="lg"
              value={director_nombre}
              readOnly
              className="bg-light"
            />
            <Form.Text className="text-muted">
              Como usuario actual, serás asignado automáticamente como director de este proyecto.
            </Form.Text>
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

        <div className="mt-5 mb-4 border-top pt-4">
        <h4 className="mb-3">Datos de Prórroga <span className="text-muted fs-6">(Opcional)</span></h4>  

          <Form.Group controlId="fecha_prorroga" className="mb-4">
            <Form.Label className="fw-semibold">Fecha de Prórroga <span className="text-muted">(Opcional)</span></Form.Label>
            <Form.Control
              type="date"
              size="lg"
              value={fecha_prorroga}
              onChange={(e) => setFecha_prorroga(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="fecha_prorroga_inicio" className="mb-4">
            <Form.Label className="fw-semibold">Fecha de Inicio de Prórroga <span className="text-muted">(Opcional)</span></Form.Label>
            <Form.Control
              type="date"
              size="lg"
              value={fecha_prorroga_inicio}
              onChange={(e) => setFecha_prorroga_inicio(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="fecha_prorroga_fin" className="mb-4">
            <Form.Label className="fw-semibold">Fecha de Fin de Prórroga <span className="text-muted">(Opcional)</span></Form.Label>
            <Form.Control
              type="date"
              size="lg"
              value={fecha_prorroga_fin}
              onChange={(e) => setFecha_prorroga_fin(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="tiempo_prorroga_meses" className="mb-4">
            <Form.Label className="fw-semibold">Tiempo de Prórroga (meses) <span className="text-muted">(Opcional)</span></Form.Label>
            <Form.Control
              type="number"
              placeholder="Ingrese el tiempo de prórroga"
              size="lg"
              value={tiempo_prorroga_meses}
              onChange={(e) => setTiempo_prorroga_meses(e.target.value)}
            />
          </Form.Group>
        </div>        
        
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
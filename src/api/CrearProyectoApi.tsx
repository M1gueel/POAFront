import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card } from 'react-bootstrap';

// Interfaces for data types from the API
interface TipoProyecto {
  id_tipo_proyecto: string;
  codigo_tipo: string;
  nombre: string;
  descripcion: string;
}

interface EstadoProyecto {
  id_estado_proyecto: string;
  nombre: string;
}

interface DirectorProyecto {
  id_usuario: string;
  nombre_usuario: string;
}

// Interface for props
interface CrearProyectoApiProps {
  tipoProyectoSeleccionado: TipoProyecto;
  onCancel: () => void;
}

const CrearProyectoApi: React.FC<CrearProyectoApiProps> = ({ tipoProyectoSeleccionado, onCancel }) => {
    // Estado para campos del formulario
    const [codigo_proyecto, setCodigo_proyecto] = useState('');
    const [titulo, setTitulo] = useState('');
    const [id_tipo_proyecto, setId_tipo_proyecto] = useState('');
    const [nombre_tipo_proyecto, setNombre_tipo_proyecto] = useState('');
    const [id_estado_proyecto, setId_estado_proyecto] = useState('');
    const [id_director_proyecto, setId_director_proyecto] = useState('');
    const [presupuesto_aprobado, setPresupuesto_aprobado] = useState('');
    const [fecha_inicio, setFecha_inicio] = useState('');
    const [fecha_fin, setFecha_fin] = useState('');
    const [fecha_prorroga, setFecha_prorroga] = useState('');
    const [tiempo_prorroga_meses, setTiempo_prorroga_meses] = useState('');
    
    // Estados para las listas de opciones
    const [estadosProyecto, setEstadosProyecto] = useState<EstadoProyecto[]>([]);
    const [directoresProyecto, setDirectoresProyecto] = useState<DirectorProyecto[]>([]);
    
    // Estados para mostrar mensajes de carga o error
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Set initial values based on selected project type
    useEffect(() => {
        if (tipoProyectoSeleccionado) {
            setId_tipo_proyecto(tipoProyectoSeleccionado.id_tipo_proyecto);
            setNombre_tipo_proyecto(tipoProyectoSeleccionado.nombre);
            // Set the project code with the project type code as prefix
            setCodigo_proyecto(`${tipoProyectoSeleccionado.codigo_tipo}-${generateRandomCode()}`);
        }
    }, [tipoProyectoSeleccionado]);

    // Generate a random code to append to the project type code
    const generateRandomCode = () => {
        return Math.floor(10000 + Math.random() * 90000).toString();
    };

    // Efecto para cargar los datos cuando el componente se monte
    useEffect(() => {
        const cargarDatos = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                // Mock data for now - will be replaced with actual API calls
                // Estados de proyecto mock
                const mockEstadosProyecto = [
                    { id_estado_proyecto: '1e1e1e1e-1e1e-1e1e-1e1e-1e1e1e1e1e1e', nombre: 'Nuevo' },
                    { id_estado_proyecto: '2e2e2e2e-2e2e-2e2e-2e2e-2e2e2e2e2e2e', nombre: 'En Revisión' },
                    { id_estado_proyecto: '3e3e3e3e-3e3e-3e3e-3e3e-3e3e3e3e3e3e', nombre: 'Aprobado' },
                    { id_estado_proyecto: '4e4e4e4e-4e4e-4e4e-4e4e-4e4e4e4e4e4e', nombre: 'En Ejecución' },
                    { id_estado_proyecto: '5e5e5e5e-5e5e-5e5e-5e5e-5e5e5e5e5e5e', nombre: 'Finalizado' }
                ];
                
                // Directores de proyecto mock
                const mockDirectoresProyecto = [
                    { id_usuario: '1d1d1d1d-1d1d-1d1d-1d1d-1d1d1d1d1d1d', nombre_usuario: 'Juan Pérez' },
                    { id_usuario: '2d2d2d2d-2d2d-2d2d-2d2d-2d2d2d2d2d2d', nombre_usuario: 'María García' },
                    { id_usuario: '3d3d3d3d-3d3d-3d3d-3d3d-3d3d3d3d3d3d', nombre_usuario: 'Carlos Rodríguez' },
                    { id_usuario: '4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d', nombre_usuario: 'Ana Martínez' }
                ];
                
                // Simulate API calls
                setTimeout(() => {
                    setEstadosProyecto(mockEstadosProyecto);
                    setDirectoresProyecto(mockDirectoresProyecto);
                    setIsLoading(false);
                }, 500);
                
                // When integrating with real API, use this:
                // const [estadosRes, directoresRes] = await Promise.all([
                //     fetch('/api/estados-proyecto'),
                //     fetch('/api/directores-proyecto')
                // ]);
                
                // if (!estadosRes.ok) throw new Error('Error al cargar estados de proyecto');
                // if (!directoresRes.ok) throw new Error('Error al cargar directores de proyecto');
                
                // const estados = await estadosRes.json();
                // const directores = await directoresRes.json();
                
                // setEstadosProyecto(estados);
                // setDirectoresProyecto(directores);
                // setIsLoading(false);
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
        
        // Validate required fields
        if (!codigo_proyecto || !titulo || !id_tipo_proyecto || !id_estado_proyecto) {
            setError('Por favor complete los campos obligatorios: código, título, tipo y estado del proyecto');
            return;
        }
        
        // Here goes the logic to send data to the backend
        console.log({
            codigo_proyecto,
            titulo,
            id_tipo_proyecto,
            id_estado_proyecto,
            id_director_proyecto,
            presupuesto_aprobado: presupuesto_aprobado ? parseFloat(presupuesto_aprobado) : null,
            fecha_inicio,
            fecha_fin,
            fecha_prorroga,
            tiempo_prorroga_meses: tiempo_prorroga_meses ? parseInt(tiempo_prorroga_meses) : null
        });
        
        // Show success message
        alert('Proyecto creado con éxito');
    };

    return (
        <Container className="d-flex justify-content-center align-items-start py-5" style={{ minHeight: '100vh' }}>
            <Card className="p-5 shadow-lg" style={{ width: '80%', maxWidth: '900px' }}>
                <div className="text-center mb-4 bg-primary bg-gradient text-white p-3 rounded-3 shadow-sm">
                    <h2 className="mb-0 fw-bold">Nuevo Proyecto</h2>
                    <p className="mt-2 mb-0">Tipo: {tipoProyectoSeleccionado.nombre}</p>
                </div>
                
                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}
                
                <Form className="py-3" onSubmit={handleSubmit}>
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
                    
                    <Form.Group controlId="tipo_proyecto" className="mb-4">
                        <Form.Label className="fw-semibold">Tipo de Proyecto <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="text"
                            size="lg"
                            value={nombre_tipo_proyecto}
                            readOnly
                            className="bg-light"
                        />
                        <Form.Text className="text-muted">
                            El tipo de proyecto seleccionado no puede ser modificado.
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
                            value={id_director_proyecto}
                            onChange={(e) => setId_director_proyecto(e.target.value)}
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
                            onClick={onCancel}
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

export default CrearProyectoApi;
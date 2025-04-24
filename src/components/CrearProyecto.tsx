import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Collapse } from 'react-bootstrap';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TipoProyecto, EstadoProyecto } from '../interfaces/project';
import { projectAPI } from '../api/projectAPI';
import { UserProfile } from '../interfaces/user';
import '../styles/NuevoProyecto.css';
//  TODO: controlar que sean solo dos decimas en el presupuesto aprobado

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
  const [id_director_proyecto, setId_director_proyecto] = useState('');
  const [directorError, setDirectorError] = useState<string | null>(null);
  const [presupuesto_aprobado, setPresupuesto_aprobado] = useState('');
  const [presupuestoError, setPresupuestoError] = useState<string | null>(null);
  const [fecha_inicio, setFecha_inicio] = useState('');
  const [fecha_fin, setFecha_fin] = useState('');
  const [fechaFinError, setFechaFinError] = useState<string | null>(null);
  const [fechaFinMaxima, setFechaFinMaxima] = useState<string>('');
  const [fecha_prorroga, setFecha_prorroga] = useState('');
  const [fecha_prorroga_inicio, setFecha_prorroga_inicio] = useState('');
  const [fecha_prorroga_fin, setFecha_prorroga_fin] = useState('');
  const [tiempo_prorroga_meses, setTiempo_prorroga_meses] = useState('');
  
  // Estado para controlar la expansión de la sección de prórroga
  const [prorrogaOpen, setProrrogaOpen] = useState(false);
  
  // Estados para las listas de opciones
  const [estadosProyecto, setEstadosProyecto] = useState<EstadoProyecto[]>([]);
  
  // Estados para mensajes de carga o error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // campo para el usuario 
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Efecto para inicializar el tipo de proyecto desde la navegación
  useEffect(() => {
    if (state && state.tipoProyecto) {
      setTipoProyecto(state.tipoProyecto);
    } else {
      // Si no hay datos en state, redirigir a la selección de tipo
      setError('Por favor seleccione un tipo de proyecto');
    }
  }, [state, navigate]);

  // Función para actualizar el código de proyecto basado en la fecha de inicio
  const actualizarCodigoProyectoDesdefecha = (fecha: string) => {
    if (fecha && tipoProyecto) {
      const fechaObj = new Date(fecha);
      const anio = fechaObj.getFullYear().toString().slice(-2);
      const mes = ("0" + (fechaObj.getMonth() + 1)).slice(-2);
      
      setCodigo_proyecto(`${tipoProyecto.codigo_tipo}-${anio}-${mes}`);
    }
  };

  // Función para calcular la fecha máxima permitida
  const calcularFechaFinMaxima = (fechaInicio: string, duracionMeses: number): string => {
    if (!fechaInicio || !duracionMeses) return '';
    
    const fechaInicioObj = new Date(fechaInicio);
    const fechaFinObj = new Date(fechaInicioObj);
    
    // Establecer el día exacto después de añadir los meses
    fechaFinObj.setMonth(fechaInicioObj.getMonth() + duracionMeses);
    
    // Ajustar para asegurarnos que sea el mismo día del mes (o el último día si el mes destino es más corto)
    if (fechaFinObj.getDate() !== fechaInicioObj.getDate()) {
      // Si estamos en un día diferente, significa que el mes destino no tiene ese día
      // Volvemos al último día del mes anterior
      fechaFinObj.setDate(0);
    }
    
    // Formatear a YYYY-MM-DD para el valor del input date
    return fechaFinObj.toISOString().split('T')[0];
  };

  // Efecto para calcular la fecha fin automáticamente cuando cambia la fecha de inicio
  useEffect(() => {
    if (fecha_inicio && tipoProyecto?.duracion_meses) {
      const nuevaFechaFinMaxima = calcularFechaFinMaxima(fecha_inicio, tipoProyecto.duracion_meses);
      setFechaFinMaxima(nuevaFechaFinMaxima);
      
      // Actualizar automáticamente la fecha fin si no está establecida o si excede el límite
      if (!fecha_fin || new Date(fecha_fin) > new Date(nuevaFechaFinMaxima)) {
        setFecha_fin(nuevaFechaFinMaxima);
      }
    }
  }, [fecha_inicio, tipoProyecto]);

  // Efecto para cargar los datos al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Cargar los estados de proyecto desde la API
        const estadosData = await projectAPI.getEstadosProyecto();
        setEstadosProyecto(estadosData);
        
        // Siempre establecer el estado inicial a vacío para mostrar "Seleccione..."
        setId_estado_proyecto('');
        
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error(err);
        setIsLoading(false);
      }
    };
    
    cargarDatos();
  }, []);

  //función de validación para el nombre del director:
  const validarDirectorNombre = (nombre: string): boolean => {
    // Patrón para validar: 1-2 nombres seguidos de 1-2 apellidos
    const pattern = /^[A-Za-zÀ-ÖØ-öø-ÿ]+ [A-Za-zÀ-ÖØ-öø-ÿ]+( [A-Za-zÀ-ÖØ-öø-ÿ]+)?( [A-Za-zÀ-ÖØ-öø-ÿ]+)?$/;
    return pattern.test(nombre.trim());
  };

  //manejador para validar el cambio en el campo de presupuesto
  const handlePresupuestoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPresupuesto_aprobado(value);
    
    // Validar que sea un número positivo
    if (value && parseFloat(value) <= 0) {
      setPresupuestoError('El presupuesto debe ser un valor positivo');
      return;
    }
    
    // Validar que no exceda el presupuesto máximo del tipo de proyecto
    if (value && tipoProyecto && tipoProyecto.presupuesto_maximo) {
      if (parseFloat(value) > tipoProyecto.presupuesto_maximo) {
        setPresupuestoError(`El presupuesto no puede exceder ${tipoProyecto.presupuesto_maximo.toLocaleString('es-CO')} para este tipo de proyecto`);
      } else {
        setPresupuestoError(null);
      }
    } else {
      setPresupuestoError(null);
    }
  };
  
  //manejador para los cambios en el campo director
  const handleDirectorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setId_director_proyecto(value);
    
    if (value.trim() !== '') {
      if (!validarDirectorNombre(value)) {
        setDirectorError('El formato debe ser: Nombre Apellido o Nombre1 Nombre2 Apellido1 Apellido2');
      } else {
        setDirectorError(null);
      }
    } else {
      setDirectorError(null);
    }
  };

  // Manejador para cambios en la fecha de inicio
  const handleFechaInicioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevaFecha = e.target.value;
    setFecha_inicio(nuevaFecha);
    actualizarCodigoProyectoDesdefecha(nuevaFecha);
    
    // Resetear la fecha de fin
    setFecha_fin('');
    setFechaFinError(null);
  };

  // Manejador para cambios en la fecha de fin
  const handleFechaFinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevaFechaFin = e.target.value;
    setFecha_fin(nuevaFechaFin);
    
    // Validar que la fecha fin no exceda la duración máxima del proyecto
    if (nuevaFechaFin && fechaFinMaxima && new Date(nuevaFechaFin) > new Date(fechaFinMaxima)) {
      setFechaFinError(`La fecha de fin no puede exceder la duración máxima de ${tipoProyecto?.duracion_meses} meses desde la fecha de inicio`);
    } else {
      setFechaFinError(null);
    }
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validación de campos requeridos
    if (!codigo_proyecto || !titulo || !tipoProyecto || !id_estado_proyecto || !fecha_inicio) {
      setError('Por favor complete los campos obligatorios');
      return;
    }
    
    // Validar el director
    if (!id_director_proyecto.trim()) {
      setError('El director del proyecto es obligatorio');
      return;
    }
    
    if (!validarDirectorNombre(id_director_proyecto)) {
      setError('El formato del nombre del director debe ser: Nombre Apellido o Nombre1 Nombre2 Apellido1 Apellido2');
      return;
    }

    // Validar que el presupuesto si se ha ingresado
    if (presupuesto_aprobado) {
      if (parseFloat(presupuesto_aprobado) <= 0) {
        setError('El presupuesto debe ser un valor positivo');
        return;
      }
      
      // Validar que no exceda el presupuesto máximo del tipo de proyecto
      if (tipoProyecto && tipoProyecto.presupuesto_maximo && 
          parseFloat(presupuesto_aprobado) > tipoProyecto.presupuesto_maximo) {
        setError(`El presupuesto no puede exceder ${tipoProyecto.presupuesto_maximo.toLocaleString('es-CO')} para este tipo de proyecto`);
        return;
      }
    }
    
    // Validar fecha de fin
    if (fecha_fin && fechaFinMaxima && new Date(fecha_fin) > new Date(fechaFinMaxima)) {
      setError(`La fecha de fin no puede exceder la duración máxima de ${tipoProyecto?.duracion_meses} meses desde la fecha de inicio`);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Preparar datos para enviar al backend
      const proyectoData = {
        codigo_proyecto,
        titulo,
        id_tipo_proyecto: tipoProyecto.id_tipo_proyecto,
        id_estado_proyecto,
        id_director_proyecto,
        presupuesto_aprobado: presupuesto_aprobado ? parseFloat(presupuesto_aprobado) : 0,
        fecha_inicio,
        fecha_fin,
      };
      
      console.log("Enviando datos:", proyectoData); // Para depuración
      
      // Enviar datos al backend
      await projectAPI.crearProyecto(proyectoData);
      
      // Mostrar mensaje de éxito
      alert('Proyecto creado con éxito');
      navigate('/crearPOA');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear el proyecto';
      console.error(errorMessage, err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="nuevo-proyecto-wrapper">
      <Card className="nuevo-proyecto-card">
        <div className="nuevo-proyecto-header">
          <h2 className="nuevo-proyecto-title">Nuevo Proyecto</h2>
          {tipoProyecto && (
            <p className="nuevo-proyecto-subtitle">
              Tipo: {tipoProyecto.nombre}
              {tipoProyecto.duracion_meses && (
                <span className="ms-2 text-muted">(Duración máxima: {tipoProyecto.duracion_meses} meses)</span>
              )}
            </p>
          )}
        </div>
        
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
        
        <Form className="py-3" onSubmit={handleSubmit}>
          <Form.Group controlId="tipo_proyecto" className="form-group-custom">
            <Form.Label className="form-label-custom">Tipo de Proyecto <span className="required-field">*</span></Form.Label>
            <Form.Control
              type="text"
              size="lg"
              value={tipoProyecto?.nombre || ''}
              readOnly
              className="form-control-custom form-control-readonly"
            />
            <Form.Text className="form-text-custom">
              El tipo de proyecto no puede ser modificado después de seleccionado.
            </Form.Text>
          </Form.Group>
          
          <Form.Group controlId="titulo" className="form-group-custom">
            <Form.Label className="form-label-custom">Título <span className="required-field">*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingrese el título"
              size="lg"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              className="form-control-custom"
            />
          </Form.Group>

          {/* Fila con Fecha de Inicio y Fecha de Fin */}
          <div className="row">
            <div className="col-md-6">
              <Form.Group controlId="fecha_inicio" className="form-group-custom">
                <Form.Label className="form-label-custom">Fecha de Inicio <span className="required-field">*</span></Form.Label>
                <Form.Control
                  type="date"
                  size="lg"
                  value={fecha_inicio}
                  onChange={handleFechaInicioChange}
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
                  value={fecha_fin}
                  onChange={handleFechaFinChange}
                  max={fechaFinMaxima}
                  isInvalid={!!fechaFinError}
                  className="form-control-custom"
                />
                {fechaFinError && (
                  <Form.Control.Feedback type="invalid">
                    {fechaFinError}
                  </Form.Control.Feedback>
                )}
                {tipoProyecto?.duracion_meses && fecha_inicio && (
                  <Form.Text className="form-text-custom">
                    Máximo {tipoProyecto.duracion_meses} meses desde la fecha de inicio
                  </Form.Text>
                )}
              </Form.Group>
            </div>
          </div>

          {/* Fila con Código del Proyecto y Estado del Proyecto */}
          <div className="row">
            <div className="col-md-6">
              <Form.Group controlId="codigo_proyecto" className="form-group-custom">
                <Form.Label className="form-label-custom">Código del Proyecto <span className="required-field">*</span></Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Se generará automáticamente"
                  size="lg"
                  value={codigo_proyecto}
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
                  value={id_estado_proyecto}
                  onChange={(e) => setId_estado_proyecto(e.target.value)}
                  disabled={isLoading}
                  required
                  className="form-control-custom"
                >
                  <option value="">Seleccione...</option>
                  {estadosProyecto.map(estado => (
                    <option key={estado.id_estado_proyecto} value={estado.id_estado_proyecto}>
                      {estado.nombre}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </div>
          </div>

          <Form.Group controlId="id_director_proyecto" className="form-group-custom">
            <Form.Label className="form-label-custom">Director del Proyecto <span className="required-field">*</span></Form.Label>
            <Form.Control
              type='text'
              placeholder="Ej: Juan Pérez o Juan Carlos Pérez González"
              size="lg"
              value={id_director_proyecto}
              onChange={handleDirectorChange}
              isInvalid={!!directorError}
              required
              className="form-control-custom"
            />
            {directorError && (
              <Form.Control.Feedback type="invalid">
                {directorError}
              </Form.Control.Feedback>
            )}
            <Form.Text className="form-text-custom">
              Ingrese al menos un nombre y un apellido, máximo dos nombres y dos apellidos.
            </Form.Text>
          </Form.Group>

          <Form.Group controlId="presupuesto_aprobado" className="form-group-custom">
            <Form.Label className="form-label-custom">Presupuesto Aprobado</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              min="0.01" 
              placeholder="Ingrese el presupuesto"
              size="lg"
              value={presupuesto_aprobado}
              onChange={handlePresupuestoChange}
              isInvalid={!!presupuestoError}
              className="form-control-custom"
            />
            {presupuestoError && (
              <Form.Control.Feedback type="invalid">
                {presupuestoError}
              </Form.Control.Feedback>
            )}
            <Form.Text className="form-text-custom">
              {tipoProyecto?.presupuesto_maximo ? 
                `El presupuesto debe ser un valor positivo y no debe exceder ${tipoProyecto.presupuesto_maximo.toLocaleString('es-CO')}` : 
                'El presupuesto debe ser un valor positivo'}
            </Form.Text>
          </Form.Group>

          {/* Sección de prórroga colapsable */}
          <div className="prorroga-section">
            <h4 
              className="prorroga-title" 
              onClick={() => setProrrogaOpen(!prorrogaOpen)}
              style={{ cursor: 'pointer' }}
            >
              Datos de Prórroga <span className="text-muted fs-6">(Opcional)</span>
              <span className="ms-2 d-inline-flex align-items-center">
                {prorrogaOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </span>
            </h4>  
            
            <Collapse in={prorrogaOpen}>
              <div>
                <Form.Group controlId="fecha_prorroga" className="form-group-custom">
                  <Form.Label className="form-label-custom">Fecha de Prórroga <span className="text-muted">(Opcional)</span></Form.Label>
                  <Form.Control
                    type="date"
                    size="lg"
                    value={fecha_prorroga}
                    onChange={(e) => setFecha_prorroga(e.target.value)}
                    className="form-control-custom"
                    min={fecha_fin} // La prórroga debe ser después de la fecha de fin original
                  />
                </Form.Group>

                <Form.Group controlId="fecha_prorroga_inicio" className="form-group-custom">
                  <Form.Label className="form-label-custom">Fecha de Inicio de Prórroga <span className="text-muted">(Opcional)</span></Form.Label>
                  <Form.Control
                    type="date"
                    size="lg"
                    value={fecha_prorroga_inicio}
                    onChange={(e) => setFecha_prorroga_inicio(e.target.value)}
                    className="form-control-custom"
                    min={fecha_fin} // Debe iniciar después de la fecha de fin original
                  />
                </Form.Group>

                <Form.Group controlId="fecha_prorroga_fin" className="form-group-custom">
                  <Form.Label className="form-label-custom">Fecha de Fin de Prórroga <span className="text-muted">(Opcional)</span></Form.Label>
                  <Form.Control
                    type="date"
                    size="lg"
                    value={fecha_prorroga_fin}
                    onChange={(e) => setFecha_prorroga_fin(e.target.value)}
                    className="form-control-custom"
                    min={fecha_prorroga_inicio || fecha_fin} // Debe ser después del inicio de prórroga o fecha fin original
                  />
                </Form.Group>

                <Form.Group controlId="tiempo_prorroga_meses" className="form-group-custom">
                  <Form.Label className="form-label-custom">Tiempo de Prórroga (meses) <span className="text-muted">(Opcional)</span></Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Ingrese el tiempo de prórroga"
                    size="lg"
                    value={tiempo_prorroga_meses}
                    onChange={(e) => setTiempo_prorroga_meses(e.target.value)}
                    className="form-control-custom"
                    min="1"
                  />
                </Form.Group>
              </div>
            </Collapse>
          </div>        
        
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
              disabled={isLoading}
            >
              {isLoading ? 'Cargando...' : 'Crear Proyecto'}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default CrearProyecto;
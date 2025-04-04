import React, { useState, useEffect } from 'react';
import { Nav, Button, Image } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Ajusta la ruta según sea necesario

// Interface para el tipo de proyecto
interface TipoProyecto {
  id_tipo_proyecto: string;
  codigo_tipo: string;
  nombre: string;
  descripcion: string;
}

// Interface para el usuario
interface Usuario {
  nombre: string;
  rol: string;
  imagen: string;
}

// Props para el SidebarContent
interface SidebarContentProps {
  usuario: Usuario;
  onItemClick?: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ 
  usuario, 
  onItemClick, 
  isSidebarCollapsed, 
  toggleSidebar 
}) => {
  const { logout } = useAuth(); // Obtener logout directamente del contexto
  const location = useLocation();
  const navigate = useNavigate();
  
  // Estado para controlar si se muestran los tipos de proyecto
  const [showTiposProyecto, setShowTiposProyecto] = useState(false);
  // Estado para almacenar los tipos de proyecto
  const [tiposProyecto, setTiposProyecto] = useState<TipoProyecto[]>([]);
  // Estado para manejar carga
  const [isLoading, setIsLoading] = useState(false);

  // Datos mock para tipos de proyecto
  const mockTiposProyecto: TipoProyecto[] = [
    {
      id_tipo_proyecto: '1e4e8f1c-1a1a-4a1a-8a1a-1a1a1a1a1a1a',
      codigo_tipo: 'PIIF',
      nombre: 'Interno con financiamiento',
      descripcion: 'Proyectos internos que requieren cierto monto de dinero'
    },
    {
      id_tipo_proyecto: '2e4e8f1c-2a2a-4a2a-8a2a-2a2a2a2a2a2a',
      codigo_tipo: 'PIS',
      nombre: 'Semilla con financiamiento',
      descripcion: 'Proyectos semilla que requieren cierto monto de dinero'
    },
    {
      id_tipo_proyecto: '3e4e8f1c-3a3a-4a3a-8a3a-3a3a3a3a3a3a',
      codigo_tipo: 'PIGR',
      nombre: 'Grupales',
      descripcion: 'Proyectos grupales que requieren cierto monto de dinero'
    },
    {
      id_tipo_proyecto: '4e4e8f1c-4a4a-4a4a-8a4a-4a4a4a4a4a4a',
      codigo_tipo: 'PIM',
      nombre: 'Multidisciplinarios',
      descripcion: 'Proyectos que incluyen varias disciplinas que requieren cierto monto de dinero'
    },
    {
      id_tipo_proyecto: '5e4e8f1c-5a5a-4a5a-8a5a-5a5a5a5a5a5a',
      codigo_tipo: 'PVIF',
      nombre: 'Vinculación con financiaminento',
      descripcion: 'Proyectos de vinculación con la sociedad que requieren cierto monto de dinero'
    },
    {
      id_tipo_proyecto: '6e4e8f1c-6a6a-4a6a-8a6a-6a6a6a6a6a6a',
      codigo_tipo: 'PTT',
      nombre: 'Transferencia tecnológica',
      descripcion: 'Proyectos de transferencia tecnológica y uso de equipamiento'
    },
    {
      id_tipo_proyecto: '7e4e8f1c-7a7a-4a7a-8a7a-7a7a7a7a7a7a',
      codigo_tipo: 'PVIS',
      nombre: 'Vinculación sin financiaminento',
      descripcion: 'Proyectos de vinculación con la sociedad sin necesidad de dinero'
    }
  ];

  // Cargar tipos de proyecto cuando se despliegan
  useEffect(() => {
    if (showTiposProyecto && tiposProyecto.length === 0) {
      setIsLoading(true);
      // Simulamos una carga desde API
      setTimeout(() => {
        setTiposProyecto(mockTiposProyecto);
        setIsLoading(false);
      }, 500);
    }
  }, [showTiposProyecto]);

  // Función para determinar si un link está activo
  const isActive = (path: string) => {
    return location.pathname === path ? "active" : "";
  };

  // Función para manejar la selección de un tipo de proyecto
  const handleSelectTipoProyecto = (tipoProyecto: TipoProyecto) => {
    // Navegar a la ruta con los datos del tipo seleccionado
    navigate(`/crear-proyecto/${tipoProyecto.id_tipo_proyecto}`);
    // Cerrar el sidebar si existe un callback
    if (onItemClick) onItemClick();
  };

  return (
    <React.Fragment>
      {/* Botón de toggle en la parte superior */}
      <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
        <Link 
          to="/dashboard" 
          className="fs-4 fw-semibold text-decoration-none text-white"
          onClick={onItemClick}
        >
          SGP
        </Link>
        <Button 
          variant="outline-light" 
          size="sm" 
          onClick={toggleSidebar}
          className="d-none d-lg-block"
        >
          <i className={`bi bi-chevron-${isSidebarCollapsed ? 'right' : 'left'}`}></i>
        </Button>
      </div>
      
      {/* Solo mostrar estos elementos si el sidebar no está colapsado */}
      {!isSidebarCollapsed && (
        <>
          {/* Links de navegación */}
          <Nav className="flex-column mt-3">
            <div className="px-3 mb-2 text-secondary text-uppercase small">Proyectos</div>
            
            {/* Sección Proyectos */}
            <Nav.Item>
              <Nav.Link 
                as={Link} 
                to="/proyectos" 
                className={`text-white ${isActive("/proyectos")}`}
                onClick={onItemClick}
              >
                <i className="bi bi-folder me-2"></i>
                Listar Proyectos
              </Nav.Link>
            </Nav.Item>
            
            {/* Nuevo Proyecto - Ahora con función para mostrar/ocultar tipos */}
            <Nav.Item>
              <Nav.Link 
                className="text-white"
                onClick={() => setShowTiposProyecto(!showTiposProyecto)}
                style={{ cursor: 'pointer' }}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Nuevo Proyecto
                <i className={`bi bi-chevron-${showTiposProyecto ? 'down' : 'right'} ms-2`}></i>
              </Nav.Link>
              
              {/* Submenu para tipos de proyecto */}
              {showTiposProyecto && (
                <div className="ps-4 border-start border-secondary ms-3">
                  {isLoading ? (
                    <div className="text-white-50 p-2">
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                      Cargando...
                    </div>
                  ) : (
                    tiposProyecto.map(tipo => (
                      <Nav.Link
                        key={tipo.id_tipo_proyecto}
                        className="text-white-50 py-1"
                        onClick={() => handleSelectTipoProyecto(tipo)}
                        style={{ cursor: 'pointer' }}
                      >
                        <i className="bi bi-arrow-right-short me-1"></i>
                        {tipo.codigo_tipo}: {tipo.nombre}
                      </Nav.Link>
                    ))
                  )}
                </div>
              )}
            </Nav.Item>
            
            {/* Sección POAs */}
            <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">POAs</div>
            
            <Nav.Item>
              <Nav.Link 
                as={Link} 
                to="/nuevo-poa" 
                className={`text-white ${isActive("/nuevo-poa")}`}
                onClick={onItemClick}
              >
                <i className="bi bi-file-earmark-plus me-2"></i>
                Nuevo POA
              </Nav.Link>
            </Nav.Item>
            
            {/* Preferencias de usuario */}
            <div className="mt-auto">
              <div className="px-3 mb-2 text-secondary text-uppercase small">Usuario</div>
                <Nav.Item>
                  <Nav.Link 
                    as={Link} 
                    to="/perfil" 
                    className={`text-white ${isActive("/perfil")}`}
                    onClick={onItemClick}
                  >
                    <i className="bi bi-person-circle me-2"></i>
                    Perfil
                  </Nav.Link>
                </Nav.Item>
            </div>
            
            {/* Información del usuario en la parte inferior del sidebar */}
            <div className="mt-auto p-3 border-top">
              <div className="d-flex align-items-center">
                <Image 
                  src={usuario.imagen} 
                  roundedCircle 
                  width="40" 
                  height="40" 
                  className="me-2"
                  alt={usuario.nombre}
                />
                <div>
                  <div className="fw-bold">{usuario.nombre}</div>
                  <small className="text-muted">{usuario.rol}</small>
                </div>
              </div>
              <Button 
                variant="outline-light" 
                size="sm" 
                className="w-100 mt-2"
                onClick={() => {
                  if (onItemClick) onItemClick();
                  logout(); // Usa la función del contexto
                }}
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Cerrar Sesión
              </Button>
            </div>
          </Nav>
        </>
      )}
      
      {/* Cuando el sidebar está colapsado, mostrar solo íconos */}
      {isSidebarCollapsed && (
        <Nav className="flex-column align-items-center mt-3">
          <Nav.Item>
            <Nav.Link 
              as={Link} 
              to="/proyectos" 
              className={`text-white ${isActive("/proyectos")}`}
              onClick={onItemClick}
              title="Listar Proyectos"
            >
              <i className="bi bi-folder"></i>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              className="text-white"
              onClick={() => setShowTiposProyecto(!showTiposProyecto)}
              style={{ cursor: 'pointer' }}
              title="Nuevo Proyecto"
            >
              <i className="bi bi-plus-circle"></i>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              as={Link} 
              to="/nuevo-poa" 
              className={`text-white ${isActive("/nuevo-poa")}`}
              onClick={onItemClick}
              title="Nuevo POA"
            >
              <i className="bi bi-file-earmark-plus"></i>
            </Nav.Link>
          </Nav.Item>
          <div className="mt-auto mb-3">
            <Nav.Item>
              <Nav.Link 
                as={Link} 
                to="/perfil" 
                className={`text-white ${isActive("/perfil")}`}
                onClick={onItemClick}
                title="Perfil"
              >
                <i className="bi bi-person-circle"></i>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                className="text-white"
                onClick={onItemClick}
                title="Cerrar Sesión"
              >
                <i className="bi bi-box-arrow-right"></i>
              </Nav.Link>
            </Nav.Item>
          </div>
        </Nav>
      )}
    </React.Fragment>
  );
};

export default SidebarContent;
import React from 'react';
import { Nav, Button } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SidebarContentProps } from '../interfaces/bar';
import { TableProperties, FolderKanban, FileChartLine, CircleUserRound, UserPlus, LogOut, Icon } from 'lucide-react';
import { owl } from '@lucide/lab';

const SidebarContent: React.FC<SidebarContentProps> = ({ 
  usuario, 
  onItemClick, 
  isSidebarCollapsed, 
  toggleSidebar 
}) => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Función para determinar si un link está activo
  const isActive = (path: string) => {
    return location.pathname === path ? "active" : "";
  };

  // Función para manejar la navegación
  const handleNavigate = (path: string) => {
    navigate(path);
    if (onItemClick) onItemClick();
  };

  // Tamaño estándar para los iconos
  const iconSize = 18;

  return (
    <React.Fragment>
      {/* Encabezado - Ajustado para mostrar/ocultar "SGP" basado en el estado colapsado */}
      <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
        <div 
          className="fs-4 fw-semibold text-decoration-none text-white d-flex align-items-center"
          onClick={() => handleNavigate("/dashboard")}
          style={{ cursor: 'pointer' }}
        >
          <Icon iconNode={owl} size={24} className="me-2" />
          {!isSidebarCollapsed && "SGP"}
        </div>
      </div>
      
      {/* Botón de toggle separado en su propia fila */}
      <div className="d-flex justify-content-center p-2 border-bottom">
        <Button 
          variant="outline-light" 
          size="sm" 
          onClick={toggleSidebar}
          className="d-none d-lg-block"
          style={{ width: isSidebarCollapsed ? '40px' : 'auto' }}
        >
          <TableProperties size={iconSize} />
          {!isSidebarCollapsed && <span className="ms-2">Contraer</span>}
        </Button>
      </div>
      
      {/* Solo mostrar estos elementos si el sidebar no está colapsado */}
      {!isSidebarCollapsed && (
        <>
          {/* Links de navegación */}
          <Nav className="flex-column mt-3">
            <div className="px-3 mb-2 text-secondary text-uppercase small">Proyectos</div>
            
            {/* Nuevo Proyecto */}
            <Nav.Item>
              <Nav.Link 
                className={`text-white ${isActive("/tipos-proyecto")}`}
                onClick={() => handleNavigate("/tipos-proyecto")}
              >
                <FolderKanban size={iconSize} className="me-2" />
                Nuevo Proyecto
              </Nav.Link>
            </Nav.Item>
            
            {/* Sección POAs */}
            <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">POAs</div>
            
            <Nav.Item>
              <Nav.Link 
                className={`text-white ${isActive("/crearPOA")}`}
                onClick={() => handleNavigate("/crearPOA")}
              >
                <FileChartLine size={iconSize} className="me-2" />
                Nuevo POA
              </Nav.Link>
            </Nav.Item>

            <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">ACTIVIDADES</div>
            
            <Nav.Item>
              <Nav.Link 
                className={`text-white ${isActive("/agregar-actividad")}`}
                onClick={() => handleNavigate("/agregar-actividad")}
              >
                <FileChartLine size={iconSize} className="me-2" />
                Agregar Actividad
              </Nav.Link>
            </Nav.Item>
            
            {/* Preferencias de usuario */}
            <div className="mt-auto"> 
              <div className="px-3 mb-2 text-secondary text-uppercase small">Usuario</div>
                <Nav.Item>
                  <Nav.Link 
                    className={`text-white ${isActive("/perfil")}`}
                    onClick={() => handleNavigate("/perfil")}
                  >
                    <CircleUserRound size={iconSize} className="me-2" />
                    Perfil
                  </Nav.Link>
                </Nav.Item>
            </div>
            {/* Registro de usuarios */}
            <div className='mt-auto'>
              <Nav.Item>
                <Nav.Link
                className={`text-white ${isActive("/register")}`}
                onClick={() => handleNavigate("/register")}
                > 
                  <UserPlus size={iconSize} className="me-2" />
                  Registrar usuario
                </Nav.Link>
              </Nav.Item>
            </div>
            
            {/* Sección Excel */}
            <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">
              Excel
            </div>
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/subir-excel")}`}
                onClick={() => handleNavigate("/subir-excel")}
              >
                <FileChartLine size={iconSize} className="me-2" />
                Transformar Excel
              </Nav.Link>
              <Nav.Link
                className={`text-white ${isActive("/reporte-poa")}`}
                onClick={() => handleNavigate("/reporte-poa")}
              >
                <FileChartLine size={iconSize} className="me-2" />
                Reporte Anual
              </Nav.Link>
            </Nav.Item>
            

            {/* Información del usuario en la parte inferior del sidebar */}
            <div className="mt-auto p-3 border-top">
              <div className="d-flex align-items-center">
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
                  logout();
                }}
              >
                <LogOut size={iconSize} className="me-2" />
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
              className={`text-white ${isActive("/tipos-proyecto")}`}
              onClick={() => handleNavigate("/tipos-proyecto")}
              style={{ cursor: 'pointer' }}
              title="Nuevo Proyecto"
            >
              <FolderKanban size={iconSize} />
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              className={`text-white ${isActive("/CrearPOA")}`}
              onClick={() => handleNavigate("/CrearPOA")}
              title="Nuevo POA"
            >
              <FileChartLine size={iconSize} />
            </Nav.Link>
          </Nav.Item>
          <div className="mt-auto mb-3">
            <Nav.Item>
              <Nav.Link 
                className={`text-white ${isActive("/perfil")}`}
                onClick={() => handleNavigate("/perfil")}
                title="Perfil"
              >
                <CircleUserRound size={iconSize} />
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                className="text-white"
                onClick={() => logout()}
                title="Cerrar Sesión"
              >
                <LogOut size={iconSize} />
              </Nav.Link>
            </Nav.Item>
          </div>
        </Nav>
      )}
    </React.Fragment>
  );
};

export default SidebarContent;
import React, { useState, useEffect } from 'react';
import { Nav, Button } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TipoProyecto } from '../interfaces/project';
import { SidebarContentProps } from '../interfaces/bar';


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

  return (
    <React.Fragment>
      {/* Botón de toggle en la parte superior */}
      <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
        <div 
          className="fs-4 fw-semibold text-decoration-none text-white"
          onClick={() => handleNavigate("/dashboard")}
          style={{ cursor: 'pointer' }}
        >
          SGP
        </div>
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
            {/* <Nav.Item>
              <Nav.Link 
                className={`text-white ${isActive("/tipos-proyecto")}`}
                onClick={() => handleNavigate("/tipos-proyecto")}
              >
                <i className="bi bi-folder me-2"></i>
                Listar Proyectos
              </Nav.Link>
            </Nav.Item> */}
            
            {/* Nuevo Proyecto - Ahora con función para mostrar/ocultar tipos */}
            <Nav.Item>
              <Nav.Link 
                className={`text-white ${isActive("/tipos-proyecto")}`}
                onClick={() => handleNavigate("/tipos-proyecto")}
              >
                <i className="bi bi-plus-circle me-2"></i>
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
                <i className="bi bi-file-earmark-plus me-2"></i>
                Nuevo POA
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
                    <i className="bi bi-person-circle me-2"></i>
                    Perfil
                  </Nav.Link>
                </Nav.Item>
            </div>
            {/* TODO: El registro de usuarios solo lo puede hacer el administrador */}
            <div className='mt-auto'>
              <Nav.Item>
                <Nav.Link
                className={`text-white ${isActive("/register")}`}
                onClick={() => handleNavigate("/register")}
                > 
                  <i className='bi bi-person-circle me-2'></i>
                    Registrar usuario
                </Nav.Link>
              </Nav.Item>
            </div>
            
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
              className={`text-white ${isActive("/proyectos")}`}
              onClick={() => handleNavigate("/proyectos")}
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
              className={`text-white ${isActive("/CrearPOA")}`}
              onClick={() => handleNavigate("/CrearPOA")}
              title="Nuevo POA"
            >
              <i className="bi bi-file-earmark-plus"></i>
            </Nav.Link>
          </Nav.Item>
          <div className="mt-auto mb-3">
            <Nav.Item>
              <Nav.Link 
                className={`text-white ${isActive("/perfil")}`}
                onClick={() => handleNavigate("/perfil")}
                title="Perfil"
              >
                <i className="bi bi-person-circle"></i>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                className="text-white"
                onClick={() => logout()}
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
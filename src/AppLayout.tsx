
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Offcanvas } from 'react-bootstrap';
import { useAuth } from './context/AuthContext';
import SidebarContent from './pages/SidebarContent';
import './styles/Screen.css';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  // Estado para el sidebar móvil
  const [showSidebar, setShowSidebar] = useState(false);
  // Estado para controlar si el sidebar está colapsado (en pantallas grandes)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const { usuario, isAuthenticated } = useAuth();
  const location = useLocation();
  
  const handleCloseSidebar = () => setShowSidebar(false);
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
  
  // Determinar si estamos en una ruta pública
  const isPublicRoute = ['/login'].includes(location.pathname);
  
  // 🌌 Cambiar el fondo del body solo en login
  useEffect(() => {
    if (isPublicRoute) {
      document.body.style.backgroundColor = '#01050E';
    } else {
      document.body.style.backgroundColor = ''; // Reset (usa lo que tengas por defecto)
    }
  }, [isPublicRoute]);

  // Función para determinar las clases del contenido principal
  const getMainContentClasses = () => {
    if (isPublicRoute) {
      return 'main-content main-content-public';
    }
    if (isAuthenticated) {
      return isSidebarCollapsed 
        ? 'main-content main-content-authenticated-collapsed'
        : 'main-content main-content-authenticated-expanded';
    }
    return 'main-content main-content-public';
  };

  return (
    <div className="app-layout">
      {/* Sidebar para pantallas grandes - solo se muestra en rutas protegidas */}
      {isAuthenticated && !isPublicRoute && (
        <div 
          className={`sidebar-desktop custom-scrollbar ${
            isSidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'
          }`}
        >
          {usuario && (
            <SidebarContent 
              usuario={usuario} 
              isSidebarCollapsed={isSidebarCollapsed}
              toggleSidebar={toggleSidebar}
            />
          )}
        </div>
      )}
      
      {/* Contenido principal con margen para compensar el sidebar fijo */}
      <div className={getMainContentClasses()}>
        {/* Sidebar como Offcanvas para pantallas pequeñas */}
        <Offcanvas 
          show={showSidebar} 
          onHide={handleCloseSidebar} 
          className="sidebar-mobile custom-scrollbar" 
        >
          <Offcanvas.Header closeButton closeVariant="white">
            <Offcanvas.Title>Menú</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="sidebar-mobile">
            {usuario && (
              <SidebarContent 
                usuario={usuario} 
                onItemClick={handleCloseSidebar} 
                isSidebarCollapsed={false}
                toggleSidebar={() => {}}
              />
            )}
          </Offcanvas.Body>
        </Offcanvas>
        
        {/* Contenido de la página */}
        <Container fluid className="container-fluid-custom">
          {children}
        </Container>
      </div>
    </div>
  );
};

export default AppLayout;
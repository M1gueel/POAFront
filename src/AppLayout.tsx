import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Offcanvas } from 'react-bootstrap';
import { useAuth } from './context/AuthContext';
import SidebarContent from './components/SidebarContent';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  // Estado para el sidebar móvil
  const [showSidebar, setShowSidebar] = useState(false);
  // Estado para controlar si el sidebar está colapsado (en pantallas grandes)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const { usuario, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  
  const handleCloseSidebar = () => setShowSidebar(false);
  const handleShowSidebar = () => setShowSidebar(true);
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
  
  // Determinar si estamos en una ruta pública
  const isPublicRoute = ['/login', '/register'].includes(location.pathname);
  
  return (
    <div className="d-flex">
      {/* Sidebar para pantallas grandes - solo se muestra en rutas protegidas */}
      {isAuthenticated && !isPublicRoute && (
        <div 
          className="d-none d-lg-flex flex-column bg-dark text-white" 
          style={{ 
            width: isSidebarCollapsed ? '70px' : '280px', 
            minHeight: '100vh',
            transition: 'width 0.3s ease'
          }}
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
      
      {/* Contenido principal */}
      <div className={`${isPublicRoute ? 'w-100' : 'flex-grow-1'}`}>
                
        {/* Sidebar como Offcanvas para pantallas pequeñas */}
        <Offcanvas show={showSidebar} onHide={handleCloseSidebar} className="bg-dark text-white" style={{ width: '280px' }}>
          <Offcanvas.Header closeButton closeVariant="white">
            <Offcanvas.Title>Menú</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
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
        <Container fluid className="p-4">
          {children}
        </Container>
      </div>
    </div>
  );
};

export default AppLayout;
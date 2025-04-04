import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar, Container, Button, Offcanvas } from 'react-bootstrap';
import { useAuth } from './context/AuthContext';
import SidebarContent from './components/SidebarContent'; // Asumiendo que tienes este componente

// Definir la interfaz del AppLayout
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const { usuario, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const handleCloseSidebar = () => setShowSidebar(false);
  const handleShowSidebar = () => setShowSidebar(true);
  
  // Determinar si estamos en una ruta pública
  const isPublicRoute = ['/login', '/register'].includes(location.pathname);

  return (
    <div className="d-flex">
      {/* Sidebar para pantallas grandes - solo se muestra en rutas protegidas */}
      {isAuthenticated && !isPublicRoute && (
        <div className="d-none d-lg-flex flex-column bg-dark text-white" style={{ width: '280px', minHeight: '100vh' }}>
          {usuario && <SidebarContent usuario={usuario} />}
        </div>
      )}

      {/* Contenido principal */}
      <div className={`${isPublicRoute ? 'w-100' : 'flex-grow-1'}`}>
        {/* Navbar Superior - solo se muestra en rutas protegidas */}
        {isAuthenticated && !isPublicRoute && (
          <Navbar bg="primary" variant="dark" expand="lg" className="mb-3 px-3">
            <Container fluid>
              <Button 
                variant="outline-light" 
                className="d-lg-none me-2"
                onClick={handleShowSidebar}
              >
                <i className="bi bi-list"></i> Menú
              </Button>
              <Navbar.Brand href="#home">Sistema de Gestión de Proyectos</Navbar.Brand>
              <Navbar.Toggle aria-controls="basic-navbar-nav" />
              <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
                <Navbar.Text className="text-white me-3">
                  Usuario: {usuario?.nombre} ({usuario?.rol})
                </Navbar.Text>
                <Button variant="outline-light" size="sm" onClick={logout}>
                  Cerrar Sesión
                </Button>
              </Navbar.Collapse>
            </Container>
          </Navbar>
        )}

        {/* Sidebar como Offcanvas para pantallas pequeñas */}
        <Offcanvas show={showSidebar} onHide={handleCloseSidebar} className="bg-dark text-white" style={{ width: '280px' }}>
          <Offcanvas.Header closeButton closeVariant="white">
            <Offcanvas.Title>Menú</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            {usuario && <SidebarContent usuario={usuario} onItemClick={handleCloseSidebar} />}
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
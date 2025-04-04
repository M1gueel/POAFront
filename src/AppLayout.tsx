import React, { useState, useEffect } from 'react';
import { Container, Navbar, Button, Offcanvas } from 'react-bootstrap';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';

// Importación de componentes
import SeleccionarTipoProyecto from './components/SeleccionarTipoProyecto';
import CrearPOA from './components/CrearPOA';
import SidebarContent from './components/SidebarContent';
import CrearProyectoDirecto from './components/CrearProyectoDirecto.tsx';
import Login from './components/Login';
import RegistrarUsuario from './components/RegistrarUsuario';
import Dashboard from './components/Dashboard.tsx';
// import ListaProyectos from './components/ListaProyectos';
// import DetalleProyecto from './components/DetalleProyecto';
// import EditarProyecto from './components/EditarProyecto';
// import ListaPOAs from './components/ListaPOAs';
// import DetallePOA from './components/DetallePOA';
// import EditarPOA from './components/EditarPOA';
// import ListaPeriodos from './components/ListaPeriodos';
import AgregarPeriodo from './components/AgregarPeriodo';
import ProtectedRoute from './components/ProtectedRoute.tsx';
// import EditarPeriodo from './components/EditarPeriodo';
// import PerfilUsuario from './components/PerfilUsuario';
// import PaginaNoEncontrada from './components/PaginaNoEncontrada';

// Interface para el usuario
interface Usuario {
  nombre: string;
  rol: string;
  imagen: string;
}

const AppLayout: React.FC = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  
  // Usuario mock (esto vendría de tu sistema de autenticación)
  // const usuarioActual: Usuario = {
  //   nombre: "Juan Pérez",
  //   rol: "Administrador",
  //   imagen: "/profile-placeholder.jpg"
  // };

  const [usuarioActual, setUsuarioActual] = useState<Usuario>({
    nombre: "Cargando...",
    rol: "",
    imagen: "/profile-placeholder.jpg"
  });
  const location = useLocation();

  // Cargar información del usuario desde localStorage
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      try {
        const usuario = JSON.parse(usuarioGuardado);
        setUsuarioActual(usuario);
      } catch (error) {
        console.error('Error al parsear datos del usuario:', error);
      }
    }
  }, [location.pathname]); // Actualizar cuando cambie la ruta



  const handleCloseSidebar = () => setShowSidebar(false);
  const handleShowSidebar = () => setShowSidebar(true);
  
  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
  };

  // Determinar si estamos en una ruta pública
  const isPublicRoute = ['/login', '/register'].includes(location.pathname);

  return (
    <div className="d-flex">
      {/* Sidebar para pantallas grandes - solo se muestra en rutas protegidas */}
      {!isPublicRoute && (
        <div className="d-none d-lg-flex flex-column bg-dark text-white" style={{ width: '280px', minHeight: '100vh' }}>
          <SidebarContent usuario={usuarioActual} />
        </div>
      )}

      {/* Contenido principal */}
      <div className={`${isPublicRoute ? 'w-100' : 'flex-grow-1'}`}>
        {/* Navbar Superior - solo se muestra en rutas protegidas */}
        {!isPublicRoute && (
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
                  Usuario: {usuarioActual.nombre} ({usuarioActual.rol})
                </Navbar.Text>
                <Button variant="outline-light" size="sm" onClick={handleLogout}>
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
            <SidebarContent usuario={usuarioActual} onItemClick={handleCloseSidebar} />
          </Offcanvas.Body>
        </Offcanvas>

        {/* Contenido principal - Rutas */}
        <Container fluid className="p-4">
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegistrarUsuario />} />
            
            {/* Ruta principal / dashboard - protegida */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Gestión de proyectos */}
            {/* <Route path="/proyectos" element={<ListaProyectos />} />
            <Route 
              path="/nuevo-proyecto" 
              element={
                <ProtectedRoute>
                  <SeleccionarTipoProyecto />
                </ProtectedRoute>
              } 
            />
            <Route path="/crear-proyecto/:tipoProyectoId" element={<CrearProyectoDirecto />} />
            <Route path="/proyecto/:id" element={<DetalleProyecto />} />
            <Route path="/proyecto/:id/editar" element={<EditarProyecto />} /> */}
            
            {/* Gestión de POAs */}
            {/* <Route path="/poas" element={<ListaPOAs />} />
            <Route path="/nuevo-poa" element={<CrearPOA />} />
            <Route path="/poa/:id" element={<DetallePOA />} />
            <Route path="/poa/:id/editar" element={<EditarPOA />} /> */}
            
            {/* Gestión de periodos */}
            {/* <Route path="/periodos" element={<ListaPeriodos />} />
            <Route path="/nuevo-periodo" element={<AgregarPeriodo />} />
            <Route path="/periodo/:id/editar" element={<EditarPeriodo />} /> */}
            
            {/* Perfil de usuario */}
            {/* <Route path="/perfil" element={<PerfilUsuario />} /> */}
            
            {/* Ruta para cualquier otra dirección no definida */}
            {/* <Route path="*" element={<PaginaNoEncontrada />} /> */}
          </Routes>
        </Container>
      </div>
    </div>
  );
};

export default AppLayout;
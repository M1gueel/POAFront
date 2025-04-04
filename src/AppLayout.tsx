import React, { useState, useEffect, JSX } from 'react';
import { Container, Nav, Navbar, Button, Image, Offcanvas } from 'react-bootstrap';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';

// Importación de componentes
import SeleccionarTipoProyecto from './components/SeleccionarTipoProyecto';
import CrearPOA from './components/CrearPOA';
import SidebarContent from './components/SidebarContent.tsx';
import CrearProyectoApi from './components/CrearProyectoApi';
import Login from './components/Login.tsx';
import Register from './components/Register.tsx'; // Importar el nuevo componente de registro

// Interface para el usuario
interface Usuario {
  nombre: string;
  rol: string;
  imagen: string;
}

// Componente para proteger rutas que requieren autenticación
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Redireccionar al login si no hay token
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const AppLayout: React.FC = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Verificar autenticación al cargar
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);
  
  // Usuario mock (esto vendría de tu sistema de autenticación)
  const usuarioActual: Usuario = {
    nombre: "Juan Pérez",
    rol: "Administrador",
    imagen: "/profile-placeholder.jpg" // Ruta a imagen de perfil
  };

  const handleCloseSidebar = () => setShowSidebar(false);
  const handleShowSidebar = () => setShowSidebar(true);

  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rutas protegidas dentro del layout principal */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="d-flex">
                {/* Sidebar para pantallas grandes */}
                <div className="d-none d-lg-flex flex-column bg-dark text-white" style={{ width: '280px', minHeight: '100vh' }}>
                  <SidebarContent usuario={usuarioActual} />
                </div>

                {/* Contenido principal */}
                <div className="flex-grow-1">
                  {/* Navbar Superior con botón para mostrar sidebar en pantallas pequeñas */}
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
                        <Navbar.Text className="text-white">
                          Usuario: {usuarioActual.nombre}
                        </Navbar.Text>
                      </Navbar.Collapse>
                    </Container>
                  </Navbar>

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
                      <Route path="/" element={<h1>Bienvenido al Sistema de Gestión de Proyectos</h1>} />
                      <Route path="/nuevo-proyecto" element={<SeleccionarTipoProyecto />} />
                      <Route path="/crear-proyecto/:tipoProyectoId" element={<CrearProyectoDirecto />} />
                      <Route path="/nuevo-poa" element={<CrearPOA />} />
                    </Routes>
                  </Container>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

// Componente para manejar la creación directa de proyectos
const CrearProyectoDirecto: React.FC = () => {
  const { tipoProyectoId } = useParams<{ tipoProyectoId: string }>();
  const [tipoProyectoSeleccionado, setTipoProyectoSeleccionado] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Mockup de tipos de proyecto (mismo que en el sidebar)
  const mockTiposProyecto = [
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
  
  // Buscar el tipo de proyecto según el ID recibido
  useEffect(() => {
    // Simulamos una llamada a la API
    setTimeout(() => {
      const tipoProyecto = mockTiposProyecto.find(tipo => tipo.id_tipo_proyecto === tipoProyectoId);
      if (tipoProyecto) {
        setTipoProyectoSeleccionado(tipoProyecto);
      }
      setIsLoading(false);
    }, 500);
  }, [tipoProyectoId]);
  
  // Mientras carga, muestra un spinner
  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3">Cargando información del tipo de proyecto...</p>
      </div>
    );
  }
  
  // Si no se encuentra el tipo de proyecto
  if (!tipoProyectoSeleccionado) {
    return (
      <div className="alert alert-danger" role="alert">
        Tipo de proyecto no encontrado. Por favor, seleccione un tipo de proyecto válido.
      </div>
    );
  }
  
  // Si encuentra el tipo de proyecto, muestra el formulario de creación
  return (
    <CrearProyectoApi 
      tipoProyectoSeleccionado={tipoProyectoSeleccionado}
      onCancel={() => window.history.back()} // Volver atrás al cancelar
    />
  );
};

export default AppLayout;
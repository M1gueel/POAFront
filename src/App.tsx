import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext'; // Agregar esta importación
import AppLayout from './AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import SubirExcel from './pages/SubirExcel';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CrearPOA from './pages/CrearPOA';
import Perfil from './pages/Perfil';
import CrearProyecto from './pages/CrearProyecto';
import TiposProyecto from './pages/TiposProyecto';
import AgregarActividad from './pages/AgregarActividad';
import ReportePOA from './pages/ReportePOA';
import LogsCargaExcel from './pages/LogsCargaExcel';
import VerProyectos from './pages/VerProyectos';
import EditarProyecto from './pages/EditarProyecto';
import EditarPOA from './pages/EditarPOA';
import { ThemeProvider } from "@mui/material/styles";

import theme from "./theme";

// Importar ToastContainer y estilos
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import RoleProtectedRoute from './components/RoleProtectedRoute';

// Importar las funciones de roles actualizadas
import { ROLES, initializeRoles, areRolesLoaded, getAllRoles } from './interfaces/user';
import { useState, useEffect } from 'react';


// Componente interno para debugging mejorado
const DebugInfo = () => {
  const { usuario, getUserRole, hasRole, getRoleId } = useAuth();
  
  useEffect(() => {
    if (areRolesLoaded()) {
      console.log('=== DEBUG INFO COMPLETO ===');
      console.log('👤 Usuario completo:', usuario);
      console.log('🔑 ID del rol del usuario:', getRoleId());
      console.log('👨‍💼 Rol completo:', getUserRole());
      console.log('🔍 Roles disponibles:', getAllRoles());
      
      // Verificar cada rol específico
      console.log('🔐 Verificaciones de roles:');
      console.log('  - ADMINISTRADOR:', ROLES.ADMINISTRADOR);
      console.log('  - DIRECTOR_DE_INVESTIGACION:', ROLES.DIRECTOR_DE_INVESTIGACION);
      console.log('  - DIRECTOR_DE_PROYECTO:', ROLES.DIRECTOR_DE_PROYECTO);
      console.log('  - DIRECTOR_DE_REFORMAS:', ROLES.DIRECTOR_DE_REFORMAS);
      
      console.log('✅ Permisos del usuario actual:');
      console.log('  - ¿Es ADMINISTRADOR?', hasRole(ROLES.ADMINISTRADOR));
      console.log('  - ¿Es DIRECTOR_DE_INVESTIGACION?', hasRole(ROLES.DIRECTOR_DE_INVESTIGACION));
      console.log('  - ¿Es DIRECTOR_DE_PROYECTO?', hasRole(ROLES.DIRECTOR_DE_PROYECTO));
      console.log('  - ¿Es DIRECTOR_DE_REFORMAS?', hasRole(ROLES.DIRECTOR_DE_REFORMAS));
      
      console.log('🔄 Comparación directa:');
      console.log('  - ID del usuario:', getRoleId());
      console.log('  - ID de ADMINISTRADOR:', ROLES.ADMINISTRADOR);
      console.log('  - ¿Coincide?', getRoleId() === ROLES.ADMINISTRADOR);
      
      // Debug adicional
      // debugRoles();
      console.log('============================');
    }
  }, [usuario, getRoleId, hasRole, getUserRole]);
  
  return null;
};

// Componente para manejar la carga de roles
const RoleInitializer = ({ children }: { children: React.ReactNode }) => {
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        console.log('🔄 Iniciando carga de roles...');
        await initializeRoles();
        console.log('✅ Roles cargados exitosamente');
        setRolesLoaded(true);
      } catch (error) {
        console.error('❌ Error al cargar roles:', error);
        setRolesError(error instanceof Error ? error.message : 'Error desconocido');
      }
    };

    if (!areRolesLoaded()) {
      loadRoles();
    } else {
      setRolesLoaded(true);
    }
  }, []);

  if (rolesError) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: 'red',
        fontSize: '16px'
      }}>
        <h3>Error al cargar la aplicación</h3>
        <p>No se pudieron cargar los roles desde el servidor:</p>
        <p><strong>{rolesError}</strong></p>
        <button 
          onClick={() => window.location.reload()}
          style={{ 
            padding: '10px 20px', 
            marginTop: '10px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!rolesLoaded) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        fontSize: '16px'
      }}>
        <h3>Cargando aplicación...</h3>
        <p>Inicializando roles del sistema...</p>
        <div style={{ 
          marginTop: '20px',
          fontSize: '14px',
          color: '#666'
        }}>
          ⏳ Por favor espera...
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

function AppContent() {
  return (
    <AppLayout>
      <ThemeProvider theme={theme}>
        <DebugInfo /> {/* Componente de debugging */}
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Rutas protegidas */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          {/* Ruta original con RoleProtectedRoute */}
          <Route path="/tipos-proyecto" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_DE_INVESTIGACION,
              ]}>
                <TiposProyecto />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/crear-proyecto" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_DE_INVESTIGACION,
              ]}>
                <CrearProyecto />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/crear-poa" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_DE_INVESTIGACION,
              ]}>
                <CrearPOA />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/agregar-actividad-tarea" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_DE_INVESTIGACION,
                ROLES.DIRECTOR_DE_PROYECTO,
              ]}>
                <AgregarActividad />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/editar-proyecto" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_INVESTIGACION,
              ]}>
                <EditarProyecto />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/editar-poa" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_INVESTIGACION,
              ]}>
                <EditarPOA />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/perfil" element={
            <ProtectedRoute>
              <Perfil />
            </ProtectedRoute>
          } />

          <Route path="/subir-excel" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_DE_REFORMAS,                
              ]}>
                <SubirExcel />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/reporte-poa" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_DE_REFORMAS,
              ]}>
                <ReportePOA />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/LogsCargaExcel" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_DE_REFORMAS,
              ]}>
                <LogsCargaExcel />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/ver-proyectos" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_DE_REFORMAS,
              ]}>
              <VerProyectos />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </ThemeProvider>
    </AppLayout>
  );
}

function App() {
  return (
      <Router>
        <AuthProvider>
          <RoleInitializer>
            <AppContent />
          </RoleInitializer>
        </AuthProvider>
      </Router>
    );
}

export default App;
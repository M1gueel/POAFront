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
// Importar las constantes de roles
import { ROLES } from './interfaces/user';

// Componente interno para debugging
const DebugInfo = () => {
  const { usuario, getUserRole, hasRole, getRoleId, getRoleName } = useAuth();
  
  console.log('=== DEBUG INFO ===');
  console.log('Usuario completo:', usuario);
  console.log('ID del rol del usuario:', getRoleId());
  console.log('Nombre del rol:', getRoleName());
  console.log('Rol completo:', getUserRole());
  console.log('ROLES.ADMINISTRADOR:', ROLES.ADMINISTRADOR);
  console.log('¿Tiene rol de admin?', hasRole(ROLES.ADMINISTRADOR));
  console.log('¿Coincide el ID?', getRoleId() === ROLES.ADMINISTRADOR);
  
  return null; // No renderiza nada
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

          {/* Ruta problemática - temporalmente sin RoleProtectedRoute */}
          {/* <Route path="/tipos-proyecto-test" element={
            <ProtectedRoute>
              <TiposProyecto />
            </ProtectedRoute>
          } /> */}

          {/* Ruta original con RoleProtectedRoute */}
          <Route path="/tipos-proyecto" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_INVESTIGACION,
              ]}>
                <TiposProyecto />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/crear-proyecto" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_INVESTIGACION,
              ]}>
                <CrearProyecto />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/crear-poa" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_INVESTIGACION,
              ]}>
                <CrearPOA />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/agregar-actividad-tarea" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_INVESTIGACION,
                ROLES.DIRECTOR_PROYECTO,
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
                ROLES.DIRECTOR_REFORMAS,                
              ]}>
                <SubirExcel />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/reporte-poa" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_REFORMAS,
              ]}>
                <ReportePOA />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/LogsCargaExcel" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_REFORMAS,
              ]}>
                <LogsCargaExcel />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/ver-proyectos" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_REFORMAS,
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
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
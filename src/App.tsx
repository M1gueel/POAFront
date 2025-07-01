import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppLayout>
          <ThemeProvider theme={theme}>
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
            <Route path="/tipos-proyecto" element={
              <ProtectedRoute>
                <TiposProyecto />
              </ProtectedRoute>
            } />
            <Route path="/crear-proyecto" element={
              <ProtectedRoute>
                <CrearProyecto />
              </ProtectedRoute>
            } />
            <Route path="/crearPOA" element={
              <ProtectedRoute>
                <CrearPOA />
              </ProtectedRoute>
            } />
            <Route path="/agregar-actividad" element={
              <ProtectedRoute>
                <AgregarActividad />
              </ProtectedRoute>
            } />
            <Route path="/perfil" element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            } />
            <Route path="/subir-excel" element={
              <ProtectedRoute>
                <SubirExcel />
              </ProtectedRoute>
            } />
            <Route path="/reporte-poa" element={
              <ProtectedRoute>
                <ReportePOA />
              </ProtectedRoute>
            } />
            <Route path="/LogsCargaExcel" element={
              <ProtectedRoute>
                <LogsCargaExcel />
              </ProtectedRoute>
            } />

            <Route path="/ver-proyectos" element={
              <ProtectedRoute>
                <VerProyectos />
              </ProtectedRoute>
            } />
            
            {/* Ruta por defecto - redirigir al dashboard si está autenticado, sino al login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Ruta para URLs no válidas */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          </ThemeProvider>
        </AppLayout>
      </AuthProvider>
    </Router>
  );
}

export default App;
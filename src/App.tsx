import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './AppLayout';
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
// Importa otros componentes según sea necesario

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppLayout>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            
            {/* Rutas protegidas */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tipos-proyecto" element={<TiposProyecto />} />
            <Route path="/crear-proyecto" element={<CrearProyecto />} />
            <Route path="/crearPOA" element={<CrearPOA />} />
            <Route path="/agregar-actividad" element={<AgregarActividad />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/register" element={<Register />} />
            <Route path="/subir-excel" element={<SubirExcel />} />
            <Route path="/reporte-poa" element={<ReportePOA />} />
            {/* Ruta por defecto */}
          </Routes>
        </AppLayout>
      </AuthProvider>
    </Router>
  );
}

export default App;
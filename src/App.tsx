import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CrearPOA from './pages/CrearPOA';
import Perfil from './pages/Perfil';
import CrearProyecto from './pages/CrearProyecto';
import TiposProyecto from './pages/TiposProyecto';
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
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/crearPOA" element={<CrearPOA />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/crear-proyecto" element={<CrearProyecto />} />
            <Route path="/tipos-proyecto" element={<TiposProyecto />} />
          </Routes>
        </AppLayout>
      </AuthProvider>
    </Router>
  );
}

export default App;
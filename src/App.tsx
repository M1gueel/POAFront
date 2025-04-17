import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './AppLayout';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import CrearPOA from './components/CrearPOA';
import Perfil from './components/Perfil';
import CrearProyecto from './components/CrearProyecto';
import TiposProyecto from './components/TiposProyecto';
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
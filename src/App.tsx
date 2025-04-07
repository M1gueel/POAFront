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
            <Route path="/register" element={<Register />} />
            
            {/* Rutas protegidas */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/crearPOA" element={<CrearPOA />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/crear-proyecto" element={<CrearProyecto />} />
            <Route path="/tipos-proyecto" element={<TiposProyecto />} />



            {/* Agrega todas tus otras rutas aquí sin necesidad de protegerlas individualmente */}
            {/* <Route path="/proyectos" element={<ListaProyectos />} /> */}
            {/* <Route path="/perfil" element={<PerfilUsuario />} /> */}
            
            {/* Ruta para cualquier otra dirección no definida */}
            {/* <Route path="*" element={<PaginaNoEncontrada />} /> */}
          </Routes>
        </AppLayout>
      </AuthProvider>
    </Router>
  );
}

export default App;
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './AppLayout';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
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
            <Route path="/" element={<Dashboard />} />
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
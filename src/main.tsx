import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.tsx'
import CrearProyecto from './components/CrearProyecto.tsx';
import AgregarPOA from './components/AgregarPOA.tsx';
import AgregarPeriodo from './components/AgregarPeriodo.tsx';
import RegistrarUsuario from './components/RegistrarUsuario.tsx';
import CrearProyectoApi from './components/CrearProyectoApi.tsx';
import AgregarPOAApi from './components/AgregarPOASApi.tsx';
import SeleccionarTipoProyecto from './components/SeleccionarTipoProyecto.tsx';
import AppLayout from './AppLayout.tsx';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <App /> */}
      {/* <CrearProyecto/>
      <AgregarPOA/> */}
      {/* <CrearProyectoApi/> */}
      {/* <AgregarPOAApi/> */}
      {/* <AgregarPeriodo/> */}
      {/* <RegistrarUsuario/> */}

      {/* <SeleccionarTipoProyecto/> */}
      <AppLayout/>
  </StrictMode>,
)

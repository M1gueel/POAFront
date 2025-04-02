// TODO:Comparar con el que me dió copilot
// Declara un módulo para el componente AgregarPOA
declare module './AgregarPOA' {
    import { FC } from 'react';
  
    interface POAFormProps {
      id_proyecto: string;
      id_periodo: string;
      id_estado_poa: string;
      id_tipo_poa: string;
    }
  
    const AgregarPOA: FC<POAFormProps>;
    export default AgregarPOA;
  }
  
  // Declara un módulo para el componente CrearProyecto
  declare module './CrearProyecto' {
    import { FC } from 'react';
  
    interface ProyectoFormProps {
        id_proyecto: string;
        id_tipo_proyecto: string;
        id_estado_proyecto: string;
        id_director_proyecto?: string;
    }
  
    const CrearProyecto: FC<ProyectoFormProps>;
    export default CrearProyecto;
  }
  
  // Declara un módulo para el componente AgregarPeriodo
  declare module './AgregarPeriodo' {
    import { FC } from 'react';
  
    interface PeriodoFormProps {
        id_periodo: string;
    }
  
    const AgregarPeriodo: FC<PeriodoFormProps>;
    export default AgregarPeriodo;
  }
  
  // Declara un módulo para el componente RegistrarUsuario
  declare module './RegistrarUsuario' {
    import { FC } from 'react';
  
    interface UsuarioFormProps {
        id_usuario: string;
        id_rol: string;
    }
  
    const RegistrarUsuario: FC<UsuarioFormProps>;
    export default RegistrarUsuario;
  }
  
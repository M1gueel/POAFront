import React, { useEffect, useState } from 'react';
import { TipoProyecto } from '../interfaces/project';
import { projectAPI } from '../api/projectAPI';
import { HelpCircle } from 'lucide-react'; // Importamos el ícono de interrogación

// Componente para mostrar los tipos de proyecto como botones
const TiposProyecto: React.FC = () => {
  const [tiposProyecto, setTiposProyecto] = useState<TipoProyecto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTiposProyecto = async () => {
      try {
        setLoading(true);
        const data = await projectAPI.getTiposProyecto();
        setTiposProyecto(data);
        setError(null);
      } catch (err) {
        console.error('Error al obtener tipos de proyecto:', err);
        setError('Error al cargar los tipos de proyecto');
      } finally {
        setLoading(false);
      }
    };

    fetchTiposProyecto();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-4">Cargando tipos de proyecto...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="flex flex-col space-y-2 w-full max-w-md">
      {tiposProyecto.length === 0 ? (
        <div className="text-gray-500">No hay tipos de proyecto disponibles</div>
      ) : (
        tiposProyecto.map((tipo) => (
          <button
            key={tipo.id_tipo_proyecto}
            className="flex items-center justify-between px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
            onClick={() => {
              // Aquí puedes manejar la acción del botón
              console.log('Tipo seleccionado:', tipo);
            }}
          >
            <span>{tipo.codigo_tipo} | {tipo.nombre}</span>
            <div className="relative group">
              <HelpCircle size={18} className="text-white ml-2" />
              <div className="absolute right-0 w-64 p-2 mt-2 text-xs bg-gray-800 text-white rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                {tipo.descripcion}
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  );
};

export default TiposProyecto;
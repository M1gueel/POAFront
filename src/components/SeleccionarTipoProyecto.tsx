import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button } from 'react-bootstrap';
import CrearProyectoApi from './CrearProyectoApi.tsx';

// Interfaces for the data types
interface TipoProyecto {
  id_tipo_proyecto: string;
  codigo_tipo: string;
  nombre: string;
  descripcion: string;
}

const SeleccionarTipoProyecto: React.FC = () => {
  // State for project types list
  const [tiposProyecto, setTiposProyecto] = useState<TipoProyecto[]>([]);
  const [selectedTipoProyecto, setSelectedTipoProyecto] = useState<TipoProyecto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data - this will be replaced by API call
  const mockTiposProyecto: TipoProyecto[] = [
    {
      id_tipo_proyecto: '1e4e8f1c-1a1a-4a1a-8a1a-1a1a1a1a1a1a',
      codigo_tipo: 'PIIF',
      nombre: 'Interno con financiamiento',
      descripcion: 'Proyectos internos que requieren cierto monto de dinero'
    },
    {
      id_tipo_proyecto: '2e4e8f1c-2a2a-4a2a-8a2a-2a2a2a2a2a2a',
      codigo_tipo: 'PIS',
      nombre: 'Semilla con financiamiento',
      descripcion: 'Proyectos semilla que requieren cierto monto de dinero'
    },
    {
      id_tipo_proyecto: '3e4e8f1c-3a3a-4a3a-8a3a-3a3a3a3a3a3a',
      codigo_tipo: 'PIGR',
      nombre: 'Grupales',
      descripcion: 'Proyectos grupales que requieren cierto monto de dinero'
    },
    {
      id_tipo_proyecto: '4e4e8f1c-4a4a-4a4a-8a4a-4a4a4a4a4a4a',
      codigo_tipo: 'PIM',
      nombre: 'Multidisciplinarios',
      descripcion: 'Proyectos que incluyen varias disciplinas que requieren cierto monto de dinero'
    },
    {
      id_tipo_proyecto: '5e4e8f1c-5a5a-4a5a-8a5a-5a5a5a5a5a5a',
      codigo_tipo: 'PVIF',
      nombre: 'Vinculación con financiaminento',
      descripcion: 'Proyectos de vinculación con la sociedad que requieren cierto monto de dinero'
    },
    {
      id_tipo_proyecto: '6e4e8f1c-6a6a-4a6a-8a6a-6a6a6a6a6a6a',
      codigo_tipo: 'PTT',
      nombre: 'Transferencia tecnológica',
      descripcion: 'Proyectos de transferencia tecnológica y uso de equipamiento'
    },
    {
      id_tipo_proyecto: '7e4e8f1c-7a7a-4a7a-8a7a-7a7a7a7a7a7a',
      codigo_tipo: 'PVIS',
      nombre: 'Vinculación sin financiaminento',
      descripcion: 'Proyectos de vinculación con la sociedad sin necesidad de dinero'
    }
  ];

  // Effect to load project types when component mounts
  useEffect(() => {
    const cargarTiposProyecto = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // When integrating with the API, replace this with actual fetch call:
        // const response = await fetch('/api/tipos-proyecto');
        // if (!response.ok) throw new Error('Error al cargar tipos de proyecto');
        // const data = await response.json();
        // setTiposProyecto(data);
        
        // For now, use mock data
        setTimeout(() => {
          setTiposProyecto(mockTiposProyecto);
          setIsLoading(false);
        }, 500); // Simulate API delay
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error(err);
        setIsLoading(false);
      }
    };
    
    cargarTiposProyecto();
  }, []);

  const handleSelectTipoProyecto = (tipoProyecto: TipoProyecto) => {
    setSelectedTipoProyecto(tipoProyecto);
  };

  return (
    <Container className="py-5">
      {!selectedTipoProyecto ? (
        <Card className="shadow-lg">
          <Card.Header className="bg-primary bg-gradient text-white p-3">
            <h2 className="mb-0 fw-bold text-center">Seleccionar Tipo de Proyecto</h2>
          </Card.Header>
          <Card.Body className="p-4">
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="mt-3">Cargando tipos de proyecto...</p>
              </div>
            ) : (
              <>
                <p className="mb-4">Seleccione el tipo de proyecto que desea crear:</p>
                <Table hover responsive className="align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Código</th>
                      <th>Nombre</th>
                      <th className="text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiposProyecto.map(tipo => (
                      <tr key={tipo.id_tipo_proyecto}>
                        <td>{tipo.codigo_tipo}</td>
                        <td>{tipo.nombre}</td>
                        <td className="text-center">
                          <Button 
                            variant="outline-primary" 
                            onClick={() => handleSelectTipoProyecto(tipo)}
                          >
                            Seleccionar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </>
            )}
          </Card.Body>
        </Card>
      ) : (
        <CrearProyectoApi 
          tipoProyectoSeleccionado={selectedTipoProyecto}
          onCancel={() => setSelectedTipoProyecto(null)}
        />
      )}
    </Container>
  );
};

// Interface for the CrearProyectoApi component props
interface CrearProyectoApiProps {
  tipoProyectoSeleccionado: TipoProyecto;
  onCancel: () => void;
}

// This is a placeholder that will be replaced by the actual component
// const CrearProyectoApi: React.FC<CrearProyectoApiProps> = ({ tipoProyectoSeleccionado, onCancel }) => {
//   // This will be replaced by the actual component in the next file
//   return <div>Loading CrearProyectoApi component...</div>;
// };

export default SeleccionarTipoProyecto;
import React, { useState, useEffect } from 'react';
import { Alert, Table, Spinner } from 'react-bootstrap';
import { POA } from '../interfaces/poa';
import { Actividad } from '../interfaces/actividad';
import { Tarea, ProgramacionMensualOut, ItemPresupuestario } from '../interfaces/tarea';
import { actividadAPI } from '../api/actividadAPI';
import { tareaAPI } from '../api/tareaAPI';
import { showWarning } from '../utils/toast';
import { getActividadesPorTipoPOA } from '../utils/listaActividades.ts'; // Importar la función de utilidad

interface VerPOAProps {
  poa: POA;
  onClose: () => void;
}

interface TareaConProgramacion extends Tarea {
  gastos_mensuales: number[];
  item_presupuestario?: ItemPresupuestario;
  codigo_item?: string;
}

interface ActividadConTareasYProgramacion extends Actividad {
  tareas: TareaConProgramacion[];
}

const VerPOA: React.FC<VerPOAProps> = ({ poa }) => {
  const [actividades, setActividades] = useState<ActividadConTareasYProgramacion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Nombres de los meses para las columnas
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  // Función para formatear números correctamente
  const formatearNumero = (numero: any): number => {
    if (numero === null || numero === undefined || numero === '') return 0;
    
    // Convertir a string y limpiar
    let numeroString = String(numero).trim();
    
    // Si el número viene como string con formato extraño, intentar parsearlo
    if (typeof numero === 'string') {
      // Remover ceros iniciales innecesarios pero conservar el formato decimal
      numeroString = numeroString.replace(/^0+/, '') || '0';
    }
    
    const numeroFormateado = parseFloat(numeroString);
    return isNaN(numeroFormateado) ? 0 : numeroFormateado;
  };

  // Función para mostrar números con formato de moneda
  const formatearMoneda = (numero: any): string => {
    const num = formatearNumero(numero);
    return num.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Función para obtener el item presupuestario de una tarea usando el nuevo endpoint
  const obtenerItemPresupuestarioDeTarea = async (idTarea: string): Promise<{ codigo: string; itemPresupuestario?: ItemPresupuestario }> => {
    try {
      const itemPresupuestario = await tareaAPI.getItemPresupuestarioDeTarea(idTarea);
      return {
        codigo: itemPresupuestario.codigo,
        itemPresupuestario: itemPresupuestario
      };
    } catch (error) {
      console.warn(`No se pudo obtener item presupuestario para tarea ${idTarea}:`, error);
      
      // Manejar errores específicos
      if (error instanceof Error) {
        if (error.message === "Item presupuestario no asociado a esta tarea") {
          return { codigo: 'Sin Item' };
        } else if (error.message === "Tarea no encontrada") {
          return { codigo: 'Tarea no encontrada' };
        }
      }
      
      return { codigo: 'Error' };
    }
  };

  // Función para obtener el tipo de POA desde el código
  const obtenerTipoPOA = (codigoPOA: string): string => {
    // Extraer el tipo del código POA (ej: "PIM-2024-001" -> "PIM")
    const partes = codigoPOA.split('-');
    return partes[0] || '';
  };

  // Función para ordenar actividades según la configuración
  const ordenarActividadesSegunConfiguracion = (actividades: ActividadConTareasYProgramacion[], tipoPOA: string): ActividadConTareasYProgramacion[] => {
    const actividadesConfiguracion = getActividadesPorTipoPOA(tipoPOA);
    
    // Crear un mapa de descripción -> índice de orden
    const ordenMap = new Map<string, number>();
    actividadesConfiguracion.forEach((actConfig, index) => {
      ordenMap.set(actConfig.descripcion, index);
    });

    // Ordenar actividades según la configuración
    const actividadesOrdenadas = [...actividades].sort((a, b) => {
      const ordenA = ordenMap.get(a.descripcion_actividad);
      const ordenB = ordenMap.get(b.descripcion_actividad);
      
      // Si ambas actividades están en la configuración, usar el orden definido
      if (ordenA !== undefined && ordenB !== undefined) {
        return ordenA - ordenB;
      }
      
      // Si solo una está en la configuración, la que está va primero
      if (ordenA !== undefined) return -1;
      if (ordenB !== undefined) return 1;
      
      // Si ninguna está en la configuración, mantener orden original
      return 0;
    });

    return actividadesOrdenadas;
  };

  useEffect(() => {
    const cargarDatosPOA = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Obtener actividades del POA
        const actividadesData = await actividadAPI.getActividadesPorPOA(poa.id_poa);
        
        // 2. Para cada actividad, obtener sus tareas
        const actividadesConTareas: ActividadConTareasYProgramacion[] = [];
        
        for (const actividad of actividadesData) {
          try {
            // Obtener tareas de la actividad
            const tareasData = await tareaAPI.getTareasPorActividad(actividad.id_actividad);
            
            // 3. Para cada tarea, obtener su programación mensual e item presupuestario
            const tareasConProgramacion: TareaConProgramacion[] = [];
            
            for (const tarea of tareasData) {
              try {
                // Obtener programación mensual de la tarea
                const programacionPromise = tareaAPI.getProgramacionMensualPorTarea(tarea.id_tarea);
                
                // Obtener item presupuestario de la tarea usando el nuevo endpoint
                const itemPresupuestarioPromise = obtenerItemPresupuestarioDeTarea(tarea.id_tarea);
                
                // Ejecutar ambas consultas en paralelo
                const [programacionData, itemPresupuestarioData] = await Promise.all([
                  programacionPromise.catch(() => []), // Si falla, usar array vacío
                  itemPresupuestarioPromise
                ]);
                
                // Crear array de 12 meses inicializado en 0
                const gastosMensuales = Array(12).fill(0);
                
                // Llenar el array con los datos de programación, formateando correctamente
                programacionData.forEach((programacion: ProgramacionMensualOut) => {
                  // El mes viene en formato "MM-YYYY", extraemos el mes
                  const mesNum = parseInt(programacion.mes.split('-')[0]) - 1; // -1 porque el array es 0-indexed
                  if (mesNum >= 0 && mesNum < 12) {
                    gastosMensuales[mesNum] = formatearNumero(programacion.valor);
                  }
                });
                
                tareasConProgramacion.push({
                  ...tarea,
                  gastos_mensuales: gastosMensuales,
                  item_presupuestario: itemPresupuestarioData.itemPresupuestario,
                  codigo_item: itemPresupuestarioData.codigo
                });
                
              } catch (tareaError) {
                console.warn(`Error al procesar tarea ${tarea.id_tarea}:`, tareaError);
                showWarning(`Error al procesar tarea ${tarea.id_tarea}`);
                
                // Si hay error, usar valores por defecto
                tareasConProgramacion.push({
                  ...tarea,
                  gastos_mensuales: Array(12).fill(0),
                  codigo_item: 'Error'
                });
              }
            }
            
            actividadesConTareas.push({
              ...actividad,
              tareas: tareasConProgramacion
            });
            
          } catch (actividadError) {
            console.warn(`No se pudieron obtener tareas para actividad ${actividad.id_actividad}:`, actividadError);
            showWarning(`No se pudieron obtener tareas para actividad ${actividad.id_actividad}`);
            // Si no hay tareas, crear actividad con array vacío
            actividadesConTareas.push({
              ...actividad,
              tareas: []
            });
          }
        }
        
        // *** ORDENAR ACTIVIDADES SEGÚN LA CONFIGURACIÓN ***
        const tipoPOA = obtenerTipoPOA(poa.codigo_poa);
        const actividadesOrdenadas = ordenarActividadesSegunConfiguracion(actividadesConTareas, tipoPOA);
        
        setActividades(actividadesOrdenadas);
        
      } catch (err) {
        console.error('Error al cargar datos del POA:', err);
        setError('Error al cargar los datos del POA');
      } finally {
        setLoading(false);
      }
    };

    cargarDatosPOA();
  }, [poa.id_poa]);

  // Calcular totales
  const calcularTotalGeneral = () => {
    return actividades.reduce((total, actividad) => {
      // Usar total_por_actividad directamente de la base de datos, formateado correctamente
      return total + formatearNumero(actividad.total_por_actividad || 0);
    }, 0);
  };

  const calcularTotalMes = (mesIndex: number) => {
    return actividades.reduce((total, actividad) => {
      const totalMesActividad = actividad.tareas.reduce((sum, tarea) => {
        return sum + formatearNumero(tarea.gastos_mensuales[mesIndex] || 0);
      }, 0);
      return total + totalMesActividad;
    }, 0);
  };

  const calcularTotalProgramacion = () => {
    return meses.reduce((total, _, index) => total + calcularTotalMes(index), 0);
  };

  // Función simplificada para obtener el código del item presupuestario
  const obtenerCodigoItemPresupuestario = (tarea: TareaConProgramacion): string => {
    // Usar el código obtenido del nuevo endpoint
    return tarea.codigo_item || 'N/A';
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary">
          <span className="visually-hidden">Cargando datos del POA...</span>
        </Spinner>
        <div className="mt-2">Cargando datos del POA...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5>Detalles del POA: {poa.codigo_poa}</h5>
        </div>
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Detalles del POA: {poa.codigo_poa}</h5>
      </div>
      
      {/* Información general del POA */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <strong>Código POA:</strong>
          <p>{poa.codigo_poa}</p>
        </div>
        <div className="col-md-3">
          <strong>Año de Ejecución:</strong>
          <p>{poa.anio_ejecucion}</p>
        </div>
        <div className="col-md-3">
          <strong>Presupuesto Asignado:</strong>
          <p className="text-success">${formatearMoneda(poa.presupuesto_asignado)}</p>
        </div>
        <div className="col-md-3">
          <strong>Fecha de Creación:</strong>
          <p>{new Date(poa.fecha_creacion).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Resumen */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card bg-light">
            <div className="card-body text-center">
              <h6 className="card-title">Total Actividades</h6>
              <h4 className="text-primary">{actividades.length}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-light">
            <div className="card-body text-center">
              <h6 className="card-title">Total Tareas</h6>
              <h4 className="text-info">
                {actividades.reduce((total, act) => total + act.tareas.length, 0)}
              </h4>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-light">
            <div className="card-body text-center">
              <h6 className="card-title">Presupuesto Total</h6>
              <h4 className="text-success">${formatearMoneda(calcularTotalGeneral())}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de actividades y tareas */}
      {actividades.length > 0 ? (
        <div className="table-responsive">
          <Table bordered hover size="sm" style={{ fontSize: '0.8rem' }}>
            <thead className="table-light">
              <tr>
                <th rowSpan={2} style={{ backgroundColor: 'transparent', border: 'none', minWidth: '300px', width: '300px' }}>
                </th>
                <th rowSpan={2} style={{ backgroundColor: 'transparent', border: 'none', minWidth: '200px' }}>
                </th>
                <th rowSpan={2} style={{ backgroundColor: 'transparent', border: 'none', minWidth: '100px' }}>
                </th>
                <th rowSpan={2} style={{ backgroundColor: 'transparent', border: 'none', minWidth: '80px' }}>
                </th>
                <th rowSpan={2} style={{ backgroundColor: 'transparent', border: 'none', minWidth: '100px' }}>
                </th>
                <th rowSpan={2} style={{ backgroundColor: 'transparent', border: 'none', minWidth: '100px' }}>
                </th>
                <th rowSpan={2} style={{ verticalAlign: 'middle', minWidth: '100px', backgroundColor: '#D9D9D9' }}>
                  TOTAL POR ACTIVIDAD
                </th>
                <th colSpan={13} className="text-center" style={{ backgroundColor: '#DAEEF3' }}>
                  PROGRAMACIÓN DE EJECUCIÓN {poa.anio_ejecucion}
                </th>
              </tr>
            </thead>
            <tbody>
              {actividades.map((actividad, actIndex) => (
                <React.Fragment key={actividad.id_actividad}>
                  {/* Fila de encabezado de actividad */}
                  <tr style={{ backgroundColor: '#D9D9D9' }}>
                    <td className="fw-bold">
                      ({actIndex + 1}) {actividad.descripcion_actividad}
                    </td>
                    <td className="fw-bold text-center">DESCRIPCIÓN O DETALLE</td>
                    <td className="fw-bold text-center">ITEM PRESUPUESTARIO</td>
                    <td className="fw-bold text-center">CANTIDAD</td>
                    <td className="fw-bold text-center">PRECIO UNITARIO</td>
                    <td className="fw-bold text-center">TOTAL</td>
                    <td className="fw-bold text-center" style={{ backgroundColor: '#D9D9D9' }}>
                      {/* Usar total_por_actividad directamente de la base de datos, formateado */}
                      ${formatearMoneda(actividad.total_por_actividad || 0)}
                    </td>
                    {meses.map((mes) => (
                      <td key={mes} className="fw-bold text-center" style={{ backgroundColor: '#DAEEF3' }}>
                        {mes}
                      </td>
                    ))}
                    <td className="fw-bold text-center" style={{ backgroundColor: '#DAEEF3', width: '100px', maxWidth: '100px' }}>
                      SUMAN
                    </td>
                  </tr>

                  {/* Filas de tareas */}
                  {actividad.tareas.length > 0 ? (
                    actividad.tareas.map((tarea) => {
                      const totalProgramacion = tarea.gastos_mensuales.reduce((sum, val) => sum + formatearNumero(val || 0), 0);
                      
                      return (
                        <tr key={tarea.id_tarea}>
                          <td>{tarea.nombre}</td>
                          <td>{tarea.detalle_descripcion}</td>
                          <td>
                            <code className="bg-light px-1 rounded">
                              {obtenerCodigoItemPresupuestario(tarea)}
                            </code>
                          </td>
                          <td className="text-end">{formatearNumero(tarea.cantidad)}</td>
                          <td className="text-end">${formatearMoneda(tarea.precio_unitario)}</td>
                          <td className="text-end text-success">
                            <strong>${formatearMoneda(tarea.total)}</strong>
                          </td>
                          <td style={{ backgroundColor: '#D9D9D9' }}></td>
                          {tarea.gastos_mensuales.map((gasto, mesIndex) => (
                            <td key={mesIndex} className="text-end" style={{ backgroundColor: '#DAEEF3' }}>
                              {formatearNumero(gasto) > 0 ? `$${formatearMoneda(gasto)}` : '0'}
                            </td>
                          ))}
                          <td className="text-end fw-bold" style={{ backgroundColor: '#DAEEF3', width: '100px', maxWidth: '100px' }}>
                            ${formatearMoneda(totalProgramacion)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={19} className="text-center text-muted">
                        Sin tareas asignadas
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              
              {/* Fila de totales generales */}
              <tr style={{ backgroundColor: '#FCD5B4' }}>
                <td colSpan={6} className="text-center fw-bold">
                  TOTAL GENERAL POA
                </td>
                <td style={{ backgroundColor: '#D9D9D9' }}></td>
                {meses.map((_, mesIndex) => (
                  <td key={mesIndex} className="text-end fw-bold" style={{ backgroundColor: '#DAEEF3' }}>
                    ${formatearMoneda(calcularTotalMes(mesIndex))}
                  </td>
                ))}
                <td className="text-end fw-bold" style={{ backgroundColor: '#92D050', width: '100px', maxWidth: '100px' }}>
                  ${formatearMoneda(calcularTotalProgramacion())}
                </td>
              </tr>
            </tbody>
          </Table>
        </div>
      ) : (
        <Alert variant="info">
          <i className="bi bi-info-circle me-2"></i>
          Este POA no tiene actividades ni tareas asignadas.
        </Alert>
      )}

      {/* Información adicional */}
      {actividades.length > 0 && (
        <div className="mt-3">
          <small className="text-muted">
            <i className="bi bi-info-circle me-1"></i>
            La tabla muestra todas las actividades y tareas del POA con su programación mensual correspondiente al año {poa.anio_ejecucion}.
          </small>
        </div>
      )}
    </div>
  );
};

export default VerPOA;
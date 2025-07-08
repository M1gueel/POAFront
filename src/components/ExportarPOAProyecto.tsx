import React, { useState } from 'react';
import { Button, Dropdown, DropdownButton, Spinner } from 'react-bootstrap';
import * as ExcelJS from 'exceljs';
import { POA } from '../interfaces/poa';
import { actividadAPI } from '../api/actividadAPI';
import { tareaAPI } from '../api/tareaAPI';
import { showError, showSuccess } from '../utils/toast';
import { ProgramacionMensualOut } from '../interfaces/tarea';

interface ExportarPOAProyectoProps {
  codigoProyecto: string;
  poas: POA[];
}

interface TareaConProgramacion {
  id_tarea: string;
  nombre: string;
  detalle_descripcion?: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  gastos_mensuales: number[];
  codigo_item?: string;
  detalle_tarea?: any;
}

interface ActividadConTareasYProgramacion {
  id_actividad: string;
  descripcion_actividad: string;
  total_por_actividad: number;
  tareas: TareaConProgramacion[];
}

const ExportarPOAProyecto: React.FC<ExportarPOAProyectoProps> = ({
  codigoProyecto,
  poas
}) => {
  const [loading, setLoading] = useState<boolean>(false);

  // Definir estilo de borde estándar
  const bordeEstandar: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: '000000' } },
    left: { style: 'thin', color: { argb: '000000' } },
    bottom: { style: 'thin', color: { argb: '000000' } },
    right: { style: 'thin', color: { argb: '000000' } }
  };

  // Función para formatear números correctamente
  const formatearNumero = (numero: any): number => {
    if (numero === null || numero === undefined || numero === '') return 0;
    
    let numeroString = String(numero).trim();
    
    if (typeof numero === 'string') {
      numeroString = numeroString.replace(/^0+/, '') || '0';
    }
    
    const numeroFormateado = parseFloat(numeroString);
    return isNaN(numeroFormateado) ? 0 : numeroFormateado;
  };

  // Función para aplicar estilos a una celda (sin bordes para títulos)
  const aplicarEstiloTitulo = (cell: ExcelJS.Cell, fontSize: number = 12) => {
    cell.font = { bold: true, size: fontSize, color: { argb: '000000' } };
    cell.alignment = { 
      horizontal: 'center', 
      vertical: 'middle',
      wrapText: true 
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E6E6FA' }
    };
  };

  // Función para aplicar wrap text a todas las celdas y bordes solo a partir de la fila 7
  const aplicarEstilosGeneralesATodaLaHoja = (worksheet: ExcelJS.Worksheet) => {
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        // Aplicar wrap text a todas las celdas
        if (!cell.alignment) {
          cell.alignment = { wrapText: true };
        } else {
          cell.alignment = { ...cell.alignment, wrapText: true };
        }
        
        // Aplicar bordes solo a partir de la fila 7
        if (rowNumber >= 7 && (!cell.border || Object.keys(cell.border).length === 0)) {
          cell.border = bordeEstandar;
        }
      });
    });
  };

  // Función para aplicar estilos a la fila de encabezado de actividad
  const aplicarEstiloEncabezadoActividad = (worksheet: ExcelJS.Worksheet, fila: number) => {
    const row = worksheet.getRow(fila);
    row.eachCell((cell, colNumber) => {
      cell.font = { bold: true, size: 11 };
      cell.alignment = { 
        horizontal: 'center', 
        vertical: 'middle',
        wrapText: true 
      };
      cell.border = bordeEstandar;

      // Aplicar colores según la columna
      if (colNumber >= 1 && colNumber <= 6) { // Columnas A-F (descripción hasta TOTAL)
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'D9D9D9' } // Color gris #D9D9D9
        };
      } else if (colNumber === 7) { // Columna G ("TOTAL POR ACTIVIDAD")
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'D9D9D9' } // Cambiado a #D9D9D9
        };
        // Formatear el valor como número
        if (typeof cell.value === 'number') {
          cell.numFmt = '#,##0.00';
        }
      } else { // Columnas H en adelante (meses)
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'DAEEF3' } // Color azul claro #DAEEF3
        };
      }
    });
  };

  // Función para obtener el código del item presupuestario
  const obtenerCodigoItemPresupuestario = (tarea: any): string => {
    if (tarea.detalle_tarea?.codigo_item) {
      return tarea.detalle_tarea.codigo_item;
    }
    
    if (tarea.detalle_tarea?.item_presupuestario?.codigo) {
      return tarea.detalle_tarea.item_presupuestario.codigo;
    }
    
    return 'N/A';
  };

  // Función para obtener datos de un POA específico
  const obtenerDatosPOA = async (poa: POA): Promise<ActividadConTareasYProgramacion[]> => {
    try {
      // 1. Obtener actividades del POA
      const actividadesData = await actividadAPI.getActividadesPorPOA(poa.id_poa);
      
      // 2. Para cada actividad, obtener sus tareas
      const actividadesConTareas: ActividadConTareasYProgramacion[] = [];
      
      for (const actividad of actividadesData) {
        try {
          // Obtener tareas de la actividad
          const tareasData = await tareaAPI.getTareasPorActividad(actividad.id_actividad);
          
          // 3. Para cada tarea, obtener su programación mensual
          const tareasConProgramacion: TareaConProgramacion[] = [];
          
          for (const tarea of tareasData) {
            try {
              // Obtener programación mensual de la tarea
              const programacionData = await tareaAPI.getProgramacionMensualPorTarea(tarea.id_tarea);
              
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
                id_tarea: tarea.id_tarea,
                nombre: tarea.nombre,
                detalle_descripcion: tarea.detalle_descripcion,
                cantidad: formatearNumero(tarea.cantidad),
                precio_unitario: formatearNumero(tarea.precio_unitario),
                total: formatearNumero(tarea.total),
                gastos_mensuales: gastosMensuales,
                codigo_item: obtenerCodigoItemPresupuestario(tarea),
                detalle_tarea: tarea.detalle_tarea
              });
              
            } catch (tareaError) {
              console.warn(`No se pudo obtener programación para tarea ${tarea.id_tarea}:`, tareaError);
              // Si no hay programación, usar array de ceros
              tareasConProgramacion.push({
                id_tarea: tarea.id_tarea,
                nombre: tarea.nombre,
                detalle_descripcion: tarea.detalle_descripcion,
                cantidad: formatearNumero(tarea.cantidad),
                precio_unitario: formatearNumero(tarea.precio_unitario),
                total: formatearNumero(tarea.total),
                gastos_mensuales: Array(12).fill(0),
                codigo_item: obtenerCodigoItemPresupuestario(tarea),
                detalle_tarea: tarea.detalle_tarea
              });
            }
          }
          
          actividadesConTareas.push({
            id_actividad: actividad.id_actividad,
            descripcion_actividad: actividad.descripcion_actividad,
            total_por_actividad: formatearNumero(actividad.total_por_actividad),
            tareas: tareasConProgramacion
          });
          
        } catch (actividadError) {
          console.warn(`No se pudieron obtener tareas para actividad ${actividad.id_actividad}:`, actividadError);
          // Si no hay tareas, crear actividad con array vacío
          actividadesConTareas.push({
            id_actividad: actividad.id_actividad,
            descripcion_actividad: actividad.descripcion_actividad,
            total_por_actividad: formatearNumero(actividad.total_por_actividad),
            tareas: []
          });
        }
      }
      
      return actividadesConTareas;
      
    } catch (error) {
      console.error('Error al obtener datos del POA:', error);
      throw error;
    }
  };

  // Función para crear una hoja con información del POA
  const crearHojaPOA = (workbook: ExcelJS.Workbook, poa: POA, actividades: ActividadConTareasYProgramacion[], nombreHoja: string) => {
    const worksheet = workbook.addWorksheet(nombreHoja);

    // Configurar anchos de columnas
    worksheet.columns = [
      { width: 474 / 7 }, // Columna A
      { width: 491 / 7 }, // Columna B
      { width: 165 / 7 }, // Columna C
      { width: 165 / 7 }, // Columna D
      { width: 165 / 7 }, // Columna E
      { width: 165 / 7 }, // Columna F
      { width: 89 / 7 }, // Columna G
      { width: 89 / 7 }, // Columna H
      { width: 89 / 7 }, // Columna I
      { width: 89 / 7 }, // Columna J
      { width: 89 / 7 }, // Columna K
      { width: 89 / 7 }, // Columna L
      { width: 89 / 7 }, // Columna M
      { width: 89 / 7 }, // Columna N
      { width: 89 / 7 }, // Columna O
      { width: 89 / 7 }, // Columna P
      { width: 89 / 7 }, // Columna Q
      { width: 89 / 7 }, // Columna R
      { width: 89 / 7 }, // Columna S
      { width: 89 / 7 }  // Columna T
    ];

    // Agregar datos del encabezado
    worksheet.addRow(['VICERRECTORADO DE INVESTIGACIÓN, INNOVACIÓN Y VINCULACIÓN']);
    worksheet.addRow(['DIRECCIÓN DE INVESTIGACIÓN']);
    worksheet.addRow([`PROGRAMACIÓN PARA EL POA ${poa.anio_ejecucion}`]);
    worksheet.addRow([]); // Fila vacía
    worksheet.addRow(['', 'Código de Proyecto', codigoProyecto]);
    worksheet.addRow(['', 'Presupuesto Asignado', poa.presupuesto_asignado.toLocaleString('es-CO')]);
    worksheet.addRow([,,,,,,,'TOTAL POR ACTIVIDAD', `PROGRAMACIÓN DE EJECUCIÓN ${poa.anio_ejecucion}`]);

    let filaProgramacionyTotal = 7;

    // Aplicar estilo especial al encabezado de la actividad
    aplicarEstiloEncabezadoActividad(worksheet, filaProgramacionyTotal);
    filaProgramacionyTotal++;

    // Fusionar celdas en las primeras 4 filas (A:G)
    worksheet.mergeCells('A1:G1');
    worksheet.mergeCells('A2:G2');
    worksheet.mergeCells('A3:G3');
    worksheet.mergeCells('A4:G4');

    // Fusionar celda H7 hasta T7 y aplicar color #DAEEF3
    worksheet.mergeCells('H7:T7');
    const cellH7 = worksheet.getCell('H7');
    cellH7.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'DAEEF3' }
    };
    const cellG7 = worksheet.getCell('G7');
    cellG7.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'D9D9D9' }
    };

    let filaActual = 8; // Empezar después de los encabezados principales

    if (actividades && actividades.length > 0) {
      // Iterar sobre las actividades del POA con numeración
      actividades.forEach((actividad, indiceActividad) => {
        if (actividad.tareas && actividad.tareas.length > 0) {
          // Calcular el total de todas las tareas de esta actividad
          const totalActividad = actividad.tareas.reduce((sum, tarea) => sum + (tarea.total || 0), 0);

          // Agregar numeración a la actividad
          const numeroActividad = indiceActividad + 1;
          const nombreActividadConNumero = `(${numeroActividad}) ${actividad.descripcion_actividad}`;

          // Agregar fila de encabezado para esta actividad
          worksheet.addRow([
            nombreActividadConNumero,
            'DESCRIPCIÓN O DETALLE', 
            'ITEM PRESUPUESTARIO', 
            'CANTIDAD', 
            'PRECIO UNITARIO', 
            'TOTAL', 
            totalActividad,
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre', 
            'SUMAN'
          ]);

          // Aplicar estilo especial al encabezado de la actividad
          aplicarEstiloEncabezadoActividad(worksheet, filaActual);
          filaActual++;

          // Para cada tarea de la actividad
          actividad.tareas.forEach((tarea) => {
            // Calcular el total de programación mensual
            const totalProgramacion = tarea.gastos_mensuales?.reduce((sum, val) => sum + (val || 0), 0) || 0;

            // Agregar fila de tarea con nueva estructura
            const filaTarea = [
              tarea.nombre,
              tarea.detalle_descripcion || '',
              tarea.codigo_item || '',
              tarea.cantidad,
              tarea.precio_unitario,
              tarea.total,
              '', // Columna G vacía por defecto
              ...(tarea.gastos_mensuales || Array(12).fill(0)), // Gastos mensuales (12 meses)
              totalProgramacion // SUMAN
            ];

            worksheet.addRow(filaTarea);

            // Aplicar estilos a la fila de datos
            const row = worksheet.getRow(filaActual);
            row.eachCell((cell, colNumber) => {
              // Aplicar bordes
              cell.border = bordeEstandar;
              
              // Aplicar wrap text
              if (!cell.alignment) {
                cell.alignment = { wrapText: true };
              } else {
                cell.alignment = { ...cell.alignment, wrapText: true };
              }

              // Aplicar color de fondo según la columna
              if (colNumber === 7) { // Columna G
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'D9D9D9' }
                };
              } else if (colNumber >= 8) { // Columnas H en adelante
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'DAEEF3' }
                };
              }

              // Formatear números en las columnas correspondientes
              if (colNumber >= 4 && colNumber <= 6) { // Cantidad, Precio Unitario, Total
                if (typeof cell.value === 'number') {
                  cell.numFmt = '#,##0.00';
                }
              }
              
              // Formatear columnas de meses (H hasta S) y SUMAN (T)
              if (colNumber >= 8 && colNumber <= 20) {
                if (typeof cell.value === 'number' && cell.value > 0) {
                  cell.numFmt = '#,##0.00';
                }
              }
            });

            filaActual++;
          });
        }
      });

      // Agregar fila de total general del POA
      const totalGeneralPOA = actividades.reduce((sum, act) => 
        sum + (act.total_por_actividad || 0), 0
      );

      const filaTotalGeneral = [
        'TOTAL GENERAL POA',
        '', '', '', '', '',
        totalGeneralPOA,
        '', // Columna G
        ...Array(11).fill(''), // Meses vacíos
        totalGeneralPOA // SUMAN
      ];

      worksheet.addRow(filaTotalGeneral);

      // Fusionar celdas de TOTAL GENERAL POA desde A hasta E y aplicar color #FCD5B4
      worksheet.mergeCells(`A${filaActual}:F${filaActual}`);
      const cellTotalGeneral = worksheet.getCell(`A${filaActual}`);
      cellTotalGeneral.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FCD5B4' }
      };

      // Aplicar estilo especial a la fila de total general
      const rowTotalGeneral = worksheet.getRow(filaActual);
      rowTotalGeneral.eachCell((cell, colNumber) => {
        cell.border = bordeEstandar;
        cell.font = { bold: true, size: 12 };
        cell.alignment = { 
          horizontal: 'center', 
          vertical: 'middle',
          wrapText: true 
        };
        
        // Aplicar color específico según la columna
        if (colNumber === 7) { // Columna G
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'D9D9D9' }
          };
        } else if (colNumber >= 8) { // Columnas H en adelante
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'DAEEF3' }
          };
        }
        
        if ((colNumber === 6 || colNumber === 20) && typeof cell.value === 'number') { // Total y SUMAN
          cell.numFmt = '#,##0.00';
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '92D050' } // Verde claro
          };
        }
      });
    } else {
      // Si no hay datos de actividades, agregar una fila indicando que no hay datos
      worksheet.addRow(['Sin actividades registradas', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      
      const row = worksheet.getRow(filaActual);
      row.eachCell((cell, colNumber) => {
        cell.border = bordeEstandar;
        cell.alignment = { wrapText: true };
        
        // Aplicar color #DAEEF3 a partir de la columna H
        if (colNumber >= 8) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'DAEEF3' }
          };
        }
        
        if (cell.value === 'Sin actividades registradas') {
          cell.font = { italic: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6E6' } // Rojo muy claro
          };
        }
      });
    }

    // Aplicar estilos a los títulos principales
    aplicarEstiloTitulo(worksheet.getCell('A1'), 14);
    aplicarEstiloTitulo(worksheet.getCell('A2'), 12);
    aplicarEstiloTitulo(worksheet.getCell('A3'), 12);

    // Aplicar estilos generales
    aplicarEstilosGeneralesATodaLaHoja(worksheet);
  };

  // Función para descargar el archivo Excel
  const descargarArchivo = async (workbook: ExcelJS.Workbook, nombreArchivo: string) => {
    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreArchivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess('Archivo Excel descargado exitosamente');
    } catch (error) {
      console.error('Error al generar el archivo Excel:', error);
      showError('Error al generar el archivo Excel');
    }
  };

  // Función para exportar un POA específico
  const exportarPOA = async (poa: POA) => {
    try {
      setLoading(true);
      
      // Obtener datos del POA
      const actividades = await obtenerDatosPOA(poa);
      
      const workbook = new ExcelJS.Workbook();
      
      workbook.creator = 'Sistema POA';
      workbook.lastModifiedBy = 'Sistema POA';
      workbook.created = new Date();
      workbook.modified = new Date();

      crearHojaPOA(workbook, poa, actividades, poa.codigo_poa.toString());

      const nombreArchivo = `POA_${poa.codigo_poa}_${codigoProyecto}.xlsx`;
      await descargarArchivo(workbook, nombreArchivo);
      
    } catch (error) {
      console.error('Error al exportar POA:', error);
      showError('Error al exportar POA');
    } finally {
      setLoading(false);
    }
  };

  // Función para exportar todos los POAs
  const exportarTodosPOAs = async () => {
    try {
      setLoading(true);
      
      const workbook = new ExcelJS.Workbook();
      
      workbook.creator = 'Sistema POA';
      workbook.lastModifiedBy = 'Sistema POA';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Obtener datos de todos los POAs
      for (let i = 0; i < poas.length; i++) {
        const poa = poas[i];
        try {
          const actividades = await obtenerDatosPOA(poa);
          crearHojaPOA(workbook, poa, actividades, `POA_${poa.codigo_poa}`);
        } catch (error) {
          console.warn(`Error al obtener datos del POA ${poa.codigo_poa}:`, error);
          // Crear hoja vacía si hay error
          crearHojaPOA(workbook, poa, [], `POA_${poa.codigo_poa}`);
        }
      }

      const nombreArchivo = `POAs_Proyecto_${codigoProyecto}.xlsx`;
      await descargarArchivo(workbook, nombreArchivo);
      
    } catch (error) {
      console.error('Error al exportar todos los POAs:', error);
      showError('Error al exportar todos los POAs');
    } finally {
      setLoading(false);
    }
  };

  if (!poas || poas.length === 0) {
    return null;
  }

  return (
    <div className="d-flex align-items-center">
      {loading && (
        <Spinner 
          animation="border" 
          size="sm" 
          variant="success" 
          className="me-2"
        />
      )}
      
      {poas.length === 1 ? (
        <Button 
          variant="success" 
          size="sm"
          onClick={() => exportarPOA(poas[0])}
          disabled={loading}
          className="d-flex align-items-center"
        >
          <i className="fas fa-file-excel me-1"></i>
          {loading ? 'Exportando...' : 'Exportar Excel'}
        </Button>
      ) : (
        <DropdownButton 
          id="dropdown-exportar-poa" 
          title={loading ? 'Exportando...' : 'Exportar Excel'}
          variant="success"
          size="sm"
          disabled={loading}
        >
          <Dropdown.Item onClick={exportarTodosPOAs}>
            <i className="fas fa-file-excel me-2"></i>
            Exportar todos los POAs
          </Dropdown.Item>
          <Dropdown.Divider />
          {poas.map((poa) => (
            <Dropdown.Item 
              key={poa.id_poa} 
              onClick={() => exportarPOA(poa)}
            >
              <i className="fas fa-file-excel me-2"></i>
              Exportar POA {poa.codigo_poa}
            </Dropdown.Item>
          ))}
        </DropdownButton>
      )}
    </div>
  );
};

export default ExportarPOAProyecto;
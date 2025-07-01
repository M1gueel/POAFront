import React from 'react';
import { Button, Dropdown, DropdownButton } from 'react-bootstrap';
import * as ExcelJS from 'exceljs';

interface ExportarPOAProps {
  codigoProyecto: string;
  poas: {
    id_poa: string;
    codigo_poa: string;
    anio_ejecucion: string;
    presupuesto_asignado: number;
  }[];
  actividadesYTareas?: any[]; // Datos de actividades y tareas
  onExport?: () => void;
}

const ExportarPOA: React.FC<ExportarPOAProps> = ({
  codigoProyecto,
  poas,
  actividadesYTareas = [], // NUEVO
  onExport
}) => {  
  // Definir estilo de borde estándar
  const bordeEstandar: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: '000000' } },
    left: { style: 'thin', color: { argb: '000000' } },
    bottom: { style: 'thin', color: { argb: '000000' } },
    right: { style: 'thin', color: { argb: '000000' } }
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
    // No aplicar bordes a los títulos principales
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

  // Función para crear una hoja con información del POA
  const crearHojaPOA = (workbook: ExcelJS.Workbook, poa: any, nombreHoja: string) => {
    const worksheet = workbook.addWorksheet(nombreHoja);

    // Configurar anchos de columnas
    worksheet.columns = [
      { width: 474 / 7 }, // Columna A - 474 píxeles convertido a unidades Excel (aproximadamente)
      { width: 491 / 7 }, // Columna B - 491 píxeles
      { width: 165 / 7 }, // Columna C - 185 píxeles
      { width: 165 / 7 }, // Columna D - 185 píxeles
      { width: 165 / 7 }, // Columna E - 185 píxeles
      { width: 165 / 7 }, // Columna F - 185 píxeles
      { width: 89 / 7 }, // Columna G - 109 píxeles (estándar)
      { width: 89 / 7 }, // Columna H - 109 píxeles (estándar)
      { width: 89 / 7 }, // Columna I - 109 píxeles (estándar)
      { width: 89 / 7 }, // Columna J - 109 píxeles (estándar)
      { width: 89 / 7 }, // Columna K - 109 píxeles (estándar)
      { width: 89 / 7 }, // Columna L - 109 píxeles (estándar)
      { width: 89 / 7 }, // Columna M - 109 píxeles (estándar)
      { width: 89 / 7 }, // Columna N - 109 píxeles (estándar)
      { width: 89 / 7 }, // Columna O - 109 píxeles (estándar)
      { width: 89 / 7 }, // Columna P - 109 píxeles (estándar)
      { width: 89 / 7 }, // Columna Q - 109 píxeles (estándar)
      { width: 89 / 7 }, // Columna R - 109 píxeles (estándar)
      { width: 89 / 7 }, // Columna S - 109 píxeles (estándar)
      { width: 89 / 7 }  // Columna T - 109 píxeles (estándar)
    ];

    // Agregar datos del encabezado
    worksheet.addRow(['VICERRECTORADO DE INVESTIGACIÓN, INNOVACIÓN Y VINCULACIÓN']);
    worksheet.addRow(['DIRECCIÓN DE INVESTIGACIÓN']);
    worksheet.addRow([`PROGRAMACIÓN PARA EL POA ${poa.anio_ejecucion}`]);
    worksheet.addRow([]); // Fila vacía
    worksheet.addRow(['', 'Código de Proyecto', codigoProyecto]); // Empezar desde columna B
    worksheet.addRow(['', 'Presupuesto Asignado', poa.presupuesto_asignado.toLocaleString('es-CO')]); // Empezar desde columna B
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

    // NUEVO: Encontrar los datos de actividades para este POA
    const datosPoaActual = actividadesYTareas.find(data => data.id_poa === poa.id_poa);
    
    let filaActual = 8; // Empezar después de los encabezados principales

    if (datosPoaActual && datosPoaActual.actividades && datosPoaActual.actividades.length > 0) {
      // Iterar sobre las actividades del POA con numeración
      datosPoaActual.actividades.forEach((actividad: any, indiceActividad: number) => {
        if (actividad.tareas && actividad.tareas.length > 0) {
          // Calcular el total de todas las tareas de esta actividad
          const totalActividad = actividad.tareas.reduce((sum: number, tarea: any) => sum + (tarea.total || 0), 0);

          // MODIFICACIÓN: Agregar numeración a la actividad
          const numeroActividad = indiceActividad + 1;
          const nombreActividadConNumero = `(${numeroActividad}) ${actividad.descripcion_actividad}`;

          // Agregar fila de encabezado para esta actividad
          worksheet.addRow([
            nombreActividadConNumero, // Reemplazar por el nombre con numeración
            'DESCRIPCIÓN O DETALLE', 
            'ITEM PRESUPUESTARIO', 
            'CANTIDAD', 
            'PRECIO UNITARIO', 
            'TOTAL', 
            totalActividad, // Reemplazar '0,00' por el total calculado
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre', 
            'SUMAN'
          ]);

          // Aplicar estilo especial al encabezado de la actividad
          aplicarEstiloEncabezadoActividad(worksheet, filaActual);
          filaActual++;

          // Para cada tarea de la actividad
          actividad.tareas.forEach((tarea: any) => {
            // Calcular el total de programación mensual
            const totalProgramacion = tarea.gastos_mensuales?.reduce((sum: number, val: number) => sum + (val || 0), 0) || 0;

            // Agregar fila de tarea con nueva estructura
            const filaTarea = [
              tarea.nombre, // Usar tarea.nombre en lugar de actividad.descripcion_actividad
              tarea.detalle_descripcion, // Usar tarea.detalle_descripcion
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
              if (colNumber === 7) { // Columna G (después de tarea.total)
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'D9D9D9' } // Color #D9D9D9
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
      const totalGeneralPOA = datosPoaActual.actividades.reduce((sum: number, act: any) => 
        sum + (act.total_por_actividad || 0), 0
      );

      const filaTotalGeneral = [
        'TOTAL GENERAL POA', // En la primera columna
        '', // Descripción vacía
        '', '', '', '',// Columnas vacías
        totalGeneralPOA, // Total en columna G
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
        fgColor: { argb: 'FCD5B4' } // Color #FCD5B4
      };

      // Aplicar estilo especial a la fila de total general
      const rowTotalGeneral = worksheet.getRow(filaActual);
      rowTotalGeneral.eachCell((cell, colNumber) => {
        cell.border = bordeEstandar;
        cell.font = { bold: true, size: 12 };
        // MODIFICACIÓN: Centrar texto horizontalmente en toda la fila
        cell.alignment = { 
          horizontal: 'center', 
          vertical: 'middle',
          wrapText: true 
        };
        
        // Aplicar color específico según la columna
        if (colNumber === 7) { // Columna G (después de totalGeneralPOA)
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'D9D9D9' } // Color #D9D9D9
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

      if (onExport) {
        onExport();
      }
    } catch (error) {
      console.error('Error al generar el archivo Excel:', error);
    }
  };

  // Función para exportar un POA específico
  const exportarPOA = async (poa: any) => {
    const workbook = new ExcelJS.Workbook();
    
    workbook.creator = 'Sistema POA';
    workbook.lastModifiedBy = 'Sistema POA';
    workbook.created = new Date();
    workbook.modified = new Date();

    crearHojaPOA(workbook, poa, poa.codigo_poa.toString());

    const nombreArchivo = `POA_${poa.codigo_poa}_${codigoProyecto}.xlsx`;
    await descargarArchivo(workbook, nombreArchivo);
  };

  // Función para exportar todos los POAs
  const exportarTodosPOAs = async () => {
    const workbook = new ExcelJS.Workbook();
    
    workbook.creator = 'Sistema POA';
    workbook.lastModifiedBy = 'Sistema POA';
    workbook.created = new Date();
    workbook.modified = new Date();

    poas.forEach((poa, index) => {
      crearHojaPOA(workbook, poa, `POA ${index + 1}`);
    });

    const nombreArchivo = `POAs_Proyecto_${codigoProyecto}.xlsx`;
    await descargarArchivo(workbook, nombreArchivo);
  };

  if (!poas || poas.length === 0) {
    return null;
  }

  return (
    <div className="mb-3">
      {poas.length === 1 ? (
        <Button 
          variant="success" 
          onClick={() => exportarPOA(poas[0])}
          className="d-flex align-items-center"
        >
          <i className="fas fa-file-excel me-2"></i>
          Exportar POA
        </Button>
      ) : (
        <DropdownButton 
          id="dropdown-exportar-poa" 
          title="Exportar POAs"
          variant="success"
        >
          <Dropdown.Item onClick={exportarTodosPOAs}>
            Exportar todos los POAs
          </Dropdown.Item>
          <Dropdown.Divider />
          {poas.map((poa) => (
            <Dropdown.Item 
              key={poa.id_poa} 
              onClick={() => exportarPOA(poa)}
            >
              Exportar POA {poa.codigo_poa}
            </Dropdown.Item>
          ))}
        </DropdownButton>
      )}
    </div>
  );
};

export default ExportarPOA;
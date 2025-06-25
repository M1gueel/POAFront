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

  const aplicarEstiloEtiqueta = (cell: ExcelJS.Cell) => {
    cell.font = { bold: true };
    cell.alignment = { wrapText: true };
    // Solo aplicar bordes a etiquetas que estén en fila 7 o posterior
    // (se aplicarán en la función general)
  };

  // Funciones auxiliares para conversión de columnas
  const columnNameToNumber = (name: string): number => {
    let result = 0;
    for (let i = 0; i < name.length; i++) {
      result = result * 26 + (name.charCodeAt(i) - 64);
    }
    return result;
  };

  const columnNumberToName = (num: number): string => {
    let result = '';
    while (num > 0) {
      num--;
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    return result;
  };

  // Función optimizada para aplicar estilos a múltiples celdas
  const aplicarEstiloACeldas = (worksheet: ExcelJS.Worksheet, rangos: string[], estiloFunc: (cell: ExcelJS.Cell) => void) => {
    rangos.forEach(rango => {
      if (rango.includes(':')) {
        // Es un rango de celdas
        const startCol = rango.split(':')[0].replace(/\d+/, '');
        const endCol = rango.split(':')[1].replace(/\d+/, '');
        const row = parseInt(rango.split(':')[0].replace(/[A-Z]/g, ''));
        
        // Obtener códigos de columna
        const startColNum = columnNameToNumber(startCol);
        const endColNum = columnNameToNumber(endCol);
        
        for (let col = startColNum; col <= endColNum; col++) {
          const colName = columnNumberToName(col);
          estiloFunc(worksheet.getCell(`${colName}${row}`));
        }
      } else {
        // Es una celda individual
        estiloFunc(worksheet.getCell(rango));
      }
    });
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

  // Función para aplicar bordes a un rango específico de celdas
  const aplicarBordesARango = (worksheet: ExcelJS.Worksheet, rangoInicio: string, rangoFin: string) => {
    const startCol = columnNameToNumber(rangoInicio.replace(/\d+/, ''));
    const endCol = columnNameToNumber(rangoFin.replace(/\d+/, ''));
    const startRow = parseInt(rangoInicio.replace(/[A-Z]/g, ''));
    const endRow = parseInt(rangoFin.replace(/[A-Z]/g, ''));

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const colName = columnNumberToName(col);
        const cell = worksheet.getCell(`${colName}${row}`);
        cell.border = bordeEstandar;
      }
    }
  };

  // Función para crear una hoja con información del POA
  const crearHojaPOA = (workbook: ExcelJS.Workbook, poa: any, nombreHoja: string) => {
    const worksheet = workbook.addWorksheet(nombreHoja);

    // Agregar datos del encabezado (código existente)
    worksheet.addRow(['VICERRECTORADO DE INVESTIGACIÓN, INNOVACIÓN Y VINCULACIÓN']);
    worksheet.addRow(['DIRECCIÓN DE INVESTIGACIÓN']);
    worksheet.addRow([`PROGRAMACIÓN PARA EL POA ${poa.anio_ejecucion}`]);
    worksheet.addRow([]); // Fila vacía
    worksheet.addRow(['Código de Proyecto', codigoProyecto]);
    worksheet.addRow(['Presupuesto Asignado', poa.presupuesto_asignado.toLocaleString('es-CO')]);
    worksheet.addRow([,,,,,,,'TOTAL POR ACTIVIDAD', `PROGRAMACIÓN DE EJECUCIÓN ${poa.anio_ejecucion}`]);
    worksheet.addRow(['ACTIVIDAD', 'DESCRIPCIÓN O DETALLE', 'ITEM PRESUPUESTARIO', 'CANTIDAD (Meses de contrato)', 'PRECIO UNITARIO', 'TOTAL', '0,00', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre', 'SUMAN']);

    // NUEVO: Encontrar los datos de actividades para este POA
    const datosPoaActual = actividadesYTareas.find(data => data.id_poa === poa.id_poa);
    
    let filaActual = 9; // Empezar después de los encabezados

    if (datosPoaActual && datosPoaActual.actividades && datosPoaActual.actividades.length > 0) {
      // Iterar sobre las actividades del POA
      datosPoaActual.actividades.forEach((actividad: any) => {
        if (actividad.tareas && actividad.tareas.length > 0) {
          // Para cada tarea de la actividad
          actividad.tareas.forEach((tarea: any, indiceTarea: number) => {
            // Calcular el total de programación mensual
            const totalProgramacion = tarea.gastos_mensuales?.reduce((sum: number, val: number) => sum + (val || 0), 0) || 0;

            // Agregar fila de tarea
            const filaTarea = [
              indiceTarea === 0 ? actividad.descripcion_actividad : '', // Solo mostrar descripción en la primera tarea
              tarea.detalle_descripcion || tarea.nombre,
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

          // Agregar fila de total por actividad
          const totalActividad = actividad.total_por_actividad || 0;
          const filaTotalActividad = [
            '', // ACTIVIDAD vacía
            `TOTAL ACTIVIDAD: ${actividad.descripcion_actividad}`,
            '', '', '', // Columnas vacías
            totalActividad, // Total en columna F
            '', // Columna G vacía
            ...Array(12).fill(''), // Meses vacíos
            totalActividad // SUMAN
          ];

          worksheet.addRow(filaTotalActividad);

          // Aplicar estilo especial a la fila de total
          const rowTotal = worksheet.getRow(filaActual);
          rowTotal.eachCell((cell, colNumber) => {
            cell.border = bordeEstandar;
            cell.font = { bold: true };
            cell.alignment = { wrapText: true };
            
            if (colNumber === 2) { // Descripción del total
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'F2F2F2' } // Gris claro
              };
            }
            
            if ((colNumber === 6 || colNumber === 20) && typeof cell.value === 'number') { // Total y SUMAN
              cell.numFmt = '#,##0.00';
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFF99' } // Amarillo claro
              };
            }
          });

          filaActual++;
          
          // Agregar fila vacía entre actividades
          worksheet.addRow([]);
          filaActual++;
        }
      });

      // Agregar fila de total general del POA
      const totalGeneralPOA = datosPoaActual.actividades.reduce((sum: number, act: any) => 
        sum + (act.total_por_actividad || 0), 0
      );

      const filaTotalGeneral = [
        '', // ACTIVIDAD
        'TOTAL GENERAL POA',
        '', '', '', // Columnas vacías
        totalGeneralPOA, // Total en columna F
        '', // Columna G
        ...Array(12).fill(''), // Meses vacíos
        totalGeneralPOA // SUMAN
      ];

      worksheet.addRow(filaTotalGeneral);

      // Aplicar estilo especial a la fila de total general
      const rowTotalGeneral = worksheet.getRow(filaActual);
      rowTotalGeneral.eachCell((cell, colNumber) => {
        cell.border = bordeEstandar;
        cell.font = { bold: true, size: 12 };
        cell.alignment = { wrapText: true };
        
        if (colNumber === 2) { // Descripción del total
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'D9EDF7' } // Azul claro
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
      row.eachCell((cell) => {
        cell.border = bordeEstandar;
        cell.alignment = { wrapText: true };
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

    // Aplicar estilos a los títulos principales (código existente...)
    aplicarEstiloTitulo(worksheet.getCell('A1'), 14);
    aplicarEstiloTitulo(worksheet.getCell('A2'), 12);
    aplicarEstiloTitulo(worksheet.getCell('A3'), 12);

    // ... resto del código de estilos existente ...

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
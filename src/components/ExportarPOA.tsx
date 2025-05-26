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
  onExport?: () => void;
}

const ExportarPOA: React.FC<ExportarPOAProps> = ({ codigoProyecto, poas, onExport }) => {
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

    // Agregar datos
    worksheet.addRow(['VICERRECTORADO DE INVESTIGACIÓN, INNOVACIÓN Y VINCULACIÓN']);
    worksheet.addRow(['DIRECCIÓN DE INVESTIGACIÓN']);
    worksheet.addRow([`PROGRAMACIÓN PARA EL POA ${poa.anio_ejecucion}`]);
    worksheet.addRow([]); // Fila vacía
    worksheet.addRow(['Código de Proyecto', codigoProyecto]);
    worksheet.addRow(['Presupuesto Asignado', poa.presupuesto_asignado.toLocaleString('es-CO')]);
    worksheet.addRow([,,,,,,,'TOTAL POR ACTIVIDAD', `PROGRAMACIÓN DE EJECUCIÓN ${poa.anio_ejecucion}`]); 
    worksheet.addRow(['ACTIVIDAD', 'DESCRIPCIÓN O DETALLE', 'ITEM PRESUPUESTARIO', 'CANTIDAD (Meses de contrato)', 'PRECIO UNITARIO', 'TOTAL', '0,00', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre', 'SUMAN']); 

    // Aplicar estilos a los títulos principales
    aplicarEstiloTitulo(worksheet.getCell('A1'), 14);
    aplicarEstiloTitulo(worksheet.getCell('A2'), 12);
    aplicarEstiloTitulo(worksheet.getCell('A3'), 12);

    // Aplicar estilos a las etiquetas de forma optimizada
    const celdasEtiqueta = ['A5', 'A6', 'G7'];
    aplicarEstiloACeldas(worksheet, celdasEtiqueta, aplicarEstiloEtiqueta);

    // Combinar celda H7 hasta T7 y aplicar color aguamarina
    worksheet.mergeCells('H7:T7');
    const celdaH7 = worksheet.getCell('H7');
    const celdaG7 = worksheet.getCell('G7');
    celdaH7.font = { bold: true };
    celdaH7.alignment = { 
      horizontal: 'center', 
      vertical: 'middle',
      wrapText: true 
    };
    celdaH7.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'DAEEF3' } // Aguamarina claro (equivalente a Aguamarina, Énfasis 5, Claro 80%)
    };
    celdaH7.border = bordeEstandar;
    
    celdaG7.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'D9D9D9' } // Gris claro (equivalente a Blanco, Fondo 1, Oscuro 15%)
    };

    // Aplicar estilos a la fila 8 (encabezados de tabla)
    // A8 hasta F8 - Blanco, Fondo 1, Oscuro 15% (gris claro)
    const celdasA8F8 = ['A8', 'B8', 'C8', 'D8', 'E8', 'F8'];
    aplicarEstiloACeldas(worksheet, celdasA8F8, (cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'D9D9D9' } // Gris claro (equivalente a Blanco, Fondo 1, Oscuro 15%)
      };
      cell.alignment = { 
        horizontal: 'center', 
        vertical: 'middle',
        wrapText: true 
      };
      cell.border = bordeEstandar;
    });

    // G8 - Color Canela, Fondo 2
    const celdaG8 = worksheet.getCell('G8');
    celdaG8.font = { bold: true };
    celdaG8.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'D2B48C' } // Color canela
    };
    celdaG8.alignment = { 
      horizontal: 'center', 
      vertical: 'middle',
      wrapText: true 
    };
    celdaG8.border = bordeEstandar;

    // H8 hasta T8 - Aguamarina, Énfasis 5, Claro 80%
    const celdasH8T8 = ['H8', 'I8', 'J8', 'K8', 'L8', 'M8', 'N8', 'O8', 'P8', 'Q8', 'R8', 'S8', 'T8'];
    aplicarEstiloACeldas(worksheet, celdasH8T8, (cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'DAEEF3' } // Aguamarina claro
      };
      cell.alignment = { 
        horizontal: 'center', 
        vertical: 'middle',
        wrapText: true 
      };
      cell.border = bordeEstandar;
    });

    // Ajustar ancho de columnas
    worksheet.getColumn('A').width = 55;
    worksheet.getColumn('B').width = 53;
    worksheet.getColumn('C').width = 17;
    worksheet.getColumn('D').width = 20;
    worksheet.getColumn('E').width = 15;
    worksheet.getColumn('F').width = 18;
    worksheet.getColumn('G').width = 19;
    worksheet.getColumn('P').width = 11;
    worksheet.getColumn('R').width = 10;
    worksheet.getColumn('S').width = 10;

    // Ajustar alto de la fila 8
    worksheet.getRow(8).height = 43;

    // Combinar celdas para los títulos principales y centrar el texto
    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').alignment = { 
      horizontal: 'center', 
      vertical: 'middle',
      wrapText: true 
    };

    worksheet.mergeCells('A2:G2');
    worksheet.getCell('A2').alignment = { 
      horizontal: 'center', 
      vertical: 'middle',
      wrapText: true 
    };

    worksheet.mergeCells('A3:G3');
    worksheet.getCell('A3').alignment = { 
      horizontal: 'center', 
      vertical: 'middle',
      wrapText: true 
    };

    // Aplicar wrap text a todas las celdas y bordes solo desde la fila 7
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
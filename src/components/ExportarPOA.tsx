import React from 'react';
import { Button, Dropdown, DropdownButton } from 'react-bootstrap';
import * as ExcelJS from 'exceljs';

interface ExportarPOAProps {
  codigoProyecto: string;
  poas: {
    id_poa: string;
    codigo_poa: string;
    anio_ejecucion: string;
    tipo_poa: string;
    presupuesto_asignado: number;
  }[];
  onExport?: () => void;
}

const ExportarPOA: React.FC<ExportarPOAProps> = ({ codigoProyecto, poas, onExport }) => {
  // Función para aplicar estilos a una celda
  const aplicarEstiloTitulo = (cell: ExcelJS.Cell, fontSize: number = 12) => {
    cell.font = { bold: true, size: fontSize, color: { argb: '000000' } };
    cell.alignment = { horizontal: 'center' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E6E6FA' }
    };
  };

  const aplicarEstiloEtiqueta = (cell: ExcelJS.Cell) => {
    cell.font = { bold: true };
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
    worksheet.addRow([]); // Fila vacía
    worksheet.addRow(['Código POA', poa.codigo_poa]);
    worksheet.addRow(['Año de Ejecución', poa.anio_ejecucion]);
    worksheet.addRow(['Tipo de POA', poa.tipo_poa || 'No especificado']);

    // Aplicar estilos a los títulos principales
    aplicarEstiloTitulo(worksheet.getCell('A1'), 14);
    aplicarEstiloTitulo(worksheet.getCell('A2'), 12);
    aplicarEstiloTitulo(worksheet.getCell('A3'), 12);

    // Aplicar estilos a las etiquetas
    aplicarEstiloEtiqueta(worksheet.getCell('A5'));
    aplicarEstiloEtiqueta(worksheet.getCell('A6'));
    aplicarEstiloEtiqueta(worksheet.getCell('A8'));
    aplicarEstiloEtiqueta(worksheet.getCell('A9'));
    aplicarEstiloEtiqueta(worksheet.getCell('A10'));

    // Ajustar ancho de columnas
    worksheet.getColumn('A').width = 50;
    worksheet.getColumn('B').width = 55;

    // Combinar celdas para los títulos principales y centra el texto
    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('A2:G2');
    worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('A3:G3');
    worksheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };

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

      // Notificar que se completó la exportación si hay un callback
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
    
    // Configurar propiedades del libro
    workbook.creator = 'Sistema POA';
    workbook.lastModifiedBy = 'Sistema POA';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Crear hoja con información del POA
    crearHojaPOA(workbook, poa, 'Información POA');

    // Generar y descargar archivo
    const nombreArchivo = `POA_${poa.codigo_poa}_${codigoProyecto}.xlsx`;
    await descargarArchivo(workbook, nombreArchivo);
  };

  // Función para exportar todos los POAs
  const exportarTodosPOAs = async () => {
    const workbook = new ExcelJS.Workbook();
    
    // Configurar propiedades del libro
    workbook.creator = 'Sistema POA';
    workbook.lastModifiedBy = 'Sistema POA';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Crear una hoja para cada POA
    poas.forEach((poa, index) => {
      crearHojaPOA(workbook, poa, `POA ${index + 1}`);
    });

    // Generar y descargar archivo
    const nombreArchivo = `POAs_Proyecto_${codigoProyecto}.xlsx`;
    await descargarArchivo(workbook, nombreArchivo);
  };

  // No mostrar el componente si no hay POAs para exportar
  if (!poas || poas.length === 0) {
    return null;
  }

  return (
    <div className="mb-3">
      {poas.length === 1 ? (
        // Si solo hay un POA, mostrar un único botón
        <Button 
          variant="success" 
          onClick={() => exportarPOA(poas[0])}
          className="d-flex align-items-center"
        >
          <i className="fas fa-file-excel me-2"></i>
          Exportar POA
        </Button>
      ) : (
        // Si hay múltiples POAs, mostrar un dropdown
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
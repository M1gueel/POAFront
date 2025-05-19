import React, { useState } from 'react';
import { Button, Spinner, Alert } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Download } from 'lucide-react';

// Interfaces (asumiendo estas estructuras basadas en el código que compartiste)
interface Proyecto {
  id_proyecto: string;
  codigo_proyecto: string;
  titulo: string;
  fecha_inicio: string;
  fecha_fin: string;
  presupuesto_aprobado: number;
}

interface POA {
  id_poa: string;
  codigo_poa: string;
  anio_ejecucion: number;
  tipo_poa: string;
  presupuesto_asignado: number;
  periodo?: {
    nombre_periodo: string;
  };
}

interface ExportarPOAProps {
  proyectoSeleccionado: Proyecto;
  poasProyecto: POA[];
}

const ExportarPOA: React.FC<ExportarPOAProps> = ({
  proyectoSeleccionado,
  poasProyecto
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString('es-CO')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO');
  };

  const exportarPOAsAExcel = async () => {
    if (!proyectoSeleccionado || poasProyecto.length === 0) {
      setExportMessage({
        type: 'error',
        text: 'No hay proyecto seleccionado o no existen POAs para exportar'
      });
      return;
    }

    try {
      setIsExporting(true);
      setExportMessage(null);

      // Crear un archivo Excel para cada POA
      for (const poa of poasProyecto) {
        // Crear los datos para el Excel
        const datosProyecto = [
          ['INFORMACIÓN DEL PROYECTO', ''],
          ['Código del Proyecto', proyectoSeleccionado.codigo_proyecto],
          ['Título del Proyecto', proyectoSeleccionado.titulo],
          ['Fecha de Inicio', formatDate(proyectoSeleccionado.fecha_inicio)],
          ['Fecha de Fin', formatDate(proyectoSeleccionado.fecha_fin)],
          ['Presupuesto Aprobado', formatCurrency(proyectoSeleccionado.presupuesto_aprobado)],
          ['', ''],
          ['INFORMACIÓN DEL POA', ''],
          ['ID POA', poa.id_poa],
          ['Código POA', poa.codigo_poa],
          ['Año de Ejecución', poa.anio_ejecucion.toString()],
          ['Tipo de POA', poa.tipo_poa || 'No especificado'],
          ['Presupuesto Asignado', formatCurrency(poa.presupuesto_asignado)],
          ['Periodo', poa.periodo?.nombre_periodo || 'No especificado']
        ];

        // Crear el libro de trabajo
        const workbook = XLSX.utils.book_new();
        
        // Crear la hoja de trabajo
        const worksheet = XLSX.utils.aoa_to_sheet(datosProyecto);

        // Configurar el ancho de las columnas
        const columnWidths = [
          { wch: 25 }, // Columna A (etiquetas)
          { wch: 40 }  // Columna B (valores)
        ];
        worksheet['!cols'] = columnWidths;

        // Aplicar estilos a las celdas de encabezado
        const headerCells = ['A1', 'A8'];
        headerCells.forEach(cell => {
          if (worksheet[cell]) {
            worksheet[cell].s = {
              font: { bold: true, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "366092" } },
              alignment: { horizontal: "center" }
            };
          }
        });

        // Agregar la hoja al libro
        XLSX.utils.book_append_sheet(workbook, worksheet, `POA_${poa.codigo_poa}`);

        // Generar el nombre del archivo
        const nombreArchivo = `${proyectoSeleccionado.codigo_proyecto}_POA_${poa.codigo_poa}_${poa.anio_ejecucion}.xlsx`;

        // Escribir y descargar el archivo
        XLSX.writeFile(workbook, nombreArchivo);

        // Esperar un momento entre descargas para evitar problemas del navegador
        if (poasProyecto.length > 1 && poasProyecto.indexOf(poa) < poasProyecto.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setExportMessage({
        type: 'success',
        text: `Se han exportado exitosamente ${poasProyecto.length} archivo(s) Excel`
      });

    } catch (error) {
      console.error('Error al exportar POAs a Excel:', error);
      setExportMessage({
        type: 'error',
        text: 'Error al generar los archivos Excel. Por favor, intente nuevamente.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportarTodosPOAsMismosArchivo = async () => {
    if (!proyectoSeleccionado || poasProyecto.length === 0) {
      setExportMessage({
        type: 'error',
        text: 'No hay proyecto seleccionado o no existen POAs para exportar'
      });
      return;
    }

    try {
      setIsExporting(true);
      setExportMessage(null);

      // Crear un solo archivo con múltiples hojas
      const workbook = XLSX.utils.book_new();

      // Crear hoja resumen del proyecto
      const datosResumen = [
        ['RESUMEN DEL PROYECTO', ''],
        ['Código del Proyecto', proyectoSeleccionado.codigo_proyecto],
        ['Título del Proyecto', proyectoSeleccionado.titulo],
        ['Fecha de Inicio', formatDate(proyectoSeleccionado.fecha_inicio)],
        ['Fecha de Fin', formatDate(proyectoSeleccionado.fecha_fin)],
        ['Presupuesto Aprobado', formatCurrency(proyectoSeleccionado.presupuesto_aprobado)],
        ['Total POAs', poasProyecto.length.toString()],
        ['', ''],
        ['RESUMEN DE POAs', '', '', '', ''],
        ['Código POA', 'Año Ejecución', 'Tipo POA', 'Presupuesto Asignado', 'Periodo']
      ];

      // Agregar datos de cada POA al resumen
      poasProyecto.forEach(poa => {
        datosResumen.push([
          poa.codigo_poa,
          poa.anio_ejecucion.toString(),
          poa.tipo_poa || 'No especificado',
          formatCurrency(poa.presupuesto_asignado),
          poa.periodo?.nombre_periodo || 'No especificado'
        ]);
      });

      // Crear hoja de resumen
      const worksheetResumen = XLSX.utils.aoa_to_sheet(datosResumen);
      worksheetResumen['!cols'] = [
        { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }
      ];
      XLSX.utils.book_append_sheet(workbook, worksheetResumen, 'Resumen');

      // Crear una hoja para cada POA
      poasProyecto.forEach(poa => {
        const datosPOA = [
          ['INFORMACIÓN DEL PROYECTO', ''],
          ['Código del Proyecto', proyectoSeleccionado.codigo_proyecto],
          ['Título del Proyecto', proyectoSeleccionado.titulo],
          ['', ''],
          ['INFORMACIÓN DEL POA', ''],
          ['ID POA', poa.id_poa],
          ['Código POA', poa.codigo_poa],
          ['Año de Ejecución', poa.anio_ejecucion.toString()],
          ['Tipo de POA', poa.tipo_poa || 'No especificado'],
          ['Presupuesto Asignado', formatCurrency(poa.presupuesto_asignado)],
          ['Periodo', poa.periodo?.nombre_periodo || 'No especificado']
        ];

        const worksheetPOA = XLSX.utils.aoa_to_sheet(datosPOA);
        worksheetPOA['!cols'] = [{ wch: 25 }, { wch: 40 }];
        
        const nombreHoja = `POA_${poa.codigo_poa}`.substring(0, 31); // Excel limita nombres de hoja a 31 caracteres
        XLSX.utils.book_append_sheet(workbook, worksheetPOA, nombreHoja);
      });

      // Generar el nombre del archivo
      const nombreArchivo = `${proyectoSeleccionado.codigo_proyecto}_Todos_POAs.xlsx`;

      // Escribir y descargar el archivo
      XLSX.writeFile(workbook, nombreArchivo);

      setExportMessage({
        type: 'success',
        text: `Se ha exportado exitosamente el archivo Excel con ${poasProyecto.length} POA(s)`
      });

    } catch (error) {
      console.error('Error al exportar POAs a Excel:', error);
      setExportMessage({
        type: 'error',
        text: 'Error al generar el archivo Excel. Por favor, intente nuevamente.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Limpiar mensaje después de 5 segundos
  React.useEffect(() => {
    if (exportMessage) {
      const timer = setTimeout(() => {
        setExportMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [exportMessage]);

  return (
    <div className="mb-3">
      {exportMessage && (
        <Alert variant={exportMessage.type === 'success' ? 'success' : 'danger'} className="mb-3">
          {exportMessage.text}
        </Alert>
      )}
      
      <div className="d-flex gap-2 flex-wrap">
        <Button
          variant="success"
          onClick={exportarPOAsAExcel}
          disabled={isExporting || !proyectoSeleccionado || poasProyecto.length === 0}
          className="d-flex align-items-center gap-2"
        >
          {isExporting ? (
            <Spinner as="span" animation="border" size="sm" role="status" />
          ) : (
            <FileSpreadsheet size={18} />
          )}
          {isExporting ? 'Exportando...' : 'Exportar POAs (Archivos Separados)'}
        </Button>

        <Button
          variant="primary"
          onClick={exportarTodosPOAsMismosArchivo}
          disabled={isExporting || !proyectoSeleccionado || poasProyecto.length === 0}
          className="d-flex align-items-center gap-2"
        >
          {isExporting ? (
            <Spinner as="span" animation="border" size="sm" role="status" />
          ) : (
            <Download size={18} />
          )}
          {isExporting ? 'Exportando...' : 'Exportar Todo en Un Archivo'}
        </Button>
      </div>

      {proyectoSeleccionado && poasProyecto.length > 0 && (
        <small className="text-muted d-block mt-2">
          Proyecto: {proyectoSeleccionado.codigo_proyecto} | POAs disponibles: {poasProyecto.length}
        </small>
      )}
    </div>
  );
};

export default ExportarPOA;
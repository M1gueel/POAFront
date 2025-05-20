import React from 'react';
import { Button, Dropdown, DropdownButton } from 'react-bootstrap';
import * as XLSX from 'xlsx';

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
  // Función para exportar un POA específico
  const exportarPOA = (poa: any) => {
    // Crear un libro de Excel
    const workbook = XLSX.utils.book_new();
    
    // Datos para la hoja principal con información del POA
    const poaInfo = [
      ['Código de Proyecto', codigoProyecto],
      ['Código POA', poa.codigo_poa],
      ['Año de Ejecución', poa.anio_ejecucion],
      ['Tipo de POA', poa.tipo_poa || 'No especificado'],
      ['Presupuesto Asignado', poa.presupuesto_asignado.toLocaleString('es-CO')]
    ];
    
    // Crear hoja de datos
    const worksheet = XLSX.utils.aoa_to_sheet(poaInfo);
    
    // Ajustar ancho de columnas
    const wscols = [{ wch: 25 }, { wch: 30 }];
    worksheet['!cols'] = wscols;
    
    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Información POA');
    
    // Generar archivo Excel
    const nombreArchivo = `POA_${poa.codigo_poa}_${codigoProyecto}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
    
    // Notificar que se completó la exportación si hay un callback
    if (onExport) {
      onExport();
    }
  };

  // Función para exportar todos los POAs
  const exportarTodosPOAs = () => {
    // Crear un libro de Excel
    const workbook = XLSX.utils.book_new();
    
    // Exportar una hoja para cada POA
    poas.forEach((poa, index) => {
      // Datos para la hoja principal con información del POA
      const poaInfo = [
        ['Código de Proyecto', codigoProyecto],
        ['Código POA', poa.codigo_poa],
        ['Año de Ejecución', poa.anio_ejecucion],
        ['Tipo de POA', poa.tipo_poa || 'No especificado'],
        ['Presupuesto Asignado', poa.presupuesto_asignado.toLocaleString('es-CO')]
      ];
      
      // Crear hoja de datos
      const worksheet = XLSX.utils.aoa_to_sheet(poaInfo);
      
      // Ajustar ancho de columnas
      const wscols = [{ wch: 25 }, { wch: 30 }];
      worksheet['!cols'] = wscols;
      
      // Añadir la hoja al libro
      XLSX.utils.book_append_sheet(workbook, worksheet, `POA ${index + 1}`);
    });
    
    // Generar archivo Excel
    const nombreArchivo = `POAs_Proyecto_${codigoProyecto}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
    
    // Notificar que se completó la exportación si hay un callback
    if (onExport) {
      onExport();
    }
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
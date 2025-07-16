# Utilidad de Ordenamiento de Actividades

## Descripción
Este archivo contiene utilidades para ordenar actividades según la configuración definida en `listaActividades.ts`, con manejo especial para casos de actividades con descripción duplicada.

## Funciones Principales

### `ordenarActividadesSegunConfiguracion(actividades, codigoPOA)`

Función principal que ordena un array de actividades según la configuración del tipo de POA.

**Parámetros:**
- `actividades: Actividad[]` - Array de actividades obtenidas del backend
- `codigoPOA: string` - Código del POA para determinar el tipo (ej: "PIM-2024-001")

**Retorna:**
- `Promise<Actividad[]>` - Array de actividades ordenadas según la configuración

**Uso:**
```typescript
import { ordenarActividadesSegunConfiguracion } from '../utils/ordenarActividades';

// En un componente o función async
const actividadesOrdenadas = await ordenarActividadesSegunConfiguracion(
  actividadesDelBackend, 
  poa.codigo_poa
);
```

### `obtenerTipoPOA(codigoPOA)`

Función auxiliar que extrae el tipo de POA desde el código.

**Parámetros:**
- `codigoPOA: string` - Código completo del POA (ej: "PIM-2024-001")

**Retorna:**
- `string` - Tipo de POA (ej: "PIM")

## Lógica de Ordenamiento

### Casos Manejados

1. **Actividades únicas**: Si hay una sola actividad en la configuración con esa descripción, se usa directamente.

2. **Actividades duplicadas**: Si hay múltiples actividades con la misma descripción:
   - **Método 1**: Analiza el primer carácter del nombre de la primera tarea de la actividad
   - **Método 2**: Usa el número de actividad si está presente en formato "(1) Descripción"
   - **Fallback**: Usa la primera coincidencia si no se puede determinar

3. **Actividades no encontradas**: Se colocan al final del listado

### Ejemplo de Actividades Duplicadas

En `listaActividades.ts`:
```typescript
const actividadesPIM = [
  {
    id: "ACT-PIM-1",
    descripcion: "Actividades donde se involucre personal para el desarrollo del proyecto"
  },
  {
    id: "ACT-PIM-2", 
    descripcion: "Actividades donde se involucre personal para el desarrollo del proyecto"
  }
];
```

La función distinguirá entre ellas usando:
- El número en el nombre de las tareas ("1.1 Tarea", "2.1 Tarea")
- El número en la descripción de la actividad ("(1) Actividades...", "(2) Actividades...")

## Ventajas de la Refactorización

1. **DRY (Don't Repeat Yourself)**: Evita duplicación de código
2. **Mantenibilidad**: Cambios solo en un lugar
3. **Testabilidad**: Función independiente fácil de probar
4. **Reutilización**: Puede usarse en otros componentes si es necesario
5. **Separación de responsabilidades**: Lógica de ordenamiento separada de la UI

## Archivos que Usan Esta Utilidad

- `components/VerPOA.tsx`
- `components/ExportarPOAProyecto.tsx`

## Dependencias

- `api/tareaAPI.ts` - Para obtener tareas de actividades duplicadas
- `utils/listaActividades.ts` - Para la configuración de actividades por tipo de POA
- `interfaces/actividad.ts` - Para el tipado de actividades

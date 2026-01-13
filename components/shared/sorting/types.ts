/**
 * Generic sorting types for reusable sort functionality
 */

export type SortDirection = 'ASC' | 'DESC';

export interface SortConfig {
  id: string;                    // ID único (usado internamente)
  label: string;                 // Label para mostrar en UI
  backendColumn: string;         // Nombre de columna en backend API
  availableInMenu?: boolean;     // Si aparece en el menú dropdown (default: true)
  availableInColumns?: boolean;  // Si aparece en headers de tabla (default: true)
  defaultDirection?: SortDirection; // Dirección por defecto (default: 'DESC')
}

export interface ActiveSort {
  columnId: string;              // ID de la configuración
  direction: SortDirection;
}

export interface SortConfigOptions {
  configs: SortConfig[];
  defaultSort?: ActiveSort;      // Sort por defecto
}


/**
 * Picklists Module
 * Configurable dropdown values for multi-tenant applications
 *
 * @example
 * // Using the hook
 * import { usePicklist, PicklistKey } from '@/lib/picklists';
 * const { items, getLabelByKey } = usePicklist(PicklistKey.ORDER_TYPES);
 *
 * @example
 * // Display component
 * import { PicklistValue, PicklistKey } from '@/lib/picklists';
 * <PicklistValue picklistKey={PicklistKey.ORDER_TYPES} value={order.orderType} />
 */

// Enums
export { PicklistKey, PicklistColor, PICKLIST_COLOR_OPTIONS, isValidPicklistColor } from './enums';
export type { PicklistColorOption } from './enums';

// Types
export type {
  PicklistItem,
  PicklistData,
  PicklistDefinition,
  PicklistSettingsValue,
  PicklistValueVariant,
  PicklistValueProps,
  PicklistEditorProps,
  PicklistFilterProps,
  UsePicklistReturn,
} from './types';

// Config
export { PICKLIST_DEFINITIONS, getPicklistDefinition, getAllPicklistKeys, isValidPicklistKey } from './config';

// Hook
export { usePicklist } from './usePicklist';

// Components
export { PicklistValue, ColorPicker, PicklistEditor, PicklistFilter } from './components';

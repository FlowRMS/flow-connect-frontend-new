import { BasePlugin } from '@revolist/revogrid';
import { BeforeRangeSaveDataDetails } from '@revolist/revogrid';
import { BeforeRowRenderEvent } from '@revolist/revogrid';
import { BeforeSaveDataDetails } from '@revolist/revogrid';
import { Cell } from '@revolist/revogrid';
import { CellTemplateProp } from '@revolist/revogrid';
import { ColumnDataSchemaModel } from '@revolist/revogrid';
import { ColumnFilterConfig } from '@revolist/revogrid';
import { ColumnGrouping } from '@revolist/revogrid';
import { ColumnProp } from '@revolist/revogrid';
import { ColumnRegular } from '@revolist/revogrid';
import { ColumnTemplateProp } from '@revolist/revogrid';
import { ColumnType } from '@revolist/revogrid';
import { ComponentChildren } from 'preact';
import { CustomFilter } from '@revolist/revogrid';
import { DataFormat } from '@revolist/revogrid';
import { DataStore } from '@revolist/revogrid';
import { DataType } from '@revolist/revogrid';
import { DimensionCols } from '@revolist/revogrid';
import { DimensionRows } from '@revolist/revogrid';
import { DragStartEvent } from '@revolist/revogrid';
import { EditCell } from '@revolist/revogrid';
import { EditorBase } from '@revolist/revogrid';
import { EditorCtrConstructible } from '@revolist/revogrid';
import { ExtraField } from '@revolist/revogrid';
import { FilterPlugin } from '@revolist/revogrid';
import { FilterType } from '@revolist/revogrid';
import { GroupLabelTemplateFunc } from '@revolist/revogrid';
import { h } from 'preact';
import { h as h_2 } from '@revolist/revogrid';
import { HyperFunc } from '@revolist/revogrid';
import { JSX } from 'preact';
import { LogicFunctionExtraParam } from '@revolist/revogrid';
import { MultiDimensionType } from '@revolist/revogrid';
import { MultiFilterItem } from '@revolist/revogrid';
import { Observable } from '@revolist/revogrid';
import { PluginProviders } from '@revolist/revogrid';
import { PropertiesFunc } from '@revolist/revogrid';
import { RangeArea } from '@revolist/revogrid';
import { ShowData } from '@revolist/revogrid';
import { ViewSettingSizeProp } from '@revolist/revogrid';
import { VNode } from '@revolist/revogrid';
import { VNode as VNode_2 } from 'preact';

export declare function addAndShift(obj: Record<number, number>, newKey: number, newValue: number): ViewSettingSizeProp;

export declare const ADDITIONAL_DATA_EVENT = "additionaldatachanged";

export declare const advancedAggregators: Record<'%oftotal' | 'accSum', (values: any[]) => any>;

/**
 * Plugins
 * The `AdvanceFilterPlugin` extends the filtering capabilities of a RevoGrid component by introducing
 * advanced, customizable filter options, such as selection and range-based filters. This plugin enhances
 * the grid's filter functionality, allowing users to interact with and manipulate data effectively.
 *
 * **Key Features**:
 * - **Custom Filters**: Introduces custom filter types including `selection` and `slider` for more
 *   flexible data filtering. These filters allow users to select specific values or define a range
 *   for filtering data.
 * - **Event Integration**: Listens for `BEFORE_HEADER_RENDER_EVENT` to determine the applicability
 *   of filters for a given column, ensuring that only relevant filters are displayed.
 * - **Dynamic Content Rendering**: Uses a `HyperFunc` to dynamically render filter UI components
 *   in the grid's header, including a `RangeSlider` component and selection list rendering.
 * - **Enhanced Filter Management**: Provides methods to manage excluded values from filters and
 *   to generate selection lists based on current data, facilitating complex filter interactions.
 *
 * **Usage**:
 * - Integrate `AdvanceFilterPlugin` into a RevoGrid instance to enable advanced filtering features.
 *   Add the plugin to the grid's plugins array during initialization.
 *
 * ### Example
 * ```typescript
 * import { AdvanceFilterPlugin } from '@revolist/revogrid-pro'
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [AdvanceFilterPlugin];
 * ```
 *
 * This plugin is essential for applications that require sophisticated filtering mechanisms, enabling
 * users to perform more nuanced data queries and enhancing the overall data exploration experience.
 */
export declare class AdvanceFilterPlugin extends FilterPlugin {
    providers: PluginProviders;
    filterConfig?: ColumnFilterConfig;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    beforeshow(data: ShowData): void;
    extraHyperContent: (data: ShowData) => VNode;
    getExcludedValues(columnProp: ColumnProp): Set<any>;
    getSelectionList(columnProp: ColumnProp, exlude?: Set<string>): {
        value: string;
        label: string;
    }[];
}

export declare const AFTER_FILTER_EVENT = "afterfilterapply";

export declare const AFTER_GRID_RENDER_EVENT = "aftergridrender";

export declare const AFTER_SOURCE_EVENT = "afteranysource";

export declare const AFTER_SOURCE_SET_EVENT = "aftersourceset";

export declare type Aggregations = Record<AggregationType, (values: any[]) => any>;

declare type AggregationType = 'sum' | 'count' | 'avg' | 'min' | 'max' | 'median' | 'mode' | 'range' | 'variance' | 'stdDev' | 'first' | 'last' | 'distinct';

export declare const APPLY_RANGE_EVENT = "beforeapplyrange";

/**
 * The `arrayRenderer` is a custom cell renderer for RevoGrid that can handle both single values
 * and arrays of values. It applies different renderers based on the value type.
 *
 * **Features**:
 * - Detects if the value is an array or a single value
 * - For arrays, renders multiple elements using the provided renderer
 * - For single values, renders a single element using the provided renderer
 * - Supports custom separator between array items
 * - Supports custom wrapper for array items
 *
 * **Usage**:
 * - Import `arrayRenderer` and use it as a wrapper around your existing renderer
 * - Configure the renderer with options like separator and wrapper
 *
 * ### Example
 * ```typescript
 * import { arrayRenderer } from '@revolist/revogrid-pro';
 * import { linkRenderer } from '@revolist/revogrid-pro';
 *
 * const grid = document.createElement('revo-grid');
 * grid.columns = [
 *   {
 *     prop: 'links',
 *     name: 'Links',
 *     cellTemplate: arrayRenderer(linkRenderer, {
 *       separator: ', ',
 *       wrapper: 'div',
 *     }),
 *   },
 * ];
 * ```
 *
 * Example of using multiRenderer to handle different types of values

 * export const multiRendererExample = {
 *   prop: 'data',
 *   name: 'Data',
 *   cellTemplate: multiRenderer({
 *     default: progressLineRenderer,
 *     renderers: [
 *       {
 *         // Use linkRenderer for URLs
 *         condition: (value) => typeof value === 'string' &&
 *           (value.startsWith('http://') || value.startsWith('https://')),
 *         renderer: linkRenderer,
 *       },
 *       {
 *         // Use progressLineRenderer for numbers
 *         condition: (value) => typeof value === 'number',
 *         renderer: progressLineRenderer,
 *       },
 *     ],
 *     separator: ' | ',
 *     wrapper: 'div',
 *     wrapperClass: 'multi-data-container',
 *   }),
 * };
 */
export declare function arrayRenderer(renderer: ColumnRegular['cellTemplate'], options?: ArrayRendererOptions): Required<ColumnRegular>['cellTemplate'];

export declare type ArrayRendererOptions = {
    /**
     * Separator between array items
     * @default ', '
     */
    separator?: string;
    /**
     * Wrapper element for array items
     * @default 'div'
     */
    wrapper?: string;
    /**
     * CSS class for the wrapper element
     */
    wrapperClass?: string;
    /**
     * CSS style for the wrapper element
     */
    wrapperStyle?: Record<string, string>;
};

declare type AutoFillDirection = 'both';

/**
 * The `AutoFillPlugin` enhances RevoGrid with advanced autofill capabilities,
 * allowing users to automatically fill cell ranges based on various sequence
 * strategies. This plugin supports numeric, date, and text sequences, making it
 * versatile for different data types and user needs.
 *
 *  **Features**:
 * - Utilizes multiple pre-defined strategies: linear numeric sequences, date sequences
 *   with and without intervals, and text sequences.
 * - Listens for the `beforeautofill` to trigger autofill actions based on user
 *   interactions.
 * - Allows registration of additional custom autofill strategies.
 * - Applies autofilled data directly to the grid, updating the data store efficiently.
 *
 * **Usage**:
 * - Import `AutoFillPlugin` and add it to the RevoGrid's plugin list.
 * - The grid will automatically handle range selection and autofilling based on the
 *   registered strategies.
 *
 * ### Example
 * ```typescript
 * import { AutoFillPlugin } from '@revolist/revogrid-pro'
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [AutoFillPlugin]; // Add autofill functionality to the grid
 * ```
 *
 * This plugin is ideal for enhancing user productivity in data entry tasks by
 * providing intelligent filling of repetitive or sequential data patterns, commonly
 * used in spreadsheets and data management applications.
 */
export declare class AutoFillPlugin extends CorePlugin {
    private strategies;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    /**
     * Register a new autofill strategy
     */
    registerStrategy(strategy: AutoFillStrategy): void;
    private onBeforeAutofill;
    private applyDataToGrid;
}

declare type AutoFillStrategy = (selectedData: any[][], direction: AutoFillDirection, newRange: RangeArea) => any[][] | null;

export declare type AutoSizeColumnConfig = {
    mode?: ColumnAutoSizeMode;
    /**
     * autoSize for all columns
     * if allColumnes true all columns treated as autoSize, worse for performance
     * false by default
     */
    allColumns?: boolean;
    /**
     * assumption per characted size
     * by default defined as 8, can be changed in this config
     */
    letterBlockSize?: number;
    /** make size calculation exact
     * by default it based on assumption each character takes some space defined in letterBlockSize */
    preciseSize?: boolean;
};

/**
 * The `AutoSizeColumnPlugin` is a plugin for the RevoGrid framework that provides automatic column resizing
 * functionality. It allows users to resize columns based on the content of the cells, providing a flexible
 * and user-friendly interface for data presentation.
 *
 *  **Features**:
 * - Automatically resizes columns based on the content of the cells.
 * - Supports different modes of automatic resizing:
 *   - Header click autosize: Resizes columns when the header is clicked.
 *   - Text overlap autosize: Resizes columns when text is edited.
 *   - All columns autosize: Resizes all columns based on the content of the cells.
 *
 * **Usage**:
 * - Add the `AutoSizeColumnPlugin` to the grid's plugins array.
 * - Configure the plugin using the `additionalData` property with the `autoSizeColumnConfig` key.
 *
 * ### Example
 * ```typescript
 * import { AutoSizeColumnPlugin } from '@revolist/revogrid-pro';
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [AutoSizeColumnPlugin]; // Add the plugin to the grid
 * grid.additionalData = {
 *   autoSizeColumnConfig: {
 *     mode: ColumnAutoSizeMode.autoSizeOnTextOverlap,
 *   },
 * };
 * ```
 */
export declare class AutoSizeColumnPlugin extends CorePlugin {
    providers: PluginProviders;
    autoSizeColumns: Partial<AutoSizeColumns> | null;
    readonly letterBlockSize: number;
    /** for config option when preciseSize enabled */
    precsizeCalculationArea: HTMLElement | null;
    config?: AutoSizeColumnConfig;
    /** for edge case when no columns defined before data */
    dataResolve: Resolve | null;
    dataReject: Reject | null;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    setSource(source: DataType[]): Promise<void>;
    getLength(len?: any): number;
    afteredit(e: EditEvent): void;
    afterEditAll(e: EditEvent): void;
    getColumnSize(index: number, type: DimensionCols): number;
    columnSet(columns: Record<DimensionCols, ColumnRegular[]>): void;
    clearPromise(): void;
    isRangeEdit(e: EditEvent): e is BeforeRangeSaveDataDetails;
    initiatePresizeElement(): HTMLElement;
    destroy(): void;
}

declare type AutoSizeColumns = Record<DimensionCols, ColumnRecords>;

export declare const avatarRenderer: ColumnRegular['cellTemplate'];

/**
 * RevoGrid Renderer
 * Renderers a badge cell with custom background color, text
 * Supports both badgeStyles and thresholds for styling
 */
export declare const badgeRenderer: ColumnRegular['cellTemplate'];

/**
 * RevoGrid Renderer
 * Generates a bar chart visualization based on the provided data
 * values and column configuration.
 */
export declare const barChartRenderer: (h: HyperFunc<VNode>, { value, column, }: {
    value?: any;
    column: Partial<ColumnRegular>;
}) => VNode;

export declare const BEFORE_ANYSOURCE_EVENT = "beforeanysource";

export declare const BEFORE_CELL_RENDER_EVENT = "beforecellrender";

export declare const BEFORE_CLIPBOARD_PASTE_EVENT = "clipboardrangepaste";

export declare const BEFORE_FILTER_EVENT = "beforefilterapply";

export declare const BEFORE_GROUP_HEADER_RENDER_EVENT = "beforegroupheaderrender";

export declare const BEFORE_HEADER_RENDER_EVENT = "beforeheaderrender";

export declare const BEFORE_HIST_EDIT_EVENT = "beforehistedit";

export declare const BEFORE_KEYDOWN_EVENT = "beforekeydown";

export declare const BEFORE_RANGE_AUTOFILL_EVENT = "beforerangecopyapply";

export declare const BEFORE_RANGE_EDIT_EVENT = "beforerangeedit";

export declare const BEFORE_REDO_EVENT = "beforeredo";

export declare const BEFORE_ROW_RENDER_EVENT = "beforerowrender";

export declare const BEFORE_ROW_SOURCE_SET_EVENT = "beforesourceset";

export declare const BEFORE_SCROLL_EVENTS = "scrollviewport";

export declare const BEFORE_SELECTION_RANGE_EVENT = "beforesettemprange";

export declare const BEFORE_UNDO_EVENT = "beforeundo";

/**
 * This file defines the `ExportExcelEvent` type, which is used to configure the export
 * of data from RevoGrid to an Excel file. It includes options for the Excel sheet and
 * workbook names, as well as detailed configuration for writing options such as file
 * type, compression, and workbook properties.
 *
 *  **Features**:
 * - Support for a variety of Excel file types through the `BookType` union.
 * - Customizable properties for the exported Excel file such as title, author, and
 *   creation date encapsulated in the `Properties` interface.
 * - Flexible writing options allowing control over data encoding, compression, and error
 *   suppression.
 *
 * This type is essential for applications needing to export grid data to Excel, providing
 * a structured way to specify export settings and ensure compatibility with various Excel
 * file formats.
 */
export declare type BookType = 'xlsx' | 'xlsm' | 'xlsb' | 'xls' | 'xla' | 'biff8' | 'biff5' | 'biff2' | 'xlml' | 'ods' | 'fods' | 'csv' | 'txt' | 'sylk' | 'slk' | 'html' | 'dif' | 'rtf' | 'prn' | 'eth' | 'dbf';

export declare const CELL_EDIT_CANCEL_EVENT = "cell-edit-cancel";

export declare const CELL_EDIT_EVENT = "cell-edit";

export declare const CELL_EDIT_ORIGINAL_EVENT = "celledit";

export declare const CELL_EDIT_SAVE_EVENT = "cell-edit-save";

/**
 * Represents a cache of cells within a single row.
 */
declare type CellCache = {
    /**
     * A map of start indices and the number of cells hidden after them.
     * Used to calculate cell sizes for visible cells.
     */
    startX: {
        [key: number]: number;
    };
    /**
     * A map of start indices and the number of cells hidden below them.
     * Used to calculate cell sizes for visible cells.
     */
    startY: {
        [key: number]: number;
    };
    /**
     * A map of hidden cell indices and their corresponding merge data.
     * Used to skip rendering hidden cells.
     */
    hiddenX: {
        [key: number]: MergeData;
    };
};

/**
 * The CellColumnFocusVerifyPlugin is a RevoGrid plugin that enables custom focus
 * verification logic for cells based on their column configurations. This plugin
 * intercepts the cell focus initialization event to apply additional validation rules
 * defined at the column level, ensuring that only cells meeting specific criteria
 * can receive focus.
 *
 * **Key Features**:
 * - Listens to the `beforecellfocusinit` event, allowing for pre-focus validation.
 * - Utilizes column-level focus functions to determine whether a cell can be focused.
 * - Prevents default focus behavior if the column's focus condition is not satisfied,
 *   enabling dynamic user interaction control based on custom logic.
 *
 * **Usage**:
 * - Integrate this plugin into RevoGrid by adding it to the grid's plugin array.
 * - Define custom focus validation logic within the column definition using the `focus`
 *   property, which should be a function that returns a boolean based on the event detail.
 *
 * ### Example
 * ```ts
 * import { CellColumnFocusVerifyPlugin } from './cell-column-focus-verify';
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [CellColumnFocusVerifyPlugin];
 *
 * grid.columns = [
 *   {
 *     prop: 'num',
 *     name: 'Numeric Column',
 *     focus: (detail) => detail.value > 10, // Custom focus validation logic
 *   },
 * ];
 * ```
 */
export declare class CellColumnFocusVerifyPlugin extends CorePlugin {
    /**
     * Providers give you access to the grid core functions like selections, data order, row/cell sizes, viewports
     */
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
}

/**
 * This module defines the `cellFlashArrowTemplate`, a function that enhances cell rendering in RevoGrid
 * by adding directional arrows to indicate changes in cell values. This visual enhancement is part of
 * the cell flashing feature, providing immediate feedback on data modifications.
 *
 * **Key Features**:
 * - **Directional Indicators**: Renders an upward arrow ('↑') if the new value is greater than the previous
 *   value, and a downward arrow ('↓') if it is less, helping users quickly identify the direction of change.
 * - **Conditional Rendering**: Only applies the arrow and flash styling if the current value differs from
 *   the previous value, ensuring that cells without changes remain unaffected.
 * - **Flexible Integration**: Supports an optional existing cell template, allowing it to be combined with
 *   arrow rendering for customized cell display while maintaining compatibility with existing templates.
 *
 * **Usage**:
 * - Integrate this template function into a column's `cellTemplate` property to activate the arrow rendering
 *   for that column, enhancing cell feedback on value changes.
 *
 * ### Example
 * ```typescript
 * import { cellFlashArrowTemplate } from './cell-flash-arrow.template';
 *
 * const grid = document.createElement('revo-grid');
 * grid.columns = [
 *   {
 *     prop: 'num',
 *     name: 'Linear',
 *     minValue: 0,
 *     maxValue: 40,
 *     cellTemplate: cellFlashArrowTemplate(),
 *   },
 * ];
 * ```
 *
 * The `cellFlashArrowTemplate` provides a user-friendly way to visualize data changes, making it easier
 * to track trends and updates within RevoGrid.
 */
export declare const cellFlashArrowTemplate: (template?: ColumnRegular["cellTemplate"]) => ColumnRegular["cellTemplate"];

/**
 *`CellFlashPlugin` for RevoGrid, designed to visually highlight cells
 * by flashing them when they are edited. This feature enhances user experience by providing immediate
 * feedback on data changes within the grid.
 *
 * **Key Features**:
 * - **Flash Management**: Maintains a map of cells that require flashing, tracking changes in cell data
 *   and previous values to determine when a cell should flash.
 * - **Event Integration**: Listens to relevant grid events such as `AFTER_SOURCE_EVENT`, `FLASH_CELL_EVENT`,
 *   `ON_EDIT_EVENT`, and `BEFORE_CELL_RENDER_EVENT` to manage the flashing lifecycle effectively, ensuring
 *   that cell flashes are initiated and removed at appropriate times.
 * - **Customizable Flash Behavior**: Utilizes column properties to determine if a cell should flash, allowing
 *   for flexible configuration based on specific column validation logic.
 * - **Automatic Flash Removal**: Automatically removes the flash effect after a set duration (1 second),
 *   cleaning up the visual state without user intervention.
 *
 * **Usage**:
 * - To enable this plugin, add it to the `plugins` array of a RevoGrid instance. This will activate cell
 *   flashing functionality for all editable cells in the grid.
 *
 * ### Example
 * ```typescript
 * import { CellFlashPlugin } from '@revolist/revogrid-pro'
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [CellFlashPlugin];
 * grid.columns = [
 *   {
 *     prop: 'name',
 *     flash: (value) => value === 'John',
 *   },
 * ];
 * ```
 *
 * The `CellFlashPlugin` is crucial for applications that require visual cues for data changes, providing
 * a straightforward method to highlight recent edits and improving data tracking within RevoGrid.
 */
export declare class CellFlashPlugin extends CorePlugin {
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
}

/**
 * The `CellMergePlugin` is a RevoGrid plugin designed to manage and render merged cells within a grid.
 * It allows users to visually and functionally combine multiple adjacent cells into a single larger cell,
 * offering a more cohesive data presentation within the grid interface.
 *
 * **Key Features**:
 * - Merging Logic: Extends the size of specified cells and hides cells covered by the merged area.
 * - Event Management: Overrides grid events and focus behavior to accommodate hidden cells due to merging.
 * - Dynamic Updates: Listens for data changes and adjusts merged configurations accordingly.
 * - UI Rendering: Adjusts cell sizes and parameters for merged cells during rendering.
 *
 * **Usage**:
 * - This plugin should be included in the grid's plugin array to enable cell merging functionality.
 * - Configure the merge data through the grid's `additionalData` property to define which cells should be merged.
 *
 * ### Example
 * ```typescript
 * import { CellMergePlugin } from './cell-merge-plugin';
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [CellMergePlugin]; // Add merge plugin
 * grid.additionalData = {
 *   cellMerge: [
 *     { row: 1, column: 1, rowSpan: 2, colSpan: 2 },
 *   ],
 * };
 * ```
 *
 * Events:
 * - Listens to a variety of events like `ADDITIONAL_DATA_EVENT`, `APPLY_RANGE_EVENT`, etc., to handle merge configurations and rendering.
 */
export declare class CellMergePlugin extends CorePlugin {
    readonly revogrid: HTMLRevoGridElement;
    private cacheService;
    private canRangePrev;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    private setMergeConfig;
    /**
     * Overrides focus range based on hidden and merged values
     */
    private focusRender;
    private hasMergedCell;
    /**
     * For range we do trick extending range area
     * But we should block range ability for merged cells
     */
    private rangeApply;
    /**
     * Block range ability in grid or unblock it to initial if @dropBlock = true
     */
    private blockRange;
    private checkIfMergedItemNotVisibleRequireAndCorrect;
    /**
     * UI render high level
     * Specify new sizes if visible
     */
    private mergeCells;
    /**
     * Get cell sizes to render in ui
     */
    private updateCellParams;
    destroy(): void;
}

/**
 * The `CellValidatePlugin` is a RevoGrid plugin designed to enforce cell validation within
 * the grid, ensuring data integrity by preventing invalid data entries from being saved.
 * It integrates seamlessly with RevoGrid's event system and requires the `EventManagerPlugin`
 * for full functionality.
 *
 *  **Features**:
 * - Listens to grid edit events (`ON_EDIT_EVENT`) to validate cell data upon modification.
 *   If a cell is deemed invalid based on the column's validation logic, it prevents the
 *   data from being saved and refreshes the grid.
 * - Adds visual indicators to invalid cells by tagging them during the `BEFORE_CELL_RENDER_EVENT`,
 *   providing immediate feedback to users about validation errors.
 * - Integrates custom validation logic through column definitions, supporting both strict
 *   and soft validation modes.
 * - Utilizes `validationRenderer` for rendering cells with validation feedback, allowing
 *   customization of how invalid cells are displayed using tooltips or other UI elements.
 *
 * **Usage**:
 * - Implement this plugin in a RevoGrid instance to enable cell validation logic and improve
 *   data quality by preventing erroneous entries.
 *
 * ### Example
 * ```ts
 * import { CellValidatePlugin } from '@revolist/revogrid-pro'
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [CellValidatePlugin];
 * ```
 */
export declare class CellValidatePlugin extends CorePlugin {
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
}

/**
 * RevoGrid Renderer
 * Formats a numeric cell value with corresponding styles and icons based on whether the value
 * is positive, negative, or zero,
 * and exports a cell template renderer for a grid that utilizes this formatting.
 */
export declare const changeRenderer: Required<ColumnRegular>['cellTemplate'];

export declare const circularProgressRenderer: Required<ColumnRegular>['cellTemplate'];

export declare const CLIPBOARD_COPY_EVENT = "beforecopyapply";

export declare const CLIPBOARD_PASTE_EVENT = "beforepasteapply";

/**
 * The `ClipboardJsonPlugin` is a custom plugin for the RevoGrid framework that enhances the clipboard
 * functionality by enabling JSON data parsing during copy and paste operations. This plugin allows
 * complex data structures to be serialized and deserialized correctly when copying to or pasting from
 * the clipboard, supporting advanced data handling scenarios within the grid.
 *
 *  **Features**:
 * - Intercepts the `CLIPBOARD_COPY_EVENT` to serialize objects in the grid cells into JSON strings
 *   prefixed with a special marker (`$rv-parse_`). This ensures that complex data types are preserved
 *   during copy operations.
 * - Intercepts the `CLIPBOARD_PASTE_EVENT` to deserialize JSON strings back into objects when pasted
 *   into the grid, restoring the original data structure.
 * - Provides methods `parserCopy` and `parserPaste` to handle the conversion logic, allowing for
 *   easy customization and extension.
 *
 * **Usage**:
 * - Integrate `ClipboardJsonPlugin` into a RevoGrid instance to enable JSON data support in clipboard
 *   operations. This is particularly useful for applications that handle structured data or require
 *   seamless data interchange with external systems.
 *
 * ### Example
 * ```typescript
 * import { ClipboardJsonPlugin } from '@revolist/revogrid-pro'
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [ClipboardJsonPlugin];
 * ```
 *
 * This plugin is essential for developers looking to enhance the data exchange capabilities of RevoGrid,
 * providing robust support for copying and pasting complex data structures.
 */
export declare class ClipboardJsonPlugin extends CorePlugin {
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    parserPaste(data: DataFormat[][]): any[][];
    parserCopy(data: DataFormat[][]): string;
}

export declare const COLLAPSE_ICON = "\u2039";

declare interface Column extends ColumnRegular {
    index: number;
}

export declare const COLUMN_COLLAPSE_EVENT = "column-collapse";

export declare const COLUMN_EXPAND_EVENT = "column-expand";

export declare const COLUMN_UPDATED_EVENT = "aftercolumnsset";

export declare const enum ColumnAutoSizeMode {
    headerClickAutosize = "headerClickAutoSize",
    autoSizeOnTextOverlap = "autoSizeOnTextOverlap",
    autoSizeAll = "autoSizeAll"
}

/**
 * The `ColumnCollapsePlugin` is a plugin for the RevoGrid framework that enables collapsible columns
 * with content trimming functionality. It allows users to collapse and expand columns, reducing the
 * visual clutter and improving the overall user experience when dealing with large datasets.
 *
 *  **Features**:
 * - Enables collapsible columns with content trimming
 * - Provides a visual indicator (▼) in the header to collapse and expand columns
 *
 * **Usage**:
 * - Add the `ColumnCollapsePlugin` to the grid's plugins array.
 * - Add the `collapsible` property to the column configuration to enable collapsible columns.
 * - Add the `collapsed` property to the column configuration to set the initial collapsed state.
 * - Add the `children` property to the column configuration to define the columns to be collapsed.
 * - Add the `sealed` property to the column configuration to prevent the column from being trimmed.
 *
 * ### Example
 * ```typescript
 * import { ColumnCollapsePlugin } from '@revolist/revogrid-pro';
 *
 * const grid = document.createElement('revo-grid');
 * grid.columns = [
 *   {
 *     collapsible: true,
 *     collapsed: true,
 *     children: [
 *       {
 *         prop: 'age',
 *         sealed: true,
 *       },
 *     ],
 *   },
 * ];
 * grid.plugins = [ColumnCollapsePlugin];
 * ```
 */
export declare class ColumnCollapsePlugin extends CorePlugin {
    private collapsedColumns;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    private initializeCollapsedStates;
    private setCollapsed;
    private isCollapsed;
    private getColumnIds;
    private toggleColumnCollapse;
    destroy(): void;
}

/**
 * Column type for dropdown editor
 *
 * **Key Features**:
 * - **Cell Template**: Uses the `editorDropdown` template for rendering the dropdown editor.
 * - **Cell Properties**: Applies a small padding to the cell to prevent layout issues.
 * - **Readonly**: Ensures the dropdown is not editable by default.
 */
export declare const ColumnDropdown: ColumnType;

/**
 * Configuration options for the ColumnGroupPanelPlugin
 */
export declare interface ColumnGroupPanelConfig {
    /**
     * Text to display in the group panel when no columns are grouped
     * @default 'Drag columns here to group by row.'
     */
    emptyPanelText?: string;
}

/**
 * The `ColumnGroupPanelPlugin` is a plugin for RevoGrid that introduces a user-friendly
 * interface for grouping columns. It enables users to drag and drop columns into a
 * designated panel to create groupings, facilitating data organization and management.
 *
 *  **Features**:
 * - Creates a visual group panel in the grid header for column grouping.
 * - Supports drag-and-drop functionality to add, reorder, or remove column groupings.
 * - Updates the grid's grouping state dynamically as users interact with the panel.
 * - Integrates drag events to enhance user interactions with column headers.
 *
 * **Usage**:
 * - Instantiate `ColumnGroupPanelPlugin` and add it to the RevoGrid plugins array.
 * - Drag columns into the group panel to group them or manage existing groupings through
 *   the UI.
 *
 * ### Example
 * ```typescript
 * import { ColumnGroupPanelPlugin } from '@revolist/revogrid-pro'
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [ColumnGroupPanelPlugin];
 * ```
 *
 * ### Configuration
 * ```typescript
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [ColumnGroupPanelPlugin];
 *
 * grid.additionalData = {
 *   columnGroupPanel: {
 *     emptyPanelText: 'Drop columns here to create groups'
 *   }
 * };
 * ```
 *
 * This plugin is ideal for users who need to organize grid data by grouping columns,
 * providing an intuitive interface for managing complex data sets.
 */
export declare class ColumnGroupPanelPlugin extends CorePlugin {
    private groupings;
    private groupPanel;
    private config;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    private createGroupPanel;
    private getEmptyPanelText;
    private renderGroupPanel;
    private createGroupItem;
    private onDrop;
    private onGroupItemDragStart;
    private getDropIndex;
    private addGrouping;
    private removeGrouping;
    private reorderGrouping;
    private updateGrouping;
}

/**
 * The `ColumnHidePlugin` is a plugin for the RevoGrid framework that enables column hiding functionality
 * based on the `hide-column` attribute or `additionalData.hiddenColumns`. It allows users to hide specific columns by providing their indices
 * in the attribute or through the additionalData property.
 *
 * **Features**:
 * - Enables column hiding through the `hide-column` attribute
 * - Supports hiding columns through `additionalData.hiddenColumns`
 * - Automatically updates when the attribute or additionalData changes
 * - Preserves column state when columns are updated
 * - Supports multiple framework attribute formats:
 *   - Vue/Svelte: `hide-column="1,2,3"` or `:hide-column="[1,2,3]"`
 *   - React: `hideColumn="1,2,3"`
 *   - Angular: `[hideColumn]="[1,2,3]"`
 *
 * **Usage**:
 * ```html
 * <!-- Vue/Svelte -->
 * <revo-grid hide-column="1,2,3"></revo-grid>
 * <!-- or with dynamic binding -->
 * <revo-grid :hide-column="[1,2,3]"></revo-grid>
 *
 * <!-- React -->
 * <RevoGrid hideColumn="1,2,3" />
 *
 * <!-- Angular -->
 * <revo-grid [hideColumn]="[1,2,3]"></revo-grid>
 *
 * <!-- Using additionalData -->
 * <revo-grid></revo-grid>
 * <script>
 *   const grid = document.querySelector('revo-grid');
 *   grid.additionalData = {
 *     hiddenColumns: [1, 2, 3]
 *   };
 * </script>
 * ```
 */
export declare class ColumnHidePlugin extends CorePlugin {
    private hiddenColumns;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    private initializeHiddenColumns;
    private getIndexesWithoutTrimmed;
    private updateColumnVisibility;
}

declare type ColumnRecords = Record<any, Column>;

/**
 * The `ColumnSelectionPlugin` is an essential plugin for RevoGrid, designed to enhance user interaction
 * by enabling column selection functionalities. It allows users to focus on and select entire columns,
 * facilitating workflows that require column-based data manipulation and analysis.
 *
 * **Key Features**:
 * - **Column Focus and Selection**: Allows users to focus on specific columns, highlighting them
 *   for operations like data editing, copying, or analysis.
 * - **Event-Driven Architecture**: Listens to and dispatches various events such as `COLUMN_UPDATED_EVENT`,
 *   `EVENT_HEADER_FOCUS`, `EVENT_BEFORE_CELL_FOCUS`, and `EVENT_BEFORE_FOCUS_LOST` to manage column
 *   selection and focus logic effectively.
 * - **Dynamic Column Updates**: Adjusts selections based on column updates, ensuring that the active
 *   selection remains consistent with any changes in column configuration.
 * - **Integration with Selection and Data Stores**: Utilizes observable stores for managing selection
 *   states, interfacing with the grid's data and selection stores to apply and clear selections.
 * - **Header Interaction**: Reacts to header clicks to initiate column selection, allowing seamless
 *   user interaction with column headers.
 *
 * **Usage**:
 * - Integrate this plugin into a RevoGrid instance to enable column selection features. Add the plugin
 *   to the grid's plugin array to activate its functionality.
 *
 * ### Example
 * ```typescript
 * import { ColumnSelectionPlugin } from '@revolist/revogrid-pro';
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [ColumnSelectionPlugin];
 * ```
 *
 * This plugin is ideal for applications where column-centric interaction is critical, providing
 * an intuitive interface for managing and selecting columns in complex data grids.
 */
export declare class ColumnSelectionPlugin extends CorePlugin {
    private activeHeader;
    /**
     * Constructor for ColumnSelectionPlugin
     * @param revogrid - The Grid element
     * @param providers - The Plugin providers
     */
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    /**
     * Handle column updates
     * @param e - CustomEvent with column collection
     */
    private onColumnUpdated;
    /**
     * Handle header focus
     * @param e - CustomEvent with template prop
     */
    private onHeaderFocus;
    /**
     * Apply header selection
     * @param param0 - Object with selection store, index, prop and type
     */
    private applyHeaderSelection;
    /**
     * Clear header focus
     */
    private dropHeaderSelection;
}

/**
 * The ColumnStretchPlugin is a RevoGrid plugin designed to dynamically adjust column
 * widths based on available space within the grid. It ensures that extra space is
 * efficiently utilized by increasing the width of specified columns, enhancing the
 * presentation of data without manual resizing.
 *
 * **Key Features**:
 * - Automatically stretches the width of columns to fill any remaining space in the grid.
 * - Supports configurations for stretching all columns, a specific column by index,
 *   or only the last column.
 * - Listens to `beforecolumnapplied` and `additionaldatachanged` events to adjust
 *   column sizes based on changes in grid dimensions or configuration updates.
 * - Utilizes `ResizeObserver` and a debounced `applyStretch` function to efficiently
 *   manage size recalculations during viewport size changes.
 *
 * **Usage**:
 * - Integrate the plugin into a RevoGrid instance by adding it to the grid's plugin array.
 * - Configure the stretching behavior through the `stretch` property in the grid's
 *   `additionalData` object, specifying modes like 'none', 'all', or a specific index.
 *
 * ### Example
 * ```typescript
 * import { ColumnStretchPlugin } from './column-stretch';
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [ColumnStretchPlugin];
 *
 * grid.additionalData = {
 *   stretch: 'last', // Stretch the last column to fit available space
 * };
 * ```
 *
 * By using this plugin, developers can enhance the adaptability and visual layout
 * of their RevoGrid, ensuring optimal use of grid space and improving data display
 * without manual intervention.
 */
export declare class ColumnStretchPlugin extends CorePlugin {
    providers: PluginProviders;
    private config;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    private applyStretch;
}

export declare const columnTypeRenderer: ColumnRegular['columnTemplate'];

/**
 * Defines a collection of common aggregation functions used for table calculations.
 * These aggregators transform an array of numerical values into meaningful statistical summaries.
 */
export declare const commonAggregators: Aggregations;

declare type ContextMenuConfig = {
    items: ContextMenuItem[];
    rightClick?: boolean;
    leftClick?: boolean;
    targetSelectors?: string[];
    anchorToTarget?: boolean;
};

declare type ContextMenuItem = {
    name: string | ((focused?: Cell | null, range?: RangeArea | null) => string);
    class?: string;
    icon?: string;
    rowClass?: string | ((item: ContextMenuItem, focused?: Cell | null, range?: RangeArea | null) => string);
    hidden?: boolean | ((item: ContextMenuItem, focused?: Cell | null, range?: RangeArea | null) => boolean);
    action?: (event: MouseEvent, focused?: Cell | null, range?: RangeArea | null, close?: () => void) => void;
    keepOpen?: boolean;
    template?: (h: HyperFunc<VNode>, item: ContextMenuItem, focused?: Cell | null, range?: RangeArea | null, close?: () => void) => any;
};

/**
 * The `ContextMenuPlugin` is a RevoGrid plugin that adds a customizable context menu
 * to the grid, allowing users to interact with grid data through right-click actions.
 * This plugin enhances user experience by providing quick access to common functionalities.
 *
 *  **Features**:
 * - Dynamic context menu creation using the `ContextMenuConfig` type, which specifies
 *   menu items and their associated actions.
 * - Event-driven architecture, reacting to grid events like `ROW_MENU_EVENT` to display
 *   context menus contextually.
 * - Integration with RevoGrid's core features through `PluginProviders`, allowing
 *   seamless interaction with the grid's data and layout.
 * - Automatic positioning of the context menu, ensuring it remains within the grid's
 *   boundaries and adjusts dynamically to fit available space.
 * - Subscribes to document click events to automatically close the menu when clicking
 *   outside, maintaining a clean user interface.
 *
 * **Usage**:
 * - Integrate `ContextMenuPlugin` into a RevoGrid instance by adding it to the grid's
 *   plugins array.
 *
 * ### Example
 * ```typescript
 * import { ContextMenuPlugin } from '@revolist/revogrid-pro'
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [ContextMenuPlugin];
 * ```
 *
 * This plugin is essential for applications requiring enhanced grid interactivity,
 * providing users with context-specific actions for efficient data manipulation.
 */
export declare class ContextMenuPlugin extends CorePlugin {
    contextMenu?: HTMLElement;
    config?: ContextMenuConfig;
    private localsubscriptions;
    /**
     * Providers give you access to the grid core functions like selections, data order, row/cell sizes, viewports
     */
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    getConfig(config?: Partial<ContextMenuConfig>): {
        items: ContextMenuItem[];
        rightClick: boolean;
        leftClick: boolean;
        targetSelectors: string[];
        anchorToTarget: boolean;
    };
    close(): void;
    private isTargetElement;
    open(target: EventTarget | null, event?: MouseEvent): Promise<void>;
    clearSubscriptions(): void;
}

declare class CorePlugin extends BasePlugin {
    private attributeObservers;
    constructor(...args: ConstructorParameters<typeof BasePlugin>);
    /**
     * Observe attribute changes on the grid element
     * @param attrName - The attribute name to observe (supports both kebab-case and camelCase)
     * @param callback - Callback function when attribute changes
     */
    observeAttribute(attrName: string, callback: (value: string | null) => void): void;
    /**
     * Stop observing an attribute
     * @param attrName - The attribute name to stop observing
     */
    unobserveAttribute(attrName: string): void;
    /**
     * Set the trimmed state for a column
     */
    setColumnTrimmed(trimmed: Record<string, Record<string, boolean | undefined>>, type: DimensionCols): void;
    /**
     * Destroy plugin and clean up all observers
     */
    destroy(): void;
}

/**
 * Create pivot data based on the configuration.
 */
export declare function createPivotData(originalData: DataType[], { rows, columns, values, dimensions }: Partial<PivotConfig>): DataType[];

export declare const DATA_RENDER_EVENT = "beforedatarender";

export declare const DATE_FILTERS: Record<DateFilterOperator, CustomFilter<any, LogicFunctionExtraParam>>;

export declare type DateFilterOperator = 'notEqual' | 'isEmpty' | 'isNotEmpty' | 'today' | 'yesterday' | 'last7Days' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'nextQuarter' | 'previousQuarter' | 'thisYear' | 'nextYear' | 'previousYear' | DateFilterOperatorWithDatePickerExtra | DateFilterOperatorWithDateRangeExtra;

export declare type DateFilterOperatorWithDatePickerExtra = 'equals' | 'before' | 'after' | 'onOrBefore' | 'onOrAfter' | 'notEqual';

export declare type DateFilterOperatorWithDateRangeExtra = 'between';

export declare interface DateRangeValue {
    operator: DateFilterOperator;
    fromDate?: string;
    toDate?: string;
}

export declare const DEFAULT_SEL_PROP = "selected";

export declare function defaultColumnTemplate(defaultTemplate?: ColumnRegular['columnTemplate']): Required<ColumnRegular>['columnTemplate'];

export declare function defaultTemplate(defaultTemplate?: ColumnRegular['cellTemplate']): Required<ColumnRegular>['cellTemplate'];

/**
 * Define the dropdown component
 * @param el - The element to render the dropdown
 * @param props - The props of the dropdown
 */
export declare const defineDropdown: (el: HTMLElement, props: DropdownProps) => void;

/**
 * The `PivotConfigurator` component provides a flexible configuration interface
 * for managing pivot table layouts. It allows users to drag and drop dimensions,
 * rows, columns, and values into designated zones, facilitating dynamic pivot
 * table setup.
 *
 *  **Features**:
 * - Supports drag-and-drop functionality for configuring rows, columns, and values.
 * - Enables dynamic selection and removal of dimensions, rows, columns, and values.
 * - Includes built-in aggregator selection for values based on dimensions.
 * - Provides customizable i18n support for localization of UI labels and messages.
 *
 * **Usage**:
 * - Import `PivotConfigurator` and pass in the required dimensions, columns, rows,
 *   and values as props.
 * - Optionally, provide callbacks for `onUpdateColumns`, `onUpdateRows`, and
 *   `onUpdateValues` to handle configuration changes.
 *
 * ### Example
 * ```ts
 * import { definePivotConfigurator } from '@revolist/revogrid-pro'
 *
 * definePivotConfigurator(yourElement, {
 *   dimensions: [...],
 *   rows: [...],
 *   columns: [...],
 *   values: [...],
 * }, {
 *   onUpdateColumns: (updatedColumns) => {
 *     // Handle column configuration changes
 *   },
 *   onUpdateRows: (updatedRows) => {
 *     // Handle row configuration changes
 *   },
 *   onUpdateValues: (updatedValues) => {
 *     // Handle value configuration changes
 *   },
 * })
 * ```
 *
 * The `PivotConfigurator` component is ideal for applications that require
 * flexible, user-driven pivot table customization, especially in data management,
 * reporting, and analytics tools.
 */
export declare const definePivotConfigurator: (el: HTMLElement, config?: Partial<PivotConfig>, actions?: Partial<PivotConfigurationActions>) => void;

export declare const DimensionsPanel: ({ dimensions, draggingItem, onDragStart, isSelected, onCheckboxChange, }: DimensionsPanelProps) => h.JSX.Element;

declare interface DimensionsPanelProps {
    dimensions: PivotConfigDimension[];
    draggingItem: DraggingItem | null;
    onDragStart: (index: number, prop: ColumnProp) => void;
    isSelected: (prop: ColumnProp) => boolean;
    onCheckboxChange: (prop: ColumnProp, checked: boolean) => void;
}

export declare function directAncestor(element: HTMLElement, selector: string): HTMLElement | null;

export declare const DRAG_END_EVENT = "rowdragend";

export declare const DRAG_EVENT = "rowdrag";

export declare const DRAG_INPROGRESS_EVENT = "rowdragstart";

/**
 * Use this event to inform plugins that start dragging.
 */
export declare const DRAG_START_EVENT = "dragstartcell";

declare interface DragEventsData extends CellTemplateProp {
    text?: string | number;
}

/** The item being dragged */
export declare interface DraggingItem {
    /** The source panel of the dragging item */
    source: PanelType;
    /** The index of the dragging item in the source panel */
    index: number;
    /** Dragging item */
    prop: ColumnProp;
}

export declare type DragStartEventDetails = {
    event: MouseEvent;
    data: DragEventsData;
};

/**
 * Dropdown component
 */
export declare function Dropdown<T = any>({ source, value, onChange, placeholder, disabled, name, id, className, style, config, renderOption, renderPlaceholder, renderSelectedValue, renderNoResults, }: DropdownProps<T>): h.JSX.Element;

export declare type DropdownConfig<T = any> = {
    search?: boolean;
    searchPlaceholder?: string;
    filterFunction?: FilterFunction<T>;
    sortDirection?: SortDirection;
    sortFunction?: SortFunction<T>;
    closeOnClickOutside?: boolean;
    autoFocus?: boolean;
    multiSelect?: boolean;
    autocomplete?: boolean;
    portalTarget?: HTMLElement | null;
    ariaLabel?: string;
    ariaLabelledBy?: string;
    ariaDescribedBy?: string;
    maxHeight?: number;
    theme?: string | null;
    popupClassName?: string;
};

export declare type DropdownOption<T = any> = {
    value: T;
    label: string;
    disabled?: boolean;
    [key: string]: any;
};

export declare type DropdownProps<T = any> = {
    source: DropdownOption<T>[];
    value?: T | T[];
    placeholder?: string;
    disabled?: boolean;
    name?: string;
    id?: string;
    className?: string;
    style?: JSX.CSSProperties;
    config?: DropdownConfig<T>;
    onChange?: (value: T | T[]) => void;
    renderOption?: (h: HyperFunc_2<VNode_2>, option: DropdownOption<T>, isSelected: boolean) => ComponentChildren;
    renderPlaceholder?: (h: HyperFunc_2<VNode_2>, placeholder: string, children: ComponentChildren) => ComponentChildren;
    /**
     * Render the selected value
     */
    renderSelectedValue?: (h: HyperFunc_2<VNode_2>, selectedOptions: DropdownOption<T>[], children: ComponentChildren) => ComponentChildren;
    renderNoResults?: (h: HyperFunc_2<VNode_2>) => ComponentChildren;
};

export declare const DropZone: ({ title, panel, items, dimensions, placeholder, i18n, renderItem, onRemove, onDrop, onDragOver, onDragEnter, onItemDragStart, }: DropZoneProps) => h.JSX.Element;

declare interface DropZoneProps {
    title: string | JSX.Element;
    panel: PanelType;
    items: ColumnProp[];
    dimensions: Record<ColumnProp, PivotConfigDimension>;
    placeholder?: string;
    i18n: typeof PIVOT_CONFIG_EN;
    onRemove: (index: number) => void;
    onDrop: (target: PanelType) => void;
    onDragOver: (e: Event) => void;
    onDragEnter: (e: Event) => void;
    onItemDragStart: (index: number, prop: ColumnProp) => void;
    renderItem?: (index: number, item?: PivotConfigDimension) => ColumnProp | JSX.Element | undefined;
}

export declare const EDIT_RENDER_EVENT = "beforeeditrender";

declare type EditEvent = BeforeSaveDataDetails | BeforeRangeSaveDataDetails;

/**
 * The `editorCheckbox` is a custom cell editor for RevoGrid that provides a checkbox input
 * to edit boolean values directly within the grid cells.
 *
 *  **Features**:
 * - Renders a checkbox input element for cells, allowing users to toggle boolean values (`true/false`)
 *   with a simple click.
 * - Automatically dispatches a `celledit` event upon change, updating the grid's data model with
 *   the new value.
 * - Ensures seamless integration with RevoGrid by providing row and column details in the event payload.
 *
 * **Usage**:
 * - Import `editorCheckbox` and assign it to the `cellTemplate` property of a column in the RevoGrid.
 * - Ideal for columns that require quick boolean editing, such as toggling statuses or enabling/disabling options.
 *
 * ### Example
 * ```typescript
 * import { editorCheckbox } from '@revolist/revogrid-pro'
 *
 * const grid = document.createElement('revo-grid');
 * grid.columns = [
 *   {
 *     prop: 'enabled',
 *     name: 'Enabled',
 *     cellTemplate: editorCheckbox,
 *   },
 * ];
 * ```
 *
 * **Event Handling**:
 * - The `editorCheckbox` dispatches a `celledit` event whenever the checkbox value changes.
 * - The event detail contains:
 *   - `rgCol`: The column index of the edited cell.
 *   - `rgRow`: The row index of the edited cell.
 *   - `type`: The type of the cell.
 *   - `prop`: The property of the cell being edited.
 *   - `val`: The new value (`true/false`) after the checkbox toggle.
 *   - `preventFocus`: A flag to control grid focus behavior (default: `false`).
 *
 * This editor is particularly useful in scenarios where users need to enable or disable specific options
 * directly from the grid, providing a quick and user-friendly interface for boolean data editing.
 */
export declare const editorCheckbox: ColumnRegular['cellTemplate'];

/**
 * The `editorCounter` is a custom cell editor for RevoGrid that provides plus/minus buttons
 * to increment/decrement numeric values within a specified range directly within the grid cells.
 *
 * **Features**:
 * - Renders plus and minus buttons for easy value adjustment
 * - Supports customizable minimum and maximum values through column properties
 * - Configurable step size for increments/decrements
 * - Shows current value with optional display toggle
 * - Automatically dispatches a `celledit` event upon change
 * - Seamless integration with RevoGrid's data model
 * - Modern, responsive design with customizable theming
 *
 * **Usage**:
 * ```typescript
 * import { editorCounter } from '@revolist/revogrid-pro'
 *
 * const grid = document.createElement('revo-grid');
 * grid.columns = [
 *   {
 *     prop: 'quantity',
 *     name: 'Quantity',
 *     cellTemplate: editorCounter,
 *     min: 0,
 *     max: 100,
 *     step: 1,
 *     hideValue: false, // Set to true to hide the value display
 *   },
 * ];
 * ```
 *
 * **Event Handling**:
 * - Dispatches a `celledit` event on value change
 * - Event detail includes row, column, property, and new value information
 *
 * **Theming**:
 * Customizable through CSS variables:
 * - `--counter-button-size`: Size of plus/minus buttons (default: 24px)
 * - `--counter-value-size`: Font size of the value display (default: 14px)
 * - `--counter-spacing`: Spacing between elements (default: 4px)
 * - `--counter-button-bg`: Background color of buttons
 * - `--counter-button-color`: Color of button icons
 * - `--counter-button-hover-bg`: Button background on hover
 * - `--counter-value-color`: Color of the value text
 * - `--counter-disabled-opacity`: Opacity for disabled buttons
 */
export declare const editorCounter: ColumnRegular['cellTemplate'];

export declare const editorDropdown: ColumnRegular['cellTemplate'];

/**
 * The editorRowActionColumn is a partial implementation of the ColumnRegular interface.
 * It defines the cellTemplate and editor properties for a column that renders action buttons
 * for row editing.
 */
export declare const editorRowActionColumn: Partial<ColumnRegular>;

/**
 * The `editorSlider` is a custom cell editor for RevoGrid that provides a slider input
 * to edit numeric values within a specified range directly within the grid cells.
 *
 * **Features**:
 * - Renders a slider input element for cells, allowing users to select numeric values
 *   by dragging a slider handle.
 * - Supports customizable minimum and maximum values through column properties.
 * - Supports visual thresholds with custom CSS classes for different value ranges.
 * - Automatically dispatches a `celledit` event upon change, updating the grid's data model
 *   with the new value.
 * - Ensures seamless integration with RevoGrid by providing row and column details in the event payload.
 * - Shows current value and visual fill indicator for better UX.
 * - Supports theming through CSS variables.
 * - Optional value display that can be hidden through column properties.
 *
 * **Usage**:
 * - Import `editorSlider` and assign it to the `cellTemplate` property of a column in the RevoGrid.
 * - Specify `min` and `max` values in the column properties to define the slider range.
 * - Use `hideValue` property to hide the numeric value display.
 * - Add `thresholds` property to define custom CSS classes for different value ranges.
 *
 * ### Example
 * ```typescript
 * import { editorSlider } from '@revolist/revogrid-pro'
 *
 * const grid = document.createElement('revo-grid');
 * grid.columns = [
 *   {
 *     prop: 'rating',
 *     name: 'Rating',
 *     cellTemplate: editorSlider,
 *     min: 0,
 *     max: 100,
 *     hideValue: false,
 *     thresholds: [
 *       { value: 70, className: 'high' },
 *       { value: 30, className: 'medium' },
 *       { value: 0, className: 'low' }
 *     ]
 *   },
 * ];
 * ```
 *
 * **Event Handling**:
 * - The `editorSlider` dispatches a `celledit` event whenever the slider value changes.
 * - The event detail contains:
 *   - `rgCol`: The column index of the edited cell.
 *   - `rgRow`: The row index of the edited cell.
 *   - `type`: The type of the cell.
 *   - `prop`: The property of the cell being edited.
 *   - `val`: The new numeric value after the slider change.
 *   - `preventFocus`: A flag to control grid focus behavior (default: `true`).
 *
 * **Theming**:
 * The slider can be themed using CSS variables:
 * - `--slider-thumb-size`: Size of the slider handle (default: 12px)
 * - `--slider-track-height`: Height of the slider track (default: 4px)
 * - `--slider-value-size`: Font size of the value display (default: 12px)
 * - `--slider-spacing`: Spacing between elements (default: 8px)
 * - `--slider-thumb-bg`: Background color of the slider handle
 * - `--slider-thumb-border`: Border color of the slider handle
 * - `--slider-track-bg`: Background color of the unfilled track
 * - `--slider-fill-start`: Start color of the fill gradient
 * - `--slider-fill-end`: End color of the fill gradient
 * - `--slider-value-color`: Color of the value text
 *
 * These variables inherit from RevoGrid theme variables when available:
 * - `--revo-primary`
 * - `--revo-primary-light`
 * - `--revo-background`
 * - `--revo-border-color`
 * - `--revo-text-color-secondary`
 */
export declare const editorSlider: ColumnRegular['cellTemplate'];

/**
 * The `editorTimeline` is a custom cell editor for RevoGrid that provides a timeline input
 * to edit date ranges directly within the grid cells.
 *
 * **Features**:
 * - Renders a timeline bar with start and end date inputs
 * - Supports date range selection with date pickers
 * - Shows progress based on current date
 * - Optional week numbers display
 * - Optional weekend hiding
 * - Milestone mode support
 * - Custom date format support
 * - Group summary support
 * - Threshold support for progress visualization
 *
 * **Usage**:
 * ```typescript
 * import { editorTimeline } from '@revolist/revogrid-pro'
 *
 * const grid = document.createElement('revo-grid');
 * grid.columns = [
 *   {
 *     prop: 'timeline',
 *     name: 'Timeline',
 *     cellTemplate: editorTimeline,
 *     milestoneMode: false,
 *     thresholds: [
 *       { value: 25, className: 'low' },
 *       { value: 50, className: 'medium' },
 *       { value: 75, className: 'high' }
 *     ]
 *   },
 * ];
 * ```
 */
export declare const editorTimeline: ColumnRegular['cellTemplate'];

export declare const EVENT_AFTER_SORTING = "aftersortingapply";

/**
 * This file defines a comprehensive set of event constants used throughout the RevoGrid Pro project,
 * enabling consistent event handling and interaction between different components and plugins.
 * These events cover a wide range of functionalities including cell focus, cell rendering,
 * data rendering, clipboard operations, grid resizing, sorting, and more.
 *
 * **Usage**:
 * - Import specific event constants to listen for or dispatch these events in your plugins or components.
 * - Use events to trigger custom logic before or after key grid operations like rendering, editing, or scrolling.
 *
 * ### Example
 * import { EVENT_BEFORE_CELL_FOCUS, FOCUS_APPLY_EVENT } from './events';
 *
 * grid.addEventListener(EVENT_BEFORE_CELL_FOCUS, (event) => {
 *   // Custom logic before cell focus
 * });
 *
 * grid.dispatchEvent(new CustomEvent(FOCUS_APPLY_EVENT, { detail }));
 *
 * These events are integral to the RevoGrid's extensibility, allowing developers to integrate
 * additional features and custom behaviors seamlessly.
 */
export declare const EVENT_BEFORE_CELL_FOCUS = "beforecellfocus";

export declare const EVENT_BEFORE_EDIT = "beforeedit";

export declare const EVENT_BEFORE_FOCUS_LOST = "beforefocuslost";

export declare const EVENT_BEFORE_RANGE = "beforesetrange";

export declare const EVENT_BEFORE_SORTING = "beforesorting";

export declare const EVENT_COLUMN_MENU_OPEN = "columnmenu";

export declare const EVENT_COLUMN_SELECTION = "beforecolumnselection";

export declare const EVENT_HEADER_FOCUS = "headerclick";

export declare const EVENT_ROW_CLICK = "rowclick";

export declare const EVENT_ROW_FOCUS = "rowfocus";

export declare const EVENT_ROW_FOCUS_SIMPLE = "rowfocussimple";

/**
 * The configuration object for the EventManagerPlugin.
 */
export declare type EventManagerConfig = {
    /**
     * Whether to collect events and apply delay or send them immediately.
     * @default false
     */
    collectEvents?: boolean;
    /**
     * The delay in milliseconds to wait until the
     * collected events are applied to the grid.
     * Used only when `collectEvents` is true.
     * @default 0
     */
    collectEventsDelay?: number;
    /**
     * Whether to apply the collected events to the
     * original data source.
     * @default true
     */
    applyEventsToSource?: boolean;
};

export declare type EventManagerEvent = {
    eventTypes: string[];
    previousData: BeforeRangeSaveDataDetails['data'];
} & Omit<BeforeRangeSaveDataDetails, 'newRange' | 'oldRange'>;

/**
 * RevoGrid Plugin for Event Manager.
 * Whole purpose is to collect and dispatch edit events in one place.
 */
export declare class EventManagerPlugin extends CorePlugin {
    /**
     * Constructor for EventManagerPlugin
     * @param revogrid - The Grid element
     * @param providers - The Plugin providers
     */
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
}

export declare const EXCEL_BEFORE_IMPORT_EVENT = "excel-before-import";

export declare const EXCEL_BEFORE_SET_EVENT = "excel-before-set";

export declare const EXCEL_EXPORT_EVENT = "export-excel";

declare type ExcelConfig = {
    /** Allow drag and drop files to the grid area, default: true */
    allowDrag?: boolean;
    /** Excel parsing options */
    parsingOptions?: {
        /** If true, plaintext parsing will not parse values */
        raw?: boolean;
        /** If true, preserve _xlfn. prefixes in formula function names */
        xlfn?: boolean;
        dense?: boolean;
        PRN?: boolean;
    };
    /** Extra options to parse the sheet to the grid format. default: { header: 1 } - define the first row as the header */
    jsonFormat?: {
        /** Output format */
        header?: "A" | number | string[];
        /** Override worksheet range */
        range?: any;
        /** Include or omit blank lines in the output */
        blankrows?: boolean;
        /** Default value for null/undefined values */
        defval?: any;
        /** if true, return raw data; if false, return formatted text */
        raw?: boolean;
        /** if true, skip hidden rows and columns */
        skipHidden?: boolean;
        /** if true, return raw numbers; if false, return formatted numbers */
        rawNumbers?: boolean;
    };
    /** Skip column generation based on the first row - keep existing columns defined in the grid. default: false */
    skipColumnGeneration?: boolean;
    /** Allowed file extensions. default: ['.xlsx', '.xls'] */
    allowedExtensions?: string[];
};

export declare const EXPAND_COLUMN: Partial<ColumnRegular>;

export declare const EXPAND_ICON = "\u203A";

/**
 * Example usage of the ExportExcelEvent type
 *
 * @example
 * const exportConfig: ExportExcelEvent = {
 *   sheetName: 'Property Data', // Specify the name of the Excel sheet
 *   workbookName: 'Properties.xlsx', // Name of the workbook file
 *   writingOptions: {
 *     type: 'file', // Output type
 *     bookType: 'xlsx', // Workbook type
 *     compression: true, // Enable compression
 *     ignoreEC: true, // Ignore Excel compatibility
 *   },
 * };
 */
export declare type ExportExcelEvent = {
    sheetName?: string;
    workbookName?: string;
    writingOptions?: {
        /** Output data encoding */
        type?: 'base64' | 'binary' | 'buffer' | 'file' | 'array' | 'string';
        /**
         * Generate Shared String Table
         * @default false
         */
        bookSST?: boolean;
        /**
         * File format of generated workbook
         * @default 'xlsx'
         */
        bookType?: BookType;
        /**
         * Use ZIP compression for ZIP-based formats
         * @default false
         */
        compression?: boolean;
        /**
         * Suppress "number stored as text" errors in generated files
         * @default true
         */
        ignoreEC?: boolean;
        /** Override workbook properties on save */
        Props?: Properties;
        /** Base64 encoding of NUMBERS base for exports */
        numbers?: string;
    };
};

/**
 * The `ExportExcelPlugin` is a plugin for RevoGrid that enables seamless import and export
 * of Excel files (.xlsx, .xls) to and from the grid, enhancing data interoperability with
 * external systems.
 *
 *  **Features**:
 * - Drag-and-drop interface for importing Excel files directly into the grid.
 * - Event-driven architecture allowing hooks for customization via 'excel-before-import'
 *   and 'excel-before-set' events, giving plugins the ability to modify data before it's
 *   processed by the grid.
 * - Export current grid data to an Excel file, with customizable workbook and sheet names.
 * - Configurable to allow or restrict drag file import based on user settings.
 *
 * **Usage**:
 * - Integrate `ExportExcelPlugin` as part of RevoGrid's plugin array to enable Excel
 *   import/export functionality.
 * - Listen to relevant events to extend or customize the data handling behavior.
 *
 * ### Example
 * ```typescript
 * import { ExportExcelPlugin } from '@revolist/revogrid-pro'
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [ExportExcelPlugin];
 * ```
 *
 * This plugin is essential for applications that require integration with Excel files,
 * providing an efficient way to manage large datasets and maintain data consistency
 * across different platforms.
 */
export declare class ExportExcelPlugin extends CorePlugin {
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    private readFileAsArrayBuffer;
    /**
     * Imports an Excel file into the grid.
     *
     * @param file The File object to import
     *
     * This method reads the file using FileReader, parses it using xlsx library,
     * and then dispatches the 'excel-before-import' event to allow plugins to
     * modify the sheet before it is imported.
     *
     * After the sheet is imported, the method dispatches the 'excel-before-set'
     * event to allow plugins to modify the data before it is set as the new
     * source.
     *
     * If either event is prevented, the method will not set the new source.
     *
     * If the file is not an Excel file, the method will log an error.
     */
    importFile(file: File, config?: ExcelConfig): Promise<void>;
    isExcel(file: File, allowedExtensions?: string[]): boolean;
    export(config?: ExportExcelEvent): void;
}

export declare function extendTemplates(...templates: Template[]): Template;

/**
 * Quick search filter type
 */
export declare const FIlTER_QUICK_SEARCH: FilterType;

/**
 * Selection filter type
 */
export declare const FIlTER_SELECTION: FilterType;

/**
 * Slider filter type
 */
export declare const FIlTER_SLIDER: FilterType;

export declare type FilterFunction<T = any> = (option: DropdownOption<T>, searchValue: string) => boolean;

/**
 * The FilterHeaderPlugin enhances RevoGrid by adding interactive filter input elements to column headers,
 * allowing users to filter grid data directly from the header. It dynamically integrates with existing
 * column templates, providing a seamless UI for text-based filters and selection-based filters.
 *
 * **Key Features**:
 * - Adds input fields below each column header for applying text-based filters.
 * - Integrates with the `AdvanceFilterPlugin` to handle complex filtering operations, supporting multiple
 *   filter types like selection and slider filters.
 * - Automatically wraps existing header templates to include filter inputs, maintaining existing header
 *   content alongside new filter functionality.
 * - Utilizes debouncing to optimize input handling, minimizing performance impact from frequent user interactions.
 *
 * **Usage**:
 * - Include this plugin in RevoGrid's plugin array to activate header filtering capabilities.
 * - Customize column definitions to specify filter types using the `filter` property.
 *
 * Events:
 * - Listens for `BEFORE_HEADER_RENDER_EVENT` to modify header templates and append filter UI components.
 *
 * Usage Example:
 * ```typescript
 * import { AdvanceFilterPlugin, FilterHeaderPlugin } from '@revolist/revogrid-pro'
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [AdvanceFilterPlugin, FilterHeaderPlugin];
 *
 * grid.columns = [
 *   {
 *     prop: 'name',
 *     name: 'Name',
 *     filter: ['input'],
 *   },
 * ];
 * ```
 *
 * By integrating this plugin, RevoGrid provides an enhanced user experience with improved data filtering
 * capabilities directly accessible from the grid interface.
 */
export declare class FilterHeaderPlugin extends CorePlugin {
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    /**
     * Creates filter input and button UI using the h function.
     */
    private createFilterUI;
    /**
     * Handles input event for the filter with debounce.
     */
    private handleFilterInput;
    /**
     * Checks if a column has a selection filter applied.
     */
    private isSelectionFilter;
    /**
     * Retrieves selected filter values for a column.
     */
    private getSelectedFilterValues;
    /**
     * Checks if input is enabled for a column based on LogicFunction's 'extra' field.
     */
    private isInputEnabled;
    /**
     * Debounces user input to avoid frequent redraws.
     */
    private debounceInput;
}

export declare const filterOperators: DateFilterOperator[];

export declare const FLASH_CELL_EVENT = "flashcell";

export declare const FOCUS_APPLY_EVENT = "applyfocus";

export declare const FOCUS_BEFORE_RENDER_EVENT = "beforefocusrender";

export declare const FOCUS_INIT_EVENT = "beforecellfocusinit";

/**
 * The `FormulaPlugin` is a RevoGrid plugin that enables spreadsheet-like formula calculations
 * within grid cells. Leveraging the "formulajs" library, this plugin allows users to input and
 * compute formulas similar to those in Excel, such as "=SUM(A1:B2)".
 *
 * **Key Features**:
 * - **Formula Evaluation**: Listens to the `beforecellrender` event to identify and calculate
 *   cell values that are formulas. The computed result replaces the formula as the cell's display value.
 * - **Recursive Formula Support**: Handles nested formulas by evaluating inner formulas first,
 *   ensuring accurate calculations even when formulas reference other formulas.
 * - **Error Handling**: Detects and prevents recursive loops in formulas, returning a `FORMULA_ERROR`
 *   when recursion is detected to avoid infinite loops.
 * - **Data Integration**: Utilizes grid data sources and column information to accurately resolve
 *   cell references within formulas.
 *
 * **Usage**:
 * - Integrate `FormulaPlugin` in the RevoGrid to enable formula parsing and computation. This is
 *   done by adding the plugin to the grid's plugin list, allowing it to automatically handle formula
 *   cells during rendering.
 *
 * ### Example
 * ```typescript
 * import { FormulaPlugin } from '@revolist/revogrid-pro';
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [FormulaPlugin];
 * ```
 *
 * This plugin is essential for users who require dynamic data computations directly within their
 * data grid, providing a powerful tool for real-time data analysis and presentation.
 */
export declare class FormulaPlugin extends CorePlugin {
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
}

/**
 * Gets and parses a column attribute value from an element
 * @param element - The element to get the attribute from
 * @param attrName - The attribute name to get (supports both kebab-case and camelCase)
 * @returns Array of parsed values
 *
 * @example
 * ```typescript
 * // Get and parse hide-columns attribute
 * getColumnAttribute(element, 'hide-columns') // returns ["1", "2", "3"]
 *
 * // Get and parse any column attribute
 * getColumnAttribute(element, 'column-type') // returns ["text", "number"]
 * ```
 */
export declare function getColumnAttribute(element: Element, attrName: string): string[];

export declare function getExtraByOperator(operator: DateFilterOperator): ExtraField | undefined;

/**
 * Extracts grouping data from the store for a specific row
 *
 * @param store - The data store
 * @param itemIndex - The index of the current item
 * @param currentDepth - The current depth of the grouping
 * @param columnProp - The column property to aggregate
 * @param aggregator - The aggregation function to apply
 * @returns An object containing the count, values, and aggregation result
 */
export declare function getGroupingData({ store, itemIndex, currentDepth, columnProp, aggregator, }: {
    store: Observable<any>;
    itemIndex: number;
    currentDepth: number;
    columnProp: ColumnProp;
    aggregator?: (values: any[]) => any;
}): GroupingData;

export declare function getScrollbarWidth(doc: Document): number;

export declare function getStartOfLastMonth(): Date;

export declare function getStartOfThisMonth(): Date;

export declare function getStartOfThisQuarter(): Date;

export declare function getStartOfThisYear(): Date;

export declare function getStartOfToday(): Date;

export declare function getStartOfYesterday(): Date;

export declare function getStore(type: DimensionRows, sources: RowDataSources): {
    items: number[];
    source: DataType[];
};

export declare const GRID_INITED_EVENTS = "created";

/**
 * The `groupingAggregation` function is a template for creating custom aggregation functions
 * that can be used for grouping in a RevoGrid.
 *
 * This function takes a template object with an optional `aggregations` property, which is a
 * key-value pair where the key is the column property name and the value is an aggregation function.
 * The aggregation functions receive an array of values and return a single aggregated result.
 *
 * ### Example
 * ```typescript
 * const aggregations = {
 *   'name': (values: string[]) => values.join(', ')
 * }
 *
 * const template: GroupLabelTemplateFunc = (h, props) => {
 *   return groupingAggregation(h, props, aggregations);
 * }
 *
 * const grid = document.createElement('revo-grid');
 * grid.columns = [
 *   { prop: 'name', name: 'Name', template: template }
 * ]
 * ```
 */
export declare const groupingAggregation: GroupLabelTemplateFunc;

/**
 * The `GroupingAggregationTemplate` type defines the structure of aggregation functions
 * that can be used for grouping in a RevoGrid.
 */
export declare type GroupingAggregationTemplate = {
    aggregations?: {
        [key: string]: (values: any[]) => any;
    };
};

/**
 * The `GroupingData` type defines the structure of data returned by the getGroupingData function
 */
export declare type GroupingData = {
    count: number;
    values: DataType[];
    aggregationValue: any;
};

export declare const heatmapRenderer: ColumnRegular['cellTemplate'];

/**
 * The `HiddenColumnsConfig` type
 * specifies which columns should be hidden in the grid.
 *
 * **Usage**:
 * - Import the `HiddenColumnsConfig` type to define hidden columns in RevoGrid components.
 * - Assign the desired hidden columns configuration to the grid's `additionalData.hiddenColumns`
 *   property to control which columns are hidden.
 *
 * @example:
 * ```typescript
 * import { ColumnHidePlugin } from '@revolist/revogrid-pro';
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [ColumnHidePlugin];
 *
 * grid.additionalData = {
 *   hiddenColumns: [1, 2, 3], // Hide columns with indices 1, 2, and 3
 * };
 * ```
 *
 * This configuration type allows developers to programmatically control which columns
 * are hidden in the grid, enhancing the flexibility of the grid's display options.
 */
export declare type HiddenColumnsConfig = ColumnProp[];

/**
 * The `HistoryPlugin` for RevoGrid provides undo and redo functionalities, allowing users to
 * navigate through their editing history within the grid. This plugin is essential for enhancing
 * user experience by offering flexibility to revert or reapply changes made during data manipulation.
 *
 * **Key Features**:
 * - **Undo/Redo Stacks**: Maintains separate stacks for undo and redo operations, with a configurable
 *   (currently fixed at 200) maximum stack size to manage memory usage efficiently.
 * - **Event Handling**: Listens to `ON_EDIT_EVENT` to track changes and updates the undo stack
 *   accordingly. It also captures `Ctrl+Z` and `Ctrl+Y` (or `Cmd` on macOS) keystrokes via the
 *   `BEFORE_KEYDOWN_EVENT` to trigger undo and redo actions.
 * - **Event Emission**: Utilizes `BEFORE_UNDO_EVENT` and `BEFORE_REDO_EVENT` to allow pre-processing
 *   or cancellation of undo/redo actions. Emits `FLASH_CELL_EVENT` to visually highlight cells affected
 *   by these actions.
 * - **Disabling and Clearing**: Provides methods to disable the plugin (preventing changes from being
 *   added to stacks) and to clear both stacks, resetting the history.
 *
 * **Usage**:
 * - Integrate the `HistoryPlugin` within the RevoGrid to enable robust undo/redo capabilities.
 *   This involves adding the plugin to the grid's plugin list, allowing automatic management of
 *   editing actions.
 *
 * ### Example
 * ```typescript
 * import { HistoryPlugin } from '@revolist/revogrid-pro';
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [HistoryPlugin];
 * ```
 *
 * This plugin is ideal for applications requiring reliable data editing workflows, providing users
 * with the ability to correct mistakes or revisit previous states seamlessly.
 */
export declare class HistoryPlugin extends CorePlugin {
    private undoStack;
    private redoStack;
    private maxStackSize;
    private disabled;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    clear(): void;
    disable(disable?: boolean): void;
    undo(): void;
    redo(): void;
}

declare interface HyperFunc_2<T> {
    (...tag: any[]): T;
}

export declare const ignoreCellEvents: {
    onMouseDown: (event: MouseEvent) => void;
    onClick: (event: MouseEvent) => void;
    onDblClick: (event: MouseEvent) => void;
};

export declare interface InfinityScrollConfig {
    /**
     * Number of items to load per chunk
     */
    chunkSize: number;
    /**
     * Number of rows to keep in buffer before and after visible area
     */
    bufferSize: number;
    /**
     * When to start loading more data (0-1)
     * ### Example 0.75 means start loading when 75% of the current chunk is visible
     */
    preloadThreshold: number;
    /**
     * Total number of items available (if known)
     * Optional - set to undefined for unknown total
     */
    total?: number;
    /**
     * Function to load data from server
     * @param skip - Number of items to skip
     * @param limit - Number of items to load
     * @returns Promise with loaded data
     */
    loadData: (skip: number, limit: number, order?: {
        [key: ColumnProp]: 'asc' | 'desc';
    }, filter?: MultiFilterItem[]) => Promise<any[]>;
}

/**
 * The InfinityScrollPlugin enables dynamic data loading as users scroll through the RevoGrid.
 * It efficiently manages data chunks, loading new data when needed and cleaning up unused data
 * to optimize memory usage.
 *
 * **Key Features**:
 * - Dynamic data loading based on scroll position with buffer zones
 * - Pre-loads data ahead of scroll direction
 * - Efficient memory management by cleaning up off-screen data
 * - Configurable chunk size and buffer sizes
 * - Support for both known and unknown total data sizes
 * - Visual loading state for unloaded rows
 *
 * Usage Example:
 * ```typescript
 * import { InfinityScrollPlugin } from './infinity-scroll';
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [InfinityScrollPlugin];
 *
 * grid.additionalData = {
 *   infinityScroll: {
 *     chunkSize: 50,
 *     bufferSize: 100, // How many rows to keep in buffer
 *     preloadThreshold: 0.75, // When to start loading more data (0-1)
 *     total: 1000, // optional
 *     loadData: async (skip, limit, order, filter) => {
 *       // Fetch data from your server
 *       const response = await fetch(`/api/data?skip=${skip}&limit=${limit}&order=${JSON.stringify(order)}`);
 *       return response.json();
 *     }
 *   }
 * };
 * ```
 */
export declare class InfinityScrollPlugin extends CorePlugin {
    private config;
    private loadedChunks;
    private loadingChunks;
    private defaultChunkSize;
    private currentOrder?;
    private currentFilter?;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    private calculateChunkSize;
    private initializeSource;
    private getConfig;
    private loadChunk;
    private cleanupChunksOutsideViewport;
    destroy(): void;
}

/**
 * The `InfoPanelPlugin` enhances RevoGrid by providing a dynamic and customizable
 * information panel that displays detailed data about the selected row. The panel
 * appears when a row is clicked and can be populated with specific fields, making it
 * highly useful for displaying additional information without cluttering the main grid.
 *
 *  **Features**:
 * - Listens for row selection events (`afterfocus`) and dynamically displays detailed
 *   information based on the selected row.
 * - Supports customization of displayed fields through the `infoPanel.keys` property
 *   in RevoGrid’s `additionalData`.
 * - Emits a `beforeinfopanelshow` event, allowing users to intercept and prevent
 *   the panel from being shown if necessary.
 * - Supports both plain text and HTML content rendering within the panel.
 * - Smoothly toggles visibility of the panel using the `hidden` attribute.
 *
 * **Usage**:
 * - Import `InfoPanelPlugin` and add it to the RevoGrid's plugin list.
 * - Optionally, define which keys should be displayed in the info panel by setting
 *   `additionalData.infoPanel.keys`.
 *
 * ### Example
 * ```typescript
 * import { InfoPanelPlugin } from '@revolist/revogrid-pro'
 *
 * const grid = document.createElement('revo-grid');
 * grid.additionalData = {
 *   infoPanel: { keys: ['name', 'age', 'email'] } // Specify keys to display
 * };
 * grid.plugins = [InfoPanelPlugin]; // Add info panel functionality to the grid
 * ```
 *
 * This plugin is ideal for enhancing user interaction by providing a non-intrusive
 * way to display detailed information about grid entries, commonly used in data
 * visualization, management dashboards, and administrative tools.
 */
export declare class InfoPanelPlugin extends CorePlugin {
    private panel?;
    private isVisible;
    private selectedRowData;
    private wrapper?;
    private displayedKeys;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    private beforeShowPanel;
    private createInfoPanel;
    private showPanel;
}

export declare function invalidCellProps(invalid?: boolean): {
    invalid: boolean;
};

export declare function isEditorCtrConstructible(editor: any): editor is EditorCtrConstructible;

export declare function isMainContent(type: DimensionRows): type is "rgRow";

export declare function isValidISODate(value: string): boolean;

/**
 * The `linkRenderer` is a custom cell editor for RevoGrid that provides a link input
 * to edit URL values directly within the grid cells.
 *
 * **Features**:
 * - Renders a link element for cells, allowing users to click and navigate to URLs
 * - Supports different link configurations (target, styling, etc.)
 * - Extracts protocols from displayed text while preserving the full URL for navigation
 * - Automatically dispatches a `celledit` event upon change, updating the grid's data model
 *
 * **Usage**:
 * - Import `linkRenderer` and assign it to the `cellTemplate` property of a column in the RevoGrid.
 * - Configure link behavior using the `linkConfig` property.
 * - Ideal for columns that contain URLs or links to external resources.
 *
 * ### Example
 * ```typescript
 * import { linkRenderer } from '@revolist/revogrid-pro'
 *
 * const grid = document.createElement('revo-grid');
 * grid.columns = [
 *   {
 *     prop: 'website',
 *     name: 'Website',
 *     cellTemplate: linkRenderer,
 *     link: {
 *       target: '_blank',
 *       showProtocol: false,
 *       className: 'custom-link',
 *     },
 *   },
 * ];
 * ```
 *
 * **Event Handling**:
 * - The `linkRenderer` dispatches a `celledit` event whenever the link value changes.
 * - The event detail contains:
 *   - `rgCol`: The column index of the edited cell.
 *   - `rgRow`: The row index of the edited cell.
 *   - `type`: The type of the cell.
 *   - `prop`: The property of the cell being edited.
 *   - `val`: The new URL value.
 *   - `preventFocus`: A flag to control grid focus behavior (default: `false`).
 *
 * This editor is particularly useful in scenarios where users need to view and interact with
 * URLs directly from the grid, providing a quick and user-friendly interface for link data.
 */
export declare const linkRenderer: ColumnRegular['cellTemplate'];

export declare const LOADER_EVENT = "busy";

/**
 * The `LoaderPlugin` is a RevoGrid plugin designed to manage and display a loading indicator within
 * the grid. This plugin provides a visual cue to users that a background operation is in progress,
 * enhancing user experience by signaling when the grid is busy with data processing tasks.
 *
 * Functionality:
 * - **Loader Element Integration**: Integrates a loader element into the grid's virtual DOM by
 *   registering a VNode containing a "loader" class, which can be styled via CSS.
 * - **Event-driven State Management**: Listens for `LOADER_EVENT` to toggle the loader's visibility
 *   based on the operation's state. This is controlled by adding or removing a "busy" class to the
 *   loader element.
 * - **Public Method**: Provides a `busy` method to programmatically trigger the loading state by
 *   emitting the `LOADER_EVENT`. This allows external components or processes to indicate grid activity.
 *
 * **Usage**:
 * - To utilize the `LoaderPlugin`, include it in the grid's plugin list and invoke the `busy` method
 *   with a boolean parameter to show or hide the loader based on current operations.
 *
 * ### Example
 * ```typescript
 * import { LoaderPlugin } from '@revolist/revogrid-pro';
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [LoaderPlugin];
 *
 * // Trigger loader
 * const loaderPlugin = grid.plugins.find(plugin => plugin instanceof LoaderPlugin);
 * loaderPlugin.busy(true); // Show loader
 * loaderPlugin.busy(false); // Hide loader
 * ```
 *
 * This plugin is ideal for developers looking to provide immediate feedback to users during
 * data-intensive operations, ensuring a responsive and intuitive grid interface.
 */
export declare class LoaderPlugin extends CorePlugin {
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    busy(isBusy: boolean): void;
}

declare type LocalSubscription = {
    target: Element | Document;
    callback(...params: any[]): void;
};

declare type MakeRequired<T, K extends keyof T> = Required<Pick<T, K>> & Partial<Omit<T, K>>;

/**
 * The `MasterRowPlugin` is a RevoGrid plugin designed to manage and render master-detail rows within the grid.
 * It provides functionalities to expand and collapse rows, offering a detailed view for selected rows, enhancing
 * data presentation and interaction in scenarios where hierarchical data representation is required.
 *
 * **Key Features**:
 * - **Row Expansion/Collapse**: Allows users to expand or collapse master rows to reveal or hide additional
 *   details, facilitating a hierarchical view of the data.
 * - **Event-Driven Interactions**: Subscribes to and dispatches a range of events, including `ROW_MASTER`,
 *   `AFTER_GRID_RENDER_EVENT`, `BEFORE_ROW_RENDER_EVENT`, and more, to maintain and update row states and visuals.
 * - **Customizable Templates**: Supports configurable templates for rendering detailed row content using
 *   the `RowMasterConfig`, providing flexibility in how detail views are presented.
 * - **Efficient DOM Management**: Handles overlay nodes for expanded rows, ensuring that DOM manipulation
 *   is optimized for performance.
 * - **Viewport Synchronization**: Continuously verifies and updates the expansion state of rows in response
 *   to viewport changes, ensuring consistency with user interactions and data state.
 *
 * **Usage**:
 * - Integrate this plugin into a RevoGrid instance to enable master-detail row functionalities. Add the plugin
 *   to the grid's plugins array to activate its features.
 *
 * ### Example
 * ```typescript
 * import { MasterRowPlugin } from '@revolist/revogrid-pro';
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [MasterRowPlugin];
 * ```
 *
 * This plugin is ideal for applications that require complex data presentation with nested details, providing
 * a robust solution for managing detailed data views efficiently within a grid structure.
 */
export declare class MasterRowPlugin extends CorePlugin {
    providers: PluginProviders;
    private unsubscribe;
    private readonly config;
    private expandedMasters;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    /**
     * Overrides focus range based on hidden and merged values
     */
    private focusRender;
    isMasterRowExpanded(itemVIndexes: number[], rowType: DimensionRows, virtualRowIndex: number): string | null;
    isExpandedRow(itemVIndexes: number[], rowType: DimensionRows, virtualRowIndex: number): string | null;
    /**
     * This method checks if a row is expanded by verifying two conditions:
     * 1. The row's ID (nodeId) is present in the expandedMasters collection.
     * 2. The physical row index (physRowIndex) is the same as the neighoring physical row index (sibPhysRowIndex).
     */
    getExpandedId(rowType: DimensionRows, physRowIndex: number, sibPhysRowIndex: number): string | null;
    clearDimensions(type: DimensionRows, rowVIndexes: number[]): void;
    collapseRow(type: DimensionRows, rowVIndexes: number[]): void;
    expandRow(type: DimensionRows, virtRowIndex: number): void;
    destroy(): void;
}

export declare type MergeCache = Partial<Record<MultiDimensionType, {
    [key: number]: MergeRowCache;
}>>;

/**
 * Merges multiple cell properties functions into a single function
 * @param properties - Array of cell property functions to merge
 * @returns A single function that combines all cell properties
 */
export declare function mergeCellProperties(...properties: (PropertiesFunc | undefined)[]): PropertiesFunc;

/**
 * Represents a range of cells that should be merged.
 * The coordinates are relative to the top-left cell of the range.
 */
export declare type MergeData = {
    /**
     * The row index of the top-left cell of the range.
     */
    row: number;
    /**
     * The column index of the top-left cell of the range.
     */
    column: number;
    /**
     * The number of rows to span. If not specified, the range will span only one row.
     */
    rowSpan?: number;
    /**
     * The type of the row dimension. If not specified, it will default to 'rgRow'.
     */
    rowType?: DimensionRows;
    /**
     * The number of columns to span. If not specified, the range will span only one column.
     */
    colSpan?: number;
    /**
     * The type of the column dimension. If not specified, it will default to 'rgCol'.
     */
    colType?: DimensionCols;
};

export declare type MergeRowCache = Partial<Record<MultiDimensionType, CellCache>>;

export declare const MOVE_EVENT = "rowmousemove";

/**
 * The MultiColumn type is a custom column type for RevoGrid that can apply different renderers
 * and editors based on the value type.
 * editors as well.
 *
 * **Key Features**:
 * - **Multiple Renderers**: Applies different renderers based on conditions
 * - **Multiple Editors**: Applies different editors based on conditions
 * - **Default Fallbacks**: Uses default renderer and editor if no condition matches
 * - **Cell Properties**: Applies consistent styling for cells
 * - **Array Support**: Handles arrays of values using the array renderer
 *
 * **Usage**:
 * - Import `MultiColumn` and use it to define different renderers and editors for different value types
 * - Configure the column with options like renderers and editors
 * - Use the `arrayOptions` to customize how arrays are rendered
 *
 * ### Example
 * ```typescript
 * import { MultiColumn } from '@revolist/revogrid-pro';
 * import { editorSlider, editorCheckbox } from '@revolist/revogrid-pro';
 * import NumberColumnType from '@revolist/revogrid-column-numeral';
 * import DateColumnType from '@revolist/revogrid-column-date';
 *
 * const numberType = new NumberColumnType('0.00');
 * const dateType = new DateColumnType();
 *
 * const grid = document.createElement('revo-grid');
 * grid.columns = [
 *   {
 *     prop: 'data',
 *     name: 'Mixed Data',
 *     columnType: 'multi',
 *     multiColumn: {
 *       defaultRenderer: numberType.cellTemplate,
 *       defaultEditor: numberType.editor,
 *       renderers: [
 *         {
 *           condition: (value) => value instanceof Date ||
 *             (typeof value === 'string' && !isNaN(Date.parse(value))),
 *           renderer: dateType.cellTemplate,
 *           editor: dateType.editor,
 *         },
 *         {
 *           condition: (value) => typeof value === 'number' && value >= 0 && value <= 100,
 *           renderer: editorSlider,
 *           editor: editorSlider,
 *         },
 *         {
 *           condition: (value) => typeof value === 'boolean',
 *           renderer: editorCheckbox,
 *           editor: editorCheckbox,
 *         },
 *       ],
 *       // Array renderer options
 *       arrayOptions: {
 *         separator: ' | ',
 *         wrapper: 'div',
 *         wrapperClass: 'array-container',
 *       },
 *     },
 *   },
 * ];
 * ```
 *
 * ### Example with Array Values
 * ```typescript
 * import { MultiColumn } from '@revolist/revogrid-pro';
 * import { linkRenderer } from '@revolist/revogrid-pro';
 * import NumberColumnType from '@revolist/revogrid-column-numeral';
 *
 * const numberType = new NumberColumnType('0.00');
 *
 * const grid = document.createElement('revo-grid');
 * grid.columns = [
 *   {
 *     prop: 'data',
 *     name: 'Mixed Data',
 *     columnType: 'multi',
 *     multiColumn: {
 *       defaultRenderer: numberType.cellTemplate,
 *       defaultEditor: numberType.editor,
 *       renderers: [
 *         {
 *           // Use linkRenderer for URLs
 *           condition: (value) => typeof value === 'string' &&
 *             (value.startsWith('http://') || value.startsWith('https://')),
 *           renderer: linkRenderer,
 *         },
 *         {
 *           // Use numberType for numbers
 *           condition: (value) => typeof value === 'number',
 *           renderer: numberType.cellTemplate,
 *           editor: numberType.editor,
 *         },
 *       ],
 *       // Array renderer options
 *       arrayOptions: {
 *         separator: ', ',
 *         wrapper: 'div',
 *         wrapperClass: 'array-container',
 *       },
 *     },
 *   },
 * ];
 *
 * // Example data with arrays
 * grid.source = [
 *   { data: [1, 2, 3] }, // Will be rendered as numbers
 *   { data: ['https://example.com', 'https://example.org'] }, // Will be rendered as links
 *   { data: [1, 'https://example.com', true] }, // Mixed types in array
 * ];
 * ```
 */
export declare const MultiColumn: ColumnType;

/**
 * The `multiRenderer` is a custom cell renderer for RevoGrid that can apply different renderers
 * based on the value type. It's similar to `arrayRenderer` but allows for more complex rendering logic.
 *
 * **Features**:
 * - Detects if the value is an array or a single value
 * - For arrays, applies a different renderer for each item based on a condition
 * - For single values, applies a default renderer
 * - Supports custom separator between array items
 * - Supports custom wrapper for array items
 *
 * **Usage**:
 * - Import `multiRenderer` and use it to define different renderers for different value types
 * - Configure the renderer with options like separator and wrapper
 *
 * ### Example
 * ```typescript
 * import { multiRenderer } from '@revolist/revogrid-pro';
 * import { linkRenderer } from '@revolist/revogrid-pro';
 * import { progressLineRenderer } from '@revolist/revogrid-pro';
 *
 * const grid = document.createElement('revo-grid');
 * grid.columns = [
 *   {
 *     prop: 'data',
 *     name: 'Data',
 *     cellTemplate: multiRenderer({
 *       default: progressLineRenderer,
 *       renderers: [
 *         {
 *           condition: (value) => typeof value === 'string' && value.startsWith('http'),
 *           renderer: linkRenderer,
 *         },
 *       ],
 *     }),
 *   },
 * ];
 * ```
 */
export declare function multiRenderer(config: {
    /**
     * Default renderer to use if no condition matches
     */
    default: ColumnRegular['cellTemplate'];
    /**
     * Array of renderers with conditions
     */
    renderers: Array<{
        /**
         * Condition function that returns true if the renderer should be used
         */
        condition: (value: any) => boolean;
        /**
         * Renderer to use if the condition is true
         */
        renderer: ColumnRegular['cellTemplate'];
    }>;
    /**
     * Separator between array items
     * @default ', '
     */
    separator?: string;
    /**
     * Wrapper element for array items
     * @default 'div'
     */
    wrapper?: string;
    /**
     * CSS class for the wrapper element
     */
    wrapperClass?: string;
    /**
     * CSS style for the wrapper element
     */
    wrapperStyle?: Record<string, string>;
}): ColumnRegular['cellTemplate'];

export declare const ON_EDIT_EVENT = "gridedit";

export declare const ORDER_CHANGED_EVENT = "rowdropped";

export declare const OVERLAY_CLEAR_NODES = "overlayclearnode";

export declare const OVERLAY_NODE = "overlaynode";

/**
 * `OverlayPlugin`, a plugin for RevoGrid that manages overlay content
 * within the grid environment. It provides mechanisms to render, position, and update overlay elements
 * dynamically based on grid events and interactions.
 *
 * **Key Features**:
 * - **Dynamic Overlay Management**: Utilizes virtual nodes (`VNode`) to manage overlay content, allowing
 *   for flexible rendering and updating of overlay elements as grid data or layout changes.
 * - **Position and Size Calculations**: Calculates and sets the position and height of overlay elements
 *   relative to grid scroll and dimension changes, ensuring overlays are correctly aligned with grid content.
 * - **Event Handling**: Listens for and responds to various grid events such as scroll, node updates,
 *   and dimension changes, refreshing overlay content and adjusting positions as needed.
 * - **Debounced Refreshing**: Integrates debouncing to optimize performance by reducing unnecessary
 *   updates during rapid event sequences.
 *
 * **Usage**:
 * - Integrate this plugin into a RevoGrid instance to enable advanced overlay management, enhancing
 *   the ability to display additional, context-sensitive information or controls over grid content.
 *
 * ### Example
 * ```typescript
 * import { OverlayPlugin } from '@revolist/revogrid-pro'
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [OverlayPlugin];
 * ```
 *
 * The `OverlayPlugin` is essential for applications that require dynamic and context-aware overlay
 * content within RevoGrid, providing a robust solution for managing additional grid features or
 * information layers.
 */
export declare class OverlayPlugin extends CorePlugin {
    private unsubscribe;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    destroy(): void;
}

export declare type OverlayRegisterEvent = {
    nodeId: string;
    vnode: ReturnType<typeof h_2>;
};

export declare type OverlayUnRegisterEvent = {
    nodeIds: string[];
};

export declare const overrideEvents: ({ onMouseUp, }: {
    onMouseUp: (e: MouseEvent) => void;
}) => Record<string, (e: any) => void>;

export declare const PAGE_CHANGE_EVENT = "pagechange";

/**
 * Event triggered when the page is changed
 */
export declare type PageChangeEvent = {
    /**
     * Number of items to be skipped
     */
    skip: number;
};

/**
 * This file defines TypeScript types used for configuring pagination in RevoGrid.
 * These types encapsulate both the core pagination logic and user interface
 * settings for the PaginationPanel.
 *
 * Key Types:
 * - `PaginationConfig`: Specifies core pagination properties including the number
 *   of items per page (`itemsPerPage`), the initial page (`initialPage`), and the
 *   total number of items (`total`).
 *
 * - `PaginationPanelConfig`: Configures the appearance and behavior of the pagination
 *   UI, including the number of numeric buttons (`buttonCount`), page information
 *   display (`info` and `totalInfo`), page size options (`pageSizes`), and button
 *   navigation (`navigation`). It also allows customization of UI text through
 *   `PaginationLocales`.
 *
 * - `PaginationFullConfig`: Combines `PaginationConfig` and `PaginationPanelConfig`
 *   for comprehensive pagination setup.
 *
 * - `PageChangeEvent`: Represents the event structure when a page is changed, containing
 *   the `skip` property indicating the number of items to skip.
 *
 * **Usage**:
 * These types are used to configure pagination behavior and appearance within the
 * RevoGrid, enabling developers to customize how data is paginated and presented in
 * the grid interface.
 *
 * ### Example
 * ```typescript
 * const paginationConfig: PaginationFullConfig = {
 *   itemsPerPage: 10,
 *   initialPage: 1,
 *   total: 100,
 *   buttonCount: 5,
 *   navigation: true,
 *   locales: {
 *     previous: 'Prev',
 *     next: 'Next',
 *   },
 * };
 * ```
 *
 * By utilizing these types, developers can create a tailored pagination experience,
 * optimizing data navigation and presentation in RevoGrid applications.
 */
/**
 * Pagination configuration
 */
export declare type PaginationConfig = {
    /**
     * Number of items per page
     */
    itemsPerPage: number;
    /**
     * Initial page number (1 based)
     */
    initialPage: number;
    /**
     * Total number of items
     */
    total: number;
};

export declare type PaginationFullConfig = PaginationConfig & PaginationPanelConfig;

export declare type PaginationLocales = {
    previous?: string;
    next?: string;
    first?: string;
    last?: string;
    page?: string;
    of?: string;
    items?: string;
};

export declare type PaginationPanelConfig = {
    /**
     * Maximum numeric buttons count before the buttons are collapsed.
     * @default undefined
     */
    buttonCount?: number;
    /**
     * 	Toggles the information about the current page.
     */
    info?: boolean;
    /**
     * 	Toggles the information about the total number of records.
     */
    totalInfo?: boolean;
    /** Shows a menu for selecting the page size. */
    pageSizes?: boolean | number[];
    /**
     *  Pager position relative to the Grid data table.
     */
    position?: 'top' | 'bottom';
    /**
     * Toggles the navigation buttons.
     */
    navigation?: boolean;
    locales?: PaginationLocales;
};

/**
 * The PaginationPlugin introduces pagination functionality to the RevoGrid, allowing for efficient navigation
 * through large datasets by dividing data into manageable pages. This plugin provides a visual pagination panel
 * and emits events to notify the application of page changes, facilitating dynamic data loading and UI updates.
 *
 * **Key Features**:
 * - Integrates a `PaginationPanel` for user interaction, enabling page navigation through intuitive controls.
 * - Emits `PAGE_CHANGE_EVENT` upon page changes, providing a `skip` property indicating the number of pages to skip.
 * - Listens to `additionaldatachanged` events to update pagination settings automatically when user configurations change.
 * - Configurable through additional data properties such as `itemsPerPage`, `initialPage`, and `total` for tailored pagination behavior.
 *
 * **Usage**:
 * - Include the plugin in the RevoGrid's plugin array to activate pagination.
 * - Configure pagination through the grid's additionalData property, specifying `itemsPerPage`, `initialPage`, and `total`.
 *
 * Usage Example:
 * ```typescript
 * import { PaginationPlugin } from './pagination';
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [PaginationPlugin];
 *
 * grid.additionalData = {
 *   pagination: {
 *     itemsPerPage: 20,
 *     initialPage: 0,
 *     total: 100,
 *   },
 * };
 * ```
 *
 * By using this plugin, developers can efficiently manage large datasets within RevoGrid, enhancing user
 * experience through improved data navigation and interaction capabilities.
 */
export declare class PaginationPlugin extends CorePlugin {
    revogrid: HTMLRevoGridElement;
    providers: PluginProviders;
    /**
     * Instance of PaginationPanel
     */
    private panel;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    setConfig(config: Partial<PaginationConfig & PaginationPanelConfig> | undefined): void;
    /**
     * Initialize pagination config from user provided config
     */
    private getConfig;
}

/** The type of the panel */
export declare type PanelType = 'dimensions' | 'rows' | 'columns' | 'values';

/**
 * Utilities used in the RevoGrid project to assist in converting
 * various data types to a boolean value. This function is essential for data processing
 * tasks where boolean values may be represented in different formats.
 *
 *  **Features**:
 * - Accepts inputs of type boolean, number, or string, and attempts to convert them to
 *   a boolean value.
 * - For numbers, returns `true` if the value is `1`, otherwise `false`.
 * - For strings, it normalizes the input to lowercase and trims whitespace, returning
 *   `true` for common affirmative representations ('true', 'yes', '1') and `false` for
 *   negative representations ('false', 'no', '0').
 * - Returns `undefined` if the input cannot be reliably converted to a boolean, allowing
 *   for error handling or default value assignment in calling code.
 *
 * **Usage**:
 * - Call `parseBoolean` when you need a flexible utility to standardize various input
 *   representations into a boolean format, particularly useful in grid configuration
 *   or data validation scenarios.
 *
 * ### Example
 * ```typescript
 * const isEnabled = parseBoolean('yes'); // Returns true
 * const isDisabled = parseBoolean(0); // Returns false
 * ```
 */
export declare function parseBoolean(value: any): boolean | undefined;

/**
 * Parses a column attribute value from either a string or array format
 * @param value - The attribute value to parse (can be string or array)
 * @returns Array of parsed values
 *
 * @example
 * ```typescript
 * // String format
 * parseColumnAttribute("1,2,3") // returns ["1", "2", "3"]
 *
 * // Array format (from JSON)
 * parseColumnAttribute("[1,2,3]") // returns ["1", "2", "3"]
 *
 * // Array format (direct)
 * parseColumnAttribute([1,2,3]) // returns ["1", "2", "3"]
 * ```
 */
export declare function parseColumnAttribute(value: string | number[] | undefined): string[];

export declare const pieChartRenderer: (h: HyperFunc<VNode>, { value, column, }: {
    value?: PieData[] | number[];
    column?: Partial<ColumnDataSchemaModel>;
}) => VNode;

export declare interface PieData {
    value: number;
    color?: string;
    name?: string;
}

export declare const PIVOT_CFG_UPDATE_EVENT = "pivot-config-update";

export declare const PIVOT_CONFIG_EN: {
    rows: string;
    columns: string;
    values: string;
    dragHereRows: string;
    dragHereColumns: string;
    dragHereValues: string;
    remove: string;
};

export declare function pivotColumns({ rows, columns, values, dimensions, flatHeaders, }: Partial<PivotConfig>, source?: DataType[]): (ColumnRegular | ColumnGrouping<any>)[];

export declare interface PivotConfig {
    dimensions?: PivotConfigDimension[];
    rows: ColumnProp[];
    columns?: ColumnProp[];
    values: PivotConfigValue[];
    hasConfigurator?: boolean;
    mountTo?: HTMLElement;
    flatHeaders?: boolean;
    showColumns?: boolean;
    showRows?: boolean;
    showValues?: boolean;
    i18n?: typeof PIVOT_CONFIG_EN;
}

export declare interface PivotConfigDimension extends Partial<ColumnRegular> {
    prop: ColumnProp;
    /**
     * Custom aggregators or use common aggregators
     */
    aggregators?: {
        [name: string]: ((values: any[]) => any);
    };
    /**
     * Aggregator value for the column
     * set automatically
     */
    readonly aggregator?: string;
    /**
     * The type of the dimension: rows, values
     * set automatically
     */
    readonly dimension?: PanelType;
}

export declare interface PivotConfigurationActions {
    onUpdateColumns?: (cols: ColumnProp[]) => void;
    onUpdateRows?: (rows: ColumnProp[]) => void;
    onUpdateValues?: (values: PivotConfigValue[]) => void;
}

declare interface PivotConfigurationComponentProps extends PivotConfigurationActions, Pick<Partial<PivotConfig>, 'dimensions' | 'columns' | 'rows' | 'values' | 'i18n' | 'showColumns' | 'showRows' | 'showValues'> {
}

export declare const PivotConfigurator: ({ dimensions, columns, rows, values, i18n, showColumns, showRows, showValues, onUpdateColumns, onUpdateRows, onUpdateValues, }?: Partial<PivotConfigurationComponentProps>) => h.JSX.Element;

export declare interface PivotConfigValue {
    prop: ColumnProp;
    aggregator: string;
}

/**
 * The PivotPlugin is a RevoGrid plugin that enables dynamic creation and manipulation of pivot table structures
 * within the grid. It provides users with the ability to configure and apply pivot transformations on grid data
 * for enhanced reporting and analysis.
 *
 * **Key Features**:
 * - **Configurable Pivot Table** – Allows users to define row, column, and value fields dynamically.
 * - **Interactive Configurator** – Integrates a pivot configurator panel to modify pivot settings in real-time.
 * - **Drag-and-Drop Support** – Enables users to rearrange fields via the configurator for a flexible pivot experience.
 * - **Efficient Data Transformation** – Utilizes optimized data processing to group and aggregate large datasets.
 * - **Custom Aggregations** – Supports multiple aggregation functions, including `sum`, `count`, `avg`, `min`, and `max`.
 * - **Dynamic Theme Adaptation** – Adjusts automatically to the applied RevoGrid theme.
 * - **State Persistence** – Updates `additionalData.pivot` dynamically, ensuring persistent pivot configurations.
 *
 * **Usage**:
 * - Instantiate the PivotPlugin in a RevoGrid instance and define a pivot configuration.
 * - Use `applyPivot` to generate a pivoted grid based on selected row, column, and value fields.
 * - Modify the pivot structure using the interactive configurator.
 * - Call `clearPivot` to restore the original grid state.
 *
 * ### Example
 * ```typescript
 * import { PivotPlugin } from '@revolist/revogrid-pro';
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [PivotPlugin];
 *
 * grid.additionalData = {
 *   pivot: {
 *      dimensions: [{ prop: 'Age' }, { prop: 'City' }, { prop: 'Gender' }, { prop: 'Total Spend' }],
 *      rows: ['City', 'Age'],
 *      columns: ['Gender'],
 *      values: [
 *        { prop: 'Total Spend', aggregator: 'sum' },
 *      ],
 *      hasConfigurator: true,
 *    },
 * };
 * ```
 *
 * This plugin is essential for users who require advanced pivot table functionalities within RevoGrid, offering
 * comprehensive tools for data transformation and visualization.
 */
export declare class PivotPlugin extends CorePlugin {
    private pivotData;
    private pivotColumns;
    private pivotConfig;
    private pivotConfigElement;
    private pivotOriginalData;
    private pivotOriginalColumns;
    private currentTheme;
    private isApplyingPivot;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    private setTheme;
    private createConfiguratorElement;
    updateConfigurator(config?: PivotConfig): void;
    /**
     * Apply a pivot configuration to the grid.
     */
    applyPivot(config?: Partial<PivotConfig>): void;
    /**
     * Clear the pivot view and restore the original data.
     */
    clearPivot(): void;
    /**
     * Restore the original grid state.
     */
    private renderOriginalGrid;
}

export declare const POPUP_OPEN_EVENT = "popup-open";

/**
 * The `ProgressColumnType` class implements a custom column type for the RevoGrid, designed
 * to visually display numeric values as progress bars within grid cells. It extends the
 * functionality of the standard `ColumnType` by providing validation and rendering logic
 * specific to progress indicators.
 *
 *  **Features**:
 * - Validation: Ensures the value is a number between 0 and 100, representing a valid
 *   percentage for progress visualization.
 * - Custom cell rendering: Uses a `cellTemplate` function to render the progress bar,
 *   adapting the visual fill based on the cell value.
 *
 * How to use:
 * - Integrate `ProgressColumnType` into your grid's column configuration to enable
 *   progress bar visualization.
 * - Assign the `cellTemplate` of this class to the corresponding column definition to
 *   render the progress bars.
 *
 * ### Example
 * ```typescript
 * import { ProgressColumnType } from './progress-column-type';
 *
 * const grid = document.createElement('revo-grid');
 * grid.columns = [
 *   {
 *     prop: 'progress',
 *     name: 'Progress',
 *     cellTemplate: ProgressColumnType.prototype.cellTemplate, // Use progress bar template
 *   },
 * ];
 * ```
 *
 * This class enhances user experience by providing a clear visual representation of
 * progress data directly within the grid interface, making data interpretation more
 * intuitive and visually appealing.
 */
export declare class ProgressColumnType implements ColumnType {
    validate: (value: number) => boolean;
    cellTemplate: ColumnRegular['cellTemplate'];
}

/**
 * The `progressLineRenderer` is a custom cell renderer for RevoGrid that provides a visual
 * representation of progress as a horizontal line within grid cells. This renderer effectively
 * communicates the completion level of a numeric value relative to a defined range.
 *
 *  **Features**:
 * - Displays a progress line that visually indicates the percentage completion within specified
 *   minimum and maximum values.
 * - Shows a percentage label beside the progress bar, formatted to one decimal place for precision.
 * - Automatically normalizes values to ensure accurate representation within the defined range.
 * - Configurable through column properties such as `minValue` and `maxValue`.
 * - Supports a custom progress function to calculate progress based on row data.
 *
 * **Usage**:
 * - Import `progressLineRenderer` and use it as the `cellTemplate` in your RevoGrid's column configuration.
 * - Specify `minValue` and `maxValue` for each column to define the range for progress calculation.
 * - Optionally provide a `progress` function to calculate progress based on row data.
 *
 * ### Example
 * ```typescript
 * import { progressLineRenderer } from './charts/progress-line.renderer';
 *
 * const grid = document.createElement('revo-grid');
 * grid.columns = [
 *   {
 *     prop: 'score',
 *     name: 'Completion Rate',
 *     minValue: 0,
 *     maxValue: 100,
 *     cellTemplate: progressLineRenderer,
 *     // Optional: Custom progress calculation
 *     progress: (config) => {
 *       // Calculate progress based on multiple fields
 *       const completed = config.model.completedTasks || 0;
 *       const total = config.model.totalTasks || 1;
 *       return (completed / total) * 100;
 *     }
 *   },
 * ];
 * ```
 *
 * This renderer is suitable for applications where tracking progression or percentage completion
 * is necessary, such as performance dashboards, goal tracking systems, or any scenario where a
 * visual progress indicator is beneficial.
 */
export declare const progressLineRenderer: Required<ColumnRegular>['cellTemplate'];

export declare const progressLineWithValueRenderer: Required<ColumnRegular>['cellTemplate'];

/** Basic File Properties */
export declare interface Properties {
    /** Summary tab "Title" */
    Title?: string;
    /** Summary tab "Subject" */
    Subject?: string;
    /** Summary tab "Author" */
    Author?: string;
    /** Summary tab "Manager" */
    Manager?: string;
    /** Summary tab "Company" */
    Company?: string;
    /** Summary tab "Category" */
    Category?: string;
    /** Summary tab "Keywords" */
    Keywords?: string;
    /** Summary tab "Comments" */
    Comments?: string;
    /** Statistics tab "Last saved by" */
    LastAuthor?: string;
    /** Statistics tab "Created" */
    CreatedDate?: Date;
}

export declare const RANGE_AUTOFILL_EVENT = "beforeautofill";

/**
 * Props for the RangeSlider component
 */
export declare interface RangeSliderProps {
    /** Minimum value for the range */
    min: number;
    /** Maximum value for the range */
    max: number;
    /** Current value for the start of the range */
    fromValue: number;
    /** Current value for the end of the range */
    toValue: number;
    /** Whether to show tooltips on hover */
    showTooltips?: boolean;
    /** Whether to show the current range values above the slider */
    showRangeDisplay?: boolean;
    /** Callback fired when the range values change */
    onRangeChange: (range: SliderRange) => void;
    /** Optional function to format the displayed values */
    formatValue?: (value: number) => string;
}

/**
 * The RatingColumnType class defines a custom column type for the RevoGrid, specifically
 * designed to handle and render rating values as a series of star icons. This custom type
 * includes a validation method to ensure rating values are within an acceptable range (0 to 5)
 * and a `cellTemplate` method for rendering the visual representation of these ratings.
 *
 * **Key Features**:
 * - Validation: Ensures rating values are between 0 and 5, inclusive.
 * - Custom cell rendering: Displays rating as stars, using a `cellTemplate` function to map
 *   numeric values to visual elements.
 *
 * **Usage**:
 * - Implement the RatingColumnType in the grid's column configuration to apply this rating
 *   visualization logic.
 * - Utilize the `cellTemplate` function provided by this class within your column definitions
 *   to render ratings.
 *
 * ### Example
 * ```typescript
 * import { RatingColumnType } from './rating-column-type';
 *
 * const grid = document.createElement('revo-grid');
 * grid.columns = [
 *   {
 *     prop: 'rating',
 *     name: 'User Rating',
 *     cellTemplate: RatingColumnType.prototype.cellTemplate, // Apply custom rating cell template
 *   },
 * ];
 * ```
 *
 * This class enhances the grid's capability to visually represent rating data, facilitating
 * a more intuitive user experience for reviewing rating values.
 */
export declare class RatingColumnType implements ColumnType {
    validate: (value: number) => boolean;
    cellTemplate: ColumnRegular['cellTemplate'];
}

export declare const ratingStarRenderer: Required<ColumnRegular>['cellTemplate'];

declare type Reject = () => void;

export declare function removeMultipleAndShift<T1>(items: {
    [virtialIndex: number]: T1;
}, toRemove: Set<number>): {
    [virtialIndex: number]: T1;
};

export declare const RESIZE_EVENT = "resizeviewport";

declare type Resolve = (cols: Partial<AutoSizeColumns>) => void;

export declare const ROW_ALL_SELECT_EVENT = "rowallselectclick";

export declare const ROW_AUTO_SIZE_CONFIG_UPDATE_EVENT = "row-auto-size-config-update";

export declare const ROW_COLLAPSE = "row-collapse";

export declare const ROW_COLLAPSE_ALL = "row-collapse-all";

export declare const ROW_EXPAND = "row-expand";

export declare const ROW_EXPAND_ALL = "row-expand-all";

export declare const ROW_MASTER = "row-master";

export declare const ROW_MENU_EVENT = "rowmenu";

export declare const ROW_SELECT_EVENT = "rowselectclick";

export declare const ROW_SELECTED_EVENT = "rowselected";

export declare const ROW_TRANSPOSE_EVENT = "row-transpose";

/**
 * The RowAutoSizePlugin enables dynamic row height calculation based on cell content.
 * It efficiently manages row heights by calculating them before rendering and updating
 * the grid's dimension store accordingly.
 *
 * **Key Features**:
 * - Pre-calculates row heights based on cell content
 * - Supports dynamic content updates
 * - Efficient caching mechanism for calculated heights
 * - Configurable minimum and maximum row heights
 * - Support for both sync and async height calculations
 *
 * Usage Example:
 * ```typescript
 * import { RowAutoSizePlugin } from './row-autosize';
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [RowAutoSizePlugin];
 *
 * grid.additionalData = {
 *   rowAutoSize: {
 *     minHeight: 24,
 *     maxHeight: 200,
 *     // Optional: Custom height calculator
 *     calculateHeight: (rowData, columns) => {
 *       // Custom logic to calculate row height
 *       return 50;
 *     }
 *   }
 * };
 * ```
 */
export declare class RowAutoSizePlugin extends CorePlugin {
    revogrid: HTMLRevoGridElement;
    providers: PluginProviders;
    private config;
    private heightCache;
    private calculationElement;
    private pendingCalculations;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    private calculateHeights;
    private calculateRowHeight;
    private calculateContentHeight;
    private getColumnWidth;
    private calculatePreciseHeight;
    private clampHeight;
    private handleEdit;
    private createCalculationElement;
    destroy(): void;
}

export declare type RowDataSources = {
    [T in DimensionRows]: DataStore<DataType, DimensionRows>;
};

declare interface RowDragStartEvent extends DragStartEvent {
    model: CellTemplateProp;
}

/**
 * The `RowEditPlugin` is a custom plugin for RevoGrid that provides row-level editing capabilities,
 * allowing users to edit entire rows inline with dedicated action buttons for saving or canceling changes.
 *
 *  **Features**:
 * - **Row Editing Mode:** Enables editing of entire rows by rendering editors for all cells in the selected row.
 * - **Inline Editors:** Supports inline editing of multiple cells in a row simultaneously.
 * - **Action Buttons:** Provides intuitive buttons for `Save` and `Cancel` actions:
 *   - `Save`: Dispatches `CELL_EDIT_SAVE_EVENT` to persist changes.
 *   - `Cancel`: Dispatches `CELL_EDIT_CANCEL_EVENT` to discard changes.
 * - **Event Handling:** Listens for key events to manage row editing:
 *   - `CELL_EDIT_EVENT`: Initiates row editing mode.
 *   - `CELL_EDIT_SAVE_EVENT`: Saves edited data and updates the grid model.
 *   - `CELL_EDIT_CANCEL_EVENT`: Cancels editing and restores original data.
 *   - `BEFORE_CELL_RENDER_EVENT`: Ensures cells in the editing row render with editors.
 *
 * **Usage**:
 * 1. **Import and Initialize the Plugin:**
 *    ```typescript
 *    import { RowEditPlugin } from '@revolist/revogrid-pro'
 *
 *    const grid = document.createElement('revo-grid');
 *    grid.plugins = [RowEditPlugin];
 *    ```
 *
 * 2. **Define Action Column:**
 *    Use the `editorRowActionColumn` to render action buttons (`Edit`, `Save`, `Cancel`):
 *    ```typescript
 *    import { editorRowActionColumn } from '@revolist/revogrid-pro'
 *
 *    grid.columns = [
 *      { prop: 'name', name: 'Name' },
 *      { prop: 'age', name: 'Age' },
 *      {
 prop: 'edit',
 ...editorRowActionColumn,
 }, // Action column for row editing
 *    ];
 *    ```
 *
 * Action Buttons:
 * - **Edit Button:** Dispatches `CELL_EDIT_EVENT` to enable row editing.
 * - **Save Button:** Dispatches `CELL_EDIT_SAVE_EVENT` to save changes.
 * - **Cancel Button:** Dispatches `CELL_EDIT_CANCEL_EVENT` to cancel editing and reset the row.
 *
 * **Icon Details**:
 * - **Save Icon:** Embedded SVG icon representing a "Save" action.
 * - **Cancel Icon:** Embedded SVG icon representing a "Cancel" action.
 * - **Edit Icon:** Embedded SVG icon representing an "Edit" action.
 *
 * **Scenarios**:
 * This plugin is particularly useful for applications where users need to edit multiple cells in a row at once.
 * Typical use cases include updating tabular records or form-like data directly within a grid.
 *
 * **Conclusion**:
 * The `RowEditPlugin` enhances RevoGrid’s editing capabilities by offering a flexible row editing solution
 * with intuitive controls, efficient event handling, and seamless data integration.
 */
export declare class RowEditPlugin extends CorePlugin {
    private editingRow;
    private rowEditedModel;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    private renderEditorTemplate;
}

/**
 * The `RowExpandPlugin` is a base plugin for row expansion functionality in RevoGrid.
 * It provides core functionality for expanding/collapsing rows that can be used by other plugins
 * like nested grid, row details, tree data etc.
 *
 * **Key Features**:
 * - Expand/collapse individual rows
 * - Expand all rows at once
 * - Support for default expanded rows through config
 * - Events for row expansion state changes
 * - Extensible design for building more complex plugins
 *
 * Usage Example:
 * ```ts
 * import { RowExpandPlugin } from './row-expand/index';
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [RowExpandPlugin];
 *
 * // Configure through additionalData
 * grid.additionalData = {
 *   rowExpand: {
 *     // Rows to expand by default
 *     expandedRows: new Set([1, 2, 3]),
 *     // Height for expanded rows (optional)
 *     expandedRowHeight: 200,
 *     // Template for expanded content
 *     template: (h, props) => h('div', null, 'Expanded content')
 *   }
 * };
 * ```
 */
export declare class RowExpandPlugin extends CorePlugin {
    private expandedPhysicalRows;
    private config;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    private setConfig;
    /**
     * Check if this is an expanded row's content
     */
    private isExpandedRowContent;
    private focusRender;
    /**
     * Helper function to shift size indexes when adding or removing rows
     * @param sizes The sizes object to modify
     * @param startIndex The index where the shift begins
     * @param shift The amount to shift by (positive for expansion, negative for collapse)
     */
    private shiftSizeIndexes;
    /**
     * Central handler for all row expansion operations
     * @param config Configuration for the expansion operation
     */
    private handleExpansion;
    /**
     * Expand a specific row
     */
    expandRow(rowIndex: number): void;
    /**
     * Collapse a specific row
     */
    collapseRow(rowIndex: number): void;
    /**
     * Toggle row expansion state
     */
    private toggleRowExpanded;
    /**
     * Expand all rows
     */
    expandAllRows(): void;
    /**
     * Collapse all rows
     */
    collapseAllRows(): void;
    /**
     * Apply default expanded state from config
     */
    private applyDefaultExpandedRows;
}

export declare type RowFocusDetails = {
    dataItem: CellTemplateProp;
    models: any[];
};

/**
 * The `RowHeaderPlugin` is a RevoGrid plugin that enhances the grid with interactive row headers,
 * allowing users to focus, select, and manage row-specific actions effectively. This plugin integrates
 * various event handlers to facilitate rich interactions and maintain state consistency across the grid.
 *
 * **Key Features**:
 * - **Header Interaction**: Listens for events such as `EVENT_ROW_FOCUS`, `EVENT_ROW_FOCUS_SIMPLE`, and
 *   `ROW_MENU_EVENT` to handle row selection and focus, enabling users to click on row headers to trigger
 *   specific actions or selections.
 * - **Selection Management**: Manages active header selections using an observable state, ensuring that
 *   header focus and selection are updated dynamically based on user interactions and grid state changes.
 * - **Event Handling**: Integrates with a variety of grid events (`EVENT_BEFORE_CELL_FOCUS`, `EVENT_BEFORE_FOCUS_LOST`,
 *   `DRAG_START_EVENT`) to modify selection states, drop focus, and handle custom row click actions.
 * - **Range and Focus Handling**: Provides utility methods to apply focus and selection ranges within rows,
 *   ensuring that selections are visually and functionally consistent across the grid.
 *
 * **Usage**:
 * - Integrate this plugin into a RevoGrid instance to enable row header functionalities. Add the plugin
 *   to the grid's plugins array to activate its features.
 *
 * ### Example
 * ```typescript
 * import { RowHeaderPlugin } from '@revolist/revogrid-pro'
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [RowHeaderPlugin];
 * ```
 *
 * This plugin is ideal for applications that require advanced row header interactions, offering
 * a robust solution for managing row-based data actions within a RevoGrid component.
 */
export declare class RowHeaderPlugin extends CorePlugin {
    /**
     * Observable of active header selection
     */
    private activeHeader;
    /**
     * Constructor
     *
     * @param revogrid - RevoGrid component
     * @param providers - Plugin providers
     */
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    /**
     * Handle row selection
     *
     * @param e - CustomEvent
     * @returns Selected row details
     */
    private select;
    /**
     * Set header selection
     *
     * @param providers - Providers
     */
    private setHeader;
    /**
     * Focus row
     *
     * @param dataItem - Data item
     */
    private focusRow;
    /**
     * Drop header selection
     */
    private dropHeaderSelection;
}

/**
 * Returns the row header column configuration.
 *
 * @param fullSize - Whether to use full size for the column.
 * @returns The row header column configuration.
 */
export declare const rowHeaders: ({ showHeaderFocusBtn, rowDrag, }: {
    showHeaderFocusBtn?: boolean | undefined;
    rowDrag?: boolean | undefined;
}) => ColumnRegular;

export declare const rowHeaderTemplate: (h: HyperFunc<VNode>, params: CellTemplateProp, showHeaderFocusBtn: boolean, rowDrag: boolean) => VNode[];

/**
 * row fell in draggable range
 * @returns active range or null
 */
export declare function rowInRange(dataItem: CellTemplateProp): RangeArea | null;

/**
 * The `RowKeyboardNextLineFocusPlugin` enhances keyboard navigation within the RevoGrid by automatically
 * shifting focus to the next or previous row when the user tabs past the last or first cell of a row.
 * This functionality is crucial for improving user experience during data entry or navigation.
 *
 *  **Features**:
 * - Listens to the `BEFORE_KEYDOWN_EVENT` to intercept keyboard events, specifically the 'Tab' key.
 * - Automatically moves focus to the first cell of the next row when tabbing past the last cell.
 * - Moves focus to the first cell of the previous row when shift-tabbing from the first cell.
 * - Ensures that focus navigation respects the grid boundaries and does not move beyond available rows.
 *
 * **Usage**:
 * - This plugin should be added to the RevoGrid to enable enhanced keyboard navigation.
 * - It can be instantiated with a reference to the RevoGrid element and associated plugin providers.
 *
 * ### Example
 * ```typescript
 * import { RowKeyboardNextLineFocusPlugin } from '@revolist/revogrid-pro'
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [RowKeyboardNextLineFocusPlugin]; // Add keyboard navigation plugin
 * ```
 *
 * Events:
 * - Intercepts keydown events to manage focus transitions and prevent default browser behavior where necessary.
 *
 * This plugin is ideal for users who rely heavily on keyboard navigation, ensuring efficient and seamless data entry across grid rows.
 */
export declare class RowKeyboardNextLineFocusPlugin extends CorePlugin {
    revogrid: HTMLRevoGridElement;
    providers: PluginProviders;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
}

export declare type RowMasterConfig = {
    prop?: ColumnProp;
    rowHeight?: number;
    template?: (h: any, data: BeforeRowRenderEvent, additionalData?: any) => ReturnType<typeof h_2>;
};

/**
 * The `RowOddPlugin` is a RevoGrid plugin designed to enhance the visual styling of grid rows by
 * automatically applying an "odd" CSS class to every odd-numbered row. This allows developers to
 * easily apply custom styling to differentiate odd rows from even ones within the grid interface.
 *
 * Functionality:
 * - **`beforerowrender` Event Hook**: Listens to the `beforerowrender` event to modify the attributes
 *   of the virtual node being rendered. It checks the row index and assigns the "odd" class to every
 *   row with an odd index, enabling targeted CSS styling.
 * - **Integration with Grid Core**: Leverages core grid functionalities provided by `PluginProviders`
 *   for seamless integration and manipulation within the RevoGrid environment.
 *
 * **Usage**:
 * - To use the `RowOddPlugin`, instantiate it by passing a reference to the `revo-grid` element and
 *   the necessary providers. This setup will automatically apply the "odd" class during row rendering.
 *
 * ### Example
 * ```typescript
 * import { RowOddPlugin } from '@revolist/revogrid-pro';
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [RowOddPlugin];
 * ```
 *
 * This plugin is particularly useful for developers looking to implement alternating row styles
 * for improved readability and aesthetic appeal in data grid presentations.
 */
export declare class RowOddPlugin extends CorePlugin {
    /**
     * Providers give you access to the grid core functions like selections, data order, row/cell sizes, viewports
     */
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
}

/**
 * The `RowOrderPlugin` is a sophisticated plugin for the RevoGrid framework, providing users with the ability
 * to reorder rows through an intuitive drag-and-drop interface. This plugin enhances user interactivity
 * by allowing smooth row rearrangement while maintaining data integrity and grid performance.
 *
 * **Key Features**:
 * - **Row Drag and Drop**: Users can drag one or multiple rows and reposition them within the grid.
 * - **Auto-scroll Support**: Automatically scrolls the grid, viewport, or container when rows are dragged
 *   near the edges, ensuring a seamless drag-and-drop experience.
 * - **Row Highlighting**: Highlights rows that are being dragged or trimmed, providing visual feedback.
 * - **Multiple Row Handling**: Supports dragging and selecting multiple rows, enhancing batch operations.
 * - **Event Integration**: Listens to and dispatches various drag-related events, such as `DRAG_START_EVENT`,
 *   `DRAG_END_EVENT`, `ORDER_CHANGED_EVENT`, and more, allowing for extensive customization and integration
 *   with other components.
 * - **Trimmed Row Management**: Manages trimmed rows by automatically clearing and updating them as necessary
 *   during drag operations.
 *
 * **Usage**:
 * - Integrate `RowOrderPlugin` into a RevoGrid instance to enable advanced row reordering capabilities.
 * - Customize behavior and appearance through configuration options and event listeners.
 *
 * ### Example
 * ```typescript
 * import { RowOrderPlugin } from '@revolist/revogrid-pro'
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [RowOrderPlugin];
 * ```
 *
 * This plugin is ideal for applications requiring dynamic, user-driven row management, such as task
 * prioritization tools, data manipulation applications, or any scenario where row order is significant.
 */
export declare class RowOrderPlugin extends CorePlugin {
    private readonly orderUi;
    private staticDragData;
    private rowOrderService;
    private dragData;
    private rowMoveFunc;
    protected readonly localSubscriptions: Record<string, LocalSubscription>;
    private trimmedRows;
    private highlightedRows;
    private config?;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    /**
     * Drop trigger event
     */
    onMouseOut(_: MouseEvent): void;
    /**
     * Final event
     */
    onMouseUp(e: MouseEvent): void;
    /**
     * Initial event when drag begins
     */
    dragStart({ originalEvent: e, model: dataItem }: RowDragStartEvent): void;
    /**
     * Initial row move
     */
    move(e: MouseEvent): void;
    clearOrder(): void;
    /**
     * Start grid reordering
     */
    orderStart(e: MouseEvent): void;
    private getItemsFromStore;
    /**
     * Change happened
     * Call updates
     */
    private onPositionChanged;
    /**
     * Aggregate data for farther usage
     */
    private getData;
    private clearLocalSubscriptions;
    /**
     * Clearing local subscription
     */
    clearSubscriptions(): void;
    clearHighlight(): void;
    private trimClear;
    private getActive;
    private getKey;
    private getDataFromKey;
}

export declare type RowSelectAllEvent = ColumnTemplateProp & {
    selected: boolean;
    type: DimensionCols;
};

declare interface RowSelectColumn extends MakeRequired<ColumnType, 'cellTemplate' | 'columnTemplate'> {
}

export declare class RowSelectColumnType implements RowSelectColumn {
    cellTemplate: RowSelectColumn['cellTemplate'];
    cellProperties: RowSelectColumn['cellProperties'];
    columnProperties: RowSelectColumn['columnProperties'];
    columnTemplate: RowSelectColumn['columnTemplate'];
    readonly: boolean;
}

export declare type RowSelectEvent = CellTemplateProp & {
    originalEvent: MouseEvent;
};

/**
 * The `RowSelectPlugin` is a plugin for RevoGrid that enables row selection functionality,
 * allowing users to select individual or multiple rows within the grid. This plugin enhances
 * interactivity and data manipulation capabilities by providing visual and programmatic access
 * to row selection states.
 *
 * **Key Features**:
 * - **Row Selection Management**: Maintains a map of selected rows across different row types,
 *   allowing for comprehensive selection tracking and easy state manipulation.
 * - **Event-Driven Architecture**: Listens to key events such as `ROW_SELECT_EVENT`, `ROW_ALL_SELECT_EVENT`,
 *   `BEFORE_CELL_RENDER_EVENT`, `BEFORE_ROW_RENDER_EVENT`, and `BEFORE_HEADER_RENDER_EVENT` to manage selection
 *   states dynamically and update the grid accordingly.
 * - **Header and Cell Template Augmentation**: Modifies header and cell templates to reflect selection
 *   states, supporting features like "select all" functionality and individual row indication.
 * - **Integration with Data Providers**: Works seamlessly with RevoGrid's data and viewport providers
 *   to ensure accurate reflection of selection states in the UI.
 *
 * **Usage**:
 * - Integrate this plugin into a RevoGrid instance's `plugins` array to enable row selection functionality.
 * - Customize additional row selection behaviors and integrate with other grid features as needed.
 *
 * ### Example
 * ```typescript
 * import { RowSelectPlugin } from '@revolist/revogrid-pro'
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [RowSelectPlugin];
 * ```
 *
 * By using the `RowSelectPlugin`, developers can enhance their RevoGrid applications with intuitive
 * row selection features, empowering users to interact with grid data more effectively.
 */
export declare class RowSelectPlugin extends CorePlugin {
    private lastSelectedIndex?;
    private selected;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    /**
     * Returns physical selected row indexes
     */
    getSelectedIndexes(): Map<DimensionRows, Set<number>>;
}

/**
 * The `RowTransposePlugin` is a plugin for the RevoGrid that enables transposing
 * grid data, switching rows and columns while preserving data integrity. This plugin
 * enhances the grid's versatility by allowing users to view and manipulate data
 * from different perspectives. It supports customizable transposed row and column
 * headers and ensures seamless toggling between original and transposed views.
 *
 * **Key Features**:
 * - Transposing functionality: Toggles between original and transposed grid views.
 * - Configurable headers: Customize transposed row and column headers.
 * - Event-driven: Listens for `ROW_TRANSPOSE_EVENT` to trigger the transpose action.
 * - Data integrity: Preserves original data and column configurations for easy restoration.
 *
 * **Usage**:
 * - Integrate the `RowTransposePlugin` with your RevoGrid instance to enable transposing.
 * - Configure transposed headers using `TransposeConfig` if needed.
 * - Trigger the transposition via `ROW_TRANSPOSE_EVENT`.
 *
 * ### Example
 * ```typescript
 * import { RowTransposePlugin, ROW_TRANSPOSE_EVENT } from '@revolist/revogrid-pro';
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [RowTransposePlugin];
 *
 * // Trigger transpose event
 * const event = new CustomEvent(ROW_TRANSPOSE_EVENT);
 * grid.dispatchEvent(event);
 * ```
 *
 * This plugin is ideal for applications requiring flexible data presentation,
 * offering users a dynamic method to interact with complex datasets.
 */
export declare class RowTransposePlugin extends CorePlugin {
    private config;
    isTransposed: boolean;
    private originalColumns;
    private originalSource;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    transpose(): void;
}

/**
 * The `SameValueMergePlugin` is a RevoGrid plugin designed to merge cells with the same values in a column.
 * It adds a special class to cells that have the same value as the cell above them.
 *
 * **Key Features**:
 * - Simple implementation: Just checks if the current cell has the same value as the cell above it
 * - Column Configuration: Supports a 'merge' property on columns to enable/disable merging
 * - Visual Styling: Adds a class to cells with the same value as the cell above
 *
 * **Usage**:
 * - This plugin should be included in the grid's plugin array to enable same-value merging functionality.
 * - Configure columns with the 'merge' property to enable merging for specific columns.
 *
 * ### Example
 * ```typescript
 * import { SameValueMergePlugin } from './same-value-merge-plugin';
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [SameValueMergePlugin]; // Add merge plugin
 * grid.columns = [
 *   { prop: 'name', name: 'Name' },
 *   { prop: 'category', name: 'Category', merge: true }, // Enable merging for this column
 * ];
 * ```
 */
export declare class SameValueMergePlugin extends CorePlugin {
    readonly revogrid: HTMLRevoGridElement;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    /**
     * Handles cell rendering for merged cells
     */
    private mergeCells;
    destroy(): void;
}

export declare const SCROLL_CHANGE_EVENT = "scrollchange";

export declare const SCROLL_EVENT = "viewportscroll";

export declare interface ScrollChangeEvent {
    /**
     * Number of items to skip
     */
    skip: number;
    /**
     * Number of items to load
     */
    limit: number;
}

export declare type SliderRange = {
    fromValue: number;
    toValue: number;
};

export declare type SortDirection = 'asc' | 'desc' | 'none';

export declare type SortFunction<T = any> = (a: DropdownOption<T>, b: DropdownOption<T>, direction: SortDirection) => number;

export declare const sparklineRenderer: ColumnRegular['cellTemplate'];

/**
 * The `StretchConfig` type
 * specifies how extra space in the grid should be utilized by adjusting the width
 * of columns.
 *
 * **Usage**:
 * - Import the `StretchConfig` type to define stretching behavior in RevoGrid components.
 * - Assign the desired stretching configuration to the grid's `additionalData.stretch`
 *   property to control how columns adjust to available space.
 *
 * @example:
 * ```typescript
 * import { ColumnStretchPlugin } from '@revolist/revogrid-pro';
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [ColumnStretchPlugin];
 *
 * grid.additionalData = {
 *   stretch: 'all', // Stretch all columns to utilize available space
 * };
 * ```
 *
 * This configuration type allows developers to customize how columns adapt to
 * changes in grid size, ensuring optimal data presentation and grid layout.
 */
export declare type StretchConfig = 'none' | 'last' | 'all' | number;

export declare const summaryAggregateRenderer: (h: HyperFunc<VNode>, summary: Record<string, number>, column?: {
    showSum?: boolean;
    showAvg?: boolean;
}) => VNode;

/**
 * The `SummaryChartHeaderPlugin` is a RevoGrid plugin that enhances the grid's column headers by
 * allowing custom summary visualizations to be displayed. This plugin leverages a custom property
 * `summaryVNode` added to the `ColumnRegular` interface, enabling developers to inject summary
 * charts or visual indicators based on column data summaries.
 *
 * **Key Features**:
 * - **Custom Header Augmentation**: Modifies the default column header template to include a summary
 *   chart or visualization as defined by the `summaryVNode` property in the column configuration.
 * - **Event-Driven Rendering**: Listens to the `BEFORE_HEADER_RENDER_EVENT` to dynamically wrap and
 *   modify header templates, ensuring seamless integration with existing grid structures.
 * - **Summary Calculation**: Provides a mechanism to calculate summary data for each column, allowing
 *   for flexible and dynamic summary representations based on the grid's row data.
 * - **Styling Support**: Automatically adds a CSS class for plugin-specific styling, enabling custom
 *   styles to be applied to headers enhanced by this plugin.
 *
 * **Usage**:
 * - Integrate this plugin into a RevoGrid instance's `plugins` array to enable summary chart headers.
 * - Define `summaryVNode` in column configurations to specify the chart or visualization logic.
 *
 * ### Example
 * ```typescript
 * import { SummaryChartHeaderPlugin } from '@revolist/revogrid-pro'
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [SummaryChartHeaderPlugin];
 * grid.columns = [
 *   {
 *     prop: 'sales',
 *     name: 'Sales',
 *     summaryVNode: (h, summary) => h('div', {}, `Total: ${summary['Total'] || 0}`),
 *   },
 * ];
 * ```
 *
 * By using the `SummaryChartHeaderPlugin`, developers can enhance their RevoGrid instances with
 * visually informative headers, improving data insights and user experience within the grid.
 */
export declare class SummaryChartHeaderPlugin extends CorePlugin {
    providers: PluginProviders;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    /**
     * Calculates summary data for the column.
     */
    private calculateSummary;
}

export declare const summaryHeaderRenderer: (h: HyperFunc<VNode>, summary: Record<string, number>, column?: {
    maxItems?: number;
}) => VNode;

declare interface Template {
    (createElement: HyperFunc<VNode>, props: any, additionalData?: any): any;
}

/**
 * The `TextAreaEditor` is a custom external editor for RevoGrid that enables
 * multi-line text editing directly within grid cells using a `<textarea>` element.
 * This editor is particularly useful for scenarios where users need to input or edit
 * larger text content that spans multiple lines, such as comments, descriptions, or notes.
 *
 *  **Features**:
 * - **Multi-line Text Support**: Renders a `<textarea>` element for multi-line input, allowing users to input detailed text content.
 * - **Automatic Focus & Selection**: Automatically focuses and selects the text content when the editor is rendered, ensuring a seamless user experience.
 * - **Keyboard Navigation**: Listens for `Enter` and `Tab` key events to save changes and move to the next cell, supporting efficient keyboard-based navigation.
 * - **Save on Blur**: Automatically saves the content and closes the editor when the user clicks outside the editor (`blur` event).
 * - **Scroll Glitch Prevention**: Ensures smooth user interaction by blurring the input before disconnecting the editor, preventing scroll glitches.
 *
 * **Usage**:
 * - Import `TextAreaEditor` and assign it as an editor for specific columns in the RevoGrid instance.
 * - Ideal for columns that require detailed multi-line text input.
 *
 * ### Example
 * ```typescript
 * import { TextAreaEditor } from '@revolist/revogrid-pro'
 *
 * const grid = document.createElement('revo-grid');
 * grid.columns = [
 *   {
 *     prop: 'comments',
 *     name: 'Comments',
 *     editor: 'textarea',
 *   },
 * ];
 *
 * grid.editors = {
 *   textarea: TextAreaEditor,
 * };
 * ```
 *
 * This editor enhances RevoGrid by providing a user-friendly and efficient way
 * to handle multi-line text input, making it suitable for applications requiring
 * rich text editing capabilities within grid cells.
 */
export declare class TextAreaEditor implements EditorBase {
    private data;
    private saveCallback;
    constructor(data: any, saveCallback: (value: any, preventFocus?: boolean) => void);
    element?: HTMLTextAreaElement | null;
    editCell?: EditCell;
    /**
     * Lifecycle method triggered after the editor is rendered.
     * Automatically focuses the textarea.
     */
    componentDidRender(): Promise<void>;
    onKeyDown(e: KeyboardEvent): void;
    /**
     * IMPORTANT: Prevent scroll glitches when editor is closed and focus is on current input element.
     */
    beforeDisconnect(): void;
    getValue(): string | undefined;
    /**
     * Render method for the TextAreaEditor.
     * Creates a textarea element with initial cell value, handles input events, and saves changes on blur.
     */
    render(h: HyperFunc<VNode>): VNode;
}

/**
 * The `thresholdRenderer` is a custom cell renderer for RevoGrid that applies CSS classes based on defined thresholds.
 * It uses the existing threshold system to apply classes to cells based on their values.
 *
 * **Features**:
 * - Supports multiple thresholds with custom CSS classes
 * - Simple and straightforward threshold-based styling
 * - Works with the existing threshold system
 *
 * **Usage**:
 * ```typescript
 * import { thresholdRenderer } from '@revolist/revogrid-pro'
 *
 * const grid = document.createElement('revo-grid');
 * grid.columns = [
 *   {
 *     prop: 'score',
 *     name: 'Score',
 *     thresholds: [
 *       { value: 0, className: 'high' },    // Red for negative values
 *       { value: 50, className: 'medium' },     // Yellow for values 0-50
 *       { value: 100, className: 'low' },      // Green for values 50-100
 *     ],
 *     cellProperties: thresholdRenderer,
 *   },
 * ];
 * ```
 */
export declare const thresholdRenderer: Required<ColumnRegular>['cellProperties'];

export declare const thumbsRenderer: ColumnRegular['cellTemplate'];

export declare const timelineRenderer: ColumnRegular['cellTemplate'];

/**
 * The TooltipPlugin is a RevoGrid plugin that provides interactive tooltip functionality
 * for grid cells, enhancing user experience by displaying additional information on hover.
 * This plugin automatically creates and manages tooltips based on element attributes,
 * allowing for seamless integration and customization.
 *
 * **Key Features**:
 * - Dynamic tooltip creation and positioning triggered by mouse events (`mouseover`, `mouseout`, `mousemove`).
 * - Tooltip content sourced from `data-tooltip` or `title` attributes.
 * - Customizable tooltip appearance based on `tooltip-type` and `tooltip-position` attributes.
 * - Ensures tooltips remain within grid boundaries for optimal display.
 *
 * **Usage**:
 * - Instantiate the TooltipPlugin with a RevoGrid element and required providers.
 * - Ensure grid elements have `data-tooltip` or `title` attributes set for tooltip content.
 * - Optionally, use `tooltip-type` for styling variations and `tooltip-position` to specify position ('top', 'bottom', 'left', 'right').
 *
 * ### Example
 * ```typescript
 * import { TooltipPlugin } from './tooltip-plugin';
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [TooltipPlugin];
 *
 * grid.columns = [
 *   {
 *     prop: 'num',
 *     name: 'Linear',
 *     cellTemplate: (createElement, props) => {
 *       return createElement('div', {
 *         title: 'Number value',
 *         'data-tooltip': 'This is a number',
 *         'tooltip-type': 'info',
 *         'tooltip-position': 'right',
 *       }, props.index);
 *     },
 *   },
 * ];
 * ```
 *
 * This plugin is ideal for providing additional data insights directly within the grid
 * interface, offering flexible tooltip management and presentation.
 */
export declare class TooltipPlugin extends CorePlugin {
    private tooltipContainer;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    private createTooltipContainer;
    private onHover;
    private showTooltip;
    private hideTooltip;
    private updateTooltipPosition;
}

/**
 * The `TransposedRow` class is a utility class for transposing a grid. It is
 * used internally by the `RowTransposePlugin`.
 *
 * When an instance of `TransposedRow` is created, it dynamically defines
 * properties on itself for each row in the original source. The property
 * names are in the format `colX`, where `X` is the index of the row in the
 * original source. The property values are the values of the field in the
 * original source that the `TransposedRow` was created with.
 *
 * The `defineProperties` method is used to define the properties on the
 * `TransposedRow` instance. It is called automatically by the constructor.
 */
export declare class TransposedRow {
    field: ColumnProp;
    originalSource: Map<DimensionRows, DataType[]>;
    name: string;
    [key: string]: any;
    /**
     * Creates a new `TransposedRow` instance.
     *
     * @param field The field in the original source to use for the transposed
     * values.
     * @param originalSource The original source data.
     */
    constructor(field: ColumnProp, originalSource: Map<DimensionRows, DataType[]>, name: string);
    getOriginalModels(props: ColumnProp[]): (DataType | undefined)[];
    /**
     * Defines the properties on the `TransposedRow` instance.
     */
    private defineProperties;
}

export declare const TREE_BEFORE_PARENT_CHANGE_EVENT = "before-parent-change";

export declare const TREE_ROW_SELECT_EVENT = "treerowselect";

/**
 * The TreeDataPlugin now uses Revogrid's row trimming mechanism without modifying the original data.
 *
 * All tree metadata (level, expanded, hasChildren, visible) is computed separately and stored in a Map.
 * The plugin builds a parent→children mapping from the original flat data and then recursively computes,
 * for each row, its tree level and whether it should be visible based on the expanded/collapsed state
 * of its ancestors.
 *
 * The cell template uses a supplied "getMeta" function to look up computed tree metadata for rendering
 * (indentation and expand/collapse icons) without changing the underlying row.
 *
 * Usage Example:
 * ```ts
 * import { TreeDataPlugin } from './tree/index';
 *
 * const grid = document.createElement('revo-grid');
 * grid.plugins = [TreeDataPlugin];
 *
 * grid.columns = [
 *   {
 *     prop: 'treeColumn',
 *     name: 'Hierarchy',
 *     tree: true,
 *     cellTemplate: TreeCellTemplate, // or you can let the plugin override it
 *   },
 * ];
 * ```
 */
export declare class TreeDataPlugin extends CorePlugin {
    private idField;
    private parentIdField;
    private rootParentId;
    private expandedRowIds;
    /**
     * Stores computed tree metadata for each row keyed by the row's id.
     */
    private metaData;
    constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders);
    private setConfig;
    /**
     * Returns the computed tree metadata for the given row.
     */
    private getMeta;
    /**
     * Recomputes the tree metadata for every row in the original data and builds a trimmed map.
     * Call this method after the original data/order/visibility/set changes
     *
     * This method builds a parent→children mapping (without modifying the original data) and then
     * recursively computes for each row:
     *  - its level (indentation),
     *  - whether it is expanded (based on the expandedRowIds set),
     *  - whether it has children,
     *  - and whether it should be visible (i.e. none of its ancestors are collapsed).
     *
     * The trimmed map is then applied via providers.data.setTrimmed().
     */
    private updateTree;
    /**
     * Toggle the expanded state for a row and then re-calculate tree metadata.
     */
    toggleRowExpanded(row: DataType): void;
    /**
     * Handles row drag-and-drop events by updating the parent id for moved rows.
     * After the parent is updated, the tree metadata is re-calculated.
     */
    private handleRowDrop;
    /**
     * Gets all descendant row IDs (children, grandchildren, etc.) for a given row
     * @param rowId - The ID of the row to get descendants for
     * @returns Array of physical indices of all descendant rows
     */
    getAllDescendantPhysicalIndices(rowId: any): number[];
}

/**
 * Validates if the value is an array.
 *
 * @param value - The value to validate.
 * @returns `true` if the value is an array, otherwise `false`.
 */
export declare function validateArray(value: any): boolean;

/**
 * Validates if the value is a boolean.
 *
 * @param value - The value to validate.
 * @returns `true` if the value is a boolean, otherwise `false`.
 */
export declare function validateBoolean(value: any): boolean;

/**
 * Validates if the value is a date.
 *
 * @param value - The value to validate.
 * @returns `true` if the value is a date, otherwise `false`.
 */
export declare function validateDate(value: any): boolean;

/**
 * Validates if the value is a decimal.
 *
 * @param value - The value to validate.
 * @returns `true` if the value is a decimal, otherwise `false`.
 */
export declare function validateDecimal(value: any): boolean;

/**
 * Validates if the value is an empty string.
 *
 * @param value - The value to validate.
 * @returns `true` if the value is an empty string, otherwise `false`.
 */
export declare function validateEmptyString(value: any): boolean;

/**
 * Validates if the value is one of the allowed values.
 *
 * @param value - The value to validate.
 * @param allowedValues - The array of allowed values.
 * @returns `true` if the value is one of the allowed values, otherwise `false`.
 */
export declare function validateEnum(value: any, allowedValues: any[]): boolean;

/**
 * Validates if the value is a finite number.
 *
 * @param value - The value to validate.
 * @returns `true` if the value is a finite number, otherwise `false`.
 */
export declare function validateFinite(value: any): boolean;

/**
 * Validates if the value is an instance of a class.
 *
 * @param value - The value to validate.
 * @param cls - The class to test against.
 * @returns `true` if the value is an instance of the class, otherwise `false`.
 */
export declare function validateInstance(value: any, cls: any): boolean;

/**
 * Validates if the value is an integer.
 *
 * @param value - The value to validate.
 * @returns `true` if the value is an integer, otherwise `false`.
 */
export declare function validateInteger(value: any): boolean;

/**
 * Validates if the value is a negative number.
 *
 * @param value - The value to validate.
 * @returns `true` if the value is a negative number, otherwise `false`.
 */
export declare function validateNegative(value: any): boolean;

/**
 * Validates if the value is a non-empty string.
 *
 * @param value - The value to validate.
 * @returns `true` if the value is a non-empty string, otherwise `false`.
 */
export declare function validateNonEmptyString(value: any): boolean;

/**
 * Validates if the value is null.
 *
 * @param value - The value to validate.
 * @returns `true` if the value is null, otherwise `false`.
 */
export declare function validateNull(value: any): boolean;

/**
 * This module provides a comprehensive set of validation functions used in the RevoGrid project
 * to verify various data types and conditions. These utility functions are essential for ensuring
 * data correctness and integrity within the grid environment.
 *
 *  **Features**:
 * - Type-specific validation functions such as `validateNumber`, `validateBoolean`, `validateString`,
 *   `validateInteger`, and `validateDecimal` to assert the data type of a value.
 * - Range validation with `validateRange`, ensuring numeric values fall within specified limits.
 * - Structure validation functions like `validateArray`, `validateObject`, `validateNull`, `validateUndefined`,
 *   and `validateDate` to confirm the data structure.
 * - Pattern matching via `validateRegex` to check strings against regular expressions.
 * - Enum validation with `validateEnum`, allowing only specified values.
 * - Positive and negative number checks through `validatePositive` and `validateNegative`.
 * - Finite number check using `validateFinite`.
 * - String content checks with `validateEmptyString` and `validateNonEmptyString`.
 * - Class instance verification using `validateInstance`.
 */
/**
 * Validates if the value is a number.
 *
 * @param value - The value to validate.
 * @returns `true` if the value is a number, otherwise `false`.
 */
export declare function validateNumber(value: any): boolean;

/**
 * Validates if the value is an object.
 *
 * @param value - The value to validate.
 * @returns `true` if the value is an object, otherwise `false`.
 */
export declare function validateObject(value: any): boolean;

/**
 * Validates if the value is a positive number.
 *
 * @param value - The value to validate.
 * @returns `true` if the value is a positive number, otherwise `false`.
 */
export declare function validatePositive(value: any): boolean;

/**
 * Validates if the value is within a specific range.
 *
 * @param value - The value to validate.
 * @param min - The minimum value.
 * @param max - The maximum value.
 * @returns `true` if the value is within the range, otherwise `false`.
 */
export declare function validateRange(value: any, min: number, max: number): boolean;

/**
 * Validates if the value matches the provided regular expression.
 *
 * @param value - The value to validate.
 * @param regex - The regular expression to test against.
 * @returns `true` if the value matches the regular expression, otherwise `false`.
 */
export declare function validateRegex(value: any, regex: RegExp): boolean;

/**
 * Validates if the value is a string.
 *
 * @param value - The value to validate.
 * @returns `true` if the value is a string, otherwise `false`.
 */
export declare function validateString(value: any): boolean;

/**
 * Validates if the value is undefined.
 *
 * @param value - The value to validate.
 * @returns `true` if the value is undefined, otherwise `false`.
 */
export declare function validateUndefined(value: any): boolean;

/**
 * Extends the `ColumnRegular` interface from the RevoGrid framework to include
 * properties and functions for validating cell data and rendering validation feedback.
 * It facilitates cell validation and provides visual indicators for invalid cells.
 *
 *  **Features**:
 * - Extends `ColumnRegular` with:
 *   - `softValidation`: An optional boolean indicating if a cell should be saved even when invalid.
 *   - `validationTooltip`: A function to provide tooltip text for invalid cells.
 *   - `validate`: A function to determine if a cell's value is valid.
 * - The `invalidCellProps` function returns cell properties indicating whether a cell is invalid.
 * - The `validationRenderer` function returns a renderer with:
 *   - `cellProperties`: Adds validation styles and properties to cells, highlighting them when invalid.
 *   - `cellTemplate`: Renders cells with a red triangle and tooltip if the value is invalid, providing visual feedback.
 *
 * **Usage**:
 * - Integrate these extensions into the RevoGrid column configuration to enable cell validation.
 * - Customize cell templates and properties using `validationRenderer` to enhance the grid's UI.
 *
 * ### Example
 * ```typescript
 * import { validationRenderer } from '@revolist/revogrid-pro'
 *
 * const grid = document.createElement('revo-grid');
 * grid.columns = [
 *   {
 *     prop: 'num',
 *     name: 'Linear',
 *     validate: (value) => value >= 0 && value <= 40,
 *     validationTooltip: (value) => `Value ${value} is out of range`,
 *     cellTemplate: validationRenderer().cellTemplate,
 *   },
 * ];
 * ```
 *
 * This module is crucial for applications requiring data validation, improving user experience
 * by providing immediate feedback for data entry errors within the RevoGrid framework.
 */
export declare const validationRenderer: ({ template, invalidProperties, }?: {
    template?: ColumnRegular["cellTemplate"];
    invalidProperties?: ColumnRegular["cellProperties"];
}) => Pick<Required<ColumnRegular>, "cellProperties" | "cellTemplate">;

export declare const ValueSelector: ({ value, aggregators, onUpdateValue }: ValueSelectorProps) => JSX;

declare interface ValueSelectorProps {
    value: PivotConfigValue['aggregator'] | undefined;
    aggregators: string[];
    onUpdateValue: (newAggregator: string) => void;
}

export declare const VIRTUAL_SCROLL_EVENT = "scrollvirtual";

export { }


declare module '@revolist/revogrid' {
    interface ColumnRegular {
        /**
         * The focus function for the column.
         */
        focus?: (detail: BeforeSaveDataDetails) => boolean;
    }
}


declare module '@revolist/revogrid' {
    interface CellTemplateProp {
        /**
         * The previous value of the cell.
         */
        previousValue?: any;
    }
    interface ColumnRegular {
        /**
         * The flash function for the column.
         */
        flash?: (value: any) => boolean;
    }
}


declare module '@revolist/revogrid' {
    interface AdditionalData {
        /**
         * Additional data property for column group panel
         *
         * @example
         * ```typescript
         * const grid = document.createElement('revo-grid');
         * grid.additionalData = {
         *   columnGroupPanel: {
         *     emptyPanelText: 'Drop columns here to create groups'
         *   }
         * };
         * ```
         */
        columnGroupPanel?: ColumnGroupPanelConfig;
    }
}


/**
 * Exports a collection of custom renderers for use within the RevoGrid component.
 * These renderers enhance the grid's visual representation by providing a variety of data visualization
 * options, such as charts, sparklines, and graphical indicators.
 *
 * Exported Renderers:
 * - `progress-line.renderer`: Renders a progress line to visually represent completion percentages.
 * - `progress-line-value.renderer`: Displays both a progress line and its corresponding value.
 * - `sparkline.renderer`: Implements sparklines for compact line charts within grid cells.
 * - `bar-chart.renderer`: Provides bar chart visualizations for comparative data analysis.
 * - `heatmap.renderer`: Applies heatmap effects to cells based on data values.
 * - `badge.renderer`: Displays badge elements to highlight key data points.
 * - `rating-star.renderer`: Renders star icons to represent ratings.
 * - `timeline.renderer`: Visualizes timeline data within grid cells.
 * - `change.renderer`: Highlights changes in data values with visual indicators.
 * - `thumbs.renderer`: Uses thumbs-up or thumbs-down icons to represent binary data.
 * - `column-type.renderer`: Supports different data types and custom column rendering.
 * - `pie-chart.renderer`: Provides pie chart visualizations for proportional data.
 * - `summary-percentage.renderer`: Displays percentage summaries across datasets.
 * - `summary-aggregate.renderer`: Aggregates data summaries for enhanced analysis.
 * -  and more...
 *
 * **Usage**:
 * - Import these renderers into your RevoGrid setup to apply custom cell templates and enhance
 *   the grid's data visualization capabilities.
 *
 * ### Example
 * ```typescript
 * import { SparklineRenderer } from '@revolist/revogrid-pro'
 *
 * const grid = document.createElement('revo-grid');
 * grid.columns = [
 *   {
 *     prop: 'data',
 *     name: 'Data Visualization',
 *     cellTemplate: SparklineRenderer,
 *   },
 * ];
 * ```
 *
 * These renderers are ideal for developers looking to enrich RevoGrid tables with interactive
 * and visually appealing data presentation elements.
 */
declare module '@revolist/revogrid' {
    interface ColumnRegular {
        /**
        * The position of the bars in the chart.
        */
        barPosition?: 'top' | 'bottom';
        /**
         * Define badge styles for the cell.
         */
        badgeStyles?: Record<string, {
            backgroundColor: string;
            color: string;
        }>;
        /**
         * Whether to render the shape as a rectangular.
         */
        rectangular?: boolean;
        /**
         * Maximum number of stars in the rating. Default is 5.
         */
        maxStars?: number;
        /**
         * Minimum value for the progress line. Default is 0.
         */
        minValue?: number;
        /**
         * Maximum value for the progress line. Default is 100.
         */
        maxValue?: number;
        /**
         * Define thresholds for the cell.
         */
        thresholds?: ThresholdConfig[];
        /**
         * Format the value of the cell.
         */
        formatValue?: (value: number, column: ColumnRegular) => string;
        /**
         * Function to calculate progress based on row data.
         * This allows connecting multiple fields to determine progress.
         * @param config Configuration object containing model, data, and prop
         * @returns A number between 0 and 100 representing progress
         */
        progress?: (config: {
            model: DataType;
            data: DataType[];
            prop: ColumnProp;
        }) => number;
    }
}


declare module '@revolist/revogrid' {
    interface ColumnRegular {
        milestoneMode?: boolean;
    }
}


declare module '@revolist/revogrid' {
    /**
     * Add autoSizeColumnConfig property to AdditionalData interface
     */
    interface AdditionalData {
        autoSizeColumnConfig?: AutoSizeColumnConfig;
    }
    /**
     * Add autoSize property to ColumnRegular interface
     */
    interface ColumnRegular {
        autoSize?: boolean;
    }
}


declare module '@revolist/revogrid' {
    interface ColumnRegular {
        link?: {
            /**
             * Target attribute for the link ('_blank', '_self', etc.)
             * @default '_blank'
             */
            target?: '_blank' | '_self' | '_parent' | '_top';
            /**
             * Whether to show the protocol (http://, https://, etc.) in the displayed text
             * @default false
             */
            showProtocol?: boolean;
            /**
             * Custom CSS class to apply to the link
             */
            className?: string;
            /**
             * Custom CSS style to apply to the link
             */
            style?: Record<string, string>;
            /**
             * Whether to prevent the default link behavior and handle navigation programmatically
             * @default false
             */
            preventDefault?: boolean;
        };
    }
}


declare module '@revolist/revogrid' {
    interface ColumnRegular {
        /**
         * Configuration for dropdown editor
         */
        dropdown?: DropdownProps;
    }
}


declare module '@revolist/revogrid' {
    interface ColumnRegular {
        /**
         * Hide filter input in the header
         */
        hideFilterHeader?: boolean;
        /**
         * Hide filter input count in the header
         */
        hideFilterHeaderCount?: boolean;
        /**
         * Filter placeholder
         */
        filterPlaceholder?: string;
    }
}


declare module '@revolist/revogrid' {
    interface ColumnRegular {
        /**
         * Configuration for multi-column type
         */
        multiColumn?: MultiColumnConfig;
    }
}


declare module '@revolist/revogrid' {
    interface ColumnRegular {
        /**
         * Enables same-value merging for this column
         */
        merge?: boolean;
    }
}


declare module '@revolist/revogrid' {
    interface ColumnRegular {
        /**
         * Add summaryVNode property to ColumnRegular interface
         */
        summaryVNode?(h: HyperFunc<VNode>, summary: Record<string, number>): VNode;
    }
}


declare module '@revolist/revogrid' {
    /**
     * Add collapsible property to Group interface
     */
    interface Group extends ColumnProperties {
        /**
         * Whether the group is collapsible
         */
        collapsible?: boolean;
        /**
         * Whether the group is collapsed
         */
        collapsed?: boolean;
    }
    /**
     * Add sealed property to ColumnRegular interface
     */
    interface ColumnRegular {
        /**
         * Whether the column is sealed, if true the column will not be trimmed/collapsed
         */
        sealed?: boolean;
    }
}


declare module '@revolist/revogrid' {
    interface FilterCaptions {
        /**
         * The title of the selection filter
         */
        selectionTitle: string;
        /**
         * The title of the slider filter
         */
        sliderTitle: string;
        /**
         * The title of the date filter
         */
        dateTitle: string;
    }
    interface ColumnFilterConfig {
        /**
         * The configuration for the selection filter
         */
        selection?: SelectionConfig;
        /**
         * The configuration for the slider filter
         */
        slider?: Pick<RangeSliderProps, 'showTooltips' | 'showRangeDisplay' | 'formatValue'>;
    }
}


declare module '@revolist/revogrid' {
    /**
     * Additional data property for column hide configuration
     */
    interface AdditionalData {
        /**
         * Additional data property for column hide configuration
         * @example
         * grid.additionalData = {
         *   // Hide columns with indices 1, 2, and 3
         *   hiddenColumns: [1, 2, 3],
         * }
         */
        hiddenColumns?: HiddenColumnsConfig;
    }
}


declare module '@revolist/revogrid' {
    interface AdditionalData {
        /**
         * Additional data property for event manager
         *
         * @example
         * ```typescript
         * const grid = document.createElement('revo-grid');
         * grid.additionalData = { eventManager: { collectEvents: true, collectEventsDelay: 1000 } };
         * ```
         */
        eventManager?: EventManagerConfig;
    }
}


declare module '@revolist/revogrid' {
    interface AdditionalData {
        /**
        * Additional data property for cell merge configuration
        * @example
        * grid.additionalData = {
        *   cellMerge: [
        *     {
        *       row: 0,
        *       column: 0,
        *       rowSpan: 2,
        *       colSpan: 2,
        *       rowType: 'rgRow',
        *       colType: 'rgCol',
        *     }
        *   ]
        * }
        */
        cellMerge?: MergeData[];
    }
}


declare module '@revolist/revogrid' {
    /**
     * Add validationTooltip property to ColumnRegular interface
     */
    interface ColumnRegular {
        /**
         * Optional property to enable soft validation, when set to true, the cell will be saved if it is invalid
         */
        softValidation?: boolean;
        /**
         * Optional function to provide tooltip text for invalid cells.
         * @param cellValue - The value of the cell.
         * @returns The tooltip text for the cell.
         */
        validationTooltip?(cellValue?: any): any;
        /**
         * Optional function to validate the cell value.
         * @param cellValue - The value of the cell.
         * @param model - The full row model containing all column values.
         * @returns `true` if the value is valid, otherwise `false`.
         */
        validate?(cellValue?: any, model?: any): boolean;
    }
}


declare module '@revolist/revogrid' {
    /**
     * Additional data property for column stretch configuration
     */
    interface AdditionalData {
        /**
         *
         * Additional data property for column stretch configuration
         * @example
         * grid.additionalData = {
         *   // Stretch all columns to utilize available space
         *   stretch: 'all',
         *   // Stretch the first column to utilize available space
         *   stretch: 1,
         *   // Stretch the last column to utilize available space
         *   stretch: 'last',
         * }
         */
        stretch?: StretchConfig;
    }
}


declare module '@revolist/revogrid' {
    interface AdditionalData {
        /**
         * Additional data property for pivot
         *
         * @example
         * ```typescript
         * const grid = document.createElement('revo-grid');
         * grid.additionalData = {
         *   pivot: {
         *     dimensions: [
         *       { prop: 'name', aggregator: 'sum' },
         *     ],
         *     rows: ['name'],
         *     columns: ['age'],
         *     values: [{ prop: 'salary', aggregator: 'sum' }],
         *   },
         * };
         * ```
         */
        pivot?: PivotConfig;
    }
}


declare module '@revolist/revogrid' {
    interface AdditionalData {
        history?: {
            undoStack: EventManagerEvent[];
            redoStack: EventManagerEvent[];
            maxStackSize: number;
            disabled: boolean;
        };
    }
}


declare module '@revolist/revogrid' {
    interface AdditionalData {
        /**
         * Additional data property for pagination
         *
         * @example
         * ```typescript
         * const grid = document.createElement('revo-grid');
         * grid.additionalData = {
         *   pagination: {
         *     itemsPerPage: 10,
         *     initialPage: 1, // default: 0
         *     total: 100, // default: 0
         *   },
         * };
         * ```
         */
        pagination?: PaginationConfig & PaginationPanelConfig;
    }
}


declare module '@revolist/revogrid' {
    interface AdditionalData {
        /**
        * Additional data property for row master configuration
        * @example
        * {
        *   masterRow: {
        *     prop: 'masterDetail',
        *     name: 'Details',
        *     cellTemplate: (h, data) => {
        *       // Custom rendering logic for master rows
        *       return h('div', { class: 'detail-content' }, 'Detail view content');
        *     },
        *   },
        * }
        */
        masterRow?: RowMasterConfig;
    }
}


declare module '@revolist/revogrid' {
    interface ColumnRegular {
        /**
         * Enables checkbox on cells and columns
         */
        rowSelect?: boolean | ((model: CellTemplateProp) => boolean);
    }
}


declare module '@revolist/revogrid' {
    interface AdditionalData {
        /**
         * Additional data property for infinity scroll
         *
         * @example
         * ```typescript
         * const grid = document.createElement('revo-grid');
         * grid.additionalData = { infinityScroll: { chunkSize: 50, bufferSize: 100, preloadThreshold: 0.75, total: 1000, loadData: async (skip, limit, order, filter) => {
         *   console.log(e);
         * });
         */
        infinityScroll?: InfinityScrollConfig;
    }
}


/**
 * This file defines types for configuring context menus within the RevoGrid environment,
 * specifically `ContextMenuItem` and `ContextMenuConfig`. These types enable the creation
 * of context menus with customizable items and actions, enhancing user interaction with
 * grid data.
 *
 *  **Features**:
 * - `ContextMenuItem` type allows defining individual menu items with properties such as
 *   `name` for display, `class` for CSS styling, `action` as a callback function for item
 *   selection, and `keepOpen` to determine if the menu remains open after an action.
 * - `ContextMenuConfig` type manages a collection of `ContextMenuItem` objects, representing
 *   the entire context menu configuration.
 *
 * **Usage**:
 * - Utilize `ContextMenuConfig` to specify settings for context menus in RevoGrid, enabling
 *   custom actions and styles for each menu item.
 *
 * ### Example
 * ```typescript
 * const contextMenuConfig: ContextMenuConfig = {
 *   items: [
 *     { name: 'Edit', action: () => console.log('Edit action'), keepOpen: false },
 *     { name: 'Delete', action: () => console.log('Delete action'), class: 'danger' },
 *   ],
 * };
 * ```
 *
 * These types are integral for applications that require dynamic and interactive context
 * menus, allowing developers to define actions and appearance tailored to specific use cases.
 */
declare module '@revolist/revogrid' {
    interface AdditionalData {
        /**
         * The context menu configuration for row context menus
         *
         * @example
         * ```typescript
         * grid.additionalData = {
         *   rowContextMenu: { items: [{ name: 'Edit', action: () => console.log('Edit action') }] },
         * };
         * ```
         */
        rowContextMenu?: ContextMenuConfig;
    }
}


declare module '@revolist/revogrid' {
    interface AdditionalData {
        /**
         * Additional data property for export excel
         *
         * @example
         * ```typescript
         * const grid = document.createElement('revo-grid');
         * grid.additionalData = { excel: { allowDrag: false, parsingOptions: { raw: true, xlfn: true, dense: true, PRN: true } } };
         * ```
         */
        excel?: ExcelConfig;
    }
}


declare module '@revolist/revogrid' {
    interface AdditionalData {
        /**
         * Additional data property for row auto size
         *
         * @example
         * ```typescript
         * const grid = document.createElement('revo-grid');
         * grid.additionalData = {
         *   rowAutoSize: {
         *     minHeight: 24,
         *     maxHeight: 200,
         *   },
         * };
         * ```
         */
        rowAutoSize?: RowAutoSizeConfig;
    }
}


declare module '@revolist/revogrid' {
    interface ColumnRegular {
        /**
         * Enables expand template on cells
         */
        expand?: boolean;
    }
}


declare module '@revolist/revogrid' {
    interface AdditionalData {
        /**
         * Additional data for row expand
         *
         * @example
         * ```typescript
         * const grid = document.createElement('revo-grid');
         * grid.additionalData = {
         *   rowExpand: {
         *     expandedRows: new Set([1, 2, 3]),
         *   },
         * };
         * ```
         */
        rowExpand?: RowExpandConfig;
    }
}


/**
 * RevoGrid Plugin for reordering rows in grid.
 * It provides ability to drag rows and drop them in new position.
 * It also provides autoscroll behavior for grid.
 * Autoscroll is happening when user is dragging row and it is close to border of grid.
 * Then plugin will automatically scroll grid to nearest edge of grid.
 * Autoscroll is also happening when user is dragging row and it is close to edge of viewport.
 * Then plugin will automatically scroll viewport to nearest edge of viewport.
 * Autoscroll is also happening when user is dragging row and it is close to edge of container.
 * Then plugin will automatically scroll container to nearest edge of container.
 * The plugin is also handling multiple row drag.
 * When user is dragging multiple rows, plugin will automatically select all rows between start and end position of drag.
 * The plugin is also handling multiple row selection.
 * When user is selecting multiple rows, plugin will automatically select all rows between start and end position of selection.
 * The plugin is also handling trimming of rows.
 * When user is dragging row and it is close to edge of grid, plugin will automatically trim all rows which are out of viewport.
 * The plugin is also handling clearing of trimmed rows.
 * When user is dropping row, plugin will automatically clear all trimmed rows.
 */
declare module '@revolist/revogrid' {
    interface AdditionalData {
        /**
         * Additional data property rowOrder
         *
         * @example
         * ```typescript
         * const grid = document.createElement('revo-grid');
         * grid.plugins = [RowOrderPlugin];
         * grid.additionalData = {
         *   rowOrder: {
         *     prop: 'name', // column prop, used for drag and drop text information
         *   },
         * };
         * ```
         */
        rowOrder?: RowOrderPluginConfig;
    }
    interface ColumnRegular {
        /**
         * Column prop, used for drag and drop text information
         */
        rowDrag?: RowDrag;
    }
}


declare module '@revolist/revogrid' {
    interface AdditionalData {
        /**
         * Additional data property transpose
         */
        transpose?: TransposeConfig;
    }
}


declare module '@revolist/revogrid' {
    interface ColumnRegular {
        /**
         * Enables tree template on cells
         */
        tree?: boolean;
    }
    interface AdditionalData {
        /**
         * Additional data property tree
         *
         * @example
         * ```typescript
         * const grid = document.createElement('revo-grid');
         * grid.additionalData = {
         *   tree: {
         *     idField: 'id',
         *     parentIdField: 'parentId',
         *     rootParentId: null,
         *     expandedRowIds: new Set(),
         *   },
         * };
         * ```
         */
        tree?: {
            idField?: string;
            parentIdField?: string;
            rootParentId?: any;
            expandedRowIds?: Set<any>;
        };
    }
}

# Warehouse Layout Modal - Refactoring Plan

## Overview

Refactor the monolithic **WarehouseLayoutModal.tsx** (2,032 lines) into a well-organized, maintainable component architecture following the successful pattern used for warehouse settings refactoring.

**Status**: 🚧 In Progress
**Start Date**: December 17, 2025
**Target**: 2,032 lines → ~150 lines (93% reduction)
**Total New Files**: ~20 files

---

## Current State

### Original File
- **Location**: `components/warehouse/WarehouseLayoutModal.tsx`
- **Size**: 2,032 lines
- **Complexity**: Very High

### Features
- **Tree View Mode**: Hierarchical location management (Section → Aisle → Shelf → Bay → Row → Bin)
- **Visual Builder Mode**: Drag-and-drop canvas builder with zoom, pan, resize, rotate
- **Product Assignment**: Assign products to bins with search functionality
- **Inline Editing**: Edit location names and properties
- **Canvas Tools**: Library toolbar, properties panel, mini-map, hierarchy tree

### Dependencies
- `@dnd-kit/*` - Complex drag and drop functionality
- React hooks (useState, useRef, useEffect, useCallback)
- Mock warehouse data

---

## Target Structure

```
components/warehouse/layout/
├── REFACTORING_PLAN.md               ← This file
├── LAYOUT_SECTION_GUIDE.md           ← Section explanation
├── WarehouseLayoutModal.tsx          ← Main orchestrator (~150 lines)
├── types.ts                           ← TypeScript interfaces (~80 lines)
├── constants.tsx                      ← Icons, colors, labels (~100 lines)
├── utils.ts                           ← Tree helpers, utilities (~180 lines)
├── hooks/
│   ├── useLocationManagement.ts      ← Location CRUD (~150 lines)
│   ├── useCanvasInteractions.ts      ← Canvas drag/resize/pan (~150 lines)
│   ├── useVisualElements.ts          ← Visual element state (~100 lines)
│   └── index.ts                       ← Barrel export
├── tree-view/
│   ├── LocationTreeView.tsx          ← Tree container (~100 lines)
│   ├── LocationNode.tsx              ← Single tree node (~150 lines)
│   ├── ProductAssignment.tsx         ← Product picker (~80 lines)
│   └── index.ts                       ← Barrel export
├── visual-builder/
│   ├── VisualWarehouseBuilder.tsx    ← Visual orchestrator (~150 lines)
│   ├── CanvasView.tsx                ← Canvas area (~200 lines)
│   ├── CanvasElement.tsx             ← Single element (~150 lines)
│   ├── LibraryToolbar.tsx            ← Drag library (~80 lines)
│   ├── PropertiesPanel.tsx           ← Properties editor (~150 lines)
│   ├── HierarchyTreeView.tsx         ← Hierarchy sidebar (~100 lines)
│   ├── MiniMap.tsx                   ← Canvas mini-map (~50 lines)
│   ├── canvas-utils.ts               ← Canvas utilities (~100 lines)
│   └── index.ts                       ← Barrel export
└── shared/
    ├── ModalHeader.tsx                ← Reusable header (~50 lines)
    ├── ModalFooter.tsx                ← Reusable footer (~40 lines)
    └── ViewModeToggle.tsx             ← Tree/Visual toggle (~30 lines)
```

---

## Refactoring Phases

### ✅ Phase 0: Documentation (COMPLETED)
- [x] Create REFACTORING_PLAN.md (this file)
- [x] Create LAYOUT_SECTION_GUIDE.md (section explanation)

### ⏸️ Phase 1: Foundation Files (PENDING)
**Files to Create**:
- [ ] `types.ts` - All TypeScript interfaces
- [ ] `constants.tsx` - Icons, colors, labels
- [ ] `utils.ts` - Tree helpers and utilities

**Interfaces to Extract**:
- `WarehouseLocation` - Location tree node structure
- `VisualElement` - Canvas element properties
- `ProductAssignment` - Product-to-location assignment
- `WarehouseLayoutModalProps` - Modal props interface
- `ViewMode` - Type: 'tree' | 'visual'

**Constants to Extract**:
- `locationTypeIcons` - SVG icons for each level
- `levelColors` - Color coding for levels
- `levelLabels` - Display names
- Canvas grid settings (grid size, snap threshold)
- Zoom limits (min, max, step)

**Utils to Extract**:
- `buildVisualElementTree()` - Build visual elements from locations
- `searchLocations()` - Filter locations by query
- `findLocationPath()` - Get path string to location
- `traverseTree()` - Tree traversal utilities

---

### ⏸️ Phase 2: Custom Hooks (PENDING)
**Files to Create**:
- [ ] `hooks/useLocationManagement.ts` - Location state & CRUD
- [ ] `hooks/useCanvasInteractions.ts` - Canvas interactions
- [ ] `hooks/useVisualElements.ts` - Visual element state
- [ ] `hooks/index.ts` - Barrel export

#### useLocationManagement (~150 lines)
**State**:
- `locations` - Location tree
- `expandedNodes` - Set of expanded node IDs
- `editingId` - Currently editing location ID
- `searchQuery` - Location search query
- `productSearchQuery` - Product search query
- `showProductSearch` - Show product picker

**Handlers**:
- `addLocation(parentId, type)` - Add new location
- `updateLocation(id, updates)` - Update location properties
- `deleteLocation(id)` - Delete location and children
- `moveLocation(id, newParentId)` - Move location in tree
- `toggleNode(id)` - Expand/collapse node
- `assignProduct(locationId, product)` - Assign product to location
- `removeProduct(locationId, productId)` - Remove product from location

#### useCanvasInteractions (~150 lines)
**State**:
- `isPanning` - Canvas pan mode active
- `lastPanPoint` - Last pan position
- `zoom` - Current zoom level (0.5 - 2.0)
- `panOffset` - Canvas pan offset {x, y}
- `selectedElementId` - Selected canvas element ID
- `draggedItem` - Currently dragged item

**Handlers**:
- `handleZoomIn()` - Zoom in
- `handleZoomOut()` - Zoom out
- `handleResetView()` - Reset zoom/pan
- `handlePanStart(e)` - Start panning
- `handlePanMove(e)` - Pan canvas
- `handlePanEnd()` - End panning
- `handleElementSelect(id)` - Select element
- `handleElementDrag(id, position)` - Drag element

#### useVisualElements (~100 lines)
**State**:
- `visualElements` - Array of canvas elements
- `warehouseDimensions` - {width, height}

**Handlers**:
- `updateElement(id, updates)` - Update element properties
- `resizeElement(id, dimensions)` - Resize element
- `rotateElement(id, rotation)` - Rotate element
- `setWarehouseDimensions(dimensions)` - Set warehouse size

---

### ⏸️ Phase 3: Tree View Components (PENDING)
**Files to Create**:
- [ ] `tree-view/LocationTreeView.tsx` - Tree container
- [ ] `tree-view/LocationNode.tsx` - Single tree node
- [ ] `tree-view/ProductAssignment.tsx` - Product picker
- [ ] `tree-view/index.ts` - Barrel export

#### LocationTreeView (~100 lines)
**Responsibility**: Tree view container with search
**Props**: locations, expandedNodes, handlers from useLocationManagement
**Renders**: Search bar + recursive LocationNode list

#### LocationNode (~150 lines)
**Responsibility**: Single expandable tree node
**Props**: location, expanded, handlers, depth
**Features**:
- Expand/collapse button
- Inline editing
- Delete button
- Product assignment (uses ProductAssignment component)
- Nested children

#### ProductAssignment (~80 lines)
**Responsibility**: Product-to-location assignment UI
**Props**: locationId, assignedProducts, handlers
**Features**:
- Product search input
- Assigned products list
- Add/remove product buttons

---

### ⏸️ Phase 4: Visual Builder Components (PENDING)
**Files to Create**:
- [ ] `visual-builder/VisualWarehouseBuilder.tsx` - Visual orchestrator
- [ ] `visual-builder/CanvasView.tsx` - Canvas area
- [ ] `visual-builder/CanvasElement.tsx` - Single canvas element
- [ ] `visual-builder/LibraryToolbar.tsx` - Drag library
- [ ] `visual-builder/PropertiesPanel.tsx` - Properties editor
- [ ] `visual-builder/HierarchyTreeView.tsx` - Hierarchy sidebar
- [ ] `visual-builder/MiniMap.tsx` - Canvas mini-map
- [ ] `visual-builder/canvas-utils.ts` - Canvas utilities
- [ ] `visual-builder/index.ts` - Barrel export

#### VisualWarehouseBuilder (~150 lines)
**Responsibility**: Visual mode orchestrator
**Coordinates**: CanvasView, LibraryToolbar, PropertiesPanel, HierarchyTreeView, MiniMap
**Layout**: Grid layout with canvas center, toolbars around

#### CanvasView (~200 lines)
**Responsibility**: Main canvas rendering area
**Features**: Zoom, pan, grid, draggable/resizable elements
**Props**: visualElements, zoom, panOffset, handlers

#### CanvasElement (~150 lines)
**Responsibility**: Single draggable/resizable element on canvas
**Props**: element, selected, handlers
**Features**: Drag handles, resize handles, rotation handle

#### LibraryToolbar (~80 lines)
**Responsibility**: Palette of draggable element types
**Props**: onAddElement handler
**Features**: Element type buttons, zoom controls

#### PropertiesPanel (~150 lines)
**Responsibility**: Edit selected element properties
**Props**: selectedElement, onUpdate handler
**Fields**: Name, dimensions, position, rotation

#### HierarchyTreeView (~100 lines)
**Responsibility**: Sidebar tree view of canvas elements
**Props**: elements, selectedId, onSelect handler
**Features**: Hierarchical element list, selection

#### MiniMap (~50 lines)
**Responsibility**: Miniature canvas overview
**Props**: elements, viewport, onViewportChange
**Features**: Viewport indicator, click to navigate

#### canvas-utils.ts (~100 lines)
**Utilities**:
- `pointInElement(point, element)` - Hit detection
- `snapToGrid(position, gridSize)` - Grid snapping
- `calculateBounds(elements)` - Calculate canvas bounds

---

### ⏸️ Phase 5: Shared Components (PENDING)
**Files to Create**:
- [ ] `shared/ModalHeader.tsx` - Reusable header
- [ ] `shared/ModalFooter.tsx` - Reusable footer
- [ ] `shared/ViewModeToggle.tsx` - Tree/Visual toggle

#### ModalHeader (~50 lines)
**Responsibility**: Modal header with title and close button
**Props**: title, onClose, extraActions (optional)

#### ModalFooter (~40 lines)
**Responsibility**: Modal footer with action buttons
**Props**: onSave, onCancel, saveDisabled, isSaving

#### ViewModeToggle (~30 lines)
**Responsibility**: Toggle between Tree and Visual modes
**Props**: viewMode, onViewModeChange

---

### ⏸️ Phase 6: Main Orchestrator (PENDING)
**File to Refactor**:
- [ ] Refactor `WarehouseLayoutModal.tsx` from 2,032 lines to ~150 lines

**Structure**:
```typescript
import { useLocationManagement, useCanvasInteractions, useVisualElements } from './hooks';
import { LocationTreeView } from './tree-view';
import { VisualWarehouseBuilder } from './visual-builder';
import { ModalHeader, ModalFooter, ViewModeToggle } from './shared';

export default function WarehouseLayoutModal({ isOpen, onClose, locationLevels, onSave, warehouseName, warehouseId }) {
  const [viewMode, setViewMode] = useState<ViewMode>('tree');

  const locationManagement = useLocationManagement(locationLevels);
  const canvasInteractions = useCanvasInteractions();
  const visualElements = useVisualElements(locationManagement.locations);

  const handleSave = () => {
    onSave(locationManagement.locations);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <ModalHeader title={`${warehouseName} - Warehouse Layout`} onClose={onClose} />

        <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />

        {viewMode === 'tree' ? (
          <LocationTreeView {...locationManagement} />
        ) : (
          <VisualWarehouseBuilder
            {...locationManagement}
            {...canvasInteractions}
            {...visualElements}
          />
        )}

        <ModalFooter onSave={handleSave} onCancel={onClose} />
      </div>
    </div>
  );
}
```

---

### ⏸️ Phase 7: Testing & Verification (PENDING)
**Test All Functionality**:
- [ ] Open Layout Modal from warehouse settings
- [ ] **Tree View**:
  - [ ] Expand/collapse nodes
  - [ ] Add new locations
  - [ ] Edit location names inline
  - [ ] Delete locations
  - [ ] Assign products to bins
  - [ ] Search locations
- [ ] **Visual View**:
  - [ ] Switch to visual mode
  - [ ] Drag elements on canvas
  - [ ] Resize elements
  - [ ] Rotate elements
  - [ ] Zoom in/out
  - [ ] Pan canvas
  - [ ] Drag from library
  - [ ] Edit properties panel
  - [ ] Use mini-map
- [ ] **Global**:
  - [ ] Save changes
  - [ ] Cancel and close
  - [ ] No console errors
  - [ ] No TypeScript errors

---

## Code Extraction Map

### From Original File (lines → new location)

**Lines 36-142** → `types.ts`
- WarehouseLocation, VisualElement, ProductAssignment, etc.

**Lines 76-133** → `constants.tsx`
- locationTypeIcons, levelColors, levelLabels

**Lines 1853-2031** → `utils.ts`
- buildVisualElementTree(), searchLocations(), etc.

**Lines 152-481** → `hooks/useLocationManagement.ts`
- State and handlers for location management

**Lines 482-707** → `hooks/useCanvasInteractions.ts`
- Canvas interaction state and handlers

**Lines 708-953** → `tree-view/LocationNode.tsx`
- Single tree node component (currently 246 lines)

**Lines 864-918** → `tree-view/ProductAssignment.tsx`
- Product assignment UI (extracted from LocationNode)

**Lines 962-1851** → `visual-builder/VisualWarehouseBuilder.tsx`
- Visual mode orchestrator (currently 890 lines, will be split)

**Lines 1172-1418** → `visual-builder/CanvasElement.tsx`
- Single canvas element

**Lines 1476-1549** → `visual-builder/LibraryToolbar.tsx`
- Drag-from-library palette

**Lines 1690-1847** → `visual-builder/PropertiesPanel.tsx`
- Element properties editor

**Lines 1426-1472** → `visual-builder/HierarchyTreeView.tsx`
- Sidebar hierarchy tree

---

## Success Metrics

| Metric | Before | Target | Improvement |
|--------|--------|--------|-------------|
| **Main file size** | 2,032 lines | ~150 lines | **93% reduction** |
| **Largest component** | 2,032 lines | ~200 lines | **90% reduction** |
| **Average file size** | N/A | ~100 lines | **Highly maintainable** |
| **Number of files** | 1 file | ~20 files | **Better organization** |
| **Complexity** | Very High | Low | **Much easier** |

---

## Benefits

### Maintainability
- Small, focused files (50-200 lines each)
- Clear separation of concerns
- Easy to locate and modify code

### Testability
- Components can be tested in isolation
- Hooks can be unit tested separately
- Utilities are pure functions

### Reusability
- Canvas components can be used elsewhere
- Tree view components are generic
- Modal header/footer are reusable

### Performance
- Opportunity to memoize components
- Smaller re-render boundaries
- Better code splitting

### Collaboration
- Multiple developers can work on different components
- No merge conflicts in one huge file
- Clear feature ownership

---

## Notes

- **Pattern Based On**: Successful warehouse settings refactoring (1,490 → 143 lines)
- **File Naming**: PascalCase for components, camelCase for hooks, lowercase for utilities
- **Barrel Exports**: Use index.ts in each subfolder for clean imports
- **Windows Paths**: Use complete absolute paths with drive letters and backslashes

---

**Last Updated**: December 17, 2025 - Documentation Created

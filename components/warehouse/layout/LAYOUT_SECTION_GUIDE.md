# Warehouse Layout Section - Guide

## Overview

The **Warehouse Layout** section provides a comprehensive interface for designing and managing the physical structure of your warehouse. It allows you to create hierarchical location systems, assign products to specific bins, and visualize the warehouse layout on a canvas.

---

## Purpose

### What It Does

1. **Hierarchical Location Management**: Create and organize warehouse locations using up to 6 configurable levels (Section → Aisle → Shelf → Bay → Row → Bin)

2. **Product Assignment**: Assign specific products to bins for efficient picking and inventory management

3. **Visual Layout Design**: Design warehouse layouts visually using a drag-and-drop canvas builder

4. **Flexible Configuration**: Enable/disable location levels based on warehouse needs

---

## User Workflows

### 1. Tree View Mode (Location Management)

**Purpose**: Manage warehouse locations hierarchically

**Steps**:
1. Open warehouse settings
2. Click "View/Edit Warehouse Layout" on a warehouse
3. Default view shows tree structure
4. Expand/collapse location nodes
5. Add new locations at any level
6. Edit location names inline
7. Assign products to bins
8. Delete locations (with children warning)
9. Search locations by name

**Use Cases**:
- Setting up a new warehouse structure
- Adding new aisles, shelves, or bins
- Reorganizing product assignments
- Finding specific locations quickly

---

### 2. Visual Builder Mode (Canvas Design)

**Purpose**: Design warehouse layout visually with drag-and-drop

**Steps**:
1. Switch to "Visual" mode using toggle
2. See canvas with existing locations rendered as rectangles
3. Drag elements to reposition
4. Resize elements using corner handles
5. Rotate elements using rotation handle
6. Add new elements from library toolbar
7. Edit element properties in properties panel
8. Use mini-map for navigation on large layouts
9. Zoom in/out for detailed editing
10. Pan canvas to view different areas

**Use Cases**:
- Designing a new warehouse from scratch
- Visualizing warehouse floor plan
- Optimizing space utilization
- Planning warehouse expansion
- Creating warehouse documentation

---

## Features Breakdown

### Tree View Features

#### Location Hierarchy
- **6 Configurable Levels**:
  - Section (e.g., "A", "B", "C")
  - Aisle (e.g., "1", "2", "3")
  - Shelf (e.g., "A", "B", "C")
  - Bay (e.g., "1", "2", "3")
  - Row (e.g., "Top", "Middle", "Bottom")
  - Bin (e.g., "001", "002", "003")

- **Example Path**: `Section A > Aisle 1 > Shelf B > Bay 2 > Row Top > Bin 005`

#### Location Operations
- **Add Location**: Click "+" icon on any node to add child location
- **Edit Location**: Click location name to edit inline
- **Delete Location**: Click trash icon (warns if location has children)
- **Expand/Collapse**: Click chevron icon to expand/collapse children

#### Product Assignment
- **Assign Products**:
  - Click "Assign Product" button on bin-level locations
  - Search products by name or SKU
  - Select product from search results
  - View assigned products in bin details

- **Remove Products**: Click "×" on assigned product to unassign

#### Search Functionality
- **Location Search**: Type in search bar to filter locations
- **Highlights**: Matching locations are highlighted
- **Automatic Expansion**: Parent nodes automatically expand to show matches

---

### Visual Builder Features

#### Canvas View
- **Grid**: Background grid for alignment (default: 20px)
- **Zoom**: Zoom in/out (range: 50% - 200%)
- **Pan**: Click and drag canvas to pan
- **Reset View**: Button to reset zoom and pan to defaults

#### Elements
- **Visual Elements**: Each location is represented as a colored rectangle
- **Color Coding**: Colors match location level (e.g., sections = blue, aisles = green)
- **Labels**: Element names are displayed inside rectangles
- **Selection**: Click element to select (highlighted border)

#### Element Manipulation
- **Drag**: Click and drag to reposition
- **Resize**: Drag corner handles to resize
- **Rotate**: Drag rotation handle to rotate
- **Snap to Grid**: Elements snap to grid when dragging (optional)

#### Library Toolbar
- **Element Types**: Buttons for common warehouse elements (section, aisle, shelf, etc.)
- **Drag to Add**: Drag element type from toolbar to canvas
- **Zoom Controls**: +/- buttons to zoom in/out

#### Properties Panel
- **Selected Element Properties**:
  - Name: Text input
  - Width: Number input (in grid units)
  - Height: Number input (in grid units)
  - X Position: Number input
  - Y Position: Number input
  - Rotation: Number input (degrees)

- **Updates**: Changes update canvas in real-time

#### Hierarchy Tree View (Sidebar)
- **Purpose**: View all canvas elements hierarchically
- **Selection**: Click element in tree to select on canvas
- **Sync**: Tree and canvas selection are synchronized

#### Mini-Map
- **Purpose**: Navigate large canvases easily
- **Viewport Indicator**: Shows current visible area
- **Click to Navigate**: Click anywhere on mini-map to jump to that area
- **Zoom Level**: Mini-map adjusts to show entire layout

---

## Data Structure

### Location Hierarchy (Tree View)

```typescript
interface WarehouseLocation {
  id: string;                    // Unique identifier
  name: string;                  // Display name (e.g., "Section A")
  type: string;                  // Level type (section, aisle, shelf, etc.)
  parentId: string | null;       // Parent location ID
  children: WarehouseLocation[]; // Child locations
  products?: ProductAssignment[]; // Assigned products (bins only)
}

interface ProductAssignment {
  productId: string;
  productName: string;
  sku: string;
  assignedAt: Date;
}
```

**Example Tree**:
```
Section A (id: "sec-a")
├── Aisle 1 (id: "a1", parentId: "sec-a")
│   ├── Shelf A (id: "a1-sa", parentId: "a1")
│   │   ├── Bay 1 (id: "a1-sa-b1", parentId: "a1-sa")
│   │   │   ├── Row Top (id: "a1-sa-b1-rt", parentId: "a1-sa-b1")
│   │   │   │   ├── Bin 001 (id: "bin-001", parentId: "a1-sa-b1-rt")
│   │   │   │   │   └── Products: [Product A, Product B]
```

---

### Visual Elements (Canvas View)

```typescript
interface VisualElement {
  id: string;                // Unique identifier
  locationId: string;        // Linked location ID from tree
  name: string;              // Display name
  type: string;              // Element type (section, aisle, etc.)
  position: { x: number; y: number }; // Canvas position (pixels)
  dimensions: { width: number; height: number }; // Size (pixels)
  rotation: number;          // Rotation angle (degrees)
  color: string;             // Fill color
  parentId: string | null;   // Parent element ID (for hierarchy)
}
```

**Example Visual Element**:
```typescript
{
  id: "ve-sec-a",
  locationId: "sec-a",
  name: "Section A",
  type: "section",
  position: { x: 100, y: 100 },
  dimensions: { width: 400, height: 300 },
  rotation: 0,
  color: "#3b82f6",
  parentId: null
}
```

---

## Integration with Warehouse Settings

### Props Interface

```typescript
interface WarehouseLayoutModalProps {
  isOpen: boolean;                  // Modal open state
  onClose: () => void;              // Close handler
  locationLevels: LocationLevel[];  // Enabled location levels
  onSave: (locations: WarehouseLocation[]) => void; // Save handler
  warehouseName: string;            // Warehouse name for title
  warehouseId: string;              // Warehouse ID
}
```

### Opening the Modal

From warehouse settings:
```typescript
<button onClick={() => setShowLayoutModal(warehouseId)}>
  View/Edit Warehouse Layout
</button>

{showLayoutModal && (
  <WarehouseLayoutModal
    isOpen={true}
    onClose={() => setShowLayoutModal(null)}
    locationLevels={warehouse.settings.locationLevels}
    onSave={(levels) => updateLocationLevels(warehouseId, levels)}
    warehouseName={warehouse.name}
    warehouseId={warehouseId}
  />
)}
```

---

## Business Rules

### Location Hierarchy Rules

1. **Maximum 6 Levels**: Section → Aisle → Shelf → Bay → Row → Bin
2. **Level Order**: Must follow defined order (can't have Shelf without Section and Aisle)
3. **Unique IDs**: Each location must have unique ID within warehouse
4. **Parent-Child Relationship**: Locations must have valid parent (except root sections)

### Product Assignment Rules

1. **Bin-Level Only**: Products can only be assigned to bin-level locations (lowest level)
2. **Multiple Products per Bin**: A bin can have multiple products assigned
3. **Unique Assignment**: A product can only be assigned to one bin at a time (per warehouse)

### Visual Builder Rules

1. **Grid Snapping**: Elements snap to grid when "Snap to Grid" is enabled
2. **Minimum Size**: Elements have minimum width/height (e.g., 50px)
3. **Canvas Bounds**: Elements cannot be placed outside warehouse dimensions
4. **Zoom Limits**: Zoom range is 50% - 200%

---

## Use Cases

### Small Warehouse (Simplified Structure)
- **Levels Used**: Section → Bin
- **Example**:
  - Section A → Bin 001, Bin 002, Bin 003
  - Section B → Bin 001, Bin 002, Bin 003
- **Disabled Levels**: Aisle, Shelf, Bay, Row

### Medium Warehouse (Moderate Complexity)
- **Levels Used**: Section → Aisle → Shelf → Bin
- **Example**:
  - Section A → Aisle 1 → Shelf A → Bin 001
  - Section A → Aisle 2 → Shelf B → Bin 002
- **Disabled Levels**: Bay, Row

### Large Warehouse (Full Hierarchy)
- **Levels Used**: All 6 levels
- **Example**: Section A → Aisle 1 → Shelf B → Bay 2 → Row Top → Bin 005
- **Benefits**: Maximum organization and precision

---

## Future Enhancements (Planned)

### Phase 1 (Backend Integration)
- Replace mock data with actual API calls
- Persist location changes to database
- Real-time product assignment updates

### Phase 2 (Advanced Features)
- **Import/Export**: Export layout to JSON, import from JSON
- **Templates**: Save common warehouse layouts as templates
- **Bulk Operations**: Add multiple bins at once
- **Copy/Paste**: Duplicate locations or elements

### Phase 3 (Optimization)
- **Keyboard Shortcuts**: Arrow keys to move elements, Delete to remove, etc.
- **Undo/Redo**: Ctrl+Z to undo, Ctrl+Y to redo
- **Multi-Select**: Select multiple elements, move/resize together
- **Alignment Tools**: Align selected elements (left, center, right, top, middle, bottom)

### Phase 4 (Integration)
- **QR Code Generation**: Auto-generate QR codes for all locations
- **3D Visualization**: 3D view of warehouse layout
- **Heatmaps**: Show product movement heatmaps
- **Analytics**: Space utilization, picking efficiency

---

## Technical Implementation

### Component Architecture

After refactoring, the layout modal is organized into:

1. **Foundation**: types.ts, constants.tsx, utils.ts
2. **Hooks**: useLocationManagement.ts, useCanvasInteractions.ts, useVisualElements.ts
3. **Tree View**: LocationTreeView.tsx, LocationNode.tsx, ProductAssignment.tsx
4. **Visual Builder**: VisualWarehouseBuilder.tsx, CanvasView.tsx, CanvasElement.tsx, etc.
5. **Shared**: ModalHeader.tsx, ModalFooter.tsx, ViewModeToggle.tsx
6. **Main Orchestrator**: WarehouseLayoutModal.tsx (~150 lines)

### State Management

- **Tree State**: Managed by `useLocationManagement` hook
- **Canvas State**: Managed by `useCanvasInteractions` and `useVisualElements` hooks
- **No Global State**: All state is local to the modal

### Performance Considerations

- **Memoization**: Components are memoized to prevent unnecessary re-renders
- **Virtualization**: For large trees, consider react-window for virtualization
- **Debouncing**: Canvas interactions are debounced for smooth performance

---

## Testing Guidelines

### Manual Testing Checklist

- [ ] **Tree View**:
  - [ ] Expand/collapse all location levels
  - [ ] Add locations at each level
  - [ ] Edit location names
  - [ ] Delete locations (with/without children)
  - [ ] Search locations
  - [ ] Assign products to bins
  - [ ] Remove products from bins

- [ ] **Visual View**:
  - [ ] Switch between Tree and Visual modes
  - [ ] Drag elements on canvas
  - [ ] Resize elements
  - [ ] Rotate elements
  - [ ] Zoom in/out
  - [ ] Pan canvas
  - [ ] Add elements from library
  - [ ] Edit properties panel
  - [ ] Use mini-map navigation

- [ ] **Data Persistence**:
  - [ ] Save changes
  - [ ] Cancel and verify no changes saved
  - [ ] Reopen modal and verify saved changes persist

---

## Support and Troubleshooting

### Common Issues

**Issue**: Can't add product to location
- **Solution**: Ensure location is bin-level (lowest enabled level)

**Issue**: Can't delete location
- **Solution**: Delete all child locations first, or confirm cascade delete

**Issue**: Canvas elements not visible
- **Solution**: Check zoom level, reset view, or verify elements are within canvas bounds

**Issue**: Changes not saving
- **Solution**: Click "Save" button before closing modal

---

## Related Documentation

- [REFACTORING_PLAN.md](./REFACTORING_PLAN.md) - Technical refactoring plan
- [Warehouse Settings Guide](../settings/SETTINGS_BUILD_PLAN.md) - Overall settings documentation
- [QR Codes Guide](../qr-codes/QR_CODES_GUIDE.md) - QR code generation (coming soon)

---

**Last Updated**: December 17, 2025
**Version**: 2.0 (Post-refactoring)

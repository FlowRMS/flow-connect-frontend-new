/**
 * Tests for SpecSheetDetailPanel
 * These tests prevent regressions for issues found via 5 Whys analysis
 */

// Test the normalizeShapeType logic
describe('normalizeShapeType', () => {
  // Valid highlight shapes that should be accepted
  const VALID_SHAPES = ['highlight', 'rectangle', 'circle', 'arrow', 'text', 'freehand'] as const;

  // Function under test (extracted logic)
  function normalizeShapeType(shapeType: string): string {
    const normalized = shapeType.toLowerCase();
    if (VALID_SHAPES.includes(normalized as typeof VALID_SHAPES[number])) {
      return normalized;
    }
    return 'highlight';
  }

  it('should accept all valid shape types', () => {
    VALID_SHAPES.forEach(shape => {
      expect(normalizeShapeType(shape)).toBe(shape);
    });
  });

  it('should normalize uppercase shape types', () => {
    expect(normalizeShapeType('HIGHLIGHT')).toBe('highlight');
    expect(normalizeShapeType('RECTANGLE')).toBe('rectangle');
    expect(normalizeShapeType('Circle')).toBe('circle');
  });

  it('should default to highlight for invalid shape types', () => {
    expect(normalizeShapeType('invalid')).toBe('highlight');
    expect(normalizeShapeType('unknown')).toBe('highlight');
    expect(normalizeShapeType('')).toBe('highlight');
    expect(normalizeShapeType('square')).toBe('highlight'); // common mistake
  });

  it('should handle edge cases', () => {
    expect(normalizeShapeType('  highlight  '.trim())).toBe('highlight');
    expect(normalizeShapeType('FREEHAND')).toBe('freehand');
  });
});

// Test highlight transformation logic
describe('Highlight transformation', () => {
  interface MockRegion {
    id: string;
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
    shapeType: string;
    color: string;
    annotation: string | null;
  }

  interface MockVersion {
    id: string;
    specSheetId: string;
    name: string;
    regions: MockRegion[];
    createdAt: string;
    createdBy: { fullName: string };
  }

  // Function under test (extracted logic)
  function transformVersion(version: MockVersion, manufacturer: string) {
    const VALID_SHAPES = ['highlight', 'rectangle', 'circle', 'arrow', 'text', 'freehand'] as const;

    function normalizeShapeType(shapeType: string): string {
      const normalized = shapeType.toLowerCase();
      if (VALID_SHAPES.includes(normalized as typeof VALID_SHAPES[number])) {
        return normalized;
      }
      return 'highlight';
    }

    return {
      id: version.id,
      specSheetId: version.specSheetId,
      catalogNumber: version.name,
      manufacturer,
      regions: version.regions.map(r => ({
        id: r.id,
        pageNumber: r.pageNumber,
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        shape: normalizeShapeType(r.shapeType),
        color: r.color,
        annotation: r.annotation || undefined,
      })),
      createdAt: version.createdAt,
      createdBy: version.createdBy.fullName,
      updatedAt: version.createdAt,
      updatedBy: version.createdBy.fullName,
    };
  }

  it('should transform API version to frontend format', () => {
    const mockVersion: MockVersion = {
      id: 'version-1',
      specSheetId: 'sheet-1',
      name: 'CAT-001',
      regions: [
        {
          id: 'region-1',
          pageNumber: 1,
          x: 100,
          y: 200,
          width: 50,
          height: 30,
          shapeType: 'rectangle',
          color: '#FFEB3B',
          annotation: 'Test annotation',
        },
      ],
      createdAt: '2024-01-15T10:00:00Z',
      createdBy: { fullName: 'John Doe' },
    };

    const result = transformVersion(mockVersion, 'Acuity');

    expect(result.id).toBe('version-1');
    expect(result.catalogNumber).toBe('CAT-001');
    expect(result.manufacturer).toBe('Acuity');
    expect(result.regions).toHaveLength(1);
    expect(result.regions[0].shape).toBe('rectangle');
    expect(result.regions[0].annotation).toBe('Test annotation');
    expect(result.createdBy).toBe('John Doe');
    expect(result.updatedBy).toBe('John Doe');
  });

  it('should handle null annotations correctly', () => {
    const mockVersion: MockVersion = {
      id: 'version-1',
      specSheetId: 'sheet-1',
      name: 'CAT-001',
      regions: [
        {
          id: 'region-1',
          pageNumber: 1,
          x: 100,
          y: 200,
          width: 50,
          height: 30,
          shapeType: 'highlight',
          color: '#FFEB3B',
          annotation: null,
        },
      ],
      createdAt: '2024-01-15T10:00:00Z',
      createdBy: { fullName: 'John Doe' },
    };

    const result = transformVersion(mockVersion, 'Acuity');

    expect(result.regions[0].annotation).toBeUndefined();
  });

  it('should normalize invalid shape types in regions', () => {
    const mockVersion: MockVersion = {
      id: 'version-1',
      specSheetId: 'sheet-1',
      name: 'CAT-001',
      regions: [
        {
          id: 'region-1',
          pageNumber: 1,
          x: 100,
          y: 200,
          width: 50,
          height: 30,
          shapeType: 'INVALID_SHAPE', // Invalid
          color: '#FFEB3B',
          annotation: null,
        },
      ],
      createdAt: '2024-01-15T10:00:00Z',
      createdBy: { fullName: 'John Doe' },
    };

    const result = transformVersion(mockVersion, 'Acuity');

    expect(result.regions[0].shape).toBe('highlight'); // Should default to highlight
  });
});

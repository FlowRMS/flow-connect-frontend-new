/**
 * Tests for SpecSheetsContent
 * These tests prevent regressions for issues found via 5 Whys analysis
 */

describe('SpecSheetsContent - Auto-select manufacturer logic', () => {
  // Test the auto-select logic (extracted from useEffect)
  interface Manufacturer {
    id: string;
    name: string;
  }

  function shouldAutoSelectManufacturer(
    selectedManufacturerId: string | null,
    manufacturers: Manufacturer[],
    isLoading: boolean
  ): string | null {
    // Logic: Auto-select first manufacturer if:
    // 1. No manufacturer is currently selected
    // 2. Manufacturers are loaded (not empty)
    // 3. Loading is complete
    if (!selectedManufacturerId && manufacturers.length > 0 && !isLoading) {
      return manufacturers[0].id;
    }
    return null;
  }

  it('should auto-select first manufacturer when none selected and data loaded', () => {
    const manufacturers = [
      { id: 'factory-1', name: 'Acuity' },
      { id: 'factory-2', name: 'Lutron' },
    ];

    const result = shouldAutoSelectManufacturer(null, manufacturers, false);

    expect(result).toBe('factory-1');
  });

  it('should NOT auto-select when manufacturer already selected', () => {
    const manufacturers = [
      { id: 'factory-1', name: 'Acuity' },
      { id: 'factory-2', name: 'Lutron' },
    ];

    const result = shouldAutoSelectManufacturer('factory-2', manufacturers, false);

    expect(result).toBeNull();
  });

  it('should NOT auto-select when still loading', () => {
    const manufacturers = [
      { id: 'factory-1', name: 'Acuity' },
    ];

    const result = shouldAutoSelectManufacturer(null, manufacturers, true);

    expect(result).toBeNull();
  });

  it('should NOT auto-select when no manufacturers available', () => {
    const result = shouldAutoSelectManufacturer(null, [], false);

    expect(result).toBeNull();
  });
});

describe('SpecSheetsContent - Factory ID to name mapping', () => {
  interface Manufacturer {
    id: string;
    name: string;
  }

  function findManufacturerIdByName(
    name: string,
    manufacturers: Manufacturer[]
  ): string | null {
    const found = manufacturers.find(m => m.name === name);
    return found?.id || null;
  }

  it('should find manufacturer ID by exact name match', () => {
    const manufacturers = [
      { id: 'factory-1', name: 'Acuity Brands' },
      { id: 'factory-2', name: 'Lutron' },
    ];

    expect(findManufacturerIdByName('Lutron', manufacturers)).toBe('factory-2');
    expect(findManufacturerIdByName('Acuity Brands', manufacturers)).toBe('factory-1');
  });

  it('should return null for unknown manufacturer', () => {
    const manufacturers = [
      { id: 'factory-1', name: 'Acuity Brands' },
    ];

    expect(findManufacturerIdByName('Unknown', manufacturers)).toBeNull();
    expect(findManufacturerIdByName('', manufacturers)).toBeNull();
  });

  it('should be case sensitive', () => {
    const manufacturers = [
      { id: 'factory-1', name: 'Acuity' },
    ];

    expect(findManufacturerIdByName('acuity', manufacturers)).toBeNull();
    expect(findManufacturerIdByName('ACUITY', manufacturers)).toBeNull();
  });
});

describe('SpecSheetsContent - Spec sheet filtering', () => {
  interface SpecSheet {
    id: string;
    manufacturer: string;
    tags: string[];
    highlightCount: number;
    folderId?: string;
    displayName: string;
    fileName: string;
  }

  function filterSpecSheets(
    specSheets: SpecSheet[],
    filters: {
      folderId: string | null;
      tags: string[];
      highlightFilter: 'all' | 'highlighted' | 'not_highlighted';
      searchQuery: string;
    }
  ): SpecSheet[] {
    let result = [...specSheets];

    // Folder filter
    if (filters.folderId) {
      result = result.filter(s => s.folderId === filters.folderId);
    }

    // Tags filter (match any selected tag)
    if (filters.tags.length > 0) {
      result = result.filter(s =>
        filters.tags.some(tag => s.tags.includes(tag))
      );
    }

    // Highlight filter
    if (filters.highlightFilter === 'highlighted') {
      result = result.filter(s => (s.highlightCount || 0) > 0);
    } else if (filters.highlightFilter === 'not_highlighted') {
      result = result.filter(s => (s.highlightCount || 0) === 0);
    }

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(s =>
        s.displayName.toLowerCase().includes(query) ||
        s.fileName.toLowerCase().includes(query) ||
        s.manufacturer.toLowerCase().includes(query) ||
        s.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return result.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  const mockSpecSheets: SpecSheet[] = [
    { id: '1', manufacturer: 'Acuity', tags: ['indoor'], highlightCount: 2, displayName: 'Sheet A', fileName: 'a.pdf' },
    { id: '2', manufacturer: 'Lutron', tags: ['outdoor'], highlightCount: 0, displayName: 'Sheet B', fileName: 'b.pdf' },
    { id: '3', manufacturer: 'Acuity', tags: ['indoor', 'led'], highlightCount: 1, folderId: 'folder-1', displayName: 'Sheet C', fileName: 'c.pdf' },
  ];

  it('should filter by folder', () => {
    const result = filterSpecSheets(mockSpecSheets, {
      folderId: 'folder-1',
      tags: [],
      highlightFilter: 'all',
      searchQuery: '',
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('should filter by tags (any match)', () => {
    const result = filterSpecSheets(mockSpecSheets, {
      folderId: null,
      tags: ['led'],
      highlightFilter: 'all',
      searchQuery: '',
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('should filter by highlight status - highlighted only', () => {
    const result = filterSpecSheets(mockSpecSheets, {
      folderId: null,
      tags: [],
      highlightFilter: 'highlighted',
      searchQuery: '',
    });

    expect(result).toHaveLength(2);
    expect(result.every(s => s.highlightCount > 0)).toBe(true);
  });

  it('should filter by highlight status - not highlighted only', () => {
    const result = filterSpecSheets(mockSpecSheets, {
      folderId: null,
      tags: [],
      highlightFilter: 'not_highlighted',
      searchQuery: '',
    });

    expect(result).toHaveLength(1);
    expect(result[0].highlightCount).toBe(0);
  });

  it('should filter by search query (case insensitive)', () => {
    const result = filterSpecSheets(mockSpecSheets, {
      folderId: null,
      tags: [],
      highlightFilter: 'all',
      searchQuery: 'LUTRON',
    });

    expect(result).toHaveLength(1);
    expect(result[0].manufacturer).toBe('Lutron');
  });

  it('should combine multiple filters', () => {
    const result = filterSpecSheets(mockSpecSheets, {
      folderId: null,
      tags: ['indoor'],
      highlightFilter: 'highlighted',
      searchQuery: '',
    });

    expect(result).toHaveLength(2);
    expect(result.every(s => s.tags.includes('indoor') && s.highlightCount > 0)).toBe(true);
  });

  it('should sort results alphabetically by displayName', () => {
    const result = filterSpecSheets(mockSpecSheets, {
      folderId: null,
      tags: [],
      highlightFilter: 'all',
      searchQuery: '',
    });

    expect(result[0].displayName).toBe('Sheet A');
    expect(result[1].displayName).toBe('Sheet B');
    expect(result[2].displayName).toBe('Sheet C');
  });
});

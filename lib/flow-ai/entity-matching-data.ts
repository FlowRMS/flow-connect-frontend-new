import type { EntityMatch } from '@/components/flow-ai/types/entity-matching';

// Helper to generate random line numbers
export const generateLines = (count: number, max: number = 500): number[] => {
  const lines = new Set<number>();
  while (lines.size < count) {
    lines.add(Math.floor(Math.random() * max) + 1);
  }
  return Array.from(lines).sort((a, b) => a - b);
};

// Mock Manufacturers
export const mockManufacturers: EntityMatch[] = [
  {
    id: 'm1',
    spreadsheetName: 'Acme Manufacturing Inc',
    spreadsheetData: {
      address: '123 Industrial Pkwy, Houston, TX 77001',
      lines: generateLines(158),
      rawValue: 'ACME MFG INC'
    },
    matchType: 'ai',
    confidence: 95,
    reasoning: 'High similarity in name, same ZIP code, appears together in 158 past confirmed matches.',
    pastConfirmations: 158,
    suggestedMatch: {
      id: 'db-m-001',
      name: 'Acme Manufacturing Inc.'
    },
    alternativeMatches: [
      { id: 'db-m-002', name: 'Acme Manufacturing Corp', confidence: 92 },
      { id: 'db-m-003', name: 'Acme Industries Inc', confidence: 88 },
      { id: 'db-m-004', name: 'ACME MFG Company', confidence: 85 },
      { id: 'db-m-005', name: 'Acme Industrial Manufacturing', confidence: 82 }
    ],
    status: 'auto',
    selected: false
  }
];

// Mock Customers
const customerNames = [
  'Industrial Supply Co', 'Metro Distributors LLC', 'Apex Trading Company', 'Summit Industrial Group',
  'Precision Parts & Supply', 'National Equipment Corp', 'Premier Wholesale Inc', 'Atlantic Distribution',
  'Delta Supply Chain Solutions', 'Continental Parts Co', 'Global Industrial Partners', 'Regional Supply House',
  'Northwest Equipment LLC', 'Southeastern Distributors', 'Midwest Industrial Supply'
];

export const mockCustomers: EntityMatch[] = customerNames.map((name, i) => {
  const isNoMatch = i === 2 || i === 7;

  if (isNoMatch) {
    return {
      id: `c${i + 1}`,
      spreadsheetName: name,
      spreadsheetData: {
        address: `${100 + i * 50} Commerce St, City ${i + 1}, TX 7${String(i).padStart(4, '0')}`,
        lines: generateLines(Math.floor(Math.random() * 15) + 5),
        rawValue: name.toUpperCase().substring(0, 20)
      },
      matchType: 'ai',
      confidence: 0,
      reasoning: 'No suitable matches found in the database. This appears to be a new entity.',
      pastConfirmations: 0,
      suggestedMatch: { id: '', name: '' },
      alternativeMatches: [],
      status: 'no-match' as const,
      selected: false
    };
  }

  const confidence = 75 + Math.floor(Math.random() * 25);
  const needsReview = confidence < 90;

  return {
    id: `c${i + 1}`,
    spreadsheetName: name,
    spreadsheetData: {
      address: `${100 + i * 50} Commerce St, City ${i + 1}, TX 7${String(i).padStart(4, '0')}`,
      lines: generateLines(Math.floor(Math.random() * 15) + 5),
      rawValue: name.toUpperCase().substring(0, 20)
    },
    matchType: confidence === 100 ? 'perfect' : 'ai',
    confidence,
    reasoning: confidence === 100
      ? 'Exact text match on company name and address.'
      : needsReview
        ? 'Moderate name similarity, different address format, requires verification.'
        : 'High name similarity, matching address pattern, consistent with past records.',
    pastConfirmations: Math.floor(Math.random() * 30),
    suggestedMatch: {
      id: `db-c-${String(i + 1).padStart(3, '0')}`,
      name: name
    },
    alternativeMatches: [
      { id: `db-c-alt1-${i}`, name: `${name} Inc`, confidence: confidence - 5 },
      { id: `db-c-alt2-${i}`, name: `${name.split(' ')[0]} Group`, confidence: confidence - 8 },
      { id: `db-c-alt3-${i}`, name: `${name} LLC`, confidence: confidence - 11 },
      { id: `db-c-alt4-${i}`, name: `${name.split(' ')[0]} ${name.split(' ')[1] || 'Corp'}`, confidence: confidence - 14 }
    ],
    status: needsReview ? 'needs-review' : 'auto',
    selected: false
  };
});

// Mock End Users
const endUserNames = [
  'Houston Refinery Operations', 'Dallas Water Treatment Plant', 'Austin Energy Facility',
  'San Antonio Chemical Plant', 'Fort Worth Manufacturing', 'El Paso Processing Center',
  'Corpus Christi Terminal', 'Arlington Industrial Park', 'Plano Tech Campus',
  'Lubbock Agricultural Center', 'Amarillo Energy Station', 'Laredo Border Facility',
  'Tyler Production Plant', 'Waco Distribution Hub', 'Midland Oil & Gas',
  'Beaumont Petrochemical', 'Galveston Port Authority', 'McKinney Data Center',
  'Frisco Industrial Complex', 'Denton Manufacturing Co'
];

export const mockEndUsers: EntityMatch[] = endUserNames.map((name, i) => {
  const confidence = 70 + Math.floor(Math.random() * 30);
  const needsReview = confidence < 90;

  return {
    id: `e${i + 1}`,
    spreadsheetName: name,
    spreadsheetData: {
      address: `${200 + i * 75} Industrial Blvd, City ${i + 1}, TX 7${String(i).padStart(4, '0')}`,
      lines: generateLines(Math.floor(Math.random() * 12) + 3),
      rawValue: name.toUpperCase().substring(0, 25)
    },
    matchType: confidence > 95 ? 'perfect' : 'ai',
    confidence,
    reasoning: confidence > 95
      ? 'Exact match on facility name and location.'
      : needsReview
        ? 'Partial name match, location data differs slightly, manual verification recommended.'
        : 'Strong name match, location consistent with known facility address.',
    pastConfirmations: Math.floor(Math.random() * 20),
    suggestedMatch: {
      id: `db-e-${String(i + 1).padStart(3, '0')}`,
      name: name
    },
    alternativeMatches: [
      { id: `db-e-alt1-${i}`, name: `${name} Facility`, confidence: confidence - 4 },
      { id: `db-e-alt2-${i}`, name: `${name.split(' ')[0]} Operations`, confidence: confidence - 7 },
      { id: `db-e-alt3-${i}`, name: `${name} Plant`, confidence: confidence - 10 },
      { id: `db-e-alt4-${i}`, name: `${name.split(' ')[0]} ${name.split(' ')[1] || 'Facility'}`, confidence: confidence - 13 }
    ],
    status: needsReview ? 'needs-review' : 'auto',
    selected: false
  };
});

// Mock Products
const productTypes = ['Ball Valve', 'Gate Valve', 'Check Valve', 'Globe Valve', 'Butterfly Valve'];
const sizes = ['1/2"', '3/4"', '1"', '1-1/2"', '2"', '3"', '4"', '6"', '8"'];
const classes = ['150#', '300#', '600#'];
const materials = ['CF8M', 'WCB', 'Bronze', 'SS316'];

export const mockProducts: EntityMatch[] = Array.from({ length: 45 }, (_, i) => {
  const type = productTypes[i % productTypes.length];
  const size = sizes[i % sizes.length];
  const cls = classes[i % classes.length];
  const material = materials[i % materials.length];
  const name = `${type} ${size} ${cls} ${material}`;
  const partNumber = `${type.substring(0, 2).toUpperCase()}-${size.replace(/"/g, '')}-${cls.replace('#', '')}-${material}`;

  const confidence = 65 + Math.floor(Math.random() * 35);
  const needsReview = confidence < 90;

  const altMaterial1 = materials[(i + 1) % materials.length];
  const altMaterial2 = materials[(i + 2) % materials.length];

  return {
    id: `p${i + 1}`,
    spreadsheetName: name,
    spreadsheetData: {
      lines: generateLines(Math.floor(Math.random() * 8) + 2),
      rawValue: partNumber
    },
    matchType: confidence > 95 ? 'id' : 'ai',
    confidence,
    reasoning: confidence > 95
      ? 'Matched by part number from factory catalog.'
      : needsReview
        ? 'Matched by part number pattern and material spec. Factory and category need confirmation.'
        : 'Strong match on part number and specifications, verified against catalog.',
    pastConfirmations: Math.floor(Math.random() * 15),
    suggestedMatch: {
      id: `db-p-${String(i + 1).padStart(3, '0')}`,
      name: name
    },
    alternativeMatches: [
      { id: `db-p-alt1-${i}`, name: `${type} ${size} ${cls} ${altMaterial1}`, confidence: confidence - 3 },
      { id: `db-p-alt2-${i}`, name: `${type} ${size} ${cls}`, confidence: confidence - 6 },
      { id: `db-p-alt3-${i}`, name: `${type} ${size} ${altMaterial2}`, confidence: confidence - 9 },
      { id: `db-p-alt4-${i}`, name: `${productTypes[(i + 1) % productTypes.length]} ${size} ${cls} ${material}`, confidence: confidence - 12 }
    ],
    status: needsReview ? 'needs-review' : 'auto',
    selected: false
  };
});






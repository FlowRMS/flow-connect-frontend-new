// Map constants for territory selection

// TopoJSON URLs
export const stateGeoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';
export const countyGeoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json';

// State abbreviation to FIPS code mapping
export const stateFipsMap: Record<string, string> = {
  AL: '01', AK: '02', AZ: '04', AR: '05', CA: '06',
  CO: '08', CT: '09', DE: '10', DC: '11', FL: '12',
  GA: '13', HI: '15', ID: '16', IL: '17', IN: '18',
  IA: '19', KS: '20', KY: '21', LA: '22', ME: '23',
  MD: '24', MA: '25', MI: '26', MN: '27', MS: '28',
  MO: '29', MT: '30', NE: '31', NV: '32', NH: '33',
  NJ: '34', NM: '35', NY: '36', NC: '37', ND: '38',
  OH: '39', OK: '40', OR: '41', PA: '42', RI: '44',
  SC: '45', SD: '46', TN: '47', TX: '48', UT: '49',
  VT: '50', VA: '51', WA: '53', WV: '54', WI: '55',
  WY: '56', PR: '72',
};

// FIPS code to state abbreviation mapping (reverse)
export const fipsToStateAbbr: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
  '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
  '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN',
  '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
  '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS',
  '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
  '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
  '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI',
  '56': 'WY', '72': 'PR',
};

// State center coordinates for county map zooming
export const stateCoordinates: Record<string, { center: [number, number]; zoom: number }> = {
  AL: { center: [-86.9, 32.8], zoom: 6 },
  AK: { center: [-154, 64], zoom: 2.5 },
  AZ: { center: [-111.9, 34.2], zoom: 5 },
  AR: { center: [-92.4, 34.9], zoom: 6 },
  CA: { center: [-119.4, 37.2], zoom: 4.5 },
  CO: { center: [-105.5, 39], zoom: 5.5 },
  CT: { center: [-72.7, 41.6], zoom: 10 },
  DE: { center: [-75.5, 39], zoom: 10 },
  DC: { center: [-77, 38.9], zoom: 50 },
  FL: { center: [-81.5, 28.5], zoom: 5 },
  GA: { center: [-83.5, 32.7], zoom: 5.5 },
  HI: { center: [-155.5, 20], zoom: 5 },
  ID: { center: [-114.7, 44.1], zoom: 4.5 },
  IL: { center: [-89.4, 40], zoom: 5 },
  IN: { center: [-86.3, 39.8], zoom: 6 },
  IA: { center: [-93.5, 42], zoom: 5.5 },
  KS: { center: [-98.4, 38.5], zoom: 5.5 },
  KY: { center: [-85.8, 37.8], zoom: 6 },
  LA: { center: [-91.9, 31], zoom: 6 },
  ME: { center: [-69, 45.3], zoom: 5.5 },
  MD: { center: [-76.6, 39.05], zoom: 7.5 },
  MA: { center: [-71.8, 42.2], zoom: 8 },
  MI: { center: [-85.6, 44.3], zoom: 4.5 },
  MN: { center: [-94.6, 46.4], zoom: 4.5 },
  MS: { center: [-89.7, 32.7], zoom: 5.5 },
  MO: { center: [-92.6, 38.5], zoom: 5 },
  MT: { center: [-110, 47], zoom: 4.5 },
  NE: { center: [-99.9, 41.5], zoom: 5 },
  NV: { center: [-116.6, 39], zoom: 4.5 },
  NH: { center: [-71.6, 43.7], zoom: 7 },
  NJ: { center: [-74.4, 40.1], zoom: 8 },
  NM: { center: [-106.2, 34.5], zoom: 5 },
  NY: { center: [-75.5, 43], zoom: 5 },
  NC: { center: [-79.4, 35.5], zoom: 5.5 },
  ND: { center: [-100.5, 47.4], zoom: 5.5 },
  OH: { center: [-82.8, 40.2], zoom: 6 },
  OK: { center: [-97.5, 35.5], zoom: 5.5 },
  OR: { center: [-120.5, 44], zoom: 5 },
  PA: { center: [-77.2, 41], zoom: 6 },
  PR: { center: [-66.5, 18.2], zoom: 8 },
  RI: { center: [-71.5, 41.7], zoom: 12 },
  SC: { center: [-81, 33.8], zoom: 6 },
  SD: { center: [-100, 44.4], zoom: 5.5 },
  TN: { center: [-86, 35.8], zoom: 5.5 },
  TX: { center: [-99.9, 31.5], zoom: 3.8 },
  UT: { center: [-111.5, 39.3], zoom: 5 },
  VT: { center: [-72.7, 44], zoom: 7 },
  VA: { center: [-79.4, 37.5], zoom: 5.5 },
  WA: { center: [-120.7, 47.4], zoom: 5 },
  WV: { center: [-80.5, 38.9], zoom: 6.5 },
  WI: { center: [-89.8, 44.5], zoom: 5 },
  WY: { center: [-107.5, 43], zoom: 5 },
};

// US States array with code and name
export const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'PR', name: 'Puerto Rico' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

// Helper to get state name from code
export function getStateName(code: string): string {
  const state = US_STATES.find((s) => s.code === code);
  return state?.name || code;
}

// Helper to get FIPS from state code
export function getStateFips(stateCode: string): string | undefined {
  return stateFipsMap[stateCode];
}

// Helper to get state code from FIPS
export function getStateFromFips(fips: string): string | undefined {
  // Handle both 2-digit state FIPS and 5-digit county FIPS
  const stateFips = fips.length >= 2 ? fips.slice(0, 2) : fips;
  return fipsToStateAbbr[stateFips];
}

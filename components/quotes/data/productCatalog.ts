// Product catalog for searchable part/description fields
export const initialProductCatalog = [
  { id: 'prod-1', partNumber: 'LUM-4FT-LED', description: '4ft LED Linear Fixture', manufacturer: 'Acuity Brands', basePrice: 125 },
  { id: 'prod-2', partNumber: 'LUM-2X4-TRF', description: '2x4 LED Troffer Panel', manufacturer: 'Acuity Brands', basePrice: 185 },
  { id: 'prod-3', partNumber: 'DOW-6IN-REC', description: '6" Recessed Downlight', manufacturer: 'Cree Lighting', basePrice: 65 },
  { id: 'prod-4', partNumber: 'DOW-4IN-ADJ', description: '4" Adjustable Gimbal Downlight', manufacturer: 'Cree Lighting', basePrice: 85 },
  { id: 'prod-5', partNumber: 'EXT-WAL-PAK', description: 'LED Wall Pack 50W', manufacturer: 'RAB Lighting', basePrice: 145 },
  { id: 'prod-6', partNumber: 'EXT-FLD-100', description: 'LED Flood Light 100W', manufacturer: 'RAB Lighting', basePrice: 225 },
  { id: 'prod-7', partNumber: 'EXT-POL-150', description: 'LED Pole Light 150W', manufacturer: 'RAB Lighting', basePrice: 385 },
  { id: 'prod-8', partNumber: 'EMG-EXIT-RD', description: 'Exit Sign LED Red', manufacturer: 'Lithonia', basePrice: 45 },
  { id: 'prod-9', partNumber: 'EMG-EXIT-GR', description: 'Exit Sign LED Green', manufacturer: 'Lithonia', basePrice: 45 },
  { id: 'prod-10', partNumber: 'EMG-COMBO-1', description: 'Exit/Emergency Combo Unit', manufacturer: 'Lithonia', basePrice: 95 },
  { id: 'prod-11', partNumber: 'CTL-DIM-0-10', description: '0-10V Dimmer Switch', manufacturer: 'Lutron', basePrice: 55 },
  { id: 'prod-12', partNumber: 'CTL-OCC-PIR', description: 'PIR Occupancy Sensor', manufacturer: 'Lutron', basePrice: 75 },
  { id: 'prod-13', partNumber: 'CTL-DAY-SNR', description: 'Daylight Sensor', manufacturer: 'Lutron', basePrice: 85 },
  { id: 'prod-14', partNumber: 'HBY-UFO-150', description: 'UFO High Bay 150W', manufacturer: 'Cooper Lighting', basePrice: 275 },
  { id: 'prod-15', partNumber: 'HBY-LIN-200', description: 'Linear High Bay 200W', manufacturer: 'Cooper Lighting', basePrice: 325 },
];

export type ProductCatalogItem = typeof initialProductCatalog[number];

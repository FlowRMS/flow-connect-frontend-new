import type { Manufacturer, PriceCategory, DistributorMatrixEntry } from '../types';

export const mockManufacturers: Manufacturer[] = [
  { manufacturer_name: 'A.O. Smith', domain: 'aosmith.com', active: true },
  { manufacturer_name: 'Rheem', domain: 'rheem.com', active: true },
  { manufacturer_name: 'Bradford White', domain: 'bradfordwhite.com', active: true },
  { manufacturer_name: 'Watts Water', domain: 'watts.com', active: true },
  { manufacturer_name: 'Moen', domain: 'moen.com', active: true },
  { manufacturer_name: 'Acuity Brands', domain: 'acuitybrands.com', active: true },
  { manufacturer_name: 'Lutron', domain: 'lutron.com', active: true },
  { manufacturer_name: 'Philips', domain: 'signify.com', active: true },
  { manufacturer_name: 'Leviton', domain: 'leviton.com', active: true },
];

export const mockPriceCategories: PriceCategory[] = [
  { price_category_name: 'Stocking', description: 'Products stocked in distributor warehouse', default_discount_percent: 0.25 },
  { price_category_name: 'Buy-Sell', description: 'Direct ship from manufacturer', default_discount_percent: 0.18 },
  { price_category_name: 'Non-Stocking', description: 'Special order products', default_discount_percent: 0.10 },
];

export const mockDistributorMatrix: DistributorMatrixEntry[] = [
  { distributor_domain: 'graybar.com', manufacturer_domain: 'acuitybrands.com', price_category: 'Stocking' },
  { distributor_domain: 'graybar.com', manufacturer_domain: 'lutron.com', price_category: 'Buy-Sell' },
  { distributor_domain: 'graybar.com', manufacturer_domain: 'signify.com', price_category: 'Stocking' },
  { distributor_domain: 'hdsupply.com', manufacturer_domain: 'acuitybrands.com', price_category: 'Buy-Sell' },
  { distributor_domain: 'hdsupply.com', manufacturer_domain: 'leviton.com', price_category: 'Stocking' },
  { distributor_domain: 'fergusons.com', manufacturer_domain: 'lutron.com', price_category: 'Non-Stocking' },
];

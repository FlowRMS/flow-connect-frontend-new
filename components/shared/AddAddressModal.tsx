/**
 * Add Address Modal Component
 * Shared modal for adding addresses to Companies and Contacts
 */

'use client';

import React, { useState, useMemo } from 'react';

// Address type for addresses
export type AddressType = 'shipping' | 'billing' | 'mailing';

// Address interface
export interface Address {
  id: string;
  types: AddressType[];
  country: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  isPrimary?: boolean;
}

// Countries list
const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'IN', label: 'India' },
  { value: 'JP', label: 'Japan' },
  { value: 'CN', label: 'China' },
];

// Country-specific configuration
interface CountryConfig {
  stateLabel: string;
  postalLabel: string;
  states?: { value: string; label: string }[];
  postalPlaceholder: string;
}

// US States
const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' }, { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' }, { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' }, { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' }, { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' }, { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' }, { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' }, { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' }, { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' }, { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' }, { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' }, { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
];

// Canadian Provinces
const CA_PROVINCES = [
  { value: 'AB', label: 'Alberta' }, { value: 'BC', label: 'British Columbia' },
  { value: 'MB', label: 'Manitoba' }, { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland and Labrador' }, { value: 'NS', label: 'Nova Scotia' },
  { value: 'NT', label: 'Northwest Territories' }, { value: 'NU', label: 'Nunavut' },
  { value: 'ON', label: 'Ontario' }, { value: 'PE', label: 'Prince Edward Island' },
  { value: 'QC', label: 'Quebec' }, { value: 'SK', label: 'Saskatchewan' }, { value: 'YT', label: 'Yukon' },
];

// Australian States
const AU_STATES = [
  { value: 'ACT', label: 'Australian Capital Territory' }, { value: 'NSW', label: 'New South Wales' },
  { value: 'NT', label: 'Northern Territory' }, { value: 'QLD', label: 'Queensland' },
  { value: 'SA', label: 'South Australia' }, { value: 'TAS', label: 'Tasmania' },
  { value: 'VIC', label: 'Victoria' }, { value: 'WA', label: 'Western Australia' },
];

// German States (Bundesländer)
const DE_STATES = [
  { value: 'BW', label: 'Baden-Württemberg' }, { value: 'BY', label: 'Bavaria' },
  { value: 'BE', label: 'Berlin' }, { value: 'BB', label: 'Brandenburg' },
  { value: 'HB', label: 'Bremen' }, { value: 'HH', label: 'Hamburg' },
  { value: 'HE', label: 'Hesse' }, { value: 'MV', label: 'Mecklenburg-Vorpommern' },
  { value: 'NI', label: 'Lower Saxony' }, { value: 'NW', label: 'North Rhine-Westphalia' },
  { value: 'RP', label: 'Rhineland-Palatinate' }, { value: 'SL', label: 'Saarland' },
  { value: 'SN', label: 'Saxony' }, { value: 'ST', label: 'Saxony-Anhalt' },
  { value: 'SH', label: 'Schleswig-Holstein' }, { value: 'TH', label: 'Thuringia' },
];

// Indian States
const IN_STATES = [
  { value: 'AN', label: 'Andaman and Nicobar Islands' }, { value: 'AP', label: 'Andhra Pradesh' },
  { value: 'AR', label: 'Arunachal Pradesh' }, { value: 'AS', label: 'Assam' },
  { value: 'BR', label: 'Bihar' }, { value: 'CH', label: 'Chandigarh' },
  { value: 'CT', label: 'Chhattisgarh' }, { value: 'DL', label: 'Delhi' },
  { value: 'GA', label: 'Goa' }, { value: 'GJ', label: 'Gujarat' },
  { value: 'HR', label: 'Haryana' }, { value: 'HP', label: 'Himachal Pradesh' },
  { value: 'JK', label: 'Jammu and Kashmir' }, { value: 'JH', label: 'Jharkhand' },
  { value: 'KA', label: 'Karnataka' }, { value: 'KL', label: 'Kerala' },
  { value: 'MP', label: 'Madhya Pradesh' }, { value: 'MH', label: 'Maharashtra' },
  { value: 'MN', label: 'Manipur' }, { value: 'ML', label: 'Meghalaya' },
  { value: 'MZ', label: 'Mizoram' }, { value: 'NL', label: 'Nagaland' },
  { value: 'OR', label: 'Odisha' }, { value: 'PB', label: 'Punjab' },
  { value: 'RJ', label: 'Rajasthan' }, { value: 'SK', label: 'Sikkim' },
  { value: 'TN', label: 'Tamil Nadu' }, { value: 'TG', label: 'Telangana' },
  { value: 'TR', label: 'Tripura' }, { value: 'UP', label: 'Uttar Pradesh' },
  { value: 'UT', label: 'Uttarakhand' }, { value: 'WB', label: 'West Bengal' },
];

// Japanese Prefectures
const JP_PREFECTURES = [
  { value: 'HOKKAIDO', label: 'Hokkaido' }, { value: 'AOMORI', label: 'Aomori' },
  { value: 'IWATE', label: 'Iwate' }, { value: 'MIYAGI', label: 'Miyagi' },
  { value: 'AKITA', label: 'Akita' }, { value: 'YAMAGATA', label: 'Yamagata' },
  { value: 'FUKUSHIMA', label: 'Fukushima' }, { value: 'IBARAKI', label: 'Ibaraki' },
  { value: 'TOCHIGI', label: 'Tochigi' }, { value: 'GUNMA', label: 'Gunma' },
  { value: 'SAITAMA', label: 'Saitama' }, { value: 'CHIBA', label: 'Chiba' },
  { value: 'TOKYO', label: 'Tokyo' }, { value: 'KANAGAWA', label: 'Kanagawa' },
  { value: 'NIIGATA', label: 'Niigata' }, { value: 'TOYAMA', label: 'Toyama' },
  { value: 'ISHIKAWA', label: 'Ishikawa' }, { value: 'FUKUI', label: 'Fukui' },
  { value: 'YAMANASHI', label: 'Yamanashi' }, { value: 'NAGANO', label: 'Nagano' },
  { value: 'GIFU', label: 'Gifu' }, { value: 'SHIZUOKA', label: 'Shizuoka' },
  { value: 'AICHI', label: 'Aichi' }, { value: 'MIE', label: 'Mie' },
  { value: 'SHIGA', label: 'Shiga' }, { value: 'KYOTO', label: 'Kyoto' },
  { value: 'OSAKA', label: 'Osaka' }, { value: 'HYOGO', label: 'Hyogo' },
  { value: 'NARA', label: 'Nara' }, { value: 'WAKAYAMA', label: 'Wakayama' },
  { value: 'TOTTORI', label: 'Tottori' }, { value: 'SHIMANE', label: 'Shimane' },
  { value: 'OKAYAMA', label: 'Okayama' }, { value: 'HIROSHIMA', label: 'Hiroshima' },
  { value: 'YAMAGUCHI', label: 'Yamaguchi' }, { value: 'TOKUSHIMA', label: 'Tokushima' },
  { value: 'KAGAWA', label: 'Kagawa' }, { value: 'EHIME', label: 'Ehime' },
  { value: 'KOCHI', label: 'Kochi' }, { value: 'FUKUOKA', label: 'Fukuoka' },
  { value: 'SAGA', label: 'Saga' }, { value: 'NAGASAKI', label: 'Nagasaki' },
  { value: 'KUMAMOTO', label: 'Kumamoto' }, { value: 'OITA', label: 'Oita' },
  { value: 'MIYAZAKI', label: 'Miyazaki' }, { value: 'KAGOSHIMA', label: 'Kagoshima' },
  { value: 'OKINAWA', label: 'Okinawa' },
];

// Chinese Provinces
const CN_PROVINCES = [
  { value: 'BEIJING', label: 'Beijing' }, { value: 'TIANJIN', label: 'Tianjin' },
  { value: 'HEBEI', label: 'Hebei' }, { value: 'SHANXI', label: 'Shanxi' },
  { value: 'INNER_MONGOLIA', label: 'Inner Mongolia' }, { value: 'LIAONING', label: 'Liaoning' },
  { value: 'JILIN', label: 'Jilin' }, { value: 'HEILONGJIANG', label: 'Heilongjiang' },
  { value: 'SHANGHAI', label: 'Shanghai' }, { value: 'JIANGSU', label: 'Jiangsu' },
  { value: 'ZHEJIANG', label: 'Zhejiang' }, { value: 'ANHUI', label: 'Anhui' },
  { value: 'FUJIAN', label: 'Fujian' }, { value: 'JIANGXI', label: 'Jiangxi' },
  { value: 'SHANDONG', label: 'Shandong' }, { value: 'HENAN', label: 'Henan' },
  { value: 'HUBEI', label: 'Hubei' }, { value: 'HUNAN', label: 'Hunan' },
  { value: 'GUANGDONG', label: 'Guangdong' }, { value: 'GUANGXI', label: 'Guangxi' },
  { value: 'HAINAN', label: 'Hainan' }, { value: 'CHONGQING', label: 'Chongqing' },
  { value: 'SICHUAN', label: 'Sichuan' }, { value: 'GUIZHOU', label: 'Guizhou' },
  { value: 'YUNNAN', label: 'Yunnan' }, { value: 'TIBET', label: 'Tibet' },
  { value: 'SHAANXI', label: 'Shaanxi' }, { value: 'GANSU', label: 'Gansu' },
  { value: 'QINGHAI', label: 'Qinghai' }, { value: 'NINGXIA', label: 'Ningxia' },
  { value: 'XINJIANG', label: 'Xinjiang' }, { value: 'HONG_KONG', label: 'Hong Kong' },
  { value: 'MACAU', label: 'Macau' },
];

// Country configuration map
const COUNTRY_CONFIG: Record<string, CountryConfig> = {
  US: {
    stateLabel: 'State',
    postalLabel: 'ZIP Code',
    states: US_STATES,
    postalPlaceholder: '12345',
  },
  CA: {
    stateLabel: 'Province',
    postalLabel: 'Postal Code',
    states: CA_PROVINCES,
    postalPlaceholder: 'A1A 1A1',
  },
  GB: {
    stateLabel: 'County',
    postalLabel: 'Postcode',
    postalPlaceholder: 'SW1A 1AA',
  },
  AU: {
    stateLabel: 'State/Territory',
    postalLabel: 'Postcode',
    states: AU_STATES,
    postalPlaceholder: '2000',
  },
  DE: {
    stateLabel: 'State',
    postalLabel: 'Postal Code',
    states: DE_STATES,
    postalPlaceholder: '10115',
  },
  FR: {
    stateLabel: 'Region',
    postalLabel: 'Postal Code',
    postalPlaceholder: '75001',
  },
  IN: {
    stateLabel: 'State',
    postalLabel: 'PIN Code',
    states: IN_STATES,
    postalPlaceholder: '110001',
  },
  JP: {
    stateLabel: 'Prefecture',
    postalLabel: 'Postal Code',
    states: JP_PREFECTURES,
    postalPlaceholder: '100-0001',
  },
  CN: {
    stateLabel: 'Province',
    postalLabel: 'Postal Code',
    states: CN_PROVINCES,
    postalPlaceholder: '100000',
  },
};

// Default config for countries without specific configuration
const DEFAULT_CONFIG: CountryConfig = {
  stateLabel: 'State/Province',
  postalLabel: 'Postal Code',
  postalPlaceholder: '',
};

interface AddAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: Address) => void;
}

export function AddAddressModal({ isOpen, onClose, onSave }: AddAddressModalProps) {
  const [formData, setFormData] = useState<Omit<Address, 'id'>>({
    types: [],
    country: 'US',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
  });

  // Get country-specific configuration
  const countryConfig = useMemo(() => {
    return COUNTRY_CONFIG[formData.country] || DEFAULT_CONFIG;
  }, [formData.country]);

  const handleTypeToggle = (type: AddressType) => {
    setFormData(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }));
  };

  const handleCountryChange = (newCountry: string) => {
    setFormData(prev => ({
      ...prev,
      country: newCountry,
      state: '', // Reset state when country changes
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newAddress: Address = {
      id: `addr-${Date.now()}`,
      ...formData,
    };

    onSave(newAddress);

    // Reset form
    setFormData({
      types: [],
      country: 'US',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
    });

    onClose();
  };

  const handleClose = () => {
    // Reset form on close
    setFormData({
      types: [],
      country: 'US',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-2";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onMouseDown={handleClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Add Address</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 flex-1 overflow-y-auto">
            {/* Address Type Checkboxes */}
            <div>
              <label className={labelClass}>Address Type</label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.types.includes('shipping')}
                    onChange={() => handleTypeToggle('shipping')}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Shipping</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.types.includes('billing')}
                    onChange={() => handleTypeToggle('billing')}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Billing</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.types.includes('mailing')}
                    onChange={() => handleTypeToggle('mailing')}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Mailing</span>
                </label>
              </div>
            </div>

            {/* Country */}
            <div>
              <label className={labelClass}>Country *</label>
              <select
                value={formData.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className={inputClass}
                required
              >
                <option value="">Select Country</option>
                {COUNTRIES.map(country => (
                  <option key={country.value} value={country.value}>{country.label}</option>
                ))}
              </select>
            </div>

            {/* Address Line 1 */}
            <div>
              <label className={labelClass}>Address Line 1 *</label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={(e) => setFormData(prev => ({ ...prev, addressLine1: e.target.value }))}
                className={inputClass}
                placeholder="Street address"
                required
              />
            </div>

            {/* Address Line 2 */}
            <div>
              <label className={labelClass}>Address Line 2</label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={(e) => setFormData(prev => ({ ...prev, addressLine2: e.target.value }))}
                className={inputClass}
                placeholder="Suite, unit, building, floor, etc."
              />
            </div>

            {/* City */}
            <div>
              <label className={labelClass}>City *</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className={inputClass}
                placeholder="City"
                required
              />
            </div>

            {/* State/Province and Postal Code Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* State/Province */}
              <div>
                <label className={labelClass}>{countryConfig.stateLabel} *</label>
                {countryConfig.states ? (
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className={inputClass}
                    required
                  >
                    <option value="">Select {countryConfig.stateLabel}</option>
                    {countryConfig.states.map(state => (
                      <option key={state.value} value={state.value}>{state.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className={inputClass}
                    placeholder={countryConfig.stateLabel}
                    required
                  />
                )}
              </div>

              {/* Postal Code */}
              <div>
                <label className={labelClass}>{countryConfig.postalLabel} *</label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                  className={inputClass}
                  placeholder={countryConfig.postalPlaceholder}
                  required
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0 bg-gray-50">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Address
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Google Maps Address Modal Types
 * Centralized types for the address autocomplete system
 */

// ============================================================================
// Address Types (matching GraphQL schema)
// ============================================================================

export type AddressSourceType = 'CUSTOMER' | 'COMPANY' | 'CONTACT' | 'FACTORY' | 'JOB';

export type AddressType = 'BILLING' | 'SHIPPING' | 'MAILING' | 'OTHER';

export interface Address {
  id: string;
  sourceId: string;
  sourceType: AddressSourceType;
  addressType: AddressType;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  notes?: string;
  isPrimary: boolean;
  createdAt?: string;
  // Computed fields for display
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
}

export interface CreateAddressInput {
  sourceId: string;
  sourceType: AddressSourceType;
  addressType: AddressType;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  notes?: string;
  isPrimary: boolean;
}

export interface UpdateAddressInput {
  sourceId?: string;
  sourceType?: AddressSourceType;
  addressType?: AddressType;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  notes?: string;
  isPrimary?: boolean;
}

// ============================================================================
// Google Places Types
// ============================================================================

export interface PlaceDetails {
  placeId: string;
  formattedAddress: string;
  streetNumber: string;
  route: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  stateCode: string;
  country: string;
  countryCode: string;
  zipCode: string;
  latitude: number;
  longitude: number;
}

export interface PlacePrediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
  types: string[];
}

// ============================================================================
// Modal Props Types
// ============================================================================

export interface GoogleMapsAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: Omit<Address, 'id' | 'createdAt'>) => Promise<void>;
  sourceId: string;
  sourceType: AddressSourceType;
  initialAddress?: Partial<Address>;
  mode?: 'create' | 'edit';
  defaultAddressType?: AddressType;
}

export interface AddressFormData {
  addressType: AddressType;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  countryCode: string;
  notes: string;
  isPrimary: boolean;
  latitude?: number;
  longitude?: number;
  placeId?: string;
}

// ============================================================================
// Google Maps Loading Types
// ============================================================================

export type GoogleMapsLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface GoogleMapsLoaderState {
  status: GoogleMapsLoadStatus;
  error?: string;
}

// Note: No hardcoded country/state types - all address data comes dynamically from Google Places API

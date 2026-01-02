/**
 * Google Maps Address Modal - Main Export
 * Centralized reusable address modal with Google Maps integration
 *
 * All address data (countries, states, cities) comes dynamically from Google Places API.
 * No hardcoded address data - works worldwide just like Google Maps.
 */

export { GoogleMapsAddressModal } from './GoogleMapsAddressModal';
export { useGoogleMapsLoader, preloadGoogleMaps, useGooglePlacesAutocomplete } from './hooks';

// Export types
export type {
  Address,
  AddressType,
  AddressSourceType,
  CreateAddressInput,
  UpdateAddressInput,
  GoogleMapsAddressModalProps,
  AddressFormData,
  PlaceDetails,
  PlacePrediction,
} from './types';

// Export address type configuration (for UI labels only, not address data)
export { ADDRESS_TYPE_CONFIG } from './constants';

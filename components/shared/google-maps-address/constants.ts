/**
 * Google Maps Address Constants
 *
 * IMPORTANT: All address data (countries, states, cities, postal codes) comes
 * dynamically from Google Places API - just like Google Maps itself.
 *
 * The only constants here are:
 * 1. Address type configuration (for our internal categorization: billing, shipping, etc.)
 * 2. Map styling preferences
 * 3. Default map positioning
 */

// ============================================================================
// Address Type Labels (Our internal categorization - not address data)
// ============================================================================

export const ADDRESS_TYPE_CONFIG = {
  BILLING: {
    label: 'Billing',
    icon: 'credit-card',
    color: 'blue',
    description: 'For billing and payment',
  },
  SHIPPING: {
    label: 'Shipping',
    icon: 'truck',
    color: 'green',
    description: 'For deliveries and shipments',
  },
  MAILING: {
    label: 'Mailing',
    icon: 'mail',
    color: 'purple',
    description: 'For correspondence',
  },
  OTHER: {
    label: 'Other',
    icon: 'map-pin',
    color: 'gray',
    description: 'General purpose address',
  },
} as const;

// ============================================================================
// Default Map Settings
// ============================================================================

// Default center when no location is selected (center of world map)
export const DEFAULT_MAP_CENTER = { lat: 20, lng: 0 };
export const DEFAULT_MAP_ZOOM = 2; // World view
export const SELECTED_MAP_ZOOM = 17; // Street level when address is selected

// ============================================================================
// Map Styles (Custom styling for a modern, clean look)
// The type is applied at runtime when Google Maps is loaded
// ============================================================================

export const MAP_STYLES = [
  // Hide points of interest labels for cleaner look
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  // Hide transit icons
  {
    featureType: 'transit',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  // Subtle water color
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#c8e0f7' }],
  },
  // Light landscape
  {
    featureType: 'landscape',
    elementType: 'geometry.fill',
    stylers: [{ color: '#f0f4f8' }],
  },
  // Clean road styling
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e0e4e8' }],
  },
  // Subtle road labels
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b7280' }],
  },
];

// ============================================================================
// Google Places API Configuration
// ============================================================================

// Search for addresses worldwide - no country restrictions
// Google will return addresses from any country the user types
export const PLACES_SEARCH_OPTIONS = {
  types: ['address'], // Only return address results (not businesses, etc.)
  // No country restrictions - works worldwide like Google Maps
};

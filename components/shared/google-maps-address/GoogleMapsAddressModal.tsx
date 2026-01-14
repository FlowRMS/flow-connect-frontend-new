/**
 * Google Maps Address Modal
 * Beautiful, animated address selection modal with Google Maps integration
 *
 * All address data (countries, states, cities, postal codes) comes dynamically
 * from Google Places API - just like Google Maps itself.
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGoogleMapsLoader, useGooglePlacesAutocomplete } from './hooks';
import {
  ADDRESS_TYPE_CONFIG,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  SELECTED_MAP_ZOOM,
  MAP_STYLES,
} from './constants';
import type {
  GoogleMapsAddressModalProps,
  AddressFormData,
  PlacePrediction,
  AddressType,
} from './types';

// ============================================================================
// Sub-Components
// ============================================================================

// Animated location pin marker
const AnimatedMarker: React.FC<{ isVisible: boolean }> = ({ isVisible }) => (
  <div
    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10 transition-all duration-500 ${
      isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
    }`}
  >
    <div className="relative">
      {/* Pulse ring */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-blue-500/30 rounded-full animate-pulse" />
      {/* Shadow */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-black/20 rounded-full blur-sm" />
      {/* Pin */}
      <svg
        className="w-10 h-10 text-blue-600 drop-shadow-lg animate-bounce"
        style={{ animationDuration: '2s' }}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      </svg>
    </div>
  </div>
);

// Loading spinner
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'md' }) => (
  <svg
    className={`animate-spin ${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}`}
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// Address type selector - supports multiple selection
const AddressTypeSelector: React.FC<{
  value: AddressType[];
  onChange: (types: AddressType[]) => void;
}> = ({ value, onChange }) => {
  const types: AddressType[] = ['BILLING', 'SHIPPING', 'MAILING', 'OTHER'];

  const handleToggle = (type: AddressType) => {
    if (value.includes(type)) {
      // Remove if already selected (but keep at least one)
      if (value.length > 1) {
        onChange(value.filter(t => t !== type));
      }
    } else {
      // Add to selection
      onChange([...value, type]);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {types.map((type) => {
          const config = ADDRESS_TYPE_CONFIG[type];
          const isSelected = value.includes(type);

          return (
            <button
              key={type}
              type="button"
              onClick={() => handleToggle(type)}
              className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {/* Icon */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-colors ${
                  isSelected ? 'bg-blue-100' : 'bg-gray-100'
                }`}
              >
                {type === 'BILLING' && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                )}
                {type === 'SHIPPING' && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12l-4 9H8l-4-9h4m0 0V4m0 3v10m4-10v10m-4 0h4" />
                  </svg>
                )}
                {type === 'MAILING' && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
                {type === 'OTHER' && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </div>
              <span className="text-xs font-medium">{config.label}</span>
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-gray-500">Click to select multiple types for this address</p>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export function GoogleMapsAddressModal({
  isOpen,
  onClose,
  onSave,
  sourceId,
  sourceType,
  initialAddress,
  mode = 'create',
  defaultAddressType = 'BILLING',
}: GoogleMapsAddressModalProps) {
  // Hooks - Google Places Autocomplete searches worldwide, no country restrictions
  const { load, isReady, status: mapsStatus } = useGoogleMapsLoader();
  const {
    predictions,
    isLoading: isSearching,
    searchPlaces,
    getPlaceDetails,
    clearPredictions,
  } = useGooglePlacesAutocomplete();

  // Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // State - all address fields are filled dynamically from Google
  const [formData, setFormData] = useState<AddressFormData>({
    addressTypes: [defaultAddressType],
    line1: '',
    line2: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    countryCode: '',
    notes: '',
    isPrimary: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showPredictions, setShowPredictions] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mapAnimating, setMapAnimating] = useState(false);

  // Initialize map when Google Maps is ready (non-interactive, display only)
  useEffect(() => {
    if (isReady && mapContainerRef.current && !mapRef.current && isOpen) {
      mapRef.current = new google.maps.Map(mapContainerRef.current, {
        center: DEFAULT_MAP_CENTER,
        zoom: DEFAULT_MAP_ZOOM,
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
        styles: MAP_STYLES as google.maps.MapTypeStyle[],
        gestureHandling: 'none', // Disable all gestures - map is display only
        draggable: false,
        scrollwheel: false,
        disableDoubleClickZoom: true,
        keyboardShortcuts: false,
      });
    }
  }, [isReady, isOpen]);

  // Load Google Maps when modal opens
  useEffect(() => {
    if (isOpen && mapsStatus === 'idle') {
      load();
    }
  }, [isOpen, mapsStatus, load]);

  // Initialize form with initial address data (for edit mode)
  useEffect(() => {
    if (isOpen && initialAddress) {
      // Use addressTypes if available, otherwise fall back to addressType
      const types = initialAddress.addressTypes && initialAddress.addressTypes.length > 0
        ? initialAddress.addressTypes
        : initialAddress.addressType
          ? [initialAddress.addressType]
          : [defaultAddressType];

      setFormData({
        addressTypes: types,
        line1: initialAddress.line1 || '',
        line2: initialAddress.line2 || '',
        city: initialAddress.city || '',
        state: initialAddress.state || '',
        zipCode: initialAddress.zipCode || '',
        country: initialAddress.country || '',
        countryCode: '',
        notes: initialAddress.notes || '',
        isPrimary: initialAddress.isPrimary || false,
        latitude: initialAddress.latitude,
        longitude: initialAddress.longitude,
      });

      // If we have coordinates, show the location on map
      if (initialAddress.latitude && initialAddress.longitude) {
        setHasLocation(true);
      }
    }
  }, [isOpen, initialAddress, defaultAddressType]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setShowPredictions(false);
      setHasLocation(false);
      setFormData({
        addressTypes: [defaultAddressType],
        line1: '',
        line2: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        countryCode: '',
        notes: '',
        isPrimary: false,
      });
      mapRef.current = null;
    }
  }, [isOpen, defaultAddressType]);

  // Handle search input change - searches Google Places API
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowPredictions(query.length > 0);

    if (query.length > 2) {
      searchPlaces(query);
    } else {
      clearPredictions();
    }
  }, [searchPlaces, clearPredictions]);

  // Handle prediction selection - fetches full details from Google
  const handleSelectPrediction = useCallback(async (prediction: PlacePrediction) => {
    setShowPredictions(false);
    setSearchQuery(prediction.description);

    const details = await getPlaceDetails(prediction.placeId);
    if (details) {
      // All fields populated from Google's response - no hardcoded data
      setFormData(prev => ({
        ...prev,
        line1: details.line1,
        line2: details.line2,
        city: details.city,
        state: details.state, // Full state name from Google
        zipCode: details.zipCode,
        country: details.country, // Full country name from Google
        countryCode: details.countryCode,
        latitude: details.latitude,
        longitude: details.longitude,
        placeId: details.placeId,
      }));

      setHasLocation(true);

      // Animate map to location
      if (mapRef.current && details.latitude && details.longitude) {
        setMapAnimating(true);

        const newCenter = { lat: details.latitude, lng: details.longitude };

        // Smooth pan and zoom animation
        mapRef.current.panTo(newCenter);
        setTimeout(() => {
          mapRef.current?.setZoom(SELECTED_MAP_ZOOM);
          setMapAnimating(false);
        }, 500);
      }
    }
  }, [getPlaceDetails]);

  // Handle form field change
  const handleFieldChange = useCallback((
    field: keyof AddressFormData,
    value: string | boolean | AddressType[]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    // Validation
    if (!formData.line1.trim()) {
      alert('Street address is required');
      return;
    }
    if (!formData.city.trim()) {
      alert('City is required');
      return;
    }
    if (!formData.country.trim()) {
      alert('Country is required');
      return;
    }
    if (formData.addressTypes.length === 0) {
      alert('At least one address type is required');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        sourceId,
        sourceType,
        addressType: formData.addressTypes[0], // Primary type for backwards compatibility
        addressTypes: formData.addressTypes,
        line1: formData.line1.trim(),
        line2: formData.line2.trim() || undefined,
        city: formData.city.trim(),
        state: formData.state.trim(),
        zipCode: formData.zipCode.trim(),
        country: formData.country.trim(),
        notes: formData.notes.trim() || undefined,
        isPrimary: formData.isPrimary,
        latitude: formData.latitude,
        longitude: formData.longitude,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save address:', err);
    } finally {
      setIsSaving(false);
    }
  }, [formData, sourceId, sourceType, onSave, onClose]);

  // Handle modal close
  const handleClose = useCallback(() => {
    if (!isSaving) {
      onClose();
    }
  }, [isSaving, onClose]);

  if (!isOpen) return null;

  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {mode === 'edit' ? 'Edit Address' : 'Add Address'}
                </h2>
                <p className="text-blue-100 text-sm mt-0.5">
                  Search any address worldwide
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Map Section */}
          <div className="relative h-64 lg:h-auto lg:w-1/2 bg-gray-100 flex-shrink-0">
            {/* Map Container */}
            <div ref={mapContainerRef} className="absolute inset-0" />

            {/* Animated Marker Overlay */}
            <AnimatedMarker isVisible={hasLocation && !mapAnimating} />

            {/* Map Loading State */}
            {!isReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center gap-3">
                  <LoadingSpinner />
                  <p className="text-sm text-gray-500">Loading map...</p>
                </div>
              </div>
            )}

            {/* Google Maps Powered By */}
            <div className="absolute top-3 left-3">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EA4335"/>
                  <circle cx="12" cy="9" r="2.5" fill="white"/>
                </svg>
                <span className="text-xs text-gray-600 font-medium">Google Maps</span>
              </div>
            </div>

            {/* Location Info Overlay */}
            {hasLocation && formData.line1 && (
              <div className="absolute bottom-4 left-4 right-4 lg:right-auto lg:max-w-xs">
                <div className="bg-white rounded-xl shadow-lg p-3 backdrop-blur-sm bg-white/95 border border-gray-100">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{formData.line1}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {[formData.city, formData.state, formData.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Section */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Search Box - Google Places Autocomplete */}
            <div className="relative">
              <label className={labelClass}>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    <circle cx="12" cy="9" r="2.5" fill="white"/>
                  </svg>
                  Search Address
                </span>
              </label>
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery.length > 0 && setShowPredictions(true)}
                  className={`${inputClass} pl-11 pr-10`}
                  placeholder="Start typing any address worldwide..."
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
              </div>

              {/* Predictions Dropdown */}
              {showPredictions && predictions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-72 overflow-y-auto">
                  {predictions.map((prediction, index) => (
                    <button
                      key={prediction.placeId}
                      onClick={() => handleSelectPrediction(prediction)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                        index !== predictions.length - 1 ? 'border-b border-gray-100' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                          <circle cx="12" cy="9" r="2" fill="white"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{prediction.mainText}</p>
                        <p className="text-xs text-gray-500 truncate">{prediction.secondaryText}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Helper text */}
              <p className="mt-1.5 text-xs text-gray-400">
                Powered by Google Places - search addresses from any country
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">ADDRESS DETAILS</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Address Type */}
            <div>
              <label className={labelClass}>Address Type(s)</label>
              <AddressTypeSelector
                value={formData.addressTypes}
                onChange={(types) => handleFieldChange('addressTypes', types)}
              />
            </div>

            {/* Street Address - populated from Google */}
            <div>
              <label className={labelClass}>
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.line1}
                onChange={(e) => handleFieldChange('line1', e.target.value)}
                className={inputClass}
                placeholder="Street address (populated from search)"
              />
            </div>

            {/* Address Line 2 */}
            <div>
              <label className={labelClass}>Apartment, Suite, Unit, etc.</label>
              <input
                type="text"
                value={formData.line2}
                onChange={(e) => handleFieldChange('line2', e.target.value)}
                className={inputClass}
                placeholder="Suite 100 (optional)"
              />
            </div>

            {/* City and State Row - populated from Google */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  className={inputClass}
                  placeholder="City"
                />
              </div>
              <div>
                <label className={labelClass}>State / Province / Region</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                  className={inputClass}
                  placeholder="State/Province"
                />
              </div>
            </div>

            {/* Zip and Country Row - populated from Google */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Postal / ZIP Code</label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                  className={inputClass}
                  placeholder="Postal code"
                />
              </div>
              <div>
                <label className={labelClass}>
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleFieldChange('country', e.target.value)}
                  className={inputClass}
                  placeholder="Country"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                className={`${inputClass} resize-none`}
                rows={2}
                placeholder="Notes about this address (optional)"
              />
            </div>

            {/* Primary Address Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-900">Set as Primary Address</p>
                <p className="text-xs text-gray-500 mt-0.5">This will be the default address used</p>
              </div>
              <button
                type="button"
                onClick={() => handleFieldChange('isPrimary', !formData.isPrimary)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.isPrimary ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                    formData.isPrimary ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-gray-500">
            <span className="text-red-500">*</span> Required fields
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" />
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Save Address
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

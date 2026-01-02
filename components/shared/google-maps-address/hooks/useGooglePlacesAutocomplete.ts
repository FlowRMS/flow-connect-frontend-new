/**
 * Google Places Autocomplete Hook (New API)
 * Provides address autocomplete functionality using the new Places API
 * https://developers.google.com/maps/documentation/javascript/place-autocomplete-new
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useGoogleMapsLoader } from './useGoogleMapsLoader';
import type { PlacePrediction, PlaceDetails } from '../types';

interface UseGooglePlacesAutocompleteProps {
  debounceMs?: number;
}

interface UseGooglePlacesAutocompleteReturn {
  predictions: PlacePrediction[];
  isLoading: boolean;
  error: string | null;
  searchPlaces: (query: string) => void;
  getPlaceDetails: (placeId: string) => Promise<PlaceDetails | null>;
  clearPredictions: () => void;
  isReady: boolean;
}

/**
 * Parse address components from the new Places API format
 */
const parseAddressComponents = (place: google.maps.places.Place): {
  streetNumber: string;
  route: string;
  city: string;
  state: string;
  stateCode: string;
  country: string;
  countryCode: string;
  zipCode: string;
} => {
  const components = place.addressComponents || [];

  const getComponent = (types: string[], format: 'long' | 'short' = 'long'): string => {
    const component = components.find(c =>
      types.some(t => c.types.includes(t))
    );
    return format === 'long' ? component?.longText || '' : component?.shortText || '';
  };

  return {
    streetNumber: getComponent(['street_number']),
    route: getComponent(['route']),
    city: getComponent(['locality', 'sublocality', 'postal_town', 'administrative_area_level_2']),
    state: getComponent(['administrative_area_level_1']),
    stateCode: getComponent(['administrative_area_level_1'], 'short'),
    country: getComponent(['country']),
    countryCode: getComponent(['country'], 'short'),
    zipCode: getComponent(['postal_code']),
  };
};

/**
 * Hook for Google Places Autocomplete (New API)
 */
export function useGooglePlacesAutocomplete({
  debounceMs = 300,
}: UseGooglePlacesAutocompleteProps = {}): UseGooglePlacesAutocompleteReturn {
  const { isReady } = useGoogleMapsLoader();
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // Initialize session token when Google Maps is ready
  useEffect(() => {
    if (isReady && !sessionTokenRef.current) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }
  }, [isReady]);

  /**
   * Search for place predictions using the new Autocomplete API
   */
  const searchPlaces = useCallback((query: string) => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Clear predictions if query is empty
    if (!query.trim()) {
      setPredictions([]);
      setIsLoading(false);
      return;
    }

    if (!isReady) {
      setError('Google Maps not loaded');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Debounce the search
    debounceTimerRef.current = setTimeout(async () => {
      try {
        // Use the new AutocompleteSuggestion API
        const { AutocompleteSuggestion } = await google.maps.importLibrary('places') as google.maps.PlacesLibrary;

        const request: google.maps.places.AutocompleteRequest = {
          input: query,
          includedPrimaryTypes: ['street_address', 'premise', 'subpremise', 'route'],
          sessionToken: sessionTokenRef.current || undefined,
        };

        const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

        const formattedPredictions: PlacePrediction[] = suggestions
          .filter(suggestion => suggestion.placePrediction)
          .map(suggestion => {
            const prediction = suggestion.placePrediction!;
            return {
              placeId: prediction.placeId,
              mainText: prediction.mainText?.text || '',
              secondaryText: prediction.secondaryText?.text || '',
              description: prediction.text?.text || '',
              types: prediction.types || [],
            };
          });

        setPredictions(formattedPredictions);
        setIsLoading(false);
      } catch (err) {
        console.error('Places autocomplete error:', err);
        setError('Failed to fetch predictions');
        setPredictions([]);
        setIsLoading(false);
      }
    }, debounceMs);
  }, [isReady, debounceMs]);

  /**
   * Get detailed place information using the new Place class
   */
  const getPlaceDetails = useCallback(async (placeId: string): Promise<PlaceDetails | null> => {
    if (!isReady) {
      setError('Google Maps not loaded');
      return null;
    }

    try {
      const { Place } = await google.maps.importLibrary('places') as google.maps.PlacesLibrary;

      const place = new Place({
        id: placeId,
      });

      // Fetch place details with the fields we need
      await place.fetchFields({
        fields: [
          'id',
          'displayName',
          'formattedAddress',
          'addressComponents',
          'location',
        ],
      });

      // Reset session token after getting details (for billing)
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();

      const components = parseAddressComponents(place);
      const line1 = [components.streetNumber, components.route].filter(Boolean).join(' ');

      return {
        placeId: place.id || '',
        formattedAddress: place.formattedAddress || '',
        streetNumber: components.streetNumber,
        route: components.route,
        line1: line1 || place.displayName || '',
        line2: '',
        city: components.city,
        state: components.state,
        stateCode: components.stateCode,
        country: components.country,
        countryCode: components.countryCode,
        zipCode: components.zipCode,
        latitude: place.location?.lat() || 0,
        longitude: place.location?.lng() || 0,
      };
    } catch (err) {
      console.error('Place details error:', err);
      setError('Failed to fetch place details');
      return null;
    }
  }, [isReady]);

  /**
   * Clear predictions
   */
  const clearPredictions = useCallback(() => {
    setPredictions([]);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    predictions,
    isLoading,
    error,
    searchPlaces,
    getPlaceDetails,
    clearPredictions,
    isReady,
  };
}

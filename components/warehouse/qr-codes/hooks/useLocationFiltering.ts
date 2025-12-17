// Location filtering hook

import { useState, useMemo } from 'react';
import type { LocationWithPath, PrintFormat } from '../types';

interface UseLocationFilteringProps {
  locations: LocationWithPath[];
}

export function useLocationFiltering({ locations }: UseLocationFilteringProps) {
  const [selectedFormat, setSelectedFormat] = useState<PrintFormat>('sheet-medium');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchesType = filterType === 'all' || loc.type === filterType;
      const matchesSearch =
        searchQuery === '' ||
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.path.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [locations, filterType, searchQuery]);

  return {
    selectedFormat,
    setSelectedFormat,
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    filteredLocations,
  };
}

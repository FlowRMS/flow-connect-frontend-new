import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_CHART_DATA } from '@/lib/analytics/graphql/queries/chartData';

/**
 * Custom hook to fetch chart data with support for filters
 * @param {Object} options - Hook options
 * @param {string} options.dataType - Type of chart data (SALES_BY_MONTH, COMMISSIONS_BY_MONTH)
 * @param {Array} options.filters - Array of filter objects
 * @param {string} options.startDate - Optional start date
 * @param {string} options.endDate - Optional end date
 * @param {boolean} options.skip - Skip the query
 */
export const useChartData = ({
  dataType,
  filters = [],
  startDate = '',
  endDate = '',
  skip = false,
}) => {
  const [chartData, setChartData] = useState({
    title: '',
    data: [],
    metadata: null,
  });

  // Transform filters to backend format
  const backendFilters = filters
    .filter(f => f && f.columnName)
    .map(filter => ({
      columnName: filter.columnName,
      operator: filter.operator || 'EQ',
      value: filter.value || '',
      values: filter.values || [],
    }));

  const { data, loading, error, refetch } = useQuery(GET_CHART_DATA, {
    variables: {
      dataType,
      startDate: startDate || null,
      endDate: endDate || null,
      filters: backendFilters.length > 0 ? backendFilters : null,
    },
    skip,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    if (data?.getChartData) {
      const { title, data: chartPoints, metadata } = data.getChartData;
      
      // Parse metadata if it's a string
      let parsedMetadata = null;
      if (metadata) {
        try {
          parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
        } catch (e) {
          console.warn('Failed to parse chart metadata:', e);
          parsedMetadata = null;
        }
      }

      setChartData({
        title: title || '',
        data: chartPoints || [],
        metadata: parsedMetadata,
      });
    }
  }, [data]);

  return {
    chartData: chartData.data,
    title: chartData.title,
    metadata: chartData.metadata,
    loading,
    error,
    refetch,
  };
};


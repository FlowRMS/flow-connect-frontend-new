import { gql } from '@apollo/client';

export const GET_CHART_DATA = gql`
  query GetChartData(
    $dataType: ChartDataType!
    $startDate: Date
    $endDate: Date
    $filters: [Filter!]
  ) {
    getChartData(
      dataType: $dataType
      startDate: $startDate
      endDate: $endDate
      filters: $filters
    ) {
      title
      data {
        label
        value
      }
      metadata
    }
  }
`;

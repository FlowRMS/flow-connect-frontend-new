import { gql } from '@apollo/client';

export const GET_TABLE_DATA = gql`
  query GetTableData(
    $dataType: TableDataType!
    $startDate: Date
    $endDate: Date
  ) {
    getTableData(
      dataType: $dataType
      startDate: $startDate
      endDate: $endDate
    ) {
      title
      metadata
      rows {
        ... on CommissionBalanceOverTimeResponse {
          __typename
          commissionBalance
          expectedCommission
          paidCommission
          timeFrame
        }
        ... on FactoryBalanceResponse {
          __typename
          commissionBalance
          expectedCommission
          factoryName
          paidCommission
        }
      }
    }
  }
`;

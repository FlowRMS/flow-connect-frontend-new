import { gql } from '@apollo/client';

export const GET_DASHBOARD_CARDS = gql`
  query GetDashboardCards {
    getDashboardCards {
      name
      changeAmount
      changePercentage
      currentPeriod { 
        label 
        value 
      }
      previousPeriod { 
        label 
        value 
      }
    }
  }
`;

export const GET_COMPARISON = gql`
  query GetComparison(
    $groupingType: GroupingType!
    $valueType: ValueType!
    $filters: [Filter!]
  ) {
    getComparison(
      groupingType: $groupingType
      valueType: $valueType
      filters: $filters
    ) {
      title
      items {
        entityId
        entityName
        lastYear
        thisYear
        variancePercentage
      }
    }
  }
`;

export const GET_COMPARISON_WITH_SUB_ENTITY = gql`
  query GetComparisonWithSubEntity(
    $groupingType: GroupingType!
    $valueType: ValueType!
    $filters: [Filter!]
  ) {
    getComparison(
      groupingType: $groupingType
      valueType: $valueType
      filters: $filters
    ) {
      title
      items {
        entityId
        entityName
        lastYear
        thisYear
        variancePercentage
        subEntityId
        subEntityName
      }
    }
  }
`;

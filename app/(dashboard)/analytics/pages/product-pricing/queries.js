import { gql } from "@apollo/client";

export const PRODUCT_PRICING_QUERY = gql`
  query GetProductPricing(
    $startDate: Date
    $endDate: Date
    $factoryId: UUID
    $customerId: UUID
    $parentCustomerId: UUID
  ) {
    productPricing(
      startDate: $startDate
      endDate: $endDate
      factoryId: $factoryId
      customerId: $customerId
      parentCustomerId: $parentCustomerId
    ) {
      factoryPartNumber
      productDescription
      lowestPrice
      highestPrice
      averagePrice
      orderCount
      customerCount
      factoryId
      factory
    }
  }
`;

// Query to get factories for filter dropdown
export const FACTORIES_QUERY = gql`
  query GetFactories {
    factories {
      id
      title
    }
  }
`;

// Query to get customers for filter dropdown
export const CUSTOMERS_SEARCH_QUERY = gql`
  query CustomerSearch($searchTerm: String!, $limit: Int = 50) {
    customerSearch(searchTerm: $searchTerm, limit: $limit) {
      id
      companyName
      parentId
    }
  }
`;

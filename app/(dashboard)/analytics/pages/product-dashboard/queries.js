import { gql } from "@apollo/client";

// Note: This query routes to Hive (flow-py-crm) via the FactorySearch operation name
export const FACTORY_SEARCH = gql`
  query FactorySearch($searchTerm: String!, $limit: Int, $useCustomOrder: Boolean, $published: Boolean) {
    factorySearch(searchTerm: $searchTerm, limit: $limit, useCustomOrder: $useCustomOrder, published: $published) {
      id
      title
      url
    }
  }
`;

export const GET_PRODUCT_TRENDS_BY_FACTORY = gql`
  query GetProductTrendsByFactory(
    $factoryId: UUID!
    $topN: Int
    $startDate: Date
    $endDate: Date
    $filters: [Filter!]
    $categoryIds: [UUID!]
    $productIds: [UUID!]
  ) {
    getProductTrendsByFactory(
      factoryId: $factoryId
      topN: $topN
      startDate: $startDate
      endDate: $endDate
      filters: $filters
      categoryIds: $categoryIds
      productIds: $productIds
    ) {
      title
      products {
        productId
        productName
        totalSales
        monthlyData {
          label
          value
        }
      }
    }
  }
`;

export const GET_CUSTOMER_PRODUCT_SALES = gql`
  query GetCustomerProductSales(
    $factoryId: UUID!
    $topN: Int
    $startDate: Date
    $endDate: Date
    $customerIds: [UUID!]
    $productIds: [UUID!]
  ) {
    getCustomerProductSales(
      factoryId: $factoryId
      topN: $topN
      startDate: $startDate
      endDate: $endDate
      customerIds: $customerIds
      productIds: $productIds
    ) {
      title
      items {
        customerId
        customerName
        productId
        productName
        totalSales
        monthlyData {
          label
          value
        }
      }
    }
  }
`;
import { gql } from "@apollo/client";

export const FIND_CUSTOMER_BY_COMPANY_NAME = gql`
  query FindCustomerByCompanyName($companyName: String!, $published: Boolean!) {
    findCustomerByCompanyName(
      companyName: $companyName
      published: $published
    ) {
      id
      companyName
    }
  }
`;

export const FIND_FACTORY_BY_TITLE = gql`
  query FindFactoryByTitle($title: String!, $published: Boolean!) {
    findFactoryByTitle(title: $title, published: $published) {
      id
      title
    }
  }
`;

export const FIND_ALL_USER = gql`
  query FindAllUser {
    findAllUser {
      id
      firstName
      lastName
      email
      isOutside
    }
  }
`;

export const GET_FACTORY_PART_NUMBERS = gql`
  query GetComparison(
    $groupingType: GroupingType!
    $valueType: ValueType!
  ) {
    getComparison(
      groupingType: $groupingType
      valueType: $valueType
      filters: []
    ) {
      items {
        entityId
        entityName
      }
    }
  }
`;

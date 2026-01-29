export const FIND_PRODUCT_BY_ID = `
  query FindProductById($id: UUID!) {
    product(id: $id) {
      approvalNeeded
      category {
        commissionRate
        factoryId
        id
        title
        parent {
          id
          title
          commissionRate
          factoryId
        }
        grandparent {
          id
          title
          commissionRate
          factoryId
        }
      }
      defaultCommissionRate
      description
      factory {
        accountNumber
        additionalInformation
        baseCommissionRate
        commissionDiscountRate
        externalPaymentTerms
        email
        freightDiscountType
        freightTerms
        id
        leadTime
        logoId
        overallDiscountRate
        paymentTerms
        phone
        published
        title
      }
      factoryPartNumber
      id
      published
      unitPrice
      uom {
        description
        divisionFactor
        id
        title
      }
    }
  }
`;

export const PRODUCT_UOMS = `
  query ProductUoms {
    productUoms {
      id
      title
      description
      divisionFactor
    }
  }
`;

export const PRODUCT_CATEGORIES = `
  query ProductCategories($factoryId: UUID, $grandparentId: UUID, $parentId: UUID) {
    productCategories(factoryId: $factoryId, grandparentId: $grandparentId, parentId: $parentId) {
      commissionRate
      factoryId
      id
      title
      parent {
        id
        title
        commissionRate
        factoryId
      }
      grandparent {
        id
        title
        commissionRate
        factoryId
      }
    }
  }
`;

export const PRODUCT_CATEGORY_SEARCH = `
  query ProductCategorySearch($searchTerm: String!, $factoryId: UUID!, $limit: Int) {
    productCategorySearch(searchTerm: $searchTerm, factoryId: $factoryId, limit: $limit) {
      commissionRate
      factoryId
      id
      title
      parent {
        id
        title
        commissionRate
        factoryId
      }
      grandparent {
        id
        title
        commissionRate
        factoryId
      }
    }
  }
`;

export const PRODUCT_SEARCH = `
  query ProductSearch($searchTerm: String!, $limit: Int) {
    productSearch(searchTerm: $searchTerm, limit: $limit) {
      approvalComments
      approvalDate
      approvalNeeded
      commissionDiscountRate
      defaultCommissionRate
      defaultDivisor
      description
      factoryPartNumber
      id
      leadTime
      minOrderQty
      published
      tags
      unitPrice
      unitPriceDiscountRate
      upc
    }
  }
`;

export const PRODUCT_LANDING_PAGES = `
  query ProductLandingPages($filters: [Filter!], $limit: Int, $offset: Int, $orderBy: [OrderBy!]) {
    findLandingPages(
      sourceType: PRODUCTS
      filters: $filters
      limit: $limit
      offset: $offset
      orderBy: $orderBy
    ) {
      records {
        ... on ProductLandingPage {
          id
          approvalNeeded
          categoryTitle
          createdAt
          createdBy
          defaultCommissionRate
          description
          factoryPartNumber
          factoryTitle
          published
          unitPrice
          uomTitle
        }
      }
      total
    }
  }
`;

export const FIND_PRODUCT_CPN_BY_ID = `
  query FindProductCpnById($id: UUID!) {
    findProductCpnById(id: $id) {
      id
      productId
      customerId
      customerPartNumber
      unitPrice
      commissionRate
      product {
        id
        factoryPartNumber
        description
        unitPrice
        defaultCommissionRate
        approvalNeeded
        published
      }
      customer {
        id
        companyName
        isParent
        parentId
        published
      }
    }
  }
`;

export const LIST_PRODUCT_CPNS_BY_PRODUCT_ID = `
  query ListProductCpnsByProductId($productId: UUID!) {
    listProductCpnsByProductId(productId: $productId) {
      id
      productId
      customerId
      customerPartNumber
      unitPrice
      commissionRate
      product {
        id
        factoryPartNumber
        description
        unitPrice
        defaultCommissionRate
        approvalNeeded
        published
      }
      customer {
        id
        companyName
        isParent
        parentId
        published
      }
    }
  }
`;

export const FIND_PRODUCT_QUANTITY_PRICING_BY_ID = `
  query FindProductQuantityPricingById($id: UUID!) {
    findProductQuantityPricingById(id: $id) {
      id
      productId
      quantityLow
      quantityHigh
      unitPrice
    }
  }
`;

export const LIST_PRODUCT_QUANTITY_PRICING_BY_PRODUCT_ID = `
  query ListProductQuantityPricingByProductId($productId: UUID!) {
    listProductQuantityPricingByProductId(productId: $productId) {
      id
      productId
      quantityLow
      quantityHigh
      unitPrice
    }
  }
`;

export const SEARCH_FACTORIES = `
  query FactorySearch($searchTerm: String!, $published: Boolean) {
    factorySearch(searchTerm: $searchTerm, published: $published) {
      id
      title
      accountNumber
      published
    }
  }
`;

export const SEARCH_CUSTOMERS = `
  query CustomerSearch($searchTerm: String!, $published: Boolean) {
    customerSearch(searchTerm: $searchTerm, published: $published) {
      id
      companyName
      isParent
      parentId
      published
    }
  }
`;

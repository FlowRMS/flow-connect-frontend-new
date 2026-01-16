/**
 * Product Crosses GraphQL Queries
 * All GraphQL query strings for product crosses module
 */

// ============================================================================
// AI Product Cross Queries
// ============================================================================

export const CROSS_PRODUCTS = `
  query CrossProducts(
    $products: [JSON!]!
    $crossTypes: [ProductCrossTypeEnum!]!
    $samplePrompts: [String!]
  ) {
    crossProducts(
      products: $products
      crossTypes: $crossTypes
      samplePrompts: $samplePrompts
    ) {
      original
      crosses {
        crossType
        originalProduct
        alternatives {
          name
          description
          price
          source
          crossType
          attributes
        }
        promptUsed
        notes
      }
    }
  }
`;

export const CROSS_PRODUCTS_FROM_DOCUMENT = `
  query ProductCrossFromParsedDocument(
    $documentUrl: String!
    $filename: String!
    $crossTypes: [ProductCrossTypeEnum!]!
    $samplePrompts: [String!]
  ) {
    productCrossFromParsedDocument(
      documentUrl: $documentUrl
      filename: $filename
      crossTypes: $crossTypes
      samplePrompts: $samplePrompts
    ) {
      original
      crosses {
        crossType
        originalProduct
        alternatives {
          name
          description
          price
          source
          crossType
          attributes
        }
        promptUsed
        notes
      }
    }
  }
`;

// ============================================================================
// Known Product Cross Queries
// ============================================================================

export const GET_KNOWN_PRODUCT_CROSS = `
  query GetProductCross($productCrossId: UUID!) {
    getProductCross(productCrossId: $productCrossId) {
      id
      userId
      competitorManufacturer
      competitorPartNumber
      competitorDescription
      ourManufacturer
      ourPartNumber
      ourDescription
      timesUsed
      lastUsed
      createdAt
      updatedAt
    }
  }
`;

export const GET_KNOWN_PRODUCT_CROSSES = `
  query GetProductCrosses(
    $limit: Int,
    $offset: Int,
    $search: String,
    $competitorManufacturer: String,
    $competitorPartNumber: String,
    $ourManufacturer: String,
    $ourPartNumber: String,
    $usageLevel: String,
    $dateFrom: datetime,
    $dateTo: datetime,
    $sortBy: String,
    $sortOrder: String
  ) {
    getProductCrosses(
      limit: $limit,
      offset: $offset,
      search: $search,
      competitorManufacturer: $competitorManufacturer,
      competitorPartNumber: $competitorPartNumber,
      ourManufacturer: $ourManufacturer,
      ourPartNumber: $ourPartNumber,
      usageLevel: $usageLevel,
      dateFrom: $dateFrom,
      dateTo: $dateTo,
      sortBy: $sortBy,
      sortOrder: $sortOrder
    ) {
      id
      userId
      competitorManufacturer
      competitorPartNumber
      competitorDescription
      ourManufacturer
      ourPartNumber
      ourDescription
      timesUsed
      lastUsed
      createdAt
      updatedAt
    }
  }
`;

export const GET_KNOWN_PRODUCT_CROSSES_PAGINATED = `
  query GetProductCrossesPaginated(
    $limit: Int,
    $offset: Int,
    $search: String,
    $competitorManufacturer: String,
    $competitorPartNumber: String,
    $ourManufacturer: String,
    $ourPartNumber: String,
    $usageLevel: String,
    $dateFrom: datetime,
    $dateTo: datetime,
    $sortBy: String,
    $sortOrder: String
  ) {
    getProductCrossesPaginated(
      limit: $limit,
      offset: $offset,
      search: $search,
      competitorManufacturer: $competitorManufacturer,
      competitorPartNumber: $competitorPartNumber,
      ourManufacturer: $ourManufacturer,
      ourPartNumber: $ourPartNumber,
      usageLevel: $usageLevel,
      dateFrom: $dateFrom,
      dateTo: $dateTo,
      sortBy: $sortBy,
      sortOrder: $sortOrder
    ) {
      totalCount
      crosses {
        id
        userId
        competitorManufacturer
        competitorPartNumber
        competitorDescription
        ourManufacturer
        ourPartNumber
        ourDescription
        timesUsed
        lastUsed
        createdAt
        updatedAt
      }
    }
  }
`;

// ============================================================================
// Cross Prompt Template Queries
// ============================================================================

export const GET_CROSS_PROMPT_TEMPLATE = `
  query GetCrossPromptTemplate($templateId: UUID!) {
    getCrossPromptTemplate(templateId: $templateId) {
      id
      userId
      name
      prompt
      description
      timesUsed
      lastUsed
      createdAt
      updatedAt
    }
  }
`;

export const GET_CROSS_PROMPT_TEMPLATES = `
  query GetCrossPromptTemplates(
    $limit: Int,
    $offset: Int,
    $search: String,
    $sortBy: String,
    $sortOrder: String
  ) {
    getCrossPromptTemplates(
      limit: $limit,
      offset: $offset,
      search: $search,
      sortBy: $sortBy,
      sortOrder: $sortOrder
    ) {
      id
      userId
      name
      prompt
      description
      timesUsed
      lastUsed
      createdAt
      updatedAt
    }
  }
`;

export const GET_CROSS_PROMPT_TEMPLATES_PAGINATED = `
  query GetCrossPromptTemplatesPaginated(
    $limit: Int,
    $offset: Int,
    $search: String,
    $sortBy: String,
    $sortOrder: String
  ) {
    getCrossPromptTemplatesPaginated(
      limit: $limit,
      offset: $offset,
      search: $search,
      sortBy: $sortBy,
      sortOrder: $sortOrder
    ) {
      totalCount
      templates {
        id
        userId
        name
        prompt
        description
        timesUsed
        lastUsed
        createdAt
        updatedAt
      }
    }
  }
`;

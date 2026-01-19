/**
 * Takeoffs GraphQL Queries
 * Query strings for fetching takeoffs data
 */

// ============================================================================
// Takeoff Queries
// ============================================================================

export const GET_USER_TAKEOFFS = `
  query GetUserTakeoffs(
    $limit: Int,
    $offset: Int,
    $search: String,
    $status: String,
    $source: String,
    $title: String
  ) {
    getUserTakeoffs(
      limit: $limit,
      offset: $offset,
      search: $search,
      status: $status,
      source: $source,
      title: $title
    ) {
      id
      takeoffNumber
      title
      source
      createdById
      status
      quoteId
      metadata
      createdAt
      documents {
        id
        takeoffId
        fileId
        name
        fileType
        fileSize
        documentUrl
        classification
        confidence
        pages
        abridged
        abridgedPages
        abridgedUrl
        reductionPercentage
        pageAnalyses
        products
        parsedItems
        createdAt
      }
    }
  }
`;

export const GET_USER_TAKEOFFS_PAGINATED = `
  query GetUserTakeoffsPaginated(
    $limit: Int,
    $offset: Int,
    $search: String,
    $status: String,
    $source: String,
    $title: String
  ) {
    getUserTakeoffsPaginated(
      limit: $limit,
      offset: $offset,
      search: $search,
      status: $status,
      source: $source,
      title: $title
    ) {
      totalCount
      takeoffs {
        id
        takeoffNumber
        title
        source
        createdById
        status
        quoteId
        metadata
        createdAt
        documents {
          id
          takeoffId
          fileId
          name
          fileType
          fileSize
          documentUrl
          classification
          confidence
          pages
          abridged
          abridgedPages
          abridgedUrl
          reductionPercentage
          pageAnalyses
          products
          parsedItems
          createdAt
        }
      }
    }
  }
`;

export const GET_TAKEOFF = `
  query GetTakeoff($takeoffId: UUID!) {
    getTakeoff(takeoffId: $takeoffId) {
      id
      takeoffNumber
      title
      source
      createdById
      status
      quoteId
      metadata
      createdAt
      documents {
        id
        takeoffId
        fileId
        name
        fileType
        fileSize
        documentUrl
        classification
        confidence
        pages
        abridged
        abridgedPages
        abridgedUrl
        reductionPercentage
        pageAnalyses
        products
        parsedItems
        createdAt
      }
    }
  }
`;

// ============================================================================
// Document Processing Queries
// ============================================================================

export const CLASSIFY_DOCUMENT = `
  query ClassifyDocument($documentUrl: String!, $filename: String!) {
    classifyDocument(documentUrl: $documentUrl, filename: $filename) {
      success
      category
      confidence
      reasoning
      documentType
      error
    }
  }
`;

export const ABRIDGE_DOCUMENT = `
  query AbridgeDocument($documentUrl: String!, $filename: String!, $instructions: [String!]!) {
    abridgeDocument(documentUrl: $documentUrl, filename: $filename, instructions: $instructions) {
      success
      abridgedUrl
      originalPages
      abridgedPages
      reductionPercentage
      wasAbridged
      pageAnalyses {
        pageNumber
        isRelevant
        confidence
        reasoning
        mainTopic
      }
      error
    }
  }
`;

export const CROSS_PRODUCTS = `
  query CrossProducts($products: [JSON!]!, $crossTypes: [ProductCrossTypeEnum!]!, $samplePrompts: [String!]) {
    crossProducts(products: $products, crossTypes: $crossTypes, samplePrompts: $samplePrompts) {
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
        }
        promptUsed
        notes
      }
    }
  }
`;

export const PRODUCT_CROSS_FROM_PARSED_DOCUMENT = `
  query ProductCrossFromParsedDocument($documentUrl: String!, $filename: String!, $crossTypes: [ProductCrossTypeEnum!]!, $samplePrompts: [String!]) {
    productCrossFromParsedDocument(documentUrl: $documentUrl, filename: $filename, crossTypes: $crossTypes, samplePrompts: $samplePrompts) {
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
        }
        promptUsed
        notes
      }
    }
  }
`;

// ============================================================================
// Product Cross Persistence Queries
// ============================================================================

export const GET_TAKEOFF_PRODUCT_CROSSES = `
  query GetTakeoffProductCrosses($takeoffId: UUID!) {
    getTakeoffProductCrosses(takeoffId: $takeoffId) {
      id
      takeoffId
      originalManufacturer
      originalPartNumber
      originalDescription
      originalAttributes
      alternatives
      crossTypesUsed
      promptUsed
      createdAt
    }
  }
`;

// ============================================================================
// Prompt Template Queries
// ============================================================================

export const GET_PROMPT_TEMPLATES = `
  query GetPromptTemplates {
    getPromptTemplates {
      id
      userId
      name
      prompt
      description
      createdAt
      updatedAt
    }
  }
`;

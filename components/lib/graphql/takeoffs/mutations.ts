/**
 * Takeoffs GraphQL Mutations
 * Mutation strings for modifying takeoffs data
 */

// ============================================================================
// Takeoff CRUD Mutations
// ============================================================================

export const CREATE_TAKEOFF = `
  mutation CreateTakeoff($input: CreateTakeoffInput!) {
    createTakeoff(input: $input) {
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
        createdAt
      }
    }
  }
`;

export const UPDATE_TAKEOFF = `
  mutation UpdateTakeoff($takeoffId: UUID!, $input: UpdateTakeoffInput!) {
    updateTakeoff(takeoffId: $takeoffId, input: $input) {
      id
      takeoffNumber
      title
      source
      createdById
      status
      quoteId
      metadata
      createdAt
    }
  }
`;

export const DELETE_TAKEOFF = `
  mutation DeleteTakeoff($takeoffId: UUID!) {
    deleteTakeoff(takeoffId: $takeoffId)
  }
`;

export const UPDATE_TAKEOFF_DOCUMENT = `
  mutation UpdateTakeoffDocument($documentId: UUID!, $input: UpdateTakeoffDocumentInput!) {
    updateTakeoffDocument(documentId: $documentId, input: $input) {
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
`;

// ============================================================================
// Upload Mutations
// ============================================================================

export const UPLOAD_TAKEOFF_DOCUMENT = `
  mutation UploadTakeoffDocument($file: Upload!, $fileName: String!, $folder: String) {
    uploadTakeoffDocument(file: $file, fileName: $fileName, folder: $folder) {
      fileId
      s3Key
      presignedUrl
      fileName
      fileSize
      contentType
    }
  }
`;

// ============================================================================
// Product Cross Persistence Mutations
// ============================================================================

export const SAVE_PRODUCT_CROSS = `
  mutation SaveProductCross($input: SaveProductCrossInput!) {
    saveProductCross(input: $input) {
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

export const SELECT_CROSS_ALTERNATIVE = `
  mutation SelectCrossAlternative($crossId: UUID!, $alternativeIndex: Int!) {
    selectCrossAlternative(crossId: $crossId, alternativeIndex: $alternativeIndex) {
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

export const DELETE_CROSS_ALTERNATIVE = `
  mutation DeleteCrossAlternative($crossId: UUID!, $alternativeIndex: Int!) {
    deleteCrossAlternative(crossId: $crossId, alternativeIndex: $alternativeIndex) {
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

export const DELETE_PRODUCT_CROSS = `
  mutation DeleteProductCross($crossId: UUID!) {
    deleteProductCross(crossId: $crossId)
  }
`;

export const CLEAR_TAKEOFF_CROSSES = `
  mutation ClearTakeoffCrosses($takeoffId: UUID!) {
    clearTakeoffCrosses(takeoffId: $takeoffId)
  }
`;

// ============================================================================
// Prompt Template Mutations
// ============================================================================

export const CREATE_PROMPT_TEMPLATE = `
  mutation CreatePromptTemplate($input: CreatePromptTemplateInput!) {
    createPromptTemplate(input: $input) {
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

export const UPDATE_PROMPT_TEMPLATE = `
  mutation UpdatePromptTemplate($input: UpdatePromptTemplateInput!) {
    updatePromptTemplate(input: $input) {
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

export const DELETE_PROMPT_TEMPLATE = `
  mutation DeletePromptTemplate($templateId: UUID!) {
    deletePromptTemplate(templateId: $templateId)
  }
`;

/**
 * Product Crosses GraphQL Mutations
 * All GraphQL mutation strings for product crosses module
 */

// ============================================================================
// Known Product Cross Mutations
// ============================================================================

export const CREATE_KNOWN_PRODUCT_CROSS = `
  mutation CreateProductCross($input: CreateProductCrossInput!) {
    createProductCross(input: $input) {
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

export const UPDATE_KNOWN_PRODUCT_CROSS = `
  mutation UpdateProductCross($productCrossId: UUID!, $input: UpdateProductCrossInput!) {
    updateProductCross(productCrossId: $productCrossId, input: $input) {
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

export const DELETE_KNOWN_PRODUCT_CROSS = `
  mutation DeleteProductCross($productCrossId: UUID!) {
    deleteProductCross(productCrossId: $productCrossId)
  }
`;

export const INCREMENT_KNOWN_PRODUCT_CROSS_USAGE = `
  mutation IncrementProductCrossUsage($productCrossId: UUID!) {
    incrementProductCrossUsage(productCrossId: $productCrossId) {
      id
      timesUsed
      lastUsed
    }
  }
`;

export const BULK_CREATE_KNOWN_PRODUCT_CROSSES = `
  mutation BulkCreateProductCrosses($crosses: [BulkProductCrossInput!]!) {
    bulkCreateProductCrosses(crosses: $crosses) {
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

// ============================================================================
// Cross Prompt Template Mutations
// ============================================================================

export const CREATE_CROSS_PROMPT_TEMPLATE = `
  mutation CreateCrossPromptTemplate($input: CreateCrossPromptTemplateInput!) {
    createCrossPromptTemplate(input: $input) {
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

export const UPDATE_CROSS_PROMPT_TEMPLATE = `
  mutation UpdateCrossPromptTemplate($templateId: UUID!, $input: UpdateCrossPromptTemplateInput!) {
    updateCrossPromptTemplate(templateId: $templateId, input: $input) {
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

export const DELETE_CROSS_PROMPT_TEMPLATE = `
  mutation DeleteCrossPromptTemplate($templateId: UUID!) {
    deleteCrossPromptTemplate(templateId: $templateId)
  }
`;

export const INCREMENT_CROSS_PROMPT_TEMPLATE_USAGE = `
  mutation IncrementCrossPromptTemplateUsage($templateId: UUID!) {
    incrementCrossPromptTemplateUsage(templateId: $templateId) {
      id
      timesUsed
      lastUsed
    }
  }
`;

export const CREATE_PRODUCT = `
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) {
      id
      factoryPartNumber
      unitPrice
      defaultCommissionRate
      approvalNeeded
      description
      published
      category {
        id
        title
        commissionRate
        factoryId
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
      uom {
        id
        title
        description
        divisionFactor
      }
      factory {
        id
        title
      }
    }
  }
`;

export const UPDATE_PRODUCT = `
  mutation UpdateProduct($id: UUID!, $input: ProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      factoryPartNumber
      unitPrice
      defaultCommissionRate
      approvalNeeded
      description
      published
      category {
        id
        title
        commissionRate
        factoryId
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
      uom {
        id
        title
        description
        divisionFactor
      }
      factory {
        id
        title
      }
    }
  }
`;

export const DELETE_PRODUCT = `
  mutation DeleteProduct($id: UUID!) {
    deleteProduct(id: $id)
  }
`;

export const CREATE_PRODUCT_CATEGORY = `
  mutation CreateProductCategory($input: ProductCategoryInput!) {
    createProductCategory(input: $input) {
      id
      title
      commissionRate
      factoryId
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

export const UPDATE_PRODUCT_CATEGORY = `
  mutation UpdateProductCategory($id: UUID!, $input: ProductCategoryInput!) {
    updateProductCategory(id: $id, input: $input) {
      id
      title
      commissionRate
      factoryId
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

export const DELETE_PRODUCT_CATEGORY = `
  mutation DeleteProductCategory($id: UUID!) {
    deleteProductCategory(id: $id)
  }
`;

export const CREATE_PRODUCT_UOM = `
  mutation CreateProductUom($input: ProductUomInput!) {
    createProductUom(input: $input) {
      id
      title
      description
      divisionFactor
    }
  }
`;

export const UPDATE_PRODUCT_UOM = `
  mutation UpdateProductUom($id: UUID!, $input: ProductUomInput!) {
    updateProductUom(id: $id, input: $input) {
      id
      title
      description
      divisionFactor
    }
  }
`;

export const DELETE_PRODUCT_UOM = `
  mutation DeleteProductUom($id: UUID!) {
    deleteProductUom(id: $id)
  }
`;

export const CREATE_PRODUCT_CPN = `
  mutation CreateProductCpn($input: ProductCpnInput!) {
    createProductCpn(input: $input) {
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

export const UPDATE_PRODUCT_CPN = `
  mutation UpdateProductCpn($id: UUID!, $input: ProductCpnInput!) {
    updateProductCpn(id: $id, input: $input) {
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

export const DELETE_PRODUCT_CPN = `
  mutation DeleteProductCpn($id: UUID!) {
    deleteProductCpn(id: $id)
  }
`;

export const CREATE_PRODUCT_QUANTITY_PRICING = `
  mutation CreateProductQuantityPricing($input: ProductQuantityPricingInput!) {
    createProductQuantityPricing(input: $input) {
      id
      productId
      quantityLow
      quantityHigh
      unitPrice
    }
  }
`;

export const UPDATE_PRODUCT_QUANTITY_PRICING = `
  mutation UpdateProductQuantityPricing($id: UUID!, $input: ProductQuantityPricingInput!) {
    updateProductQuantityPricing(id: $id, input: $input) {
      id
      productId
      quantityLow
      quantityHigh
      unitPrice
    }
  }
`;

export const DELETE_PRODUCT_QUANTITY_PRICING = `
  mutation DeleteProductQuantityPricing($id: UUID!) {
    deleteProductQuantityPricing(id: $id)
  }
`;

export const IMPORT_PRODUCTS = `
  mutation ImportProducts($input: ProductImportInput!, $defaultUomId: UUID!) {
    importProducts(input: $input, defaultUomId: $defaultUomId) {
      success
      productsCreated
      productsUpdated
      quantityPricingCreated
      customerPricingCreated
      customerPricingUpdated
      errors {
        factoryPartNumber
        error
      }
      message
      customersNotFound
    }
  }
`;

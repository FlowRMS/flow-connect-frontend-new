/**
 * Spec Sheets GraphQL Queries
 * Query strings for fetching spec sheets, highlights, and folders
 */

// ============================================================================
// Spec Sheet Queries
// ============================================================================

export const GET_SPEC_SHEET = `
  query GetSpecSheet($id: UUID!) {
    specSheet(id: $id) {
      id
      factoryId
      fileName
      displayName
      uploadSource
      sourceUrl
      fileUrl
      fileSize
      pageCount
      categories
      tags
      folderId
      needsReview
      published
      usageCount
      highlightCount
      createdAt
      createdBy {
        id
        email
        firstName
        lastName
        fullName
      }
    }
  }
`;

export const GET_SPEC_SHEETS_BY_FACTORY = `
  query GetSpecSheetsByFactory($factoryId: UUID!, $publishedOnly: Boolean) {
    specSheetsByFactory(factoryId: $factoryId, publishedOnly: $publishedOnly) {
      id
      factoryId
      fileName
      displayName
      uploadSource
      sourceUrl
      fileUrl
      fileSize
      pageCount
      categories
      tags
      folderId
      needsReview
      published
      usageCount
      highlightCount
      createdAt
      createdBy {
        id
        email
        firstName
        lastName
        fullName
      }
    }
  }
`;

export const SEARCH_SPEC_SHEETS = `
  query SearchSpecSheets(
    $searchTerm: String
    $factoryId: UUID
    $categories: [String!]
    $publishedOnly: Boolean
    $limit: Int
  ) {
    specSheetSearch(
      searchTerm: $searchTerm
      factoryId: $factoryId
      categories: $categories
      publishedOnly: $publishedOnly
      limit: $limit
    ) {
      id
      factoryId
      fileName
      displayName
      uploadSource
      sourceUrl
      fileUrl
      fileSize
      pageCount
      categories
      tags
      folderId
      needsReview
      published
      usageCount
      highlightCount
      createdAt
      createdBy {
        id
        email
        firstName
        lastName
        fullName
      }
    }
  }
`;

export const GET_SPEC_SHEETS_BY_FOLDER = `
  query GetSpecSheetsByFolder($factoryId: UUID!, $folderId: UUID, $publishedOnly: Boolean) {
    specSheetsByFolder(factoryId: $factoryId, folderId: $folderId, publishedOnly: $publishedOnly) {
      id
      factoryId
      fileName
      displayName
      uploadSource
      sourceUrl
      fileUrl
      fileSize
      pageCount
      categories
      tags
      folderId
      needsReview
      published
      usageCount
      highlightCount
      createdAt
      createdBy {
        id
        email
        firstName
        lastName
        fullName
      }
    }
  }
`;

// ============================================================================
// Highlight Queries
// ============================================================================

export const GET_HIGHLIGHT_VERSIONS = `
  query GetHighlightVersions($specSheetId: UUID!) {
    highlightVersionsBySpecSheet(specSheetId: $specSheetId) {
      id
      specSheetId
      name
      description
      versionNumber
      isActive
      regions {
        id
        pageNumber
        x
        y
        width
        height
        shapeType
        color
        annotation
        tags
        createdAt
      }
      createdAt
      createdBy {
        id
        fullName
      }
    }
  }
`;

export const GET_HIGHLIGHT_VERSION = `
  query GetHighlightVersion($id: UUID!) {
    highlightVersion(id: $id) {
      id
      specSheetId
      name
      description
      versionNumber
      isActive
      regions {
        id
        pageNumber
        x
        y
        width
        height
        shapeType
        color
        annotation
        tags
        createdAt
      }
      createdAt
      createdBy {
        id
        fullName
      }
    }
  }
`;

// ============================================================================
// Folder Queries
// ============================================================================

export const GET_FOLDERS_BY_FACTORY = `
  query GetFoldersByFactory($factoryId: UUID!) {
    foldersByFactory(factoryId: $factoryId) {
      id
      factoryId
      name
      parentId
      createdAt
      specSheetCount
    }
  }
`;

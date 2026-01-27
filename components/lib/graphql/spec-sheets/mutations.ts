/**
 * Spec Sheets GraphQL Mutations
 * Mutation strings for spec sheets, highlights, and folders
 */

// ============================================================================
// Spec Sheet Mutations
// ============================================================================

export const CREATE_SPEC_SHEET = `
  mutation CreateSpecSheet($input: CreateSpecSheetInput!) {
    createSpecSheet(input: $input) {
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

export const UPDATE_SPEC_SHEET = `
  mutation UpdateSpecSheet($id: UUID!, $input: UpdateSpecSheetInput!) {
    updateSpecSheet(id: $id, input: $input) {
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

export const DELETE_SPEC_SHEET = `
  mutation DeleteSpecSheet($id: UUID!) {
    deleteSpecSheet(id: $id)
  }
`;

export const MOVE_SPEC_SHEET_TO_FOLDER = `
  mutation MoveSpecSheetToFolder($input: MoveSpecSheetToFolderInput!) {
    moveSpecSheetToFolder(input: $input) {
      id
      factoryId
      fileName
      displayName
      folderId
      createdAt
    }
  }
`;

// ============================================================================
// Highlight Mutations
// ============================================================================

export const CREATE_HIGHLIGHT_VERSION = `
  mutation CreateHighlightVersion($input: CreateHighlightVersionInput!) {
    createHighlightVersion(input: $input) {
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

export const UPDATE_HIGHLIGHT_REGIONS = `
  mutation UpdateHighlightRegions($input: UpdateHighlightRegionsInput!) {
    updateHighlightRegions(input: $input) {
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

export const DELETE_HIGHLIGHT_VERSION = `
  mutation DeleteHighlightVersion($id: UUID!) {
    deleteHighlightVersion(id: $id)
  }
`;

export const RENAME_HIGHLIGHT_VERSION = `
  mutation RenameHighlightVersion($id: UUID!, $input: UpdateHighlightVersionInput!) {
    updateHighlightVersion(id: $id, input: $input) {
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
// Folder Mutations
// ============================================================================

export const CREATE_FOLDER = `
  mutation CreateSpecSheetFolder($input: CreateSpecSheetFolderInput!) {
    createSpecSheetFolder(input: $input) {
      id
      factoryId
      folderPath
      name
      parentId
      createdAt
      specSheetCount
    }
  }
`;

export const RENAME_FOLDER = `
  mutation RenameSpecSheetFolder($input: RenameSpecSheetFolderInput!) {
    renameSpecSheetFolder(input: $input) {
      folder {
        id
        factoryId
        folderPath
        name
        parentId
        createdAt
        specSheetCount
      }
      specSheetsUpdated
    }
  }
`;

export const DELETE_FOLDER = `
  mutation DeleteSpecSheetFolder($input: DeleteSpecSheetFolderInput!) {
    deleteSpecSheetFolder(input: $input)
  }
`;

export const MOVE_FOLDER = `
  mutation MoveFolder($input: MoveFolderInput!) {
    moveSpecSheetFolder(input: $input) {
      id
      factoryId
      folderPath
      name
      parentId
      createdAt
      specSheetCount
    }
  }
`;

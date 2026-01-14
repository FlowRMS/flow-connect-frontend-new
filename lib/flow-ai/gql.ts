import { gql } from "@apollo/client";

export const SUB_PROCESS_DOC = gql`
  subscription ProcessDocumentForReview($documentId: UUID!, $initialInstructions: [String!], $contextFiles: [UUID!]) {
    processDocumentForReview(documentId: $documentId, initialInstructions: $initialInstructions, contextFiles: $contextFiles) {
      pendingDocument {
        additionalInstructionsJson
        convertedDocumentUrl
        originalPresignedUrl
        createdAt
        entityType
        extractedDataJson
        fileId
        fileUploadProcessId
        id
        pages {
          markdownContent
        }
        sha
        similarDocumentsJson
        sourceClassificationJson
        sourceName
        sourceType
        status
        updatedAt
      }
      action
    }
  }
`;

export const SUB_UPDATE_INSTR = gql`
  subscription UpdateDocumentInstructions($input: UpdateInstructionsInput!) {
    updateDocumentInstructions(input: $input) {
      action
      isComplete
    }
  }
`;

export const SUB_APPLY_CLUSTER_INSTRUCTIONS = gql`
  subscription ApplyClusterInstructions($input: ApplyClusterInstructionsInput!) {
    applyClusterInstructions(input: $input) {
      action
      isComplete
    }
  }
`;

export const Q_GET_PENDING = gql`
  query GetPendingDocument($pendingId: UUID!) {
    getPendingDocument(pendingId: $pendingId) {
      additionalInstructionsJson
      convertedDocumentUrl
      originalPresignedUrl
      createdAt
      entityType
      extractedDataJson
      fileId
      fileUploadProcessId
      id
      pages {
        markdownContent
      }
      sha
      similarDocumentsJson
      sourceClassificationJson
      sourceName
      sourceType
      status
      workflowStatus
      updatedAt
    }
  }
`;

export const Q_GET_CORRECTIONS = gql`
  query GetPendingDocumentCorrections($pendingId: UUID!) {
    getPendingDocumentCorrections(pendingId: $pendingId) {
      correctionAction
      createdAt
      id
      newValue
      oldValue
      pendingDocumentId
    }
  }
`;

export const Q_GET_VERSION_HISTORY = gql`
  query GetVersionHistory($pendingId: UUID!) {
    getVersionHistory(pendingId: $pendingId) {
      id
      pendingDocumentId
      versionNumber
      changeType
      changeDescription
      userInstruction
      executedCode
      metadata
      createdAt
    }
  }
`;

export const Q_GET_SPECIFIC_VERSION = gql`
  query GetSpecificVersion($pendingId: UUID!, $versionNumber: Int!) {
    getSpecificVersion(pendingId: $pendingId, versionNumber: $versionNumber) {
      id
      pendingDocumentId
      versionNumber
      changeType
      changeDescription
      userInstruction
      executedCode
      metadata
      createdAt
      createdBy
      data
    }
  }
`;

export const M_APPROVE = gql`
  mutation ApproveDocument($pendingId: UUID!, $saveToTemplate: Boolean! = true) {
    approveDocument(pendingId: $pendingId, saveToTemplate: $saveToTemplate)
  }
`;

export const M_REJECT = gql`
  mutation RejectDocument($pendingId: UUID!) {
    rejectDocument(pendingId: $pendingId)
  }
`;

export const M_REMAP_TABULAR_COLUMNS = gql`
  mutation RemapTabularColumns($pendingId: UUID!, $mappingHints: JSON!, $defaultValues: [ColumnDefaultValueInput!], $duplicateColumns: [ColumnDuplicateInput!]) {
    remapTabularColumns(input: { pendingId: $pendingId, mappingHints: $mappingHints, defaultValues: $defaultValues, duplicateColumns: $duplicateColumns })
  }
`;

export const M_MANUAL_EDIT_DATA = gql`
  mutation ManualEditData($input: ManualEditDataInput!) {
    manualEditData(input: $input) {
      additionalInstructionsJson
      convertedDocumentUrl
      createdAt
      entityType
      extractedDataJson
      fileId
      fileUploadProcessId
      id
      originalPresignedUrl
      pages {
        createdAt
        entityNumber
        id
        isRelevantForTransactions
        markdownContent
        pageNumber
        pageType
        reasoning
      }
      sha
      similarDocumentsJson
      sourceClassificationJson
      sourceName
      sourceType
      status
      updatedAt
    }
  }
`;

export const M_ROLLBACK_TO_VERSION = gql`
  mutation RollbackToVersion($pendingId: UUID!, $versionNumber: Int!, $changeDescription: String) {
    rollbackToVersion(
      pendingId: $pendingId
      versionNumber: $versionNumber
      changeDescription: $changeDescription
    ) {
      additionalInstructionsJson
      convertedDocumentUrl
      createdAt
      entityType
      extractedDataJson
      fileId
      fileUploadProcessId
      id
      originalPresignedUrl
      pages {
        createdAt
        entityNumber
        id
        isRelevantForTransactions
        markdownContent
        pageNumber
        pageType
        reasoning
      }
      sha
      similarDocumentsJson
      sourceClassificationJson
      sourceName
      sourceType
      status
      updatedAt
    }
  }
`;

// Clusters / Templates queries and mutations
export const Q_GET_CLUSTERS = gql`
  query GetClusters {
    clusters {
      additionalInstructions
      clusterMetadata
      clusterName
      createdAt
      documentCount
      id
    }
  }
`;

export const Q_GET_CLUSTER = gql`
  query GetCluster($clusterId: UUID!) {
    getCluster(clusterId: $clusterId) {
      additionalInstructions
      clusterMetadata
      clusterName
      contexts {
        clusterId
        createdAt
        fileId
        fileType
        fileName
        id
      }
      createdAt
      documentCount
      id
    }
  }
`;

export const Q_GET_CLUSTER_DOCUMENTS = gql`
  query GetClusterDocuments($clusterId: UUID!) {
    getClusterDocuments(clusterId: $clusterId) {
      additionalInstructionsJson
      convertedDocumentUrl
      createdAt
      entityType
      extractedDataJson
      fileId
      id
      originalPresignedUrl
      similarDocumentsJson
      sourceClassificationJson
      sourceName
      sourceType
      status
      updatedAt
    }
  }
`;

export const M_UPDATE_CLUSTER_INSTRUCTIONS = gql`
  mutation UpdateClusterInstructions($input: UpdateClusterInstructionsInput!) {
    updateClusterInstructions(input: $input) {
      additionalInstructions
      clusterMetadata
      createdAt
      documentCount
      id
    }
  }
`;

export const M_ADD_CLUSTER_CONTEXTS = gql`
  mutation AddClusterContexts($clusterId: UUID!, $contextFiles: [UUID!]!) {
    addClusterContexts(clusterId: $clusterId, contextFiles: $contextFiles) {
      additionalInstructions
      clusterMetadata
      contexts {
        clusterId
        createdAt
        fileId
        fileName
        fileType
        id
      }
      createdAt
      documentCount
      id
    }
  }
`;

export const M_REMOVE_CLUSTER_CONTEXTS = gql`
  mutation RemoveClusterContexts($input: RemoveClusterContextsInput!) {
    removeClusterContexts(input: $input) {
      additionalInstructions
      clusterMetadata
      contexts {
        clusterId
        createdAt
        fileId
        fileName
        fileType
        id
      }
      createdAt
      documentCount
      id
    }
  }
`;

export const M_UPDATE_CLUSTER_NAME = gql`
  mutation UpdateClusterName($clusterId: UUID!, $clusterName: String!) {
    updateClusterName(clusterId: $clusterId, clusterName: $clusterName)
  }
`;

export const M_DELETE_CLUSTER = gql`
  mutation DeleteCluster($clusterId: UUID!) {
    deleteCluster(clusterId: $clusterId)
  }
`;

export const M_UPLOAD_FILE = gql`
  mutation SingleFileUpload(
    $file: Upload!
    $tenantLevel: Boolean
    $public: Boolean
    $entityId: ID
    $entityType: EntityType
    $folderId: ID
  ) {
    singleFileUpload(
      file: $file
      tenantLevel: $tenantLevel
      public: $public
      entityId: $entityId
      entityType: $entityType
      folderId: $folderId
    ) {
      results {
        status {
          code
          keyword
          message
        }
        fileName
        filePath
        folderId
        id
        thumbnail
      }
    }
  }
`;

// AI Chat Operations
export const M_CREATE_CHAT = gql`
  mutation CreateChat {
    createChat
  }
`;

export const M_DELETE_CHAT = gql`
  mutation DeleteChat($chatId: UUID!) {
    deleteChat(chatId: $chatId)
  }
`;

export const SUB_CHAT_WITH_AGENT = gql`
  subscription ChatWithAgent($userMessage: String!, $chatId: UUID, $config: ChatAgentConfigInput) {
    chatWithAgent(userMessage: $userMessage, chatId: $chatId, config: $config) {
      approvalRequired
      chatId
      followUpSuggestions
      isFinal
      message
      documentReferences {
        contentPreview
        documentId
        fileName
        pageNumber
        similarityScore
      }
    }
  }
`;

export const Q_GET_CHAT = gql`
  query GetChat($chatId: UUID!) {
    getChat(chatId: $chatId) {
      createdAt
      followUpSuggestions
      id
      messages {
        chatId
        content
        createdAt
        documentReferences {
          contentPreview
          documentId
          fileName
          pageNumber
          similarityScore
        }
        id
        messageType
        metaData
        role
        toolArgs
        toolName
      }
      sessionId
      status
      title
      userId
    }
  }
`;

export const Q_GET_USER_CHATS = gql`
  query GetUserChats {
    getUserChats {
      createdAt
      followUpSuggestions
      id
      sessionId
      status
      title
      userId
    }
  }
`;

export const Q_GET_CURRENT_SESSION_ACTIVE_CHAT = gql`
  query GetCurrentSessionActiveChat {
    getCurrentSessionActiveChat {
      createdAt
      followUpSuggestions
      id
      messages {
        chatId
        content
        createdAt
        documentReferences {
          contentPreview
          documentId
          fileName
          pageNumber
          similarityScore
        }
        id
        metaData
        messageType
        toolArgs
        role
        toolName
      }
      sessionId
      status
      title
      userId
    }
  }
`;

export const Q_FIND_FACTORY_BY_TITLE = gql`
  query FindFactoryByTitle($title: String!) {
    findFactoryByTitle(title: $title) {
      title
    }
  }
`;

export const Q_FIND_FACTORIES_BY_PUBLISHED_TRUE = gql`
  query FindFactoriesByPublishedTrue {
    findFactoriesByPublishedTrue {
      title
    }
  }
`;

export const M_SUBMIT_MESSAGE_FEEDBACK = gql`
  mutation SubmitMessageFeedback($input: SubmitFeedbackInput!) {
    submitMessageFeedback(input: $input) {
      createdAt
      feedbackMessage
      feedbackType
      id
      messageId
      userId
    }
  }
`;

// Entity Matching Operations - Fragment for reuse
const PENDING_ENTITY_FIELDS = `
  bestMatchId
  bestMatchName
  bestMatchSimilarity
  confirmationStatus
  confirmedByUserId
  confirmedAt
  createdAt
  displayName
  dtoIds
  entityType
  extractedData
  flowIndexDetail
  id
  matchCandidates {
    entityId
    metadata
    name
    rank
    similarityScore
  }
  pendingDocumentId
  sourceLineNumbers
  updatedAt
`;

// ============================================
// WORKFLOW QUERIES AND MUTATIONS
// ============================================

export const Q_GET_WORKFLOW = gql`
  query GetWorkflow($workflowId: UUID!) {
    workflow(workflowId: $workflowId) {
      id
      name
      description
      instruction
      workflowJson
      generatedCode
      pseudoCode
      status
      isPublic
      createdBy
      createdAt
      updatedAt
    }
  }
`;

export const Q_GET_WORKFLOWS = gql`
  query GetWorkflows($page: Int = 1, $pageSize: Int = 20) {
    workflows(page: $page, pageSize: $pageSize) {
      workflows {
        id
        name
        description
        instruction
        workflowJson
        generatedCode
        pseudoCode
        status
        isPublic
        createdBy
        createdAt
        updatedAt
      }
      total
      page
      pageSize
    }
  }
`;

export const Q_GET_WORKFLOW_EXECUTIONS = gql`
  query GetWorkflowExecutions($workflowId: UUID!) {
    workflowExecutions(workflowId: $workflowId) {
      id
      workflowId
      status
      inputData
      outputData
      errorMessage
      executionLog
      startedAt
      completedAt
      createdAt
    }
  }
`;

export const Q_GET_WORKFLOW_EXECUTION = gql`
  query GetWorkflowExecution($workflowId: UUID!, $executionId: UUID!) {
    workflowExecution(workflowId: $workflowId, executionId: $executionId) {
      id
      workflowId
      status
      inputData
      outputData
      errorMessage
      executionLog
      startedAt
      completedAt
      createdAt
    }
  }
`;

export const Q_GET_WORKFLOW_FILES = gql`
  query GetWorkflowFiles($workflowId: UUID!) {
    workflowFiles(workflowId: $workflowId) {
      id
      workflowId
      filename
      filePath
      fileSize
      fileType
      uploadedAt
    }
  }
`;

export const Q_GET_WORKFLOW_GALLERY = gql`
  query GetWorkflowGallery {
    workflowGallery {
      publicWorkflows {
        id
        name
        description
        instruction
        workflowJson
        generatedCode
        pseudoCode
        status
        isPublic
        createdAt
        updatedAt
        createdBy
      }
      myWorkflows {
        id
        name
        description
        instruction
        workflowJson
        generatedCode
        pseudoCode
        status
        isPublic
        createdAt
        updatedAt
        createdBy
      }
    }
  }
`;

export const Q_GET_ALL_EXECUTIONS = gql`
  query GetAllExecutions($status: String, $workflowId: UUID, $page: Int = 1, $pageSize: Int = 50) {
    allExecutions(status: $status, workflowId: $workflowId, page: $page, pageSize: $pageSize) {
      executions {
        id
        workflowId
        status
        inputData
        outputData
        errorMessage
        executionLog
        startedAt
        completedAt
        createdAt
      }
      total
      page
      pageSize
    }
  }
`;

export const Q_GET_EXECUTION_BY_ID = gql`
  query GetExecutionById($executionId: UUID!) {
    executionById(executionId: $executionId) {
      id
      workflowId
      status
      inputData
      outputData
      errorMessage
      executionLog
      startedAt
      completedAt
      createdAt
    }
  }
`;

// Workflow Mutations
export const M_CREATE_WORKFLOW = gql`
  mutation CreateWorkflow(
    $name: String!
    $instruction: String!
    $description: String
    $autoExecute: Boolean = false
    $inputData: JSON
  ) {
    createWorkflow(
      name: $name
      instruction: $instruction
      description: $description
      autoExecute: $autoExecute
      inputData: $inputData
    ) {
      id
      name
      description
      instruction
      workflowJson
      generatedCode
      pseudoCode
      status
      createdAt
    }
  }
`;

// Entity Matching Operations
export const Q_GET_PENDING_ENTITIES = gql`
  query GetPendingEntities($filterInput: PendingEntitiesFilterInput!) {
    pendingEntities(filterInput: $filterInput) {
      ${PENDING_ENTITY_FIELDS}
    }
  }
`;

// Lightweight query to check if any pending entities exist (only fetches IDs)
export const Q_CHECK_PENDING_ENTITIES_EXIST = gql`
  query CheckPendingEntitiesExist($pendingDocumentId: UUID!) {
    factories: pendingEntities(filterInput: { entityType: FACTORIES, pendingDocumentId: $pendingDocumentId }) {
      id
    }
    customers: pendingEntities(filterInput: { entityType: CUSTOMERS, pendingDocumentId: $pendingDocumentId }) {
      id
    }
    endUsers: pendingEntities(filterInput: { entityType: END_USERS, pendingDocumentId: $pendingDocumentId }) {
      id
    }
    products: pendingEntities(filterInput: { entityType: PRODUCTS, pendingDocumentId: $pendingDocumentId }) {
      id
    }
  }
`;

// Single query to fetch all entity types at once using aliases
export const Q_GET_ALL_PENDING_ENTITIES = gql`
  query GetAllPendingEntities($pendingDocumentId: UUID!) {
    factories: pendingEntities(filterInput: { entityType: FACTORIES, pendingDocumentId: $pendingDocumentId }) {
      ${PENDING_ENTITY_FIELDS}
    }
    customers: pendingEntities(filterInput: { entityType: CUSTOMERS, pendingDocumentId: $pendingDocumentId }) {
      ${PENDING_ENTITY_FIELDS}
    }
    billToCustomers: pendingEntities(filterInput: { entityType: BILL_TO_CUSTOMERS, pendingDocumentId: $pendingDocumentId }) {
      ${PENDING_ENTITY_FIELDS}
    }
    endUsers: pendingEntities(filterInput: { entityType: END_USERS, pendingDocumentId: $pendingDocumentId }) {
      ${PENDING_ENTITY_FIELDS}
    }
    products: pendingEntities(filterInput: { entityType: PRODUCTS, pendingDocumentId: $pendingDocumentId }) {
      ${PENDING_ENTITY_FIELDS}
    }
    orders: pendingEntities(filterInput: { entityType: ORDERS, pendingDocumentId: $pendingDocumentId }) {
      ${PENDING_ENTITY_FIELDS}
    }
    invoices: pendingEntities(filterInput: { entityType: INVOICES, pendingDocumentId: $pendingDocumentId }) {
      ${PENDING_ENTITY_FIELDS}
    }
    credits: pendingEntities(filterInput: { entityType: CREDITS, pendingDocumentId: $pendingDocumentId }) {
      ${PENDING_ENTITY_FIELDS}
    }
    adjustments: pendingEntities(filterInput: { entityType: ADJUSTMENTS, pendingDocumentId: $pendingDocumentId }) {
      ${PENDING_ENTITY_FIELDS}
    }
  }
`;

export const Q_GET_PENDING_ENTITY = gql`
  query GetPendingEntity($pendingEntityId: UUID!) {
    pendingEntity(pendingEntityId: $pendingEntityId) {
      bestMatchId
      bestMatchName
      bestMatchSimilarity
      confirmationStatus
      confirmedAt
      confirmedByUserId
      createdAt
      displayName
      dtoIds
      entityType
      extractedData
      flowIndexDetail
      id
      matchCandidates {
        entityId
        metadata
        name
        rank
        similarityScore
      }
      pendingDocumentId
      sourceLineNumbers
      updatedAt
    }
  }
`;

export const Q_SEARCH_EXISTING_ENTITIES = gql`
  query SearchExistingEntities($input: SearchExistingEntitiesInput!) {
    searchExistingEntities(input: $input) {
      entityId
      metadata
      name
      rank
      similarityScore
    }
  }
`;

export const M_CONFIRM_ENTITY_MATCH = gql`
  mutation ConfirmEntityMatch($input: ConfirmMatchInput!) {
    confirmEntityMatch(input: $input) {
      bestMatchId
      bestMatchName
      bestMatchSimilarity
      confirmationStatus
      confirmedAt
      confirmedByUserId
      createdAt
      displayName
      dtoIds
      entityType
      extractedData
      flowIndexDetail
      id
      matchCandidates {
        entityId
        metadata
        name
        rank
        similarityScore
      }
      pendingDocumentId
      sourceLineNumbers
      updatedAt
    }
  }
`;

export const M_SAVE_WORKFLOW = gql`
  mutation SaveWorkflow(
    $name: String!
    $instruction: String!
    $workflowJson: JSON!
    $generatedCode: String!
    $description: String
    $pseudoCode: String
    $isPublic: Boolean! = false
  ) {
    saveWorkflow(
      name: $name
      instruction: $instruction
      workflowJson: $workflowJson
      generatedCode: $generatedCode
      description: $description
      pseudoCode: $pseudoCode
      isPublic: $isPublic
    ) {
      id
      name
      description
      instruction
      workflowJson
      generatedCode
      pseudoCode
      status
      isPublic
      createdAt
      updatedAt
    }
  }
`;

export const M_UPDATE_WORKFLOW = gql`
  mutation UpdateWorkflow(
    $workflowId: UUID!
    $name: String
    $description: String
    $instruction: String
    $workflowJson: JSON
    $status: String
    $generatedCode: String
    $pseudoCode: String
    $isPublic: Boolean
  ) {
    updateWorkflow(
      workflowId: $workflowId
      name: $name
      description: $description
      instruction: $instruction
      workflowJson: $workflowJson
      status: $status
      generatedCode: $generatedCode
      pseudoCode: $pseudoCode
      isPublic: $isPublic
    ) {
      id
      name
      description
      instruction
      workflowJson
      generatedCode
      pseudoCode
      status
      isPublic
      createdAt
      updatedAt
    }
  }
`;

export const M_BULK_CONFIRM_ENTITIES = gql`
  mutation BulkConfirmEntities($inputs: [BulkConfirmationInput!]!) {
    bulkConfirmEntities(inputs: $inputs) {
      bestMatchId
      bestMatchName
      bestMatchSimilarity
      confirmationStatus
      confirmedAt
      confirmedByUserId
      createdAt
      displayName
      dtoIds
      entityType
      extractedData
      flowIndexDetail
      id
      matchCandidates {
        entityId
        metadata
        name
        rank
        similarityScore
      }
      pendingDocumentId
      sourceLineNumbers
      updatedAt
    }
  }
`;

export const M_DELETE_WORKFLOW = gql`
  mutation DeleteWorkflow($workflowId: UUID!) {
    deleteWorkflow(workflowId: $workflowId)
  }
`;

export const M_EXECUTE_WORKFLOW = gql`
  mutation ExecuteWorkflow(
    $workflowId: UUID!
    $inputData: JSON
  ) {
    executeWorkflow(
      workflowId: $workflowId
      inputData: $inputData
    ) {
      id
      workflowId
      status
      inputData
      outputData
      errorMessage
      executionLog
      startedAt
      completedAt
      createdAt
    }
  }
`;

export const M_EXECUTE_PIPELINE = gql`
  mutation ExecutePipeline(
    $prompt: String!
    $fileIds: [UUID!]!
    $overrideCode: String
    $stopAfter: Int = 4
    $additionalData: JSON
  ) {
    executePipeline(
      prompt: $prompt
      fileIds: $fileIds
      overrideCode: $overrideCode
      stopAfter: $stopAfter
      additionalData: $additionalData
    ) {
      success
      error
      result
      nodes
      warnings
      columnMapping
    }
  }
`;

export const SUB_PROCESS_EXTRACTED_DTOS = gql`
  subscription ProcessExtractedDtos($pendingDocumentId: UUID!) {
    processExtractedDtos(pendingDocumentId: $pendingDocumentId) {
      action
      isFinal
    }
  }
`;

export const M_CREATE_NEW_ENTITY = gql`
  mutation CreateNewEntity($input: CreateNewEntityInput!) {
    createNewEntity(input: $input) {
      bestMatchId
      bestMatchName
      bestMatchSimilarity
      confirmationStatus
      confirmedAt
      confirmedByUserId
      createdAt
      displayName
      dtoIds
      entityType
      extractedData
      flowIndexDetail
      id
      matchCandidates {
        entityId
        metadata
        name
        rank
        similarityScore
      }
      pendingDocumentId
      sourceLineNumbers
      updatedAt
    }
  }
`;

// Pending Documents Landing Query - for Queue page (using findLandingPages endpoint)
export const Q_PENDING_DOCUMENTS_LANDING = gql`
  query FindLandingPages(
    $limit: Int!
    $offset: Int!
    $filters: [Filter!]
    $orderBy: [OrderBy!]
  ) {
    findLandingPages(
      sourceType: PENDING_DOCUMENTS
      limit: $limit
      offset: $offset
      filters: $filters
      orderBy: $orderBy
    ) {
      records {
        ... on PendingDocumentLandingPage {
          id
          workflowStatus
          status
          isNew
          fileName
          fileId
          entityType
          documentType
          createdById
          createdBy
          createdAt
          clusterName
          clusterId
        }
      }
      total
    }
  }
`;

export const M_ARCHIVE_PENDING_DOCUMENTS = gql`
  mutation ArchivePendingDocuments($pendingIds: [UUID!]!) {
    archivePendingDocuments(pendingIds: $pendingIds)
  }
`;

// User Search Query - for inside/outside rep selection
export const Q_USER_SEARCH = gql`
  query UserSearch($searchTerm: String!, $isInside: Boolean!, $isOutside: Boolean!, $limit: Int!) {
    userSearch(searchTerm: $searchTerm, isInside: $isInside, isOutside: $isOutside, limit: $limit) {
      email
      firstName
      fullName
      id
      lastName
    }
  }
`;

// Batch Process Documents Mutation - for processing multiple documents at once
export const M_BATCH_PROCESS_DOCUMENTS = gql`
  mutation BatchProcessDocuments(
    $documentIds: [UUID!]!
    $contextFiles: [UUID!]
    $initialInstructions: [String!]
  ) {
    batchProcessDocuments(
      documentIds: $documentIds
      contextFiles: $contextFiles
      initialInstructions: $initialInstructions
    )
  }
`;

// Execute Document Workflow Mutation - called after matching is complete
// This replaces the old triggerWorkflows + entity-resolution flow
// Endpoint: NEXT_PUBLIC_FLOWRMS_HTTP_GRAPHQL_URL (staging.hive.flowrms.com)
export const M_EXECUTE_DOCUMENT_WORKFLOW = gql`
  mutation ExecuteDocumentWorkflow($pendingDocumentId: UUID!) {
    executeDocumentWorkflow(pendingDocumentId: $pendingDocumentId) {
      message
      success
      taskId
    }
  }
`;

// Query to get processing results for a pending document
export const Q_PENDING_DOCUMENT_PROCESSINGS = gql`
  query PendingDocumentProcessings($pendingDocumentId: UUID!) {
    pendingDocumentProcessings(pendingDocumentId: $pendingDocumentId) {
      dtoJson
      entityId
      errorMessage
      id
      pendingDocumentId
      status
    }
  }
`;

// Mutation to send email notification when pending document status changes
export const M_SEND_PENDING_DOCUMENT_STATUS_EMAIL = gql`
  mutation SendPendingDocumentStatusEmail($pendingDocumentId: UUID!) {
    sendPendingDocumentStatusEmail(pendingDocumentId: $pendingDocumentId) {
      message
      success
      taskId
    }
  }
`;

// ============================================
// CUSTOM INSTRUCTIONS QUERIES AND MUTATIONS
// ============================================

// Fragment for custom instruction fields
const CUSTOM_INSTRUCTION_FIELDS = `
  id
  name
  instruction
  level
  isActive
  isDefault
  createdAt
  updatedAt
  userId
  scope {
    objects
    keywords
  }
`;

export const Q_GET_ORGANIZATION_INSTRUCTIONS = gql`
  query GetOrganizationInstructions {
    organizationInstructions {
      ${CUSTOM_INSTRUCTION_FIELDS}
    }
  }
`;

export const Q_GET_MY_CUSTOM_INSTRUCTIONS = gql`
  query GetMyCustomInstructions {
    myCustomInstructions {
      ${CUSTOM_INSTRUCTION_FIELDS}
    }
  }
`;

export const Q_GET_ALL_AVAILABLE_INSTRUCTIONS = gql`
  query GetAllAvailableInstructions {
    allAvailableInstructions {
      ${CUSTOM_INSTRUCTION_FIELDS}
    }
  }
`;

export const Q_GET_CUSTOM_INSTRUCTION = gql`
  query GetCustomInstruction($instructionId: UUID!) {
    customInstruction(instructionId: $instructionId) {
      ${CUSTOM_INSTRUCTION_FIELDS}
    }
  }
`;

export const M_CREATE_CUSTOM_INSTRUCTION = gql`
  mutation CreateCustomInstruction($input: CreateCustomInstructionInput!) {
    createCustomInstruction(input: $input) {
      ${CUSTOM_INSTRUCTION_FIELDS}
    }
  }
`;

export const M_UPDATE_CUSTOM_INSTRUCTION = gql`
  mutation UpdateCustomInstruction($input: UpdateCustomInstructionInput!) {
    updateCustomInstruction(input: $input) {
      ${CUSTOM_INSTRUCTION_FIELDS}
    }
  }
`;

export const M_DELETE_CUSTOM_INSTRUCTION = gql`
  mutation DeleteCustomInstruction($instructionId: UUID!) {
    deleteCustomInstruction(instructionId: $instructionId)
  }
`;

export const M_TOGGLE_CUSTOM_INSTRUCTION = gql`
  mutation ToggleCustomInstruction($instructionId: UUID!, $isActive: Boolean!) {
    toggleCustomInstruction(instructionId: $instructionId, isActive: $isActive) {
      ${CUSTOM_INSTRUCTION_FIELDS}
    }
  }
`;

export const M_SET_INSTRUCTION_DEFAULT = gql`
  mutation SetInstructionDefault($instructionId: UUID!, $isDefault: Boolean!) {
    setInstructionDefault(instructionId: $instructionId, isDefault: $isDefault) {
      ${CUSTOM_INSTRUCTION_FIELDS}
    }
  }
`;


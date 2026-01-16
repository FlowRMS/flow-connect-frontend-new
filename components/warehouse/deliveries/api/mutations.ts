import { crmGraphQLRequest } from '@/components/lib/graphql/client';

const CREATE_DELIVERY_MUTATION = `
  mutation CreateDelivery($input: DeliveryInput!) {
    createDelivery(input: $input) {
      id
      poNumber
      status
    }
  }
`;

const UPDATE_DELIVERY_MUTATION = `
  mutation UpdateDelivery($id: UUID!, $input: DeliveryInput!) {
    updateDelivery(id: $id, input: $input) {
      id
      poNumber
      status
      updatedAt
    }
  }
`;

const CREATE_DELIVERY_ITEM_MUTATION = `
  mutation CreateDeliveryItem($input: DeliveryItemInput!) {
    createDeliveryItem(input: $input) {
      id
      deliveryId
    }
  }
`;

const UPDATE_DELIVERY_ITEM_MUTATION = `
  mutation UpdateDeliveryItem($id: UUID!, $input: DeliveryItemInput!) {
    updateDeliveryItem(id: $id, input: $input) {
      id
      deliveryId
    }
  }
`;

const DELETE_DELIVERY_ITEM_MUTATION = `
  mutation DeleteDeliveryItem($id: UUID!) {
    deleteDeliveryItem(id: $id)
  }
`;

const CREATE_DELIVERY_ITEM_RECEIPT_MUTATION = `
  mutation CreateDeliveryItemReceipt($input: DeliveryItemReceiptInput!) {
    createDeliveryItemReceipt(input: $input) {
      id
      deliveryItemId
    }
  }
`;

const UPDATE_DELIVERY_ITEM_RECEIPT_MUTATION = `
  mutation UpdateDeliveryItemReceipt($id: UUID!, $input: DeliveryItemReceiptInput!) {
    updateDeliveryItemReceipt(id: $id, input: $input) {
      id
      deliveryItemId
    }
  }
`;

const DELETE_DELIVERY_ITEM_RECEIPT_MUTATION = `
  mutation DeleteDeliveryItemReceipt($id: UUID!) {
    deleteDeliveryItemReceipt(id: $id)
  }
`;

const CREATE_DELIVERY_DOCUMENT_MUTATION = `
  mutation CreateDeliveryDocument($input: DeliveryDocumentInput!) {
    createDeliveryDocument(input: $input) {
      id
      deliveryId
    }
  }
`;

const DELETE_DELIVERY_DOCUMENT_MUTATION = `
  mutation DeleteDeliveryDocument($id: UUID!) {
    deleteDeliveryDocument(id: $id)
  }
`;

const CREATE_DELIVERY_ASSIGNEE_MUTATION = `
  mutation CreateDeliveryAssignee($input: DeliveryAssigneeInput!) {
    createDeliveryAssignee(input: $input) {
      id
      deliveryId
      userId
      role
    }
  }
`;

const DELETE_DELIVERY_ASSIGNEE_MUTATION = `
  mutation DeleteDeliveryAssignee($id: UUID!) {
    deleteDeliveryAssignee(id: $id)
  }
`;

const CREATE_DELIVERY_ISSUE_MUTATION = `
  mutation CreateDeliveryIssue($input: DeliveryIssueInput!) {
    createDeliveryIssue(input: $input) {
      id
      deliveryId
      deliveryItemId
      issueType
      status
    }
  }
`;

const CREATE_DELIVERY_STATUS_HISTORY_MUTATION = `
  mutation CreateDeliveryStatusHistory($input: DeliveryStatusHistoryInput!) {
    createDeliveryStatusHistory(input: $input) {
      id
      deliveryId
      status
      timestamp
      note
    }
  }
`;

const UPDATE_DELIVERY_ISSUE_MUTATION = `
  mutation UpdateDeliveryIssue($id: UUID!, $input: DeliveryIssueInput!) {
    updateDeliveryIssue(id: $id, input: $input) {
      id
      status
      notes
    }
  }
`;

const CREATE_RECURRING_SHIPMENT_MUTATION = `
  mutation CreateRecurringShipment($input: RecurringShipmentInput!) {
    createRecurringShipment(input: $input) {
      id
      name
      status
    }
  }
`;

const UPDATE_RECURRING_SHIPMENT_MUTATION = `
  mutation UpdateRecurringShipment($id: UUID!, $input: RecurringShipmentInput!) {
    updateRecurringShipment(id: $id, input: $input) {
      id
      name
      status
    }
  }
`;

export async function createDelivery(input: Record<string, unknown>): Promise<{ id: string; poNumber: string; status: string }> {
  const response = await crmGraphQLRequest<{ createDelivery: { id: string; poNumber: string; status: string } }>({
    query: CREATE_DELIVERY_MUTATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create delivery');
  }

  if (!response.data?.createDelivery) {
    throw new Error('No delivery returned from createDelivery');
  }

  return response.data.createDelivery;
}

export async function updateDelivery(id: string, input: Record<string, unknown>): Promise<{ id: string; poNumber: string; status: string }> {
  const response = await crmGraphQLRequest<{ updateDelivery: { id: string; poNumber: string; status: string } }>({
    query: UPDATE_DELIVERY_MUTATION,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update delivery');
  }

  if (!response.data?.updateDelivery) {
    throw new Error('No delivery returned from updateDelivery');
  }

  return response.data.updateDelivery;
}

export async function createDeliveryItem(input: Record<string, unknown>): Promise<{ id: string; deliveryId: string }> {
  const response = await crmGraphQLRequest<{ createDeliveryItem: { id: string; deliveryId: string } }>({
    query: CREATE_DELIVERY_ITEM_MUTATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create delivery item');
  }

  if (!response.data?.createDeliveryItem) {
    throw new Error('No delivery item returned from createDeliveryItem');
  }

  return response.data.createDeliveryItem;
}

export async function updateDeliveryItem(id: string, input: Record<string, unknown>): Promise<{ id: string; deliveryId: string }> {
  const response = await crmGraphQLRequest<{ updateDeliveryItem: { id: string; deliveryId: string } }>({
    query: UPDATE_DELIVERY_ITEM_MUTATION,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update delivery item');
  }

  if (!response.data?.updateDeliveryItem) {
    throw new Error('No delivery item returned from updateDeliveryItem');
  }

  return response.data.updateDeliveryItem;
}

export async function deleteDeliveryItem(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteDeliveryItem: boolean }>({
    query: DELETE_DELIVERY_ITEM_MUTATION,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete delivery item');
  }

  return response.data?.deleteDeliveryItem ?? false;
}

export async function createDeliveryItemReceipt(input: Record<string, unknown>): Promise<{ id: string; deliveryItemId: string }> {
  const response = await crmGraphQLRequest<{ createDeliveryItemReceipt: { id: string; deliveryItemId: string } }>({
    query: CREATE_DELIVERY_ITEM_RECEIPT_MUTATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create delivery item receipt');
  }

  if (!response.data?.createDeliveryItemReceipt) {
    throw new Error('No delivery item receipt returned from createDeliveryItemReceipt');
  }

  return response.data.createDeliveryItemReceipt;
}

export async function updateDeliveryItemReceipt(id: string, input: Record<string, unknown>): Promise<{ id: string; deliveryItemId: string }> {
  const response = await crmGraphQLRequest<{ updateDeliveryItemReceipt: { id: string; deliveryItemId: string } }>({
    query: UPDATE_DELIVERY_ITEM_RECEIPT_MUTATION,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update delivery item receipt');
  }

  if (!response.data?.updateDeliveryItemReceipt) {
    throw new Error('No delivery item receipt returned from updateDeliveryItemReceipt');
  }

  return response.data.updateDeliveryItemReceipt;
}

export async function deleteDeliveryItemReceipt(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteDeliveryItemReceipt: boolean }>({
    query: DELETE_DELIVERY_ITEM_RECEIPT_MUTATION,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete delivery item receipt');
  }

  return response.data?.deleteDeliveryItemReceipt ?? false;
}

export async function createDeliveryDocument(input: Record<string, unknown>): Promise<{ id: string; deliveryId: string }> {
  const response = await crmGraphQLRequest<{ createDeliveryDocument: { id: string; deliveryId: string } }>({
    query: CREATE_DELIVERY_DOCUMENT_MUTATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create delivery document');
  }

  if (!response.data?.createDeliveryDocument) {
    throw new Error('No delivery document returned from createDeliveryDocument');
  }

  return response.data.createDeliveryDocument;
}

export async function deleteDeliveryDocument(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteDeliveryDocument: boolean }>({
    query: DELETE_DELIVERY_DOCUMENT_MUTATION,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete delivery document');
  }

  return response.data?.deleteDeliveryDocument ?? false;
}

export async function createDeliveryAssignee(input: Record<string, unknown>): Promise<{ id: string; deliveryId: string; userId: string; role: string }> {
  const response = await crmGraphQLRequest<{ createDeliveryAssignee: { id: string; deliveryId: string; userId: string; role: string } }>({
    query: CREATE_DELIVERY_ASSIGNEE_MUTATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create delivery assignee');
  }

  if (!response.data?.createDeliveryAssignee) {
    throw new Error('No delivery assignee returned from createDeliveryAssignee');
  }

  return response.data.createDeliveryAssignee;
}

export async function deleteDeliveryAssignee(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteDeliveryAssignee: boolean }>({
    query: DELETE_DELIVERY_ASSIGNEE_MUTATION,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete delivery assignee');
  }

  return response.data?.deleteDeliveryAssignee ?? false;
}

export async function createDeliveryIssue(input: Record<string, unknown>): Promise<{ id: string; deliveryId: string; deliveryItemId: string; issueType: string; status: string }> {
  const response = await crmGraphQLRequest<{ createDeliveryIssue: { id: string; deliveryId: string; deliveryItemId: string; issueType: string; status: string } }>({
    query: CREATE_DELIVERY_ISSUE_MUTATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create delivery issue');
  }

  if (!response.data?.createDeliveryIssue) {
    throw new Error('No delivery issue returned from createDeliveryIssue');
  }

  return response.data.createDeliveryIssue;
}

export async function createDeliveryStatusHistory(input: Record<string, unknown>): Promise<{ id: string; deliveryId: string; status: string; timestamp: string; note?: string | null }> {
  const response = await crmGraphQLRequest<{ createDeliveryStatusHistory: { id: string; deliveryId: string; status: string; timestamp: string; note?: string | null } }>({
    query: CREATE_DELIVERY_STATUS_HISTORY_MUTATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create delivery status history');
  }

  if (!response.data?.createDeliveryStatusHistory) {
    throw new Error('No delivery status history returned from createDeliveryStatusHistory');
  }

  return response.data.createDeliveryStatusHistory;
}

export async function updateDeliveryIssue(id: string, input: Record<string, unknown>): Promise<{ id: string; status: string }> {
  const response = await crmGraphQLRequest<{ updateDeliveryIssue: { id: string; status: string } }>({
    query: UPDATE_DELIVERY_ISSUE_MUTATION,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update delivery issue');
  }

  if (!response.data?.updateDeliveryIssue) {
    throw new Error('No delivery issue returned from updateDeliveryIssue');
  }

  return response.data.updateDeliveryIssue;
}

export async function createRecurringShipment(input: Record<string, unknown>): Promise<{ id: string; name: string; status: string }> {
  const response = await crmGraphQLRequest<{ createRecurringShipment: { id: string; name: string; status: string } }>({
    query: CREATE_RECURRING_SHIPMENT_MUTATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create recurring shipment');
  }

  if (!response.data?.createRecurringShipment) {
    throw new Error('No recurring shipment returned from createRecurringShipment');
  }

  return response.data.createRecurringShipment;
}

export async function updateRecurringShipment(id: string, input: Record<string, unknown>): Promise<{ id: string; name: string; status: string }> {
  const response = await crmGraphQLRequest<{ updateRecurringShipment: { id: string; name: string; status: string } }>({
    query: UPDATE_RECURRING_SHIPMENT_MUTATION,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update recurring shipment');
  }

  if (!response.data?.updateRecurringShipment) {
    throw new Error('No recurring shipment returned from updateRecurringShipment');
  }

  return response.data.updateRecurringShipment;
}
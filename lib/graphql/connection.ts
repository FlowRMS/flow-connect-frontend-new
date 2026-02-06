/**
 * Connection & Agreement GraphQL SDK
 * 
 * Handles connection management between organizations,
 * including agreement file uploads.
 */

import { requestGraphQL } from '../graphqlClient';
import type {
  AgreementResponse,
  UploadAgreementResult,
  DeleteAgreementResult,
} from './types';

// ============================================
// MUTATIONS
// ============================================

const UploadAgreementMutation = `
  mutation UploadAgreement($connectedOrgId: ID!, $file: Upload!) {
    uploadAgreement(connectedOrgId: $connectedOrgId, file: $file) {
      id
      connectedOrgId
      fileName
      fileSize
      presignedUrl
      createdAt
    }
  }
`;

const DeleteAgreementMutation = `
  mutation DeleteAgreement($connectedOrgId: ID!) {
    deleteAgreement(connectedOrgId: $connectedOrgId)
  }
`;

// ============================================
// SDK FUNCTIONS
// ============================================

/**
 * Upload an agreement file for a connection.
 * Uses GraphQL multipart upload.
 */
export async function uploadAgreement(
  connectedOrgId: string,
  file: File,
  token?: string
): Promise<AgreementResponse> {
  try {
    const result = await requestGraphQL<UploadAgreementResult>(
      UploadAgreementMutation,
      { connectedOrgId, file },
      token
    );
    return result.uploadAgreement;
  } catch (error) {
    console.error('uploadAgreement failed:', error);
    throw error;
  }
}

/**
 * Delete an agreement file for a connection.
 * Returns true if deletion was successful.
 */
export async function deleteAgreement(
  connectedOrgId: string,
  token?: string
): Promise<boolean> {
  try {
    const result = await requestGraphQL<DeleteAgreementResult>(
      DeleteAgreementMutation,
      { connectedOrgId },
      token
    );
    return result.deleteAgreement;
  } catch (error) {
    console.error('deleteAgreement failed:', error);
    throw error;
  }
}

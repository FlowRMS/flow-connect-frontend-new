/**
 * Regression Tests: fileId and documentUrl Changes (FLO-727)
 *
 * These tests ensure that the changes from flowbot-commons are correctly
 * implemented in flow-crm:
 *
 * 1. uploadTakeoffDocument now returns fileId (UUID of File record)
 *    - Previously: returned s3Key which was used as fileId (BROKEN)
 *    - Now: returns actual file_id from files.files table
 *
 * 2. documentUrl is now a presigned URL (generated on-demand by resolver)
 *    - Previously: was the raw S3 key (NOT accessible)
 *    - Now: backend generates presigned URL via S3Service
 *
 * 3. TakeoffDocumentInput uses fileId FK to files.files
 *    - Previously: stored file info directly in TakeoffDocument
 *    - Now: references File record via foreign key
 */

import * as fs from 'fs';
import * as path from 'path';

describe('fileId and documentUrl Changes - Regression Tests', () => {
  const takeoffsGraphQLPath = path.join(__dirname, '../../lib/graphql/takeoffs.ts');

  let takeoffsGraphQLSource: string;

  beforeAll(() => {
    takeoffsGraphQLSource = fs.readFileSync(takeoffsGraphQLPath, 'utf-8');
  });

  // ==========================================================================
  // UPLOAD MUTATION TESTS
  // ==========================================================================
  describe('Upload Mutation (UPLOAD_TAKEOFF_DOCUMENT)', () => {
    it('should request fileId in mutation response', () => {
      // Extract the UPLOAD_TAKEOFF_DOCUMENT mutation
      const mutationMatch = takeoffsGraphQLSource.match(
        /const UPLOAD_TAKEOFF_DOCUMENT[\s\S]*?`;/
      );
      expect(mutationMatch).toBeTruthy();
      const mutation = mutationMatch![0];

      // Must request fileId from the response
      expect(mutation).toContain('fileId');
    });

    it('should request all required upload response fields', () => {
      const mutationMatch = takeoffsGraphQLSource.match(
        /const UPLOAD_TAKEOFF_DOCUMENT[\s\S]*?`;/
      );
      expect(mutationMatch).toBeTruthy();
      const mutation = mutationMatch![0];

      // All fields that flow-ai upload mutation returns
      expect(mutation).toContain('fileId');
      expect(mutation).toContain('s3Key');
      expect(mutation).toContain('presignedUrl');
      expect(mutation).toContain('fileName');
      expect(mutation).toContain('fileSize');
      expect(mutation).toContain('contentType');
    });
  });

  // ==========================================================================
  // UPLOAD RESPONSE TYPE TESTS
  // ==========================================================================
  describe('TakeoffUploadResponse Interface', () => {
    it('should define fileId as string (UUID)', () => {
      // Extract TakeoffUploadResponse interface
      const interfaceMatch = takeoffsGraphQLSource.match(
        /interface TakeoffUploadResponse[\s\S]*?^\}/m
      );
      expect(interfaceMatch).toBeTruthy();
      const interfaceDef = interfaceMatch![0];

      // fileId should be a string (UUID from files.files table)
      expect(interfaceDef).toContain('fileId: string');
    });

    it('should have comment explaining fileId is UUID of File record', () => {
      // The interface should have a comment explaining that fileId is
      // the UUID from files.files table, not the s3Key
      const interfaceMatch = takeoffsGraphQLSource.match(
        /interface TakeoffUploadResponse[\s\S]*?^\}/m
      );
      expect(interfaceMatch).toBeTruthy();
      const interfaceDef = interfaceMatch![0];

      // Should have explanatory comment
      expect(interfaceDef).toMatch(/UUID.*File.*record|File.*record.*UUID/i);
    });
  });

  // ==========================================================================
  // FILE RESPONSE MAPPING TESTS
  // ==========================================================================
  describe('uploadFilesToStorage Function', () => {
    it('should use fileId from upload response (not s3Key) for crmFile.id', () => {
      // Extract uploadFilesToStorage function
      const funcMatch = takeoffsGraphQLSource.match(
        /export async function uploadFilesToStorage[\s\S]*?^}/m
      );
      expect(funcMatch).toBeTruthy();
      const funcBody = funcMatch![0];

      // Should use uploadResult.fileId for crmFile.id
      expect(funcBody).toContain('id: uploadResult.fileId');

      // Should NOT use s3Key as the id (this was the bug)
      expect(funcBody).not.toMatch(/id:\s*uploadResult\.s3Key/);
    });

    it('should store s3Key in filePath (not id)', () => {
      const funcMatch = takeoffsGraphQLSource.match(
        /export async function uploadFilesToStorage[\s\S]*?^}/m
      );
      expect(funcMatch).toBeTruthy();
      const funcBody = funcMatch![0];

      // s3Key should be stored in filePath
      expect(funcBody).toContain('filePath: uploadResult.s3Key');
    });
  });

  // ==========================================================================
  // CREATE TAKEOFF WITH FILES TESTS
  // ==========================================================================
  describe('createTakeoffWithFiles Function', () => {
    it('should use crmFile.id as fileId in TakeoffDocumentInput', () => {
      // Extract createTakeoffWithFiles function
      const funcMatch = takeoffsGraphQLSource.match(
        /export async function createTakeoffWithFiles[\s\S]*?^  return result;/m
      );
      expect(funcMatch).toBeTruthy();
      const funcBody = funcMatch![0];

      // Should use crmFile.id as fileId
      expect(funcBody).toContain('fileId: crmFile.id');
    });

    it('should have comment explaining crmFile.id is from files.files table', () => {
      const funcMatch = takeoffsGraphQLSource.match(
        /export async function createTakeoffWithFiles[\s\S]*?^  return result;/m
      );
      expect(funcMatch).toBeTruthy();
      const funcBody = funcMatch![0];

      // Should have explanatory comment about file_id
      expect(funcBody).toMatch(/file_id|files\.files|File record/i);
    });
  });

  // ==========================================================================
  // DOCUMENT URL IN QUERIES TESTS
  // ==========================================================================
  describe('GraphQL Queries Request documentUrl', () => {
    it('GET_USER_TAKEOFFS should request documentUrl', () => {
      const queryMatch = takeoffsGraphQLSource.match(
        /const GET_USER_TAKEOFFS = `[\s\S]*?`;/
      );
      expect(queryMatch).toBeTruthy();
      expect(queryMatch![0]).toContain('documentUrl');
    });

    it('GET_TAKEOFF should request documentUrl', () => {
      const queryMatch = takeoffsGraphQLSource.match(
        /const GET_TAKEOFF = `[\s\S]*?`;/
      );
      expect(queryMatch).toBeTruthy();
      expect(queryMatch![0]).toContain('documentUrl');
    });

    it('CREATE_TAKEOFF should request documentUrl in response', () => {
      const queryMatch = takeoffsGraphQLSource.match(
        /const CREATE_TAKEOFF = `[\s\S]*?`;/
      );
      expect(queryMatch).toBeTruthy();
      expect(queryMatch![0]).toContain('documentUrl');
    });

    it('UPDATE_TAKEOFF_DOCUMENT should request documentUrl in response', () => {
      const queryMatch = takeoffsGraphQLSource.match(
        /const UPDATE_TAKEOFF_DOCUMENT = `[\s\S]*?`;/
      );
      expect(queryMatch).toBeTruthy();
      expect(queryMatch![0]).toContain('documentUrl');
    });
  });

  // ==========================================================================
  // DOCUMENT RESPONSE TYPE TESTS
  // ==========================================================================
  describe('TakeoffDocumentResponse Interface', () => {
    it('should have fileId field', () => {
      const interfaceMatch = takeoffsGraphQLSource.match(
        /export interface TakeoffDocumentResponse[\s\S]*?^\}/m
      );
      expect(interfaceMatch).toBeTruthy();
      expect(interfaceMatch![0]).toContain('fileId: string');
    });

    it('should have documentUrl as nullable string', () => {
      const interfaceMatch = takeoffsGraphQLSource.match(
        /export interface TakeoffDocumentResponse[\s\S]*?^\}/m
      );
      expect(interfaceMatch).toBeTruthy();
      expect(interfaceMatch![0]).toContain('documentUrl: string | null');
    });

    it('should have fileSize as number (not string)', () => {
      const interfaceMatch = takeoffsGraphQLSource.match(
        /export interface TakeoffDocumentResponse[\s\S]*?^\}/m
      );
      expect(interfaceMatch).toBeTruthy();
      expect(interfaceMatch![0]).toContain('fileSize: number');
    });
  });

  // ==========================================================================
  // TAKEOFF DOCUMENT INPUT TESTS
  // ==========================================================================
  describe('TakeoffDocumentInput Interface', () => {
    it('should have fileId as required field', () => {
      const interfaceMatch = takeoffsGraphQLSource.match(
        /export interface TakeoffDocumentInput[\s\S]*?^\}/m
      );
      expect(interfaceMatch).toBeTruthy();
      const interfaceDef = interfaceMatch![0];

      // fileId should be required (no ? after name)
      expect(interfaceDef).toMatch(/fileId:\s*string[^?]/);
    });

    it('should NOT have name, fileType, fileSize, or documentUrl fields (they come from File relationship)', () => {
      const interfaceMatch = takeoffsGraphQLSource.match(
        /export interface TakeoffDocumentInput[\s\S]*?^\}/m
      );
      expect(interfaceMatch).toBeTruthy();
      const interfaceDef = interfaceMatch![0];

      // These fields were removed - they now come from the File relationship
      // Only optional fields should be present
      expect(interfaceDef).not.toMatch(/\bname:\s*string/);
      expect(interfaceDef).not.toMatch(/\bfileType:\s*string/);
      expect(interfaceDef).not.toMatch(/\bfileSize:\s*number/);
      expect(interfaceDef).not.toMatch(/\bdocumentUrl:\s*string/);
    });
  });
});

describe('Transform Functions Handle New Schema', () => {
  const typesPath = path.join(__dirname, '../types.ts');

  let typesSource: string;

  beforeAll(() => {
    typesSource = fs.readFileSync(typesPath, 'utf-8');
  });

  describe('transformDocumentResponse', () => {
    it('should format fileSize from number to display string', () => {
      // The transform function should convert fileSize (number in bytes)
      // to a display string like "1.5 MB"
      expect(typesSource).toContain('formatFileSize');
      expect(typesSource).toContain('doc.fileSize');
    });

    it('should pass through documentUrl to UI type', () => {
      // documentUrl from API should be passed to UI TakeoffDocument
      const funcMatch = typesSource.match(
        /export function transformDocumentResponse[\s\S]*?^}/m
      );
      expect(funcMatch).toBeTruthy();
      expect(funcMatch![0]).toContain('documentUrl: doc.documentUrl');
    });
  });

  describe('TakeoffDocument UI Type', () => {
    it('should have documentUrl as optional string', () => {
      const interfaceMatch = typesSource.match(
        /export interface TakeoffDocument[\s\S]*?^\}/m
      );
      expect(interfaceMatch).toBeTruthy();
      expect(interfaceMatch![0]).toContain('documentUrl?:');
    });

    it('should have size as string (formatted for display)', () => {
      const interfaceMatch = typesSource.match(
        /export interface TakeoffDocument[\s\S]*?^\}/m
      );
      expect(interfaceMatch).toBeTruthy();
      // UI type has size as formatted string like "1.5 MB"
      expect(interfaceMatch![0]).toContain("size: string");
    });
  });

  describe('Takeoff UI Type', () => {
    it('should have createdById (not createdBy string)', () => {
      // Match "export interface Takeoff {" but NOT "TakeoffMetadata" or "TakeoffDocument"
      const interfaceMatch = typesSource.match(
        /export interface Takeoff \{[\s\S]*?documents\?: TakeoffDocument\[\];[\s\S]*?^\}/m
      );
      expect(interfaceMatch).toBeTruthy();
      const interfaceDef = interfaceMatch![0];

      // Should have createdById
      expect(interfaceDef).toContain('createdById: string');

      // Should NOT have old createdBy string field (createdBy was removed per Jamal's request)
      expect(interfaceDef).not.toMatch(/\bcreatedBy:\s*string/);
    });
  });
});

describe('API Response Types Match Backend', () => {
  const takeoffsGraphQLPath = path.join(__dirname, '../../lib/graphql/takeoffs.ts');

  let takeoffsGraphQLSource: string;

  beforeAll(() => {
    takeoffsGraphQLSource = fs.readFileSync(takeoffsGraphQLPath, 'utf-8');
  });

  describe('TakeoffResponse Interface', () => {
    it('should have createdById (matching backend created_by_id)', () => {
      const interfaceMatch = takeoffsGraphQLSource.match(
        /export interface TakeoffResponse[\s\S]*?^\}/m
      );
      expect(interfaceMatch).toBeTruthy();
      expect(interfaceMatch![0]).toContain('createdById: string');
    });

    it('should NOT have old userId or createdBy fields', () => {
      const interfaceMatch = takeoffsGraphQLSource.match(
        /export interface TakeoffResponse[\s\S]*?^\}/m
      );
      expect(interfaceMatch).toBeTruthy();
      const interfaceDef = interfaceMatch![0];

      // Old fields should not exist
      expect(interfaceDef).not.toMatch(/\buserId:\s*string/);
      expect(interfaceDef).not.toMatch(/\bcreatedBy:\s*string/);
    });
  });
});

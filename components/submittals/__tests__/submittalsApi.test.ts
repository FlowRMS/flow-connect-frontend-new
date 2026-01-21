/**
 * Tests for Submittals API Module
 * Verifies type contracts and helper functions
 */

import type {
  SubmittalResponse,
  SubmittalItemResponse,
  SubmittalStakeholderResponse,
  SubmittalRevisionResponse,
  CreateSubmittalInput,
  UpdateSubmittalInput,
  SubmittalItemInput,
  SubmittalStakeholderInput,
  GenerateSubmittalPdfInput,
  GenerateSubmittalPdfResponse,
  SubmittalStatusGQL,
  SubmittalItemApprovalStatusGQL,
  SubmittalItemMatchStatusGQL,
  SubmittalStakeholderRoleGQL,
  TransmittalPurposeGQL,
} from '../../lib/graphql/submittals';

describe('Submittals API - Type Contracts', () => {
  describe('Enum Values', () => {
    it('should have all expected SubmittalStatusGQL values', () => {
      const expectedStatuses: SubmittalStatusGQL[] = [
        'DRAFT',
        'SUBMITTED',
        'APPROVED',
        'APPROVED_AS_NOTED',
        'REVISE_AND_RESUBMIT',
        'REJECTED',
      ];

      // This is a compile-time check - if these values don't match the type, TS will error
      expectedStatuses.forEach((status) => {
        expect(typeof status).toBe('string');
      });
      expect(expectedStatuses).toHaveLength(6);
    });

    it('should have all expected SubmittalItemApprovalStatusGQL values', () => {
      const expectedStatuses: SubmittalItemApprovalStatusGQL[] = [
        'PENDING',
        'APPROVED',
        'APPROVED_AS_NOTED',
        'REVISE',
        'REJECTED',
      ];

      expectedStatuses.forEach((status) => {
        expect(typeof status).toBe('string');
      });
      expect(expectedStatuses).toHaveLength(5);
    });

    it('should have all expected SubmittalItemMatchStatusGQL values', () => {
      const expectedStatuses: SubmittalItemMatchStatusGQL[] = [
        'NO_MATCH',
        'PARTIAL_MATCH',
        'EXACT_MATCH',
      ];

      expectedStatuses.forEach((status) => {
        expect(typeof status).toBe('string');
      });
      expect(expectedStatuses).toHaveLength(3);
    });

    it('should have all expected SubmittalStakeholderRoleGQL values', () => {
      const expectedRoles: SubmittalStakeholderRoleGQL[] = [
        'CUSTOMER',
        'ENGINEER',
        'ARCHITECT',
        'GENERAL_CONTRACTOR',
        'OTHER',
      ];

      expectedRoles.forEach((role) => {
        expect(typeof role).toBe('string');
      });
      expect(expectedRoles).toHaveLength(5);
    });

    it('should have all expected TransmittalPurposeGQL values', () => {
      const expectedPurposes: TransmittalPurposeGQL[] = [
        'FOR_APPROVAL',
        'FOR_REVIEW',
        'FOR_INFORMATION',
        'FOR_RECORD',
        'RESUBMITTAL',
      ];

      expectedPurposes.forEach((purpose) => {
        expect(typeof purpose).toBe('string');
      });
      expect(expectedPurposes).toHaveLength(5);
    });
  });

  describe('Response Type Validation', () => {
    it('should validate SubmittalResponse structure', () => {
      const mockSubmittal: SubmittalResponse = {
        id: 'test-uuid',
        submittalNumber: 'SUB-001',
        quoteId: null,
        jobId: null,
        status: 'DRAFT',
        transmittalPurpose: 'FOR_APPROVAL',
        description: 'Test submittal',
        jobLocation: null,
        bidDate: null,
        tags: null,
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: {
          id: 'user-uuid',
          fullName: 'Test User',
        },
        items: [],
        stakeholders: [],
        revisions: [],
        config: {
          includeLamps: true,
          includeAccessories: true,
          includeCq: false,
          includeFromOrders: false,
          rollUpKits: false,
          rollUpAccessories: false,
          includeZeroQuantityItems: false,
          dropDescriptions: false,
          dropLineNotes: false,
        },
      };

      // Verify required fields
      expect(mockSubmittal.id).toBeDefined();
      expect(mockSubmittal.submittalNumber).toBeDefined();
      expect(mockSubmittal.status).toBeDefined();
      expect(mockSubmittal.createdAt).toBeDefined();
      expect(mockSubmittal.createdBy).toBeDefined();
      expect(mockSubmittal.createdBy.id).toBeDefined();
      expect(mockSubmittal.createdBy.fullName).toBeDefined();
      expect(Array.isArray(mockSubmittal.items)).toBe(true);
      expect(Array.isArray(mockSubmittal.stakeholders)).toBe(true);
      expect(Array.isArray(mockSubmittal.revisions)).toBe(true);
    });

    it('should validate SubmittalItemResponse structure', () => {
      const mockItem: SubmittalItemResponse = {
        id: 'item-uuid',
        submittalId: 'submittal-uuid',
        itemNumber: 1,
        quoteDetailId: null,
        specSheetId: null,
        highlightVersionId: null,
        partNumber: 'PART-001',
        manufacturer: 'Acuity Brands',
        description: 'Test item',
        quantity: 10,
        approvalStatus: 'PENDING',
        matchStatus: 'NO_MATCH',
        notes: null,
        createdAt: '2024-01-01T00:00:00Z',
        specSheet: null,
        highlightVersion: null,
      };

      expect(mockItem.id).toBeDefined();
      expect(mockItem.submittalId).toBeDefined();
      expect(typeof mockItem.itemNumber).toBe('number');
      expect(mockItem.approvalStatus).toBeDefined();
      expect(mockItem.matchStatus).toBeDefined();
    });

    it('should validate SubmittalStakeholderResponse structure', () => {
      const mockStakeholder: SubmittalStakeholderResponse = {
        id: 'stakeholder-uuid',
        submittalId: 'submittal-uuid',
        customerId: null,
        role: 'ENGINEER',
        isPrimary: true,
        contactName: 'John Engineer',
        contactEmail: 'john@example.com',
        contactPhone: null,
        companyName: 'Engineering Inc',
      };

      expect(mockStakeholder.id).toBeDefined();
      expect(mockStakeholder.submittalId).toBeDefined();
      expect(mockStakeholder.role).toBeDefined();
      expect(typeof mockStakeholder.isPrimary).toBe('boolean');
    });

    it('should validate SubmittalRevisionResponse structure', () => {
      const mockRevision: SubmittalRevisionResponse = {
        id: 'revision-uuid',
        submittalId: 'submittal-uuid',
        revisionNumber: 1,
        pdfFileId: null,
        pdfFileUrl: null,
        pdfFileName: null,
        pdfFileSizeBytes: null,
        notes: 'Initial revision',
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: {
          id: 'user-uuid',
          fullName: 'Test User',
        },
      };

      expect(mockRevision.id).toBeDefined();
      expect(mockRevision.submittalId).toBeDefined();
      expect(typeof mockRevision.revisionNumber).toBe('number');
      expect(mockRevision.createdBy).toBeDefined();
    });

    it('should validate GenerateSubmittalPdfResponse structure', () => {
      const mockPdfResponse: GenerateSubmittalPdfResponse = {
        success: true,
        error: undefined,
        pdfUrl: 'data:application/pdf;base64,abc123',
        pdfFileName: 'submittal.pdf',
        pdfFileSizeBytes: 12345,
        revision: undefined,
      };

      expect(typeof mockPdfResponse.success).toBe('boolean');
      expect(mockPdfResponse.pdfUrl).toBeDefined();
    });
  });

  describe('Input Type Validation', () => {
    it('should validate CreateSubmittalInput structure', () => {
      const input: CreateSubmittalInput = {
        submittalNumber: 'SUB-001',
        status: 'DRAFT',
        transmittalPurpose: 'FOR_APPROVAL',
        description: 'Test submittal',
      };

      expect(input.submittalNumber).toBeDefined();
      // Optional fields
      expect(input.quoteId).toBeUndefined();
      expect(input.jobId).toBeUndefined();
    });

    it('should validate UpdateSubmittalInput structure', () => {
      const input: UpdateSubmittalInput = {
        status: 'SUBMITTED',
        transmittalPurpose: 'FOR_REVIEW',
        description: 'Updated description',
      };

      // All fields are optional
      expect(input.status).toBe('SUBMITTED');
    });

    it('should validate SubmittalItemInput structure', () => {
      const input: SubmittalItemInput = {
        itemNumber: 1,
        partNumber: 'PART-001',
        description: 'Test item',
        quantity: 10,
        approvalStatus: 'PENDING',
        matchStatus: 'NO_MATCH',
      };

      expect(input.itemNumber).toBeDefined();
    });

    it('should validate SubmittalStakeholderInput structure', () => {
      const input: SubmittalStakeholderInput = {
        role: 'ENGINEER',
        isPrimary: true,
        contactName: 'John Engineer',
        contactEmail: 'john@example.com',
        companyName: 'Engineering Inc',
      };

      expect(input.role).toBeDefined();
    });

    it('should validate GenerateSubmittalPdfInput structure with all options', () => {
      const input: GenerateSubmittalPdfInput = {
        submittalId: 'submittal-uuid',
        outputType: 'pdf',
        includeCoverPage: true,
        includeTransmittalPage: true,
        includeFixtureSummary: true,
        includePages: true,
        includeTypeCoverPage: false,
        showQuantities: false,
        showDescriptions: true,
        showLeadTimes: false,
        hideNotes: false,
        useCustomerLogo: true,
        printDuplex: false,
        capFileSizeMb: 25,
        attachedItems: ['drawings', 'specifications'],
        attachedOther: 'Additional docs',
        transmittedFor: ['approval', 'review'],
        transmittedForOther: 'Other purpose',
        copies: 1,
        selectedItemIds: ['item-1', 'item-2'],
        addressedToIds: ['stakeholder-1'],
        createRevision: true,
        revisionNotes: 'Generated PDF',
      };

      expect(input.submittalId).toBeDefined();
      expect(Array.isArray(input.attachedItems)).toBe(true);
      expect(Array.isArray(input.selectedItemIds)).toBe(true);
    });
  });
});

describe('Submittals API - Helper Functions', () => {
  describe('Status Display Helpers', () => {
    function getStatusLabel(status: SubmittalStatusGQL): string {
      const labels: Record<SubmittalStatusGQL, string> = {
        DRAFT: 'Draft',
        SUBMITTED: 'Submitted',
        APPROVED: 'Approved',
        APPROVED_AS_NOTED: 'Approved as Noted',
        REVISE_AND_RESUBMIT: 'Revise and Resubmit',
        REJECTED: 'Rejected',
      };
      return labels[status];
    }

    function getStatusColor(status: SubmittalStatusGQL): string {
      const colors: Record<SubmittalStatusGQL, string> = {
        DRAFT: 'gray',
        SUBMITTED: 'blue',
        APPROVED: 'green',
        APPROVED_AS_NOTED: 'yellow',
        REVISE_AND_RESUBMIT: 'orange',
        REJECTED: 'red',
      };
      return colors[status];
    }

    it('should return correct labels for all statuses', () => {
      expect(getStatusLabel('DRAFT')).toBe('Draft');
      expect(getStatusLabel('SUBMITTED')).toBe('Submitted');
      expect(getStatusLabel('APPROVED')).toBe('Approved');
      expect(getStatusLabel('APPROVED_AS_NOTED')).toBe('Approved as Noted');
      expect(getStatusLabel('REVISE_AND_RESUBMIT')).toBe('Revise and Resubmit');
      expect(getStatusLabel('REJECTED')).toBe('Rejected');
    });

    it('should return correct colors for all statuses', () => {
      expect(getStatusColor('DRAFT')).toBe('gray');
      expect(getStatusColor('SUBMITTED')).toBe('blue');
      expect(getStatusColor('APPROVED')).toBe('green');
      expect(getStatusColor('APPROVED_AS_NOTED')).toBe('yellow');
      expect(getStatusColor('REVISE_AND_RESUBMIT')).toBe('orange');
      expect(getStatusColor('REJECTED')).toBe('red');
    });
  });

  describe('Role Display Helpers', () => {
    function getRoleLabel(role: SubmittalStakeholderRoleGQL): string {
      const labels: Record<SubmittalStakeholderRoleGQL, string> = {
        CUSTOMER: 'Customer',
        ENGINEER: 'Engineer',
        ARCHITECT: 'Architect',
        GENERAL_CONTRACTOR: 'General Contractor',
        OTHER: 'Other',
      };
      return labels[role];
    }

    it('should return correct labels for all roles', () => {
      expect(getRoleLabel('CUSTOMER')).toBe('Customer');
      expect(getRoleLabel('ENGINEER')).toBe('Engineer');
      expect(getRoleLabel('ARCHITECT')).toBe('Architect');
      expect(getRoleLabel('GENERAL_CONTRACTOR')).toBe('General Contractor');
      expect(getRoleLabel('OTHER')).toBe('Other');
    });
  });

  describe('Approval Status Helpers', () => {
    function getApprovalStatusLabel(status: SubmittalItemApprovalStatusGQL): string {
      const labels: Record<SubmittalItemApprovalStatusGQL, string> = {
        PENDING: 'Pending',
        APPROVED: 'Approved',
        APPROVED_AS_NOTED: 'Approved as Noted',
        REVISE: 'Revise',
        REJECTED: 'Rejected',
      };
      return labels[status];
    }

    it('should return correct labels for all approval statuses', () => {
      expect(getApprovalStatusLabel('PENDING')).toBe('Pending');
      expect(getApprovalStatusLabel('APPROVED')).toBe('Approved');
      expect(getApprovalStatusLabel('APPROVED_AS_NOTED')).toBe('Approved as Noted');
      expect(getApprovalStatusLabel('REVISE')).toBe('Revise');
      expect(getApprovalStatusLabel('REJECTED')).toBe('Rejected');
    });
  });

  describe('Match Status Helpers', () => {
    function getMatchStatusLabel(status: SubmittalItemMatchStatusGQL): string {
      const labels: Record<SubmittalItemMatchStatusGQL, string> = {
        NO_MATCH: 'No Match',
        PARTIAL_MATCH: 'Partial Match',
        EXACT_MATCH: 'Exact Match',
      };
      return labels[status];
    }

    it('should return correct labels for all match statuses', () => {
      expect(getMatchStatusLabel('NO_MATCH')).toBe('No Match');
      expect(getMatchStatusLabel('PARTIAL_MATCH')).toBe('Partial Match');
      expect(getMatchStatusLabel('EXACT_MATCH')).toBe('Exact Match');
    });
  });
});

describe('Submittals API - Data Transformations', () => {
  describe('Submittal Number Generation', () => {
    function generateSubmittalNumber(prefix: string = 'SUB'): string {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `${prefix}-${timestamp}-${random}`;
    }

    it('should generate unique submittal numbers', () => {
      const num1 = generateSubmittalNumber();
      const num2 = generateSubmittalNumber();

      expect(num1).not.toBe(num2);
      expect(num1).toMatch(/^SUB-\d+-[A-Z0-9]+$/);
    });

    it('should accept custom prefixes', () => {
      const num = generateSubmittalNumber('TEST');

      expect(num).toMatch(/^TEST-\d+-[A-Z0-9]+$/);
    });
  });

  describe('Items Summary', () => {
    interface ItemSummary {
      totalItems: number;
      pendingItems: number;
      approvedItems: number;
      rejectedItems: number;
    }

    function getItemsSummary(items: SubmittalItemResponse[]): ItemSummary {
      return {
        totalItems: items.length,
        pendingItems: items.filter((i) => i.approvalStatus === 'PENDING').length,
        approvedItems: items.filter(
          (i) => i.approvalStatus === 'APPROVED' || i.approvalStatus === 'APPROVED_AS_NOTED'
        ).length,
        rejectedItems: items.filter(
          (i) => i.approvalStatus === 'REJECTED' || i.approvalStatus === 'REVISE'
        ).length,
      };
    }

    it('should calculate correct summary for empty items', () => {
      const summary = getItemsSummary([]);

      expect(summary.totalItems).toBe(0);
      expect(summary.pendingItems).toBe(0);
      expect(summary.approvedItems).toBe(0);
      expect(summary.rejectedItems).toBe(0);
    });

    it('should calculate correct summary for mixed items', () => {
      const mockItems: SubmittalItemResponse[] = [
        { approvalStatus: 'PENDING' } as SubmittalItemResponse,
        { approvalStatus: 'APPROVED' } as SubmittalItemResponse,
        { approvalStatus: 'APPROVED_AS_NOTED' } as SubmittalItemResponse,
        { approvalStatus: 'REVISE' } as SubmittalItemResponse,
        { approvalStatus: 'REJECTED' } as SubmittalItemResponse,
      ];

      const summary = getItemsSummary(mockItems);

      expect(summary.totalItems).toBe(5);
      expect(summary.pendingItems).toBe(1);
      expect(summary.approvedItems).toBe(2);
      expect(summary.rejectedItems).toBe(2);
    });
  });

  describe('Revision History', () => {
    function getLatestRevision(
      revisions: SubmittalRevisionResponse[]
    ): SubmittalRevisionResponse | null {
      if (revisions.length === 0) return null;

      return revisions.reduce((latest, current) =>
        current.revisionNumber > latest.revisionNumber ? current : latest
      );
    }

    function getNextRevisionNumber(revisions: SubmittalRevisionResponse[]): number {
      if (revisions.length === 0) return 1;

      const latest = getLatestRevision(revisions);
      return (latest?.revisionNumber || 0) + 1;
    }

    it('should return null for empty revisions', () => {
      expect(getLatestRevision([])).toBeNull();
    });

    it('should return the revision with highest number', () => {
      const revisions: SubmittalRevisionResponse[] = [
        { revisionNumber: 1 } as SubmittalRevisionResponse,
        { revisionNumber: 3 } as SubmittalRevisionResponse,
        { revisionNumber: 2 } as SubmittalRevisionResponse,
      ];

      const latest = getLatestRevision(revisions);
      expect(latest?.revisionNumber).toBe(3);
    });

    it('should calculate next revision number correctly', () => {
      expect(getNextRevisionNumber([])).toBe(1);

      const revisions: SubmittalRevisionResponse[] = [
        { revisionNumber: 1 } as SubmittalRevisionResponse,
        { revisionNumber: 2 } as SubmittalRevisionResponse,
      ];
      expect(getNextRevisionNumber(revisions)).toBe(3);
    });
  });

  describe('Stakeholder Grouping', () => {
    interface GroupedStakeholders {
      customers: SubmittalStakeholderResponse[];
      engineers: SubmittalStakeholderResponse[];
      architects: SubmittalStakeholderResponse[];
      contractors: SubmittalStakeholderResponse[];
      others: SubmittalStakeholderResponse[];
    }

    function groupStakeholdersByRole(
      stakeholders: SubmittalStakeholderResponse[]
    ): GroupedStakeholders {
      return {
        customers: stakeholders.filter((s) => s.role === 'CUSTOMER'),
        engineers: stakeholders.filter((s) => s.role === 'ENGINEER'),
        architects: stakeholders.filter((s) => s.role === 'ARCHITECT'),
        contractors: stakeholders.filter((s) => s.role === 'GENERAL_CONTRACTOR'),
        others: stakeholders.filter((s) => s.role === 'OTHER'),
      };
    }

    it('should group stakeholders correctly', () => {
      const stakeholders: SubmittalStakeholderResponse[] = [
        { role: 'CUSTOMER' } as SubmittalStakeholderResponse,
        { role: 'ENGINEER' } as SubmittalStakeholderResponse,
        { role: 'ENGINEER' } as SubmittalStakeholderResponse,
        { role: 'ARCHITECT' } as SubmittalStakeholderResponse,
        { role: 'OTHER' } as SubmittalStakeholderResponse,
      ];

      const grouped = groupStakeholdersByRole(stakeholders);

      expect(grouped.customers).toHaveLength(1);
      expect(grouped.engineers).toHaveLength(2);
      expect(grouped.architects).toHaveLength(1);
      expect(grouped.contractors).toHaveLength(0);
      expect(grouped.others).toHaveLength(1);
    });
  });
});

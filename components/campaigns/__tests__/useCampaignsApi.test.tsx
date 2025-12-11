/**
 * Tests for Campaigns React Query Hooks
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useCampaigns,
  useCampaign,
  useCreateCampaign,
  useDeleteCampaign,
  usePauseCampaign,
  useResumeCampaign,
  useContactSearch,
  useCompanySearch,
  useJobSearch,
  useTaskSearch,
  useEstimateRecipients,
  campaignsQueryKeys,
} from '../api/useCampaignsApi';

// Mock the API module
jest.mock('../api/campaignsApi', () => ({
  fetchCampaigns: jest.fn(),
  fetchCampaign: jest.fn(),
  fetchCampaignRecipients: jest.fn(),
  estimateRecipients: jest.fn(),
  createCampaign: jest.fn(),
  updateCampaign: jest.fn(),
  deleteCampaign: jest.fn(),
  pauseCampaign: jest.fn(),
  resumeCampaign: jest.fn(),
  refreshDynamicRecipients: jest.fn(),
  sendTestEmail: jest.fn(),
  searchContacts: jest.fn(),
  searchCompanies: jest.fn(),
  searchJobs: jest.fn(),
  searchTasks: jest.fn(),
}));

// Mock the auth module
jest.mock('../../lib/crm-auth', () => ({
  hasCRMTokens: jest.fn(() => true),
}));

// Import the mocked functions
import * as campaignsApi from '../api/campaignsApi';
import { hasCRMTokens } from '../../lib/crm-auth';

const mockedApi = campaignsApi as jest.Mocked<typeof campaignsApi>;
const mockedHasCRMTokens = hasCRMTokens as jest.MockedFunction<typeof hasCRMTokens>;

// Create a wrapper with QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe('Campaigns Query Keys', () => {
  describe('campaignsQueryKeys', () => {
    it('should generate correct list key', () => {
      expect(campaignsQueryKeys.list()).toEqual(['campaigns', 'list']);
    });

    it('should generate correct detail key', () => {
      expect(campaignsQueryKeys.detail('123')).toEqual(['campaigns', 'detail', '123']);
    });

    it('should generate correct recipients key', () => {
      expect(campaignsQueryKeys.recipients('123')).toEqual(['campaigns', 'recipients', '123']);
    });

    it('should generate correct search keys', () => {
      expect(campaignsQueryKeys.search.contacts('john')).toEqual(['campaigns', 'search', 'contacts', 'john']);
      expect(campaignsQueryKeys.search.companies('acme')).toEqual(['campaigns', 'search', 'companies', 'acme']);
      expect(campaignsQueryKeys.search.jobs('project')).toEqual(['campaigns', 'search', 'jobs', 'project']);
      expect(campaignsQueryKeys.search.tasks('todo')).toEqual(['campaigns', 'search', 'tasks', 'todo']);
    });
  });
});

describe('useCampaigns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedHasCRMTokens.mockReturnValue(true);
  });

  it('should fetch campaigns successfully', async () => {
    const mockData = {
      records: [
        { id: '1', name: 'Campaign 1', status: 'DRAFT', recipientsCount: 10, sentCount: 0, progress: '0/10' },
        { id: '2', name: 'Campaign 2', status: 'COMPLETED', recipientsCount: 20, sentCount: 20, progress: '20/20' },
      ],
      total: 2,
    };
    mockedApi.fetchCampaigns.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useCampaigns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(mockedApi.fetchCampaigns).toHaveBeenCalledTimes(1);
  });

  it('should not fetch when no CRM tokens', async () => {
    mockedHasCRMTokens.mockReturnValue(false);

    const { result } = renderHook(() => useCampaigns(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(mockedApi.fetchCampaigns).not.toHaveBeenCalled();
  });

  it('should handle fetch error', async () => {
    mockedApi.fetchCampaigns.mockRejectedValueOnce(new Error('Failed to fetch'));

    const { result } = renderHook(() => useCampaigns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Failed to fetch');
  });
});

describe('useCampaign', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedHasCRMTokens.mockReturnValue(true);
  });

  it('should fetch a single campaign', async () => {
    const mockCampaign = {
      id: '123',
      name: 'Test Campaign',
      status: 'DRAFT',
      emailSubject: 'Test Subject',
      emailBody: 'Test Body',
    };
    mockedApi.fetchCampaign.mockResolvedValueOnce(mockCampaign);

    const { result } = renderHook(() => useCampaign('123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockCampaign);
    expect(mockedApi.fetchCampaign).toHaveBeenCalledWith('123');
  });

  it('should not fetch when id is empty', async () => {
    const { result } = renderHook(() => useCampaign(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(mockedApi.fetchCampaign).not.toHaveBeenCalled();
  });
});

describe('useCreateCampaign', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a campaign successfully', async () => {
    const mockCampaign = { id: '123', name: 'New Campaign', status: 'DRAFT' };
    mockedApi.createCampaign.mockResolvedValueOnce(mockCampaign);

    const { result } = renderHook(() => useCreateCampaign(), {
      wrapper: createWrapper(),
    });

    const input = {
      name: 'New Campaign',
      recipientListType: 'STATIC' as const,
      emailSubject: 'Subject',
      emailBody: 'Body',
    };

    result.current.mutate(input);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Check that createCampaign was called with the input as the first argument
    expect(mockedApi.createCampaign).toHaveBeenCalled();
    expect(mockedApi.createCampaign.mock.calls[0][0]).toEqual(input);
    expect(result.current.data).toEqual(mockCampaign);
  });
});

describe('useDeleteCampaign', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a campaign successfully', async () => {
    mockedApi.deleteCampaign.mockResolvedValueOnce(true);

    const { result } = renderHook(() => useDeleteCampaign(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('123');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.deleteCampaign).toHaveBeenCalled();
    expect(mockedApi.deleteCampaign.mock.calls[0][0]).toBe('123');
  });
});

describe('usePauseCampaign', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should pause a campaign successfully', async () => {
    const mockCampaign = { id: '123', status: 'PAUSED' };
    mockedApi.pauseCampaign.mockResolvedValueOnce(mockCampaign);

    const { result } = renderHook(() => usePauseCampaign(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('123');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.pauseCampaign).toHaveBeenCalled();
    expect(mockedApi.pauseCampaign.mock.calls[0][0]).toBe('123');
    expect(result.current.data?.status).toBe('PAUSED');
  });
});

describe('useResumeCampaign', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should resume a campaign successfully', async () => {
    const mockCampaign = { id: '123', status: 'SENDING' };
    mockedApi.resumeCampaign.mockResolvedValueOnce(mockCampaign);

    const { result } = renderHook(() => useResumeCampaign(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('123');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.resumeCampaign).toHaveBeenCalled();
    expect(mockedApi.resumeCampaign.mock.calls[0][0]).toBe('123');
  });
});

describe('Search Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedHasCRMTokens.mockReturnValue(true);
  });

  describe('useContactSearch', () => {
    it('should search contacts', async () => {
      const mockContacts = [
        { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
      ];
      mockedApi.searchContacts.mockResolvedValueOnce(mockContacts);

      const { result } = renderHook(() => useContactSearch('john'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedApi.searchContacts).toHaveBeenCalledWith('john');
      expect(result.current.data).toEqual(mockContacts);
    });

    it('should return all contacts with empty string', async () => {
      const mockContacts = [
        { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
        { id: '2', firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com' },
      ];
      mockedApi.searchContacts.mockResolvedValueOnce(mockContacts);

      const { result } = renderHook(() => useContactSearch(''), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedApi.searchContacts).toHaveBeenCalledWith('');
      expect(result.current.data).toHaveLength(2);
    });

    it('should not fetch when disabled', async () => {
      const { result } = renderHook(() => useContactSearch('john', false), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(mockedApi.searchContacts).not.toHaveBeenCalled();
    });
  });

  describe('useCompanySearch', () => {
    it('should search companies', async () => {
      const mockCompanies = [
        { id: '1', name: 'Acme Corp', companySourceType: 'Contractor' },
      ];
      mockedApi.searchCompanies.mockResolvedValueOnce(mockCompanies);

      const { result } = renderHook(() => useCompanySearch('acme'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedApi.searchCompanies).toHaveBeenCalledWith('acme');
      expect(result.current.data).toEqual(mockCompanies);
    });
  });

  describe('useJobSearch', () => {
    it('should search jobs', async () => {
      const mockJobs = [
        { id: '1', jobName: 'Project A', jobType: 'Commercial' },
      ];
      mockedApi.searchJobs.mockResolvedValueOnce(mockJobs);

      const { result } = renderHook(() => useJobSearch('project'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedApi.searchJobs).toHaveBeenCalledWith('project');
      expect(result.current.data).toEqual(mockJobs);
    });
  });

  describe('useTaskSearch', () => {
    it('should search tasks', async () => {
      const mockTasks = [
        { id: '1', title: 'Todo item', status: 'Open', priority: 'High' },
      ];
      mockedApi.searchTasks.mockResolvedValueOnce(mockTasks);

      const { result } = renderHook(() => useTaskSearch('todo'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedApi.searchTasks).toHaveBeenCalledWith('todo');
      expect(result.current.data).toEqual(mockTasks);
    });
  });
});

describe('useEstimateRecipients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedHasCRMTokens.mockReturnValue(true);
  });

  it('should estimate recipients for valid criteria', async () => {
    const mockResult = { count: 25, sampleContactIds: ['1', '2', '3'] };
    mockedApi.estimateRecipients.mockResolvedValueOnce(mockResult);

    const criteria = {
      groups: [
        {
          logicalOperator: 'AND' as const,
          conditions: [
            { entityType: 'CONTACT' as const, field: 'role', operator: 'EQUALS' as const, value: 'Manager' },
          ],
        },
      ],
      groupOperator: 'AND' as const,
    };

    const { result } = renderHook(() => useEstimateRecipients(criteria), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.estimateRecipients).toHaveBeenCalledWith(criteria);
    expect(result.current.data?.count).toBe(25);
  });

  it('should not fetch when criteria is null', async () => {
    const { result } = renderHook(() => useEstimateRecipients(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(mockedApi.estimateRecipients).not.toHaveBeenCalled();
  });

  it('should not fetch when groups are empty', async () => {
    const emptyCriteria = {
      groups: [],
      groupOperator: 'AND' as const,
    };

    const { result } = renderHook(() => useEstimateRecipients(emptyCriteria), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(mockedApi.estimateRecipients).not.toHaveBeenCalled();
  });
});

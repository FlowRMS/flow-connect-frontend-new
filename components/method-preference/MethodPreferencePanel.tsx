'use client';

import { useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMethodPreference } from '@/lib/hooks/useMethodPreference';
import type {
  SendMethodConfig,
  SendMethodType,
  ApiCredentials,
  DataIntakeMethodConfig,
  DataIntakeMethodType,
} from '@/lib/nemra-pos-data';
import {
  getDistributorSendMethodConfig,
  getManufacturerSendMethodConfig,
  getDataIntakeConfig,
} from '@/lib/gqlSdk';

// Send method components
import {
  LoadingState as SendLoadingState,
  ErrorState as SendErrorState,
  MethodSelector,
  CredentialsDisplay,
  EndpointsPanel,
  RequiredFieldsGrid,
  ErrorCodesGrid,
  BatchStatusesGrid,
  RateLimitInfo,
  CodeBlock,
  SftpConfigPanel,
  FileUploadPanel,
  EmailForwardingPanel,
} from '@/components/send-method';

// Data intake method components
import {
  IntakeMethodSelector,
  MANUFACTURER_INTAKE_METHODS,
  REP_INTAKE_METHODS,
} from '@/components/data-intake-method/IntakeMethodSelector';
import { FlowRmsPanel } from '@/components/data-intake-method/FlowRmsPanel';
import { ApiPanel } from '@/components/data-intake-method/ApiPanel';
import { SftpPanel } from '@/components/data-intake-method/SftpPanel';
import { FileDownloadPanel } from '@/components/data-intake-method/FileDownloadPanel';
import { EmailPanel } from '@/components/data-intake-method/EmailPanel';

// ============================================
// CONSTANTS
// ============================================

const ERROR_EXAMPLE = `{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid ZIP code format",
    "field": "records[17].customerZip",
    "rowNumber": 18
  }
}`;

// Send method mappings
const SEND_METHOD_TO_PREFERENCE: Record<SendMethodType, string> = {
  file: 'upload_file',
  api: 'api',
  sftp: 'sftp',
  email: 'email',
};

const PREFERENCE_TO_SEND_METHOD: Record<string, SendMethodType> = {
  upload_file: 'file',
  api: 'api',
  sftp: 'sftp',
  email: 'email',
};

// Data intake method mappings
const INTAKE_METHOD_TO_PREFERENCE: Record<string, string> = {
  file: 'upload_file',
  api: 'api',
  sftp: 'sftp',
  email: 'email',
};

const PREFERENCE_TO_INTAKE_METHOD: Record<string, DataIntakeMethodType> = {
  upload_file: 'file',
  api: 'api',
  sftp: 'sftp',
  email: 'email',
};

// ============================================
// TYPES
// ============================================

export interface ApiCodeExamples {
  submitBatch: string;
  response: string;
  checkStatus: string;
  csvUpload: string;
}

export type MethodPreferenceMode = 'send' | 'receive';
export type MethodPreferenceRole = 'distributor' | 'manufacturer' | 'rep';

export interface MethodPreferencePanelProps {
  /** Mode: 'send' for sending data, 'receive' for receiving/intake */
  mode: MethodPreferenceMode;
  /** Role: determines config fetcher and available methods */
  role: MethodPreferenceRole;

  // Text customization (optional - has defaults based on mode/role)
  pageTitle?: string;
  pageDescription?: string;
  cardTitle?: string;
  cardDescription?: string;

  // Send mode specific props
  apiCredentialsDescription?: string;
  sftpDescription?: string;
  fileUploadDescription?: string;
  fileUploadButtonLabel?: string;
  emailDescription?: string;
  onNavigateToUpload?: () => void;
  getApiCodeExamples?: (api: ApiCredentials) => ApiCodeExamples;

  // Receive mode specific props
  entityLabel?: string;
}

// ============================================
// DEFAULT TEXT HELPERS
// ============================================

function getDefaultText(mode: MethodPreferenceMode, role: MethodPreferenceRole) {
  if (mode === 'send') {
    if (role === 'distributor') {
      return {
        pageTitle: 'Send Method',
        pageDescription: 'Choose how you want to send POS data to FlowConnect',
        cardTitle: 'Data Upload Method',
        cardDescription: 'Select your preferred method for sending POS data',
        apiCredentialsDescription: 'Your token is scoped to your distributor account. Data is automatically tagged with your company.',
        sftpDescription: 'Files uploaded to this directory are processed automatically on a schedule.',
        fileUploadDescription: 'Upload CSV or Excel files directly. Go to the Upload page to submit your POS data.',
        fileUploadButtonLabel: 'Go to Upload',
        emailDescription: "Forward your POS reports to this address. We'll automatically process and validate them.",
      };
    } else {
      // manufacturer send
      return {
        pageTitle: 'Send Method',
        pageDescription: 'Choose how you want to send POS data to your rep firms via FlowConnect',
        cardTitle: 'Data Send Method',
        cardDescription: 'Select your preferred method for sending POS data to rep firms',
        apiCredentialsDescription: 'Your token is scoped to your manufacturer account. All submissions are automatically routed to your configured rep firms.',
        sftpDescription: 'Files uploaded to this directory are automatically routed to the appropriate rep firms based on your routing configuration.',
        fileUploadDescription: 'Upload CSV or Excel files directly. Go to the Send Data page to submit your POS data for rep firms.',
        fileUploadButtonLabel: 'Go to Send Data',
        emailDescription: "Forward your POS reports to this address. We'll automatically route them to the appropriate rep firms based on your configuration.",
      };
    }
  } else {
    // receive mode
    if (role === 'manufacturer') {
      return {
        pageTitle: 'Data Intake Method',
        pageDescription: 'Choose how you want to receive POS data from distributors',
        cardTitle: 'Data Intake Method',
        cardDescription: 'Choose how you want to receive POS data from distributors',
        entityLabel: 'distributors',
      };
    } else {
      // rep receive
      return {
        pageTitle: 'Data Intake Method',
        pageDescription: 'Choose how you want to receive POS data from manufacturers',
        cardTitle: 'Data Intake Method',
        cardDescription: 'Choose how you want to receive POS data from manufacturers',
        entityLabel: 'manufacturers',
      };
    }
  }
}

// ============================================
// COMPONENT
// ============================================

export function MethodPreferencePanel({
  mode,
  role,
  pageTitle: pageTitleProp,
  pageDescription: pageDescriptionProp,
  cardTitle: cardTitleProp,
  cardDescription: cardDescriptionProp,
  apiCredentialsDescription: apiCredentialsDescriptionProp,
  sftpDescription: sftpDescriptionProp,
  fileUploadDescription: fileUploadDescriptionProp,
  fileUploadButtonLabel: fileUploadButtonLabelProp,
  emailDescription: emailDescriptionProp,
  onNavigateToUpload,
  getApiCodeExamples,
  entityLabel: entityLabelProp,
}: MethodPreferencePanelProps) {
  // Get default text based on mode/role
  const defaults = useMemo(() => getDefaultText(mode, role), [mode, role]);

  // Merge props with defaults
  const pageTitle = pageTitleProp ?? defaults.pageTitle;
  const pageDescription = pageDescriptionProp ?? defaults.pageDescription;
  const cardTitle = cardTitleProp ?? defaults.cardTitle;
  const cardDescription = cardDescriptionProp ?? defaults.cardDescription;

  // Send mode text
  const apiCredentialsDescription = apiCredentialsDescriptionProp ?? (defaults as { apiCredentialsDescription?: string }).apiCredentialsDescription ?? '';
  const sftpDescription = sftpDescriptionProp ?? (defaults as { sftpDescription?: string }).sftpDescription ?? '';
  const fileUploadDescription = fileUploadDescriptionProp ?? (defaults as { fileUploadDescription?: string }).fileUploadDescription ?? '';
  const fileUploadButtonLabel = fileUploadButtonLabelProp ?? (defaults as { fileUploadButtonLabel?: string }).fileUploadButtonLabel ?? 'Go to Upload';
  const emailDescription = emailDescriptionProp ?? (defaults as { emailDescription?: string }).emailDescription ?? '';

  // Receive mode text
  const entityLabel = entityLabelProp ?? (defaults as { entityLabel?: string }).entityLabel ?? 'distributors';

  // Config type for the hook
  type ConfigType = SendMethodConfig | DataIntakeMethodConfig;

  // Determine config fetcher based on mode/role
  const getConfig = useCallback((): Promise<ConfigType> => {
    if (mode === 'send') {
      return role === 'distributor'
        ? getDistributorSendMethodConfig()
        : getManufacturerSendMethodConfig();
    } else {
      return getDataIntakeConfig(role as 'manufacturer' | 'rep');
    }
  }, [mode, role]);

  // Extract active method from config (different property names for different config types)
  const getActiveMethod = useCallback((cfg: ConfigType): string | undefined => {
    if (mode === 'send') {
      return (cfg as SendMethodConfig).activeSendMethod;
    } else {
      return (cfg as DataIntakeMethodConfig).activeMethod;
    }
  }, [mode]);

  // Determine preference key and mappings based on mode
  const preferenceKey = mode === 'send' ? 'send_method' : 'receiving_method';
  const methodToPreference = mode === 'send' ? SEND_METHOD_TO_PREFERENCE : INTAKE_METHOD_TO_PREFERENCE;
  const preferenceToMethod = mode === 'send' ? PREFERENCE_TO_SEND_METHOD : PREFERENCE_TO_INTAKE_METHOD;
  const defaultMethod = mode === 'send' ? 'file' : (role === 'rep' ? 'flow-rms' : 'file');
  const unsaveableMethods = mode === 'receive' ? ['flow-rms'] : [];

  // Use the shared hook
  const {
    selectedMethod,
    config,
    isLoading,
    isSaving,
    error,
    hasUnsavedChanges,
    canSaveMethod,
    setSelectedMethod,
    handleSave,
    handleRetry,
  } = useMethodPreference<string, ConfigType>({
    preferenceKey,
    defaultMethod,
    methodToPreference,
    preferenceToMethod,
    getConfig,
    getActiveMethod,
    unsaveableMethods,
    successMessage: mode === 'send' ? 'Send method saved successfully' : 'Data intake method saved successfully',
    errorMessage: mode === 'send' ? 'Failed to save send method' : 'Failed to save data intake method',
  });

  const handleDownloadSshKey = useCallback(() => {
    // TODO: Implement SSH key download
    console.log('Download SSH key');
  }, []);

  // Memoize API code examples for send mode
  const apiCodeExamples = useMemo(() => {
    if (mode !== 'send' || !config || !getApiCodeExamples) return null;
    return getApiCodeExamples((config as SendMethodConfig).api);
  }, [mode, config, getApiCodeExamples]);

  // Determine available methods for receive mode
  const intakeMethods = role === 'rep' ? REP_INTAKE_METHODS : MANUFACTURER_INTAKE_METHODS;

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    if (mode === 'send') {
      return <SendLoadingState />;
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle>{cardTitle}</CardTitle>
          <CardDescription>{cardDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
                <div className="w-12 h-12 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-3 bg-muted rounded w-48" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================

  if (error || !config) {
    if (mode === 'send') {
      return <SendErrorState message={error || 'Configuration not available'} onRetry={handleRetry} />;
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle>{cardTitle}</CardTitle>
          <CardDescription>{cardDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error || 'Configuration not available'}</p>
          <Button onClick={handleRetry} className="mt-4">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  // ============================================
  // SEND MODE RENDER
  // ============================================

  if (mode === 'send') {
    const sendConfig = config as SendMethodConfig;
    const sendMethod = selectedMethod as SendMethodType;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{cardTitle}</CardTitle>
            <CardDescription>{cardDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MethodSelector
              selectedMethod={sendMethod}
              onMethodChange={(m) => setSelectedMethod(m as string)}
            />

            {sendMethod === 'api' && apiCodeExamples && (
              <div className="mt-4 space-y-4">
                <CredentialsDisplay
                  baseUrl={sendConfig.api.baseUrl}
                  apiKey={sendConfig.api.apiKey}
                  description={apiCredentialsDescription}
                />

                <EndpointsPanel endpoints={sendConfig.api.endpoints} />

                {/* Quick Start */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2 border-b">
                    <p className="font-medium text-sm">Quick Start</p>
                  </div>
                  <div className="p-4 space-y-4">
                    <CodeBlock title="1. Submit a batch" code={apiCodeExamples.submitBatch} />
                    <CodeBlock title="2. Response (202 Accepted)" code={apiCodeExamples.response} />
                    <CodeBlock title="3. Check status" code={apiCodeExamples.checkStatus} />
                  </div>
                </div>

                {/* CSV Upload */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2 border-b">
                    <p className="font-medium text-sm">CSV Upload</p>
                  </div>
                  <div className="p-4">
                    <CodeBlock code={apiCodeExamples.csvUpload} />
                  </div>
                </div>

                <RequiredFieldsGrid fields={sendConfig.api.requiredFields} />
                <ErrorCodesGrid codes={sendConfig.api.errorCodes} errorExample={ERROR_EXAMPLE} />
                <BatchStatusesGrid statuses={sendConfig.api.batchStatuses} />
                <RateLimitInfo
                  requestsPerMinute={sendConfig.api.rateLimit.requestsPerMinute}
                  maxRecordsPerBatch={sendConfig.api.rateLimit.maxRecordsPerBatch}
                />
              </div>
            )}

            {sendMethod === 'sftp' && (
              <SftpConfigPanel
                config={sendConfig.sftp}
                description={sftpDescription}
                onDownloadKey={handleDownloadSshKey}
              />
            )}

            {sendMethod === 'file' && (
              <FileUploadPanel
                description={fileUploadDescription}
                buttonLabel={fileUploadButtonLabel}
                onNavigate={onNavigateToUpload || (() => {})}
              />
            )}

            {sendMethod === 'email' && (
              <EmailForwardingPanel
                forwardingAddress={sendConfig.email.forwardingAddress}
                description={emailDescription}
              />
            )}

            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================
  // RECEIVE MODE RENDER
  // ============================================

  const intakeConfig = config as DataIntakeMethodConfig;
  const intakeMethod = selectedMethod as DataIntakeMethodType;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <IntakeMethodSelector
          selectedMethod={intakeMethod}
          onMethodChange={(m) => setSelectedMethod(m as string)}
          methods={intakeMethods}
        />

        {intakeMethod === 'flow-rms' && intakeConfig?.flowRms && (
          <FlowRmsPanel config={intakeConfig.flowRms} />
        )}

        {intakeMethod === 'api' && intakeConfig?.api && (
          <ApiPanel config={intakeConfig.api} />
        )}

        {intakeMethod === 'sftp' && intakeConfig?.sftp && (
          <SftpPanel config={intakeConfig.sftp} entityLabel={entityLabel} />
        )}

        {intakeMethod === 'file' && intakeConfig?.file && (
          <FileDownloadPanel config={intakeConfig.file} />
        )}

        {intakeMethod === 'email' && intakeConfig?.email && (
          <EmailPanel config={intakeConfig.email} />
        )}

        {canSaveMethod && (
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

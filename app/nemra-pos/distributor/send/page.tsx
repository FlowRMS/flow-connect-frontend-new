'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import {
  SendSuccessBanner,
  SendMethodCard,
  UploadedFilesList,
  EmptyFilesState,
  SendActionBar,
  ConfirmSendModal,
  UploadModal,
} from '@/components/send';
import { useSendData, type SendDataConfig } from '@/lib/hooks';

const distributorSendConfig: SendDataConfig = {
  isRepFirms: false,
  recipientLabel: 'manufacturers',
  recipientIcon: 'factory',
  recipientType: 'manufacturers',
  routes: {
    history: '/nemra-pos/distributor/history',
    dashboard: '/nemra-pos/distributor',
    issues: '/nemra-pos/distributor/send-issues',
  },
  labels: {
    dashboardLabel: 'Back to Home',
    pageTitle: 'Send Data',
    pageDescription: 'Send POS (and optionally POT) to your manufacturing partners.',
    uploadModalTitle: 'Upload POS/POT Files',
    fileMethodDescription: 'Upload CSV or Excel files.',
    integrationMethodDescription: 'Data pulled automatically from your system.',
  },
};

export default function DistributorSendDataPage() {
  const {
    showUploadModal,
    setShowUploadModal,
    showConfirmModal,
    setShowConfirmModal,
    uploadedFiles,
    expandedFile,
    setExpandedFile,
    deletingFile,
    integrationMode,
    setIntegrationMode,
    recipients,
    isLoadingRecipients,
    isLoadingPendingFiles,
    sendComplete,
    isSending,
    totalRecords,
    hasBlockingIssues,
    handleSend,
    handleRemoveFile,
    handleUpload,
    config,
  } = useSendData({ config: distributorSendConfig });

  const sendMethod = 'file';

  if (sendComplete) {
    return (
      <SendSuccessBanner
        fileCount={uploadedFiles.length}
        recipientCount={recipients.length}
        recipientLabel={config.recipientLabel}
        historyLink={config.routes.history}
        dashboardLink={config.routes.dashboard}
        dashboardLabel={config.labels.dashboardLabel}
      />
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold">{config.labels.pageTitle}</h1>
          <p className="text-muted-foreground">{config.labels.pageDescription}</p>
        </div>

        {/* Configured Send Method Card */}
        <SendMethodCard
          sendMethod={sendMethod}
          integrationMode={integrationMode}
          onIntegrationModeChange={setIntegrationMode}
          onUploadClick={() => setShowUploadModal(true)}
          fileMethodDescription={config.labels.fileMethodDescription}
          integrationMethodDescription={config.labels.integrationMethodDescription}
        />

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <UploadedFilesList
            files={uploadedFiles}
            expandedFile={expandedFile}
            onExpandFile={setExpandedFile}
            onRemoveFile={handleRemoveFile}
            onAddMore={() => setShowUploadModal(true)}
            recipientIcon={config.recipientIcon}
            issuesLink={config.routes.issues}
            deletingFile={deletingFile}
          />
        )}

        {/* Loading State for Pending Files */}
        {isLoadingPendingFiles && (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground">Loading pending files...</p>
          </div>
        )}

        {/* Empty State for File Upload */}
        {!isLoadingPendingFiles && sendMethod === 'file' && uploadedFiles.length === 0 && (
          <EmptyFilesState onUploadClick={() => setShowUploadModal(true)} />
        )}

        {/* Action Bar */}
        {uploadedFiles.length > 0 && (
          <SendActionBar
            fileCount={uploadedFiles.length}
            totalRecords={totalRecords}
            hasBlockingIssues={hasBlockingIssues}
            onSendClick={() => setShowConfirmModal(true)}
            issuesLink={config.routes.issues}
            isSending={isSending}
          />
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <UploadModal
            recipients={recipients}
            recipientLabel={config.recipientLabel}
            recipientIcon={config.recipientIcon}
            recipientType={config.recipientType}
            title={config.labels.uploadModalTitle}
            onClose={() => setShowUploadModal(false)}
            onUpload={handleUpload}
            isLoadingRecipients={isLoadingRecipients}
          />
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <ConfirmSendModal
            files={uploadedFiles}
            recipientCount={recipients.length}
            recipientLabel={config.recipientLabel}
            onConfirm={handleSend}
            onCancel={() => setShowConfirmModal(false)}
            isSending={isSending}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

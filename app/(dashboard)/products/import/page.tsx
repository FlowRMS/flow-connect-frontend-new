'use client';

import {
  ImportHeader,
  ImportConfigSection,
  ImportResultSection,
  ProductPreviewTable,
  useProductImportPage,
} from '@/components/products/import';

export default function ImportProductsPage() {
  const {
    // Workflow state
    fromWorkflow,
    workflowSession,
    isLoadingWorkflowData,

    // Factory state
    factorySearchTerm,
    setFactorySearchTerm,
    selectedFactory,
    setSelectedFactory,
    isFactoryDropdownOpen,
    setIsFactoryDropdownOpen,
    factories,
    isLoadingFactories,

    // UOM state
    selectedUom,
    setSelectedUom,
    isUomDropdownOpen,
    setIsUomDropdownOpen,
    uoms,

    // File state
    file,
    parsedProducts,
    parseError,
    handleFileChange,

    // Import state
    isImporting,
    importResult,
    handleImport,

    // Utilities
    handleBack,
    formatPrice,
  } = useProductImportPage();

  // Loading state for workflow data
  if (isLoadingWorkflowData) {
    return (
      <main className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 mx-auto text-blue-500 mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <p className="text-gray-600">Loading workflow data...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
      <ImportHeader
        fromWorkflow={fromWorkflow}
        workflowName={workflowSession?.workflowName}
        isImporting={isImporting}
        canImport={!!selectedFactory && !!selectedUom && parsedProducts.length > 0}
        productCount={parsedProducts.length}
        onBack={handleBack}
        onImport={handleImport}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <ImportConfigSection
            factorySearchTerm={factorySearchTerm}
            setFactorySearchTerm={setFactorySearchTerm}
            selectedFactory={selectedFactory}
            setSelectedFactory={setSelectedFactory}
            isFactoryDropdownOpen={isFactoryDropdownOpen}
            setIsFactoryDropdownOpen={setIsFactoryDropdownOpen}
            factories={factories}
            isLoadingFactories={isLoadingFactories}
            selectedUom={selectedUom}
            setSelectedUom={setSelectedUom}
            isUomDropdownOpen={isUomDropdownOpen}
            setIsUomDropdownOpen={setIsUomDropdownOpen}
            uoms={uoms}
          />

          {/* File Upload Section - Hide when data comes from workflow */}
          {!fromWorkflow && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload JSON File</h2>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                  id="json-upload"
                />
                <label
                  htmlFor="json-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    {file ? file.name : 'Click to upload JSON file'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Download the JSON from a workflow result and upload it here
                  </p>
                </label>
              </div>

              {parseError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{parseError}</p>
                </div>
              )}
            </div>
          )}

          {/* Workflow Data Info - Show when data comes from workflow */}
          {fromWorkflow && workflowSession && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Data loaded from Workflow</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    {parsedProducts.length} products ready to import
                    {workflowSession.detectedFactory && (
                      <span className="ml-2">
                        (Detected factory: <strong>{workflowSession.detectedFactory.toUpperCase()}</strong>)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Import Result */}
          {importResult && <ImportResultSection importResult={importResult} />}

          {/* Preview Section */}
          {parsedProducts.length > 0 && (
            <ProductPreviewTable products={parsedProducts} formatPrice={formatPrice} />
          )}
        </div>
      </div>
    </main>
  );
}

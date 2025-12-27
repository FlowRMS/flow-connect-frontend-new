'use client';

import React from 'react';
import type { VersionV2 } from '../types';

interface VersionsTabV2Props {
  versions: VersionV2[];
  currentVersion: number;
  onRevertToVersion: (versionNumber: number) => void;
}

export function VersionsTabV2({ versions, currentVersion, onRevertToVersion }: VersionsTabV2Props) {
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getApprovalsClass = (status: string): string => {
    if (status.includes('pending')) {
      return 'text-yellow-600';
    }
    if (status.includes('needed')) {
      return 'text-red-600';
    }
    return 'text-green-600';
  };

  return (
    <div className="h-full overflow-auto">
      <div className="px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Version History</h3>
            <p className="text-sm text-gray-500">Track changes and compare versions</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="6" height="14" rx="1" />
                <rect x="11" y="3" width="6" height="14" rx="1" />
              </svg>
              Compare Versions
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 5v10M5 10h10" strokeLinecap="round" />
              </svg>
              Create Revision
            </button>
          </div>
        </div>

        {/* Versions List */}
        <div className="space-y-3">
          {versions.map((version) => (
            <div
              key={version.id}
              className={`p-4 bg-white border rounded-lg transition-shadow ${
                version.isCurrent
                  ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-sm'
                  : 'border-gray-200 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Radio Button */}
                <div className="pt-1">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    version.isCurrent
                      ? 'border-indigo-600 bg-indigo-600'
                      : 'border-gray-300'
                  } flex items-center justify-center`}>
                    {version.isCurrent && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>

                {/* Version Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-900 text-white rounded text-xs font-medium">
                      v{version.versionNumber}
                    </span>
                    <span className="text-sm text-gray-900">{formatDate(version.createdAt)}</span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-600">{version.createdByName}</span>
                    {version.isCurrent && (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                        current
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{version.description}</p>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium text-gray-900">
                      ${version.totalAmount.toLocaleString()}
                    </span>
                    <span className={`font-medium ${getApprovalsClass(version.approvalsStatus)}`}>
                      {version.approvalsStatus}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    View
                  </button>
                  {!version.isCurrent && (
                    <button
                      onClick={() => onRevertToVersion(version.versionNumber)}
                      className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Revert to v{version.versionNumber}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Changes Section */}
        {versions.length > 1 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Changes in v{versions[0].versionNumber} (from v{versions[1]?.versionNumber || versions[0].versionNumber - 1})
            </h4>
            <p className="text-sm text-gray-600">
              Comparison details would appear here showing line item changes, pricing updates, and other modifications.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VersionsTabV2;

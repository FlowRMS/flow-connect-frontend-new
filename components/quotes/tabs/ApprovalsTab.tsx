'use client';

import React from 'react';
import type { Quote, LineItem, ApprovalRequest } from '../types';

interface PdfData {
  manufacturer: string;
  builder: string;
  project: string;
  products: { sku: string; description: string; qty: number; value: number }[];
  justification: string;
  totalValue: number;
}

interface ApprovalsTabProps {
  selectedQuote: Quote;
  quoteLineItems: LineItem[];
  approvalRequests: ApprovalRequest[];
  onSetGeneratedPdfData: (data: PdfData) => void;
  onShowPdfPreviewModal: () => void;
  onShowEditTemplateModal: () => void;
  onShowSendEmailModal: () => void;
  onShowMarkApprovalModal: () => void;
  onShowApprovalRequestModal: () => void;
}

export function ApprovalsTab({
  selectedQuote,
  quoteLineItems,
  approvalRequests,
  onSetGeneratedPdfData,
  onShowPdfPreviewModal,
  onShowEditTemplateModal,
  onShowSendEmailModal,
  onShowMarkApprovalModal,
  onShowApprovalRequestModal,
}: ApprovalsTabProps) {
  return (
    <div className="space-y-6">
      {/* Header with Builder Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Manufacturer Approvals</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Builder: {selectedQuote.soldToCustomer}</p>
        </div>
        {(() => {
          const notApprovedMfrsHeader = quoteLineItems
            .filter(li => li.manufacturers[0].approvalStatus === 'not_approved' || li.manufacturers[0].approvalStatus === 'unknown')
            .reduce((acc, li) => {
              const mfr = li.manufacturers[0];
              if (!acc[mfr.name]) {
                acc[mfr.name] = { lines: 0, value: 0, status: mfr.approvalStatus, items: [] as typeof quoteLineItems };
              }
              acc[mfr.name].lines++;
              acc[mfr.name].value += li.sellPrice * li.quantity;
              acc[mfr.name].items.push(li);
              return acc;
            }, {} as Record<string, { lines: number; value: number; status: string; items: typeof quoteLineItems }>);

          const hasNotApprovedHeader = Object.keys(notApprovedMfrsHeader).length > 0;

          const generateAllManufacturersPdfDataHeader = () => {
            const allProducts: { manufacturer: string; sku: string; description: string; qty: number; value: number }[] = [];
            let totalValue = 0;

            Object.entries(notApprovedMfrsHeader).forEach(([mfrName, data]) => {
              data.items.forEach(li => {
                allProducts.push({
                  manufacturer: mfrName,
                  sku: li.productNumber,
                  description: li.description,
                  qty: li.quantity,
                  value: li.sellPrice * li.quantity,
                });
                totalValue += li.sellPrice * li.quantity;
              });
            });

            return {
              manufacturers: Object.keys(notApprovedMfrsHeader),
              builder: selectedQuote?.soldToCustomer || '',
              project: selectedQuote?.name || '',
              products: allProducts,
              justification: `Requesting approval for ${Object.keys(notApprovedMfrsHeader).join(', ')} products on the ${selectedQuote?.name} project. These products meet the project specifications and offer competitive pricing.`,
              totalValue,
            };
          };

          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!hasNotApprovedHeader) return;
                  const data = generateAllManufacturersPdfDataHeader();
                  onSetGeneratedPdfData({
                    manufacturer: data.manufacturers.join(', '),
                    builder: data.builder,
                    project: data.project,
                    products: data.products.map(p => ({
                      sku: p.sku,
                      description: p.description,
                      qty: p.qty,
                      value: p.value,
                    })),
                    justification: data.justification,
                    totalValue: data.totalValue,
                  });
                  onShowPdfPreviewModal();
                }}
                disabled={!hasNotApprovedHeader}
                className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
                  hasNotApprovedHeader
                    ? 'border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]'
                    : 'border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                title={hasNotApprovedHeader ? "Generate PDF for all manufacturers needing approval" : "No manufacturers need approval"}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <path d="M14 2v6h6"/>
                  <path d="M9 15h6M9 11h6"/>
                </svg>
                Generate PDF
              </button>
              <button
                onClick={onShowEditTemplateModal}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                title="Edit PDF Template"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit Template
              </button>
              <button
                onClick={() => {
                  if (!hasNotApprovedHeader) return;
                  const data = generateAllManufacturersPdfDataHeader();
                  onSetGeneratedPdfData({
                    manufacturer: data.manufacturers.join(', '),
                    builder: data.builder,
                    project: data.project,
                    products: data.products.map(p => ({
                      sku: p.sku,
                      description: p.description,
                      qty: p.qty,
                      value: p.value,
                    })),
                    justification: data.justification,
                    totalValue: data.totalValue,
                  });
                  onShowSendEmailModal();
                }}
                disabled={!hasNotApprovedHeader}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                  hasNotApprovedHeader
                    ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                title={hasNotApprovedHeader ? "Send approval request email" : "No manufacturers need approval"}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M22 7l-10 7L2 7"/>
                </svg>
                Send Request
              </button>
            </div>
          );
        })()}
      </div>

      {/* Approved Manufacturers */}
      <div className="bg-[var(--card)] rounded-lg border border-green-200 overflow-hidden">
        <div className="px-4 py-3 bg-green-50 border-b border-green-200 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
            <circle cx="10" cy="10" r="7"/>
            <path d="M7 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3 className="font-semibold text-green-800">Approved</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)]/30">
              <tr className="text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                <th className="px-4 py-2">Manufacturer</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Lines</th>
                <th className="px-4 py-2">Value</th>
                <th className="px-4 py-2">Approved</th>
                <th className="px-4 py-2">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {(() => {
                const approvedMfrs = quoteLineItems
                  .filter(li => li.manufacturers[0].approvalStatus === 'approved')
                  .reduce((acc, li) => {
                    const mfr = li.manufacturers[0];
                    if (!acc[mfr.name]) {
                      acc[mfr.name] = { lines: 0, value: 0, date: mfr.approvalDate, notes: mfr.approvalNotes };
                    }
                    acc[mfr.name].lines++;
                    acc[mfr.name].value += li.sellPrice * li.quantity;
                    return acc;
                  }, {} as Record<string, { lines: number; value: number; date: string | null; notes: string | null }>);

                return Object.entries(approvedMfrs).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-center text-sm text-[var(--muted-foreground)]">
                      No approved manufacturers for this quote
                    </td>
                  </tr>
                ) : Object.entries(approvedMfrs).map(([name, data]) => (
                  <tr key={name} className="hover:bg-[var(--muted)]/20">
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{name}</td>
                    <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">Lighting</td>
                    <td className="px-4 py-3 text-sm text-[var(--foreground)]">{data.lines}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">${data.value.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{data.date}</td>
                    <td className="px-4 py-3 text-sm text-[var(--muted-foreground)] truncate max-w-[200px]" title={data.notes || ''}>
                      {data.notes || 'All products'}
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Needs Review (Conditional/Pending) */}
      <div className="bg-[var(--card)] rounded-lg border border-yellow-200 overflow-hidden">
        <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600">
            <circle cx="10" cy="10" r="7"/>
            <path d="M10 6v4l2 2" strokeLinecap="round"/>
          </svg>
          <h3 className="font-semibold text-yellow-800">Needs Review (Conditional / Pending)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)]/30">
              <tr className="text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                <th className="px-4 py-2">Manufacturer</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Lines</th>
                <th className="px-4 py-2">Details</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {(() => {
                const conditionalMfrs = quoteLineItems
                  .filter(li => li.manufacturers[0].approvalStatus === 'conditional')
                  .reduce((acc, li) => {
                    const mfr = li.manufacturers[0];
                    if (!acc[mfr.name]) {
                      acc[mfr.name] = { lines: 0, status: 'Conditional', notes: mfr.approvalNotes, date: mfr.approvalDate };
                    }
                    acc[mfr.name].lines++;
                    return acc;
                  }, {} as Record<string, { lines: number; status: string; notes: string | null; date: string | null }>);

                // Add pending requests
                approvalRequests
                  .filter(ar => ar.quoteId === selectedQuote.id && ar.status === 'pending')
                  .forEach(ar => {
                    conditionalMfrs[ar.manufacturerName] = {
                      lines: ar.skus.length,
                      status: 'Pending',
                      notes: `Requested ${ar.requestedDate}`,
                      date: ar.requestedDate,
                    };
                  });

                return Object.entries(conditionalMfrs).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-sm text-[var(--muted-foreground)]">
                      No conditional or pending approvals
                    </td>
                  </tr>
                ) : Object.entries(conditionalMfrs).map(([name, data]) => (
                  <tr key={name} className="hover:bg-[var(--muted)]/20">
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        data.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {data.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--foreground)]">{data.lines}</td>
                    <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{data.notes}</td>
                    <td className="px-4 py-3">
                      <button className="px-3 py-1 text-xs border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors">
                        {data.status === 'Pending' ? 'View Request' : 'Check SKUs'}
                      </button>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Not Approved (Action Required) */}
      <div className="bg-[var(--card)] rounded-lg border border-red-200 overflow-hidden">
        <div className="px-4 py-3 bg-red-50 border-b border-red-200 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
            <circle cx="10" cy="10" r="7"/>
            <path d="M8 8l4 4M12 8l-4 4" strokeLinecap="round"/>
          </svg>
          <h3 className="font-semibold text-red-800">Not Approved (Action Required)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)]/30">
              <tr className="text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                <th className="px-4 py-2">Manufacturer</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Lines</th>
                <th className="px-4 py-2">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {(() => {
                const notApprovedMfrs = quoteLineItems
                  .filter(li => li.manufacturers[0].approvalStatus === 'not_approved' || li.manufacturers[0].approvalStatus === 'unknown')
                  .reduce((acc, li) => {
                    const mfr = li.manufacturers[0];
                    if (!acc[mfr.name]) {
                      acc[mfr.name] = { lines: 0, value: 0, status: mfr.approvalStatus };
                    }
                    acc[mfr.name].lines++;
                    acc[mfr.name].value += li.sellPrice * li.quantity;
                    return acc;
                  }, {} as Record<string, { lines: number; value: number; status: string }>);

                return Object.keys(notApprovedMfrs).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-sm text-green-600">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-2">
                        <circle cx="10" cy="10" r="7"/>
                        <path d="M7 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      All manufacturers approved or requests pending
                    </td>
                  </tr>
                ) : Object.entries(notApprovedMfrs).map(([name, data]) => (
                  <tr key={name} className="hover:bg-[var(--muted)]/20">
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{name}</td>
                    <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                      {data.status === 'unknown' ? 'Unknown' : 'Lighting'}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--foreground)]">{data.lines}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">${data.value.toLocaleString()}</td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Approval Requests */}
      {approvalRequests.filter(ar => ar.quoteId === selectedQuote.id && ar.status === 'pending').length > 0 && (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--foreground)]">Pending Approval Requests</h3>
          </div>
          <div className="p-4 space-y-3">
            {approvalRequests
              .filter(ar => ar.quoteId === selectedQuote.id && ar.status === 'pending')
              .map(request => (
                <div key={request.id} className="border border-[var(--border)] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-[var(--foreground)]">{request.manufacturerName}</h4>
                        <span className="text-xs text-[var(--muted-foreground)]">#{request.id}</span>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Requested: {request.requestedDate} ({Math.floor((Date.now() - new Date(request.requestedDate).getTime()) / (1000 * 60 * 60 * 24))} days ago)
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Sent to: {request.requestedBy}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="10" cy="10" r="7"/>
                        <path d="M10 6v4l2 2" strokeLinecap="round"/>
                      </svg>
                      Awaiting Response
                    </span>
                  </div>
                  <p className="text-sm text-[var(--foreground)] mb-3 line-clamp-2">{request.justification}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-[var(--muted-foreground)]">SKUs:</span>
                    {request.skus.map(sku => (
                      <span key={sku} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                        {sku}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 text-xs border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors">
                      View Request
                    </button>
                    <button className="px-3 py-1.5 text-xs border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors">
                      Resend
                    </button>
                    <button
                      onClick={onShowMarkApprovalModal}
                      className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Mark as Approved
                    </button>
                    <button className="px-3 py-1.5 text-xs border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors">
                      Attach Response
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

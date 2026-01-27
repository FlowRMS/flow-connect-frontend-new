/**
 * CreditModal Component
 * Modal for creating credits for line items
 */

import { formatCurrency } from '../../utils';

interface CreditLineItem {
  partNumber: string;
  amount: number;
  quantity: number;
  unitCredit: number;
  commissionPercent: number;
  commissionAmount: number;
  reason: string;
}

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditName: string;
  setCreditName: (name: string) => void;
  creditDate: string;
  setCreditDate: (date: string) => void;
  creditLineItems: CreditLineItem[];
  setCreditLineItems: (items: CreditLineItem[]) => void;
  onSave: () => void;
}

export function CreditModal({
  isOpen,
  onClose,
  creditName,
  setCreditName,
  creditDate,
  setCreditDate,
  creditLineItems,
  setCreditLineItems,
  onSave,
}: CreditModalProps) {
  if (!isOpen) return null;

  const totalCredit = creditLineItems.reduce((sum, li) => sum + li.unitCredit, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-green-600"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v12M6 12h12" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Creating Credit{' '}
              <span className="text-green-600">
                ({formatCurrency(totalCredit)})
              </span>
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Enter credit information, verify your entries, and save
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Credit Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={creditName}
                onChange={(e) => setCreditName(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 ${
                  !creditName ? 'border-red-500' : 'border-[var(--border)]'
                }`}
              />
              {!creditName && (
                <p className="text-xs text-red-500 mt-1">
                  This field is required.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Credit Date<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={creditDate}
                  onChange={(e) => setCreditDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 pr-10"
                />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                >
                  <rect x="3" y="4" width="14" height="14" rx="2" />
                  <path d="M3 8h14M7 2v4M13 2v4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Credit Line Items */}
          <div>
            <div className="grid grid-cols-[1fr_80px_140px_120px_140px_140px] gap-4 px-2 py-2 bg-[var(--muted)]/30 rounded-t-lg text-xs font-semibold text-[var(--muted-foreground)] uppercase">
              <div>Part Number</div>
              <div>Quantity *</div>
              <div>Unit Credit *</div>
              <div>Commission % *</div>
              <div>Commission Amount *</div>
              <div>Reason *</div>
            </div>
            <div className="border border-[var(--border)] rounded-b-lg divide-y divide-[var(--border)]">
              {creditLineItems.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_80px_140px_120px_140px_140px] gap-4 px-2 py-3 items-center"
                >
                  <div className="text-sm text-green-600 font-medium">
                    {item.partNumber}
                  </div>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...creditLineItems];
                      newItems[index].quantity = parseInt(e.target.value) || 0;
                      setCreditLineItems(newItems);
                    }}
                    className="px-2 py-1.5 border border-[var(--border)] rounded text-sm bg-[var(--background)]"
                  />
                  <input
                    type="text"
                    value={`$${item.unitCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`}
                    onChange={(e) => {
                      const newItems = [...creditLineItems];
                      newItems[index].unitCredit =
                        parseFloat(e.target.value.replace('$', '')) || 0;
                      setCreditLineItems(newItems);
                    }}
                    className="px-2 py-1.5 border border-[var(--border)] rounded text-sm bg-[var(--background)]"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      value={item.commissionPercent}
                      onChange={(e) => {
                        const newItems = [...creditLineItems];
                        newItems[index].commissionPercent =
                          parseFloat(e.target.value) || 0;
                        newItems[index].commissionAmount =
                          newItems[index].unitCredit *
                          (newItems[index].commissionPercent / 100);
                        setCreditLineItems(newItems);
                      }}
                      className="px-2 py-1.5 border border-[var(--border)] rounded text-sm bg-[var(--background)] w-20"
                    />
                    <span className="text-sm text-[var(--muted-foreground)]">
                      %
                    </span>
                  </div>
                  <input
                    type="text"
                    value={`$${item.commissionAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`}
                    readOnly
                    className="px-2 py-1.5 border border-[var(--border)] rounded text-sm bg-[var(--muted)]/30"
                  />
                  <select
                    value={item.reason}
                    onChange={(e) => {
                      const newItems = [...creditLineItems];
                      newItems[index].reason = e.target.value;
                      setCreditLineItems(newItems);
                    }}
                    className="px-2 py-1.5 border border-[var(--border)] rounded text-sm bg-[var(--background)]"
                  >
                    <option value="">Choose</option>
                    <option value="price_adjustment">Price Adjustment</option>
                    <option value="return">Return</option>
                    <option value="damaged">Damaged</option>
                    <option value="wrong_item">Wrong Item</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              ))}
            </div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1 px-2">
              {creditLineItems.length > 0 && `1 - ${creditLineItems.length}`}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            Save Credit
          </button>
        </div>
      </div>
    </div>
  );
}

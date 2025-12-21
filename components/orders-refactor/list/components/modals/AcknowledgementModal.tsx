/**
 * AcknowledgementModal Component
 * Modal for adding acknowledgements to orders
 */

interface AckLineItem {
  lineId: string;
  partNumber: string;
  orderedQty: number;
  acknowledgedQty: number;
}

interface AcknowledgementModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrderNumbers: string[];
  ackNumber: string;
  setAckNumber: (number: string) => void;
  ackDate: string;
  setAckDate: (date: string) => void;
  ackLineItems: AckLineItem[];
  setAckLineItems: (items: AckLineItem[]) => void;
  onSubmit: () => void;
}

export function AcknowledgementModal({
  isOpen,
  onClose,
  selectedOrderNumbers,
  ackNumber,
  setAckNumber,
  ackDate,
  setAckDate,
  ackLineItems,
  setAckLineItems,
  onSubmit,
}: AcknowledgementModalProps) {
  if (!isOpen) return null;

  const isValid = ackNumber && ackDate;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-xl w-full">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-blue-600"
            >
              <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Add Acknowledgements for {selectedOrderNumbers.join(', ')}
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              The below acknowledgment number and ship date will be applied to
              all selected detail lines.
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

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Acknowledgement Number<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={ackNumber}
              onChange={(e) => setAckNumber(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              placeholder="Enter acknowledgement number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Order Ack. Date<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={ackDate}
                onChange={(e) => setAckDate(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
          </div>

          {/* Line Item Quantities */}
          {ackLineItems.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Acknowledged Quantity per Line Item
              </label>
              <p className="text-xs text-[var(--muted-foreground)] mb-3">
                The acknowledged quantity may be less than the full ordered
                quantity for partial acknowledgements.
              </p>
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="grid grid-cols-[1fr_100px_100px] gap-2 px-3 py-2 bg-[var(--muted)]/30 text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                  <div>Part Number</div>
                  <div>Ordered Qty</div>
                  <div>Ack. Qty</div>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {ackLineItems.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr_100px_100px] gap-2 px-3 py-2 items-center"
                    >
                      <span className="text-sm">{item.partNumber}</span>
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {item.orderedQty}
                      </span>
                      <input
                        type="number"
                        value={item.acknowledgedQty}
                        onChange={(e) => {
                          const newItems = [...ackLineItems];
                          const newQty = parseInt(e.target.value) || 0;
                          newItems[index].acknowledgedQty = Math.min(
                            newQty,
                            item.orderedQty
                          );
                          setAckLineItems(newItems);
                        }}
                        max={item.orderedQty}
                        min={0}
                        className="px-2 py-1 border border-[var(--border)] rounded text-sm bg-[var(--background)] w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!isValid}
            className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

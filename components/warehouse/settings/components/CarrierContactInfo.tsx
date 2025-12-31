import type { ShippingCarrier } from '../types';

interface CarrierContactInfoProps {
  carrier: ShippingCarrier;
  onUpdate: (updates: Partial<ShippingCarrier>) => void;
}

export default function CarrierContactInfo({
  carrier,
  onUpdate,
}: CarrierContactInfoProps) {
  return (
    <div>
      <h3 className="text-sm font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        Contact Information
      </h3>
      <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] p-3 space-y-3">
        {/* Contact Name */}
        <div>
          <label className="block text-xs text-[var(--muted-foreground)] mb-1">
            Contact Name
          </label>
          <input
            type="text"
            value={carrier.contactName || ''}
            onChange={(e) => onUpdate({ contactName: e.target.value })}
            placeholder="e.g. John Smith"
            className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Phone & Email */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={carrier.contactPhone || ''}
              onChange={(e) => onUpdate({ contactPhone: e.target.value })}
              placeholder="(800) 555-1234"
              className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">
              Email
            </label>
            <input
              type="email"
              value={carrier.contactEmail || ''}
              onChange={(e) => onUpdate({ contactEmail: e.target.value })}
              placeholder="contact@carrier.com"
              className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import { Info } from 'lucide-react';

interface QuantityPricingInfoBoxProps {
  /**
   * Whether to show the formula "(Qty × Unit Cost)" after "is the goal"
   * @default true
   */
  showFormula?: boolean;
}

/**
 * Info box explaining the linked relationship between Extended Net Price, Quantity, and Unit Cost fields.
 * Used in category sections for QUANTITY_PRICING or QUANTITY_COST categories.
 */
export function QuantityPricingInfoBox({ showFormula = true }: QuantityPricingInfoBoxProps) {
  return (
    <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-800">
          <p className="font-medium">These fields are linked:</p>
          <p className="mt-1">
            <strong>Extended Net Price</strong> is the goal{showFormula ? ' (Qty × Unit Cost)' : ''}. You can either:
          </p>
          <ul className="mt-1 ml-4 list-disc space-y-0.5">
            <li>Map <strong>Extended Net Price</strong> directly → Qty and Unit Cost become optional</li>
            <li>Map both <strong>Quantity</strong> and <strong>Unit Cost</strong> → Extended Price will be calculated</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

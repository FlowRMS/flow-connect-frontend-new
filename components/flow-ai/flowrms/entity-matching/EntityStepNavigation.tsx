import { CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/flow-ai/ui/badge';
import type { EntityStep, StepStatus } from '@/components/flow-ai/types/entity-matching';

interface EntityStepNavigationProps {
  currentStep: EntityStep;
  onStepChange: (step: EntityStep) => void;
  factoriesCount: number;
  customersCount: number;
  billToCustomersCount: number;
  endUsersCount: number;
  productsCount: number;
  ordersCount: number;
  invoicesCount: number;
  getStepStatus: (step: EntityStep) => StepStatus;
}

export function EntityStepNavigation({
  currentStep,
  onStepChange,
  factoriesCount,
  customersCount,
  billToCustomersCount,
  endUsersCount,
  productsCount,
  ordersCount,
  invoicesCount,
  getStepStatus
}: EntityStepNavigationProps) {
  const steps = [
    { key: 'factories' as EntityStep, label: 'Factories', count: factoriesCount },
    { key: 'customers' as EntityStep, label: 'Sold to Customers', count: customersCount },
    { key: 'billtocustomers' as EntityStep, label: 'Bill to Customers', count: billToCustomersCount },
    { key: 'endusers' as EntityStep, label: 'End Users', count: endUsersCount },
    { key: 'products' as EntityStep, label: 'Products', count: productsCount },
    { key: 'orders' as EntityStep, label: 'Orders', count: ordersCount },
    { key: 'invoices' as EntityStep, label: 'Invoices', count: invoicesCount }
  ];

  return (
    <div className="border rounded-lg p-6 bg-white">
      <div className="flex items-center justify-between gap-4">
        {steps.map(step => {
          const status = getStepStatus(step.key);
          return (
            <button
              key={step.key}
              onClick={() => onStepChange(step.key)}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                currentStep === step.key
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`font-semibold ${currentStep === step.key ? 'text-primary' : 'text-gray-700'}`}>
                  {step.label}
                </span>
                {status.validated && (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{step.count}</Badge>
                {status.needsReview > 0 && (
                  <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 text-xs">
                    {status.needsReview} Need Review
                  </Badge>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}










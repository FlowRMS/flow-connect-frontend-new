import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/flow-ai/ui/badge';
import { useRef, useState, useEffect } from 'react';
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
  creditsCount: number;
  adjustmentsCount: number;
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
  creditsCount,
  adjustmentsCount,
  getStepStatus
}: EntityStepNavigationProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const steps = [
    { key: 'factories' as EntityStep, label: 'Factories', count: factoriesCount },
    { key: 'customers' as EntityStep, label: 'Sold to Customers', count: customersCount },
    { key: 'billtocustomers' as EntityStep, label: 'Bill to Customers', count: billToCustomersCount },
    { key: 'endusers' as EntityStep, label: 'End Users', count: endUsersCount },
    { key: 'products' as EntityStep, label: 'Products', count: productsCount },
    { key: 'orders' as EntityStep, label: 'Orders', count: ordersCount },
    { key: 'invoices' as EntityStep, label: 'Invoices', count: invoicesCount },
    { key: 'credits' as EntityStep, label: 'Credits', count: creditsCount },
    { key: 'adjustments' as EntityStep, label: 'Adjustments', count: adjustmentsCount }
  ];

  const checkScrollability = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScrollability, 300);
    }
  };

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <div className="relative flex items-center">
        {/* Left scroll button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 z-10 h-full px-2 bg-gradient-to-r from-white via-white to-transparent hover:from-gray-50"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollability}
          className="flex items-stretch gap-2 p-3 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {steps.map(step => {
            const status = getStepStatus(step.key);
            const isActive = currentStep === step.key;

            return (
              <button
                key={step.key}
                onClick={() => onStepChange(step.key)}
                className={`flex-shrink-0 min-w-[120px] px-4 py-3 rounded-lg border-2 transition-all ${
                  isActive
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <span className={`text-sm font-semibold whitespace-nowrap ${isActive ? 'text-primary' : 'text-gray-700'}`}>
                    {step.label}
                  </span>
                  {status.validated && (
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className={`text-xs ${isActive ? 'bg-primary/10 text-primary' : ''}`}
                  >
                    {step.count}
                  </Badge>
                  {status.needsReview > 0 && (
                    <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 text-xs whitespace-nowrap">
                      {status.needsReview} Review
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right scroll button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 z-10 h-full px-2 bg-gradient-to-l from-white via-white to-transparent hover:from-gray-50"
          >
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
}

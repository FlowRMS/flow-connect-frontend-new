import { CheckCircle2, ChevronLeft, ChevronRight, Lock, Loader2 } from 'lucide-react';
import { Badge } from '@/components/flow-ai/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/flow-ai/ui/tooltip';
import { useRef, useState, useEffect, useMemo } from 'react';
import type { EntityStep, StepStatus } from '@/components/flow-ai/types/entity-matching';

// Document type from pending document entity type
export type DocumentType = 'ORDERS' | 'QUOTES' | 'INVOICES' | 'CHECKS' | 'ORDER_ACKNOWLEDGEMENTS' | string | null;

// Tabs that require factory to be matched first (for CHECKS, INVOICES, and COMMISSION_STATEMENTS document types)
const FACTORY_DEPENDENT_TABS: EntityStep[] = ['orders', 'invoices', 'credits', 'adjustments'];

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
  // New props for document type-based tab visibility
  documentType?: DocumentType;
  isFactoryMatched?: boolean;
  factoryEntitiesLoading?: boolean;
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
  getStepStatus,
  documentType,
  isFactoryMatched = false,
  factoryEntitiesLoading = false
}: EntityStepNavigationProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isDelivery = documentType?.toUpperCase() === 'DELIVERIES';

  const allSteps = [
    { key: 'factories' as EntityStep, label: 'Factories', count: factoriesCount },
    { key: 'customers' as EntityStep, label: 'Sold to Customers', count: customersCount },
    { key: 'billtocustomers' as EntityStep, label: 'Bill to Customers (Optional)', count: billToCustomersCount },
    { key: 'endusers' as EntityStep, label: 'End Users', count: endUsersCount },
    { key: 'products' as EntityStep, label: 'Products', count: productsCount },
    { key: 'orders' as EntityStep, label: 'Orders', count: ordersCount },
    { key: 'invoices' as EntityStep, label: 'Invoices', count: invoicesCount },
    { key: 'credits' as EntityStep, label: 'Credits', count: creditsCount },
    { key: 'adjustments' as EntityStep, label: 'Adjustments', count: adjustmentsCount }
  ];

  // Determine which tabs to show based on document type
  const steps = useMemo(() => {
    const normalizedDocType = documentType?.toUpperCase();

    // For DELIVERIES: Same as ORDERS/QUOTES - show factories, customers, bill-to, end users, products
    if (normalizedDocType === 'DELIVERIES') {
      return allSteps.filter(step => !FACTORY_DEPENDENT_TABS.includes(step.key));
    }

    // For CHECKS: Show all tabs (orders, invoices, credits, adjustments all visible)
    if (normalizedDocType === 'CHECKS') {
      return allSteps;
    }

    // For INVOICES: Hide invoices, credits, adjustments tabs - only show orders
    if (normalizedDocType === 'INVOICES') {
      return allSteps.filter(step =>
        !['invoices', 'credits', 'adjustments'].includes(step.key)
      );
    }

    // For COMMISSION_STATEMENTS: Show orders and invoices tabs (hide credits, adjustments)
    if (normalizedDocType === 'COMMISSION_STATEMENTS') {
      return allSteps.filter(step =>
        !['credits', 'adjustments'].includes(step.key)
      );
    }

    // For other document types (ORDERS, QUOTES, ORDER_ACKNOWLEDGEMENTS, etc.):
    // Hide orders, invoices, credits, adjustments tabs entirely
    return allSteps.filter(step =>
      !FACTORY_DEPENDENT_TABS.includes(step.key)
    );
  }, [documentType, factoriesCount, customersCount, billToCustomersCount, endUsersCount, productsCount, ordersCount, invoicesCount, creditsCount, adjustmentsCount]);

  // Determine if a tab should be disabled (waiting for factory match)
  const isTabDisabled = (stepKey: EntityStep): boolean => {
    const normalizedDocType = documentType?.toUpperCase();

    // Only apply factory-dependent logic for CHECKS, INVOICES, and COMMISSION_STATEMENTS
    if (normalizedDocType !== 'CHECKS' && normalizedDocType !== 'INVOICES' && normalizedDocType !== 'COMMISSION_STATEMENTS') {
      return false;
    }

    // For CHECKS: orders, invoices, credits, adjustments are disabled until factory matched
    if (normalizedDocType === 'CHECKS') {
      return FACTORY_DEPENDENT_TABS.includes(stepKey) && !isFactoryMatched;
    }

    // For INVOICES: only orders tab needs factory match
    if (normalizedDocType === 'INVOICES') {
      return stepKey === 'orders' && !isFactoryMatched;
    }

    // For COMMISSION_STATEMENTS: orders and invoices tabs need factory match
    if (normalizedDocType === 'COMMISSION_STATEMENTS') {
      return ['orders', 'invoices'].includes(stepKey) && !isFactoryMatched;
    }

    return false;
  };

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

  // Re-check scrollability when steps change or loading state changes
  useEffect(() => {
    // Use setTimeout to ensure DOM has updated after steps change
    const timeoutId = setTimeout(checkScrollability, 100);
    return () => clearTimeout(timeoutId);
  }, [steps, factoryEntitiesLoading]);

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
          <TooltipProvider>
            {steps.map(step => {
              const status = getStepStatus(step.key);
              const isActive = currentStep === step.key;
              const disabled = isTabDisabled(step.key);

              const buttonContent = (
                <button
                  key={step.key}
                  onClick={() => !disabled && onStepChange(step.key)}
                  disabled={disabled}
                  className={`flex-shrink-0 min-w-[120px] px-4 py-3 rounded-lg border-2 transition-all ${
                    disabled
                      ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                      : isActive
                        ? isDelivery
                          ? 'border-amber-400 bg-amber-50'
                          : 'border-primary bg-primary/5'
                        : isDelivery
                          ? 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1.5">
                    {disabled && (
                      <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    )}
                    <span className={`text-sm font-semibold whitespace-nowrap ${
                      disabled
                        ? 'text-gray-400'
                        : isActive
                          ? isDelivery ? 'text-amber-700' : 'text-primary'
                          : 'text-gray-700'
                    }`}>
                      {step.label}
                    </span>
                    {!disabled && factoryEntitiesLoading && FACTORY_DEPENDENT_TABS.includes(step.key) ? (
                      <Loader2 className="w-4 h-4 text-blue-500 flex-shrink-0 animate-spin" />
                    ) : !disabled && status.validated ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    ) : null}
                  </div>
                  {disabled ? (
                    <div className="text-xs text-gray-400 whitespace-nowrap">
                      Match a factory first
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${isActive ? (isDelivery ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary') : ''}`}
                      >
                        {step.count}
                      </Badge>
                      {status.needsReview > 0 && (
                        <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 text-xs whitespace-nowrap">
                          {status.needsReview} Review
                        </Badge>
                      )}
                    </div>
                  )}
                </button>
              );

              // Wrap disabled tabs with tooltip for better UX
              if (disabled) {
                return (
                  <Tooltip key={step.key}>
                    <TooltipTrigger asChild>
                      {buttonContent}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Match and confirm a factory first to enable this tab</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return buttonContent;
            })}
          </TooltipProvider>
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

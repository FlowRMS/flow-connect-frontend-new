"use client";

import React from "react";
import { X, Users, Building2, Filter, Package } from "lucide-react";
import { useGlobalDashFilters } from "@/lib/analytics/features/order-dashboard/GlobalDashFilterContext";

type ActiveGlobalFiltersProps = {
  className?: string;
};

export const ActiveGlobalFilters: React.FC<ActiveGlobalFiltersProps> = ({
  className = "",
}) => {
  const { state, setDimension, clearAll } = useGlobalDashFilters();

  const hasFilters =
    state.customers.length > 0 ||
    state.factories.length > 0 ||
    state.outsideReps.length > 0 ||
    state.factoryPartNumbers.length > 0;

  if (!hasFilters) {
    return null;
  }

  const handleRemoveCustomer = (value: string) => {
    setDimension(
      "customers",
      state.customers.filter((c) => c.value !== value)
    );
  };

  const handleRemoveFactory = (value: string) => {
    setDimension(
      "factories",
      state.factories.filter((f) => f.value !== value)
    );
  };

  const handleRemoveOutsideRep = (value: string) => {
    setDimension(
      "outsideReps",
      state.outsideReps.filter((r) => r.value !== value)
    );
  };

  const handleRemoveFactoryPartNumber = (value: string) => {
    setDimension(
      "factoryPartNumbers",
      state.factoryPartNumbers.filter((fpn) => fpn.value !== value)
    );
  };

  const totalCount =
    state.customers.length + state.factories.length + state.outsideReps.length + state.factoryPartNumbers.length;

  return (
    <div
      className={`bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4 shadow-md ${className}`}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-md">
            <Filter className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Active Global Filters</h3>
            <p className="text-xs text-gray-600">
              {totalCount} filter{totalCount !== 1 ? "s" : ""} applied to dashboard
            </p>
          </div>
        </div>

        {/* Clear All Button */}
        <button
          onClick={clearAll}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
        >
          <X className="h-4 w-4" />
          Clear All
        </button>
      </div>

      {/* Filter Badges */}
      <div className="mt-4 space-y-3">
        {/* Customers */}
        {state.customers.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Customers ({state.customers.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pl-6">
              {state.customers.map((customer) => (
                <button
                  key={customer.value}
                  onClick={() => handleRemoveCustomer(customer.value)}
                  className="group flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-red-50 border-2 border-blue-300 hover:border-red-400 rounded-lg text-sm font-medium text-gray-700 hover:text-red-700 transition-all shadow-sm hover:shadow-md"
                  title={`Remove ${customer.label}`}
                >
                  <span className="truncate max-w-[200px]">{customer.label}</span>
                  <X className="h-3.5 w-3.5 text-gray-500 group-hover:text-red-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Factories */}
        {state.factories.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Factories ({state.factories.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pl-6">
              {state.factories.map((factory) => (
                <button
                  key={factory.value}
                  onClick={() => handleRemoveFactory(factory.value)}
                  className="group flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-red-50 border-2 border-indigo-300 hover:border-red-400 rounded-lg text-sm font-medium text-gray-700 hover:text-red-700 transition-all shadow-sm hover:shadow-md"
                  title={`Remove ${factory.label}`}
                >
                  <span className="truncate max-w-[200px]">{factory.label}</span>
                  <X className="h-3.5 w-3.5 text-gray-500 group-hover:text-red-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Outside Reps */}
        {state.outsideReps.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Outside Reps ({state.outsideReps.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pl-6">
              {state.outsideReps.map((rep) => (
                <button
                  key={rep.value}
                  onClick={() => handleRemoveOutsideRep(rep.value)}
                  className="group flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-red-50 border-2 border-purple-300 hover:border-red-400 rounded-lg text-sm font-medium text-gray-700 hover:text-red-700 transition-all shadow-sm hover:shadow-md"
                  title={`Remove ${rep.label}`}
                >
                  <span className="truncate max-w-[200px]">{rep.label}</span>
                  <X className="h-3.5 w-3.5 text-gray-500 group-hover:text-red-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Factory Part Numbers */}
        {state.factoryPartNumbers.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-green-600" />
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Factory Part Numbers ({state.factoryPartNumbers.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pl-6">
              {state.factoryPartNumbers.map((fpn) => (
                <button
                  key={fpn.value}
                  onClick={() => handleRemoveFactoryPartNumber(fpn.value)}
                  className="group flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-red-50 border-2 border-green-300 hover:border-red-400 rounded-lg text-sm font-medium text-gray-700 hover:text-red-700 transition-all shadow-sm hover:shadow-md"
                  title={`Remove ${fpn.label}`}
                >
                  <span className="truncate max-w-[200px]">{fpn.label}</span>
                  <X className="h-3.5 w-3.5 text-gray-500 group-hover:text-red-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


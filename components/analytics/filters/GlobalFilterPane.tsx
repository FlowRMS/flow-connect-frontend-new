"use client";

import React from "react";
import { useApolloClient } from "@apollo/client/react";
import { Loader2, Search, X, Filter, ChevronDown, ChevronUp, Check, Users, Building2, Package } from "lucide-react";

import { useGlobalDashFilters } from "@/lib/analytics/features/order-dashboard/GlobalDashFilterContext";
import { ValueType, GetComparisonData, GetComparisonVariables } from "@/lib/analytics/graphql/types";
import { USER_SEARCH } from "@/lib/analytics/graphql/queries/orderDashboardFilters";
import { GET_COMPARISON } from "@/lib/analytics/graphql/queries/orderDashboard";

interface User {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  email?: string | null;
  outside?: boolean;
}

interface UserSearchData {
  userSearch: User[];
}

type LabeledValue = {
  label: string;
  value: string;
};

type GlobalFilterPaneProps = {
  valueType: ValueType;
  className?: string;
};

const labelFromName = (firstName?: string | null, lastName?: string | null) => {
  const pieces = [firstName, lastName].filter(Boolean);
  if (pieces.length === 0) return "";
  return pieces.join(" ");
};

const ensureUnique = (items: LabeledValue[]): LabeledValue[] => {
  const map = new Map<string, LabeledValue>();
  items.forEach((item) => {
    if (!map.has(item.value)) {
      map.set(item.value, item);
    }
  });
  return Array.from(map.values());
};

export const GlobalFilterPane: React.FC<GlobalFilterPaneProps> = ({
  valueType,
  className = "",
}) => {
  const client = useApolloClient();
  const { state, setDimension, clearAll } = useGlobalDashFilters();
  
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Filter sections state
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    customers: true,
    factories: true,
    outsideReps: true,
    factoryPartNumbers: true,
  });

  // Search terms
  const [searchTerms, setSearchTerms] = React.useState<Record<string, string>>({
    customers: "",
    factories: "",
    outsideReps: "",
    factoryPartNumbers: "",
  });

  // Data loading
  const [customerOptions, setCustomerOptions] = React.useState<LabeledValue[]>([]);
  const [factoryOptions, setFactoryOptions] = React.useState<LabeledValue[]>([]);
  const [outsideReps, setOutsideReps] = React.useState<LabeledValue[]>([]);
  const [factoryPartNumberOptions, setFactoryPartNumberOptions] = React.useState<LabeledValue[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [repsLoading, setRepsLoading] = React.useState(false);

  const baseValueType = valueType === "BOTH" ? "SALES" : valueType;

  // Debounce timer ref for reps search
  const repsSearchTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load reps based on search term
  const loadOutsideReps = React.useCallback(async (searchTerm: string) => {
    setRepsLoading(true);
    try {
      const { data } = await client.query<UserSearchData>({
        query: USER_SEARCH,
        variables: {
          searchTerm: searchTerm,
          limit: 1000,
          isOutside: true, // Get outside reps only
        },
        fetchPolicy: "network-only",
      });

      const reps: LabeledValue[] = [];
      (data?.userSearch ?? []).forEach((user) => {
        const label = user.fullName || labelFromName(user.firstName, user.lastName) || user.email || user.id;
        reps.push({ label, value: user.id });
      });

      setOutsideReps(ensureUnique(reps.sort((a, b) => a.label.localeCompare(b.label))));
    } catch (err) {
      console.error("[GlobalFilterPane] Failed to load reps:", err);
    } finally {
      setRepsLoading(false);
    }
  }, [client]);

  // Handle reps search with debounce
  const handleRepsSearchChange = React.useCallback((searchTerm: string) => {
    setSearchTerms((prev) => ({ ...prev, outsideReps: searchTerm }));
    
    if (repsSearchTimerRef.current) {
      clearTimeout(repsSearchTimerRef.current);
    }
    
    repsSearchTimerRef.current = setTimeout(() => {
      loadOutsideReps(searchTerm);
    }, 300);
  }, [loadOutsideReps]);

  // Load data on mount
  React.useEffect(() => {
    let isActive = true;
    setLoading(true);

    const loadCustomers = client.query<GetComparisonData, GetComparisonVariables>({
      query: GET_COMPARISON,
      variables: {
        groupingType: "CUSTOMER",
        valueType: baseValueType,
        filters: [],
      },
      fetchPolicy: "network-only",
    });

    const loadFactories = client.query<GetComparisonData, GetComparisonVariables>({
      query: GET_COMPARISON,
      variables: {
        groupingType: "FACTORY",
        valueType: baseValueType,
        filters: [],
      },
      fetchPolicy: "network-only",
    });

    const loadFactoryPartNumbers = client.query<GetComparisonData, GetComparisonVariables>({
      query: GET_COMPARISON,
      variables: {
        groupingType: "PRODUCT",
        valueType: baseValueType,
        filters: [],
      },
      fetchPolicy: "network-only",
    });

    // Load reps with empty search to populate on open
    loadOutsideReps("");

    Promise.all([loadCustomers, loadFactories, loadFactoryPartNumbers])
      .then(([custResult, factResult, fpnResult]) => {
        if (!isActive) return;

        // Process customers
        const custItems = custResult.data?.getComparison?.items ?? [];
        const customers = ensureUnique(
          custItems
            .filter((item) => item.entityName)
            .map((item) => ({
              label: item.entityName,
              value: item.entityId ?? item.entityName,
            }))
        );
        setCustomerOptions(customers);

        // Process factories
        const factItems = factResult.data?.getComparison?.items ?? [];
        const factories = ensureUnique(
          factItems
            .filter((item) => item.entityName)
            .map((item) => ({
              label: item.entityName,
              value: item.entityId ?? item.entityName,
            }))
        );
        setFactoryOptions(factories);

        // Process factory part numbers
        const fpnItems = fpnResult.data?.getComparison?.items ?? [];
        const factoryPartNumbers = ensureUnique(
          fpnItems
            .filter((item) => item.entityName)
            .map((item) => ({
              label: item.entityName,
              value: item.entityName,
            }))
        );
        setFactoryPartNumberOptions(factoryPartNumbers);
      })
      .catch((err) => {
        console.error("[GlobalFilterPane] Failed to load data:", err);
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
      if (repsSearchTimerRef.current) {
        clearTimeout(repsSearchTimerRef.current);
      }
    };
  }, [client, baseValueType, loadOutsideReps]);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleToggle = (dimension: "customers" | "factories" | "outsideReps" | "factoryPartNumbers", item: LabeledValue) => {
    const current = state[dimension] || [];
    const exists = current.some((x) => x.value === item.value);

    if (exists) {
      setDimension(dimension, current.filter((x) => x.value !== item.value));
    } else {
      setDimension(dimension, [...current, item]);
    }
  };

  const handleSelectAll = (dimension: "customers" | "factories" | "outsideReps" | "factoryPartNumbers", options: LabeledValue[]) => {
    const current = state[dimension] || [];
    
    if (current.length === options.length) {
      setDimension(dimension, []);
    } else {
      setDimension(dimension, [...options]);
    }
  };

  const getFilteredOptions = (dimension: string, options: LabeledValue[]) => {
    const searchTerm = searchTerms[dimension] || "";
    if (!searchTerm) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const activeFilterCount = 
    (state.customers?.length || 0) +
    (state.factories?.length || 0) +
    (state.outsideReps?.length || 0) +
    (state.factoryPartNumbers?.length || 0);

  const sections = [
    {
      key: "customers",
      label: "Customers",
      icon: Users,
      options: customerOptions,
      selected: state.customers || [],
    },
    {
      key: "factories",
      label: "Factories",
      icon: Building2,
      options: factoryOptions,
      selected: state.factories || [],
    },
    {
      key: "outsideReps",
      label: "Outside Reps",
      icon: Users,
      options: outsideReps,
      selected: state.outsideReps || [],
    },
    {
      key: "factoryPartNumbers",
      label: "Factory Part Numbers",
      icon: Package,
      options: factoryPartNumberOptions,
      selected: state.factoryPartNumbers || [],
    },
  ];

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md transition-all"
      >
        <Filter size={18} />
        <span>Global Filters</span>
        {activeFilterCount > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-white text-blue-600 rounded-full text-xs font-bold">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Collapsible Filter Pane */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 w-full min-w-[800px] max-w-none bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ width: '1400px' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Global Filters</h3>
                <p className="text-xs text-blue-100">
                  {loading ? "Loading filter options..." : "Filter dashboard data"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {activeFilterCount > 0 && (
                <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                  <span className="text-sm font-semibold text-white">
                    {activeFilterCount} active
                  </span>
                </div>
              )}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAll}
                  className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 rounded-lg text-sm font-medium transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <X className="h-4 w-4" />
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Close filters"
              >
                <ChevronUp className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Filter Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center gap-3 px-6 py-12 bg-white rounded-xl border-2 border-dashed border-blue-200">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                <span className="text-sm font-medium text-gray-600">
                  Loading filter options...
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const filteredOptions = getFilteredOptions(section.key, section.options);
                  const isExpanded = expandedSections[section.key];
                  const allSelected = section.selected.length === section.options.length && section.options.length > 0;

                  return (
                    <div
                      key={section.key}
                      className={`bg-white rounded-xl border-2 shadow-sm overflow-hidden transition-all ${
                        section.selected.length > 0
                          ? "border-blue-400 shadow-md"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      {/* Section Header */}
                      <div
                        className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
                          section.selected.length > 0
                            ? "bg-gradient-to-r from-blue-50 to-indigo-50"
                            : "bg-gray-50 hover:bg-blue-50"
                        }`}
                        onClick={() => toggleSection(section.key)}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Icon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <span className="text-sm font-bold text-gray-900 truncate">
                            {section.label}
                          </span>
                          {section.selected.length > 0 && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-bold">
                              {section.selected.length}
                            </span>
                          )}
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 text-gray-500 transition-transform flex-shrink-0 ml-2 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>

                      {/* Section Body */}
                      {isExpanded && (
                        <div className="border-t border-gray-200">
                          {/* Controls */}
                          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectAll(section.key as "customers" | "factories" | "outsideReps", section.options);
                              }}
                              className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                            >
                              {allSelected ? (
                                <>
                                  <X className="h-3 w-3" />
                                  Deselect All
                                </>
                              ) : (
                                <>
                                  <Check className="h-3 w-3" />
                                  Select All
                                </>
                              )}
                            </button>
                            {section.options.length > 5 && (
                              <div className="relative flex-1 max-w-[200px]">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                                {section.key === "outsideReps" && repsLoading && (
                                  <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-blue-500 animate-spin" />
                                )}
                                <input
                                  type="text"
                                  placeholder="Search..."
                                  value={searchTerms[section.key] || ""}
                                  onChange={(e) => {
                                    if (section.key === "outsideReps") {
                                      handleRepsSearchChange(e.target.value);
                                    } else {
                                      setSearchTerms({
                                        ...searchTerms,
                                        [section.key]: e.target.value,
                                      });
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            )}
                          </div>

                          {/* Options List */}
                          <div className="max-h-48 overflow-y-auto">
                            {filteredOptions.length === 0 ? (
                              <div className="px-4 py-3 text-xs text-gray-500 text-center">
                                No options found
                              </div>
                            ) : (
                              filteredOptions.map((option) => {
                                const isSelected = section.selected.some((s) => s.value === option.value);
                                
                                return (
                                  <label
                                    key={option.value}
                                    className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleToggle(section.key as "customers" | "factories" | "outsideReps", option)}
                                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 truncate flex-1">
                                      {option.label}
                                    </span>
                                  </label>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};



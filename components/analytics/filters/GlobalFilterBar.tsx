"use client";

import React from "react";
import { useApolloClient } from "@apollo/client/react";
import { Loader2, Search, X, Filter, ChevronDown } from "lucide-react";

import { useGlobalDashFilters } from "@/lib/analytics/features/order-dashboard/GlobalDashFilterContext";
import { ValueType, GetComparisonData, GetComparisonVariables } from "@/lib/analytics/graphql/types";
import { GET_COMPARISON } from "@/lib/analytics/graphql/queries/orderDashboard";
import { USER_SEARCH } from "@/lib/analytics/graphql/queries/orderDashboardFilters";
// TEMPORARY: Import CRM client for user searches (CRM queries need CRM backend, not Report API)
// TO REVERT: Remove this import and change crmClient.query back to client.query for USER_SEARCH
import { crmClient } from "@/lib/analytics/apolloClient";

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

type MultiSelectProps = {
  label: string;
  placeholder: string;
  options: LabeledValue[];
  loading: boolean;
  selected: LabeledValue[];
  onSearch?: (term: string) => void;
  onToggle: (option: LabeledValue) => void;
};

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  placeholder,
  options,
  loading,
  selected,
  onSearch,
  onToggle,
}) => {
  const [searchValue, setSearchValue] = React.useState("");
  const isFirstRun = React.useRef(true);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!onSearch) {
      return undefined;
    }

    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    const trimmed = searchValue.trim();
    if (trimmed.length >= 2) {
      const handler = setTimeout(() => {
        onSearch(trimmed);
      }, 250);
      return () => clearTimeout(handler);
    }

    if (trimmed.length === 0) {
      onSearch("");
    }

    return undefined;
  }, [searchValue, onSearch]);

  const handleToggle = (option: LabeledValue) => {
    onToggle(option);
    setSearchValue("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const optionList = React.useMemo(() => {
    const map = new Map<string, LabeledValue>();
    [...selected, ...options].forEach((opt) => {
      if (!map.has(opt.value)) {
        map.set(opt.value, opt);
      }
    });
    const base = Array.from(map.values());
    if (searchValue.trim().length > 0) {
      const needle = searchValue.trim().toLowerCase();
      return base.filter((opt) =>
        opt.label.toLowerCase().includes(needle)
      );
    }
    return base;
  }, [options, selected, searchValue]);

  return (
    <div className="border rounded-lg overflow-hidden border-gray-200 dark:border-zinc-700">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-zinc-800 px-3 py-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {label}
          </span>
          {selected.length > 0 && (
            <span className="px-2 py-0.5 bg-blue-500 text-white rounded-full text-xs font-bold">
              {selected.length}
            </span>
          )}
        </div>
      </div>

      {/* Selected Pills */}
      {selected.length > 0 && (
        <div className="px-3 py-2 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex flex-wrap gap-2">
            {selected.map((item) => (
              <button
                key={item.value}
                type="button"
                className="group flex items-center gap-1 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs text-blue-700 dark:text-blue-300 transition hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                onClick={() => handleToggle(item)}
              >
                <span className="truncate max-w-[140px]">{item.label}</span>
                <X
                  size={14}
                  className="text-blue-500 dark:text-blue-400 transition group-hover:text-blue-700 dark:group-hover:text-blue-200"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Box */}
      <div className="px-3 py-2 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            defaultValue=""
            onChange={(event) => setSearchValue(event.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Options List */}
      <div className="max-h-56 overflow-y-auto bg-white dark:bg-zinc-900">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            Loading options…
          </div>
        ) : optionList.length === 0 ? (
          <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
            {searchValue.trim().length >= 2
              ? "No matches found. Try a different search."
              : "No options available."}
          </div>
        ) : (
          <ul>
            {optionList.map((option) => {
              const isSelected = selected.some(
                (item) => item.value === option.value
              );
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => handleToggle(option)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-blue-50 dark:hover:bg-zinc-800 ${
                      isSelected
                        ? "bg-blue-50 dark:bg-zinc-800 font-medium text-blue-700 dark:text-blue-300"
                        : "text-gray-700 dark:text-gray-200"
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <span className="text-[11px] uppercase tracking-wide text-blue-500 dark:text-blue-400 ml-2">
                        Selected
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

type GlobalFilterBarProps = {
  valueType: ValueType;
  className?: string;
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

const labelFromName = (firstName?: string | null, lastName?: string | null) => {
  const pieces = [firstName, lastName].filter(Boolean);
  if (pieces.length === 0) return "";
  return pieces.join(" ");
};

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({
  valueType,
  className = "",
}) => {
  const client = useApolloClient();
  const { state, setDimension, clearAll } =
    useGlobalDashFilters();
  
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [placement, setPlacement] = React.useState<"left" | "right">("left");
  const [popupWidth, setPopupWidth] = React.useState(600);

  const [customerOptions, setCustomerOptions] = React.useState<LabeledValue[]>(
    []
  );
  const [customerLoading, setCustomerLoading] = React.useState(false);

  const [factoryOptions, setFactoryOptions] = React.useState<LabeledValue[]>(
    []
  );
  const [factoryLoading, setFactoryLoading] = React.useState(false);

  const [outsideRepOptions, setOutsideRepOptions] = React.useState<
    LabeledValue[]
  >([]);
  const [outsideRepLoading, setOutsideRepLoading] =
    React.useState(false);

  const baseValueType = valueType === "BOTH" ? "SALES" : valueType;

  const loadCustomers = React.useCallback(
    async () => {
      setCustomerLoading(true);
      try {
        // Always use getComparison to populate the initial list
        // It provides all available customers from actual data
        const { data } = await client.query<GetComparisonData, GetComparisonVariables>({
          query: GET_COMPARISON,
          variables: {
            groupingType: "CUSTOMER",
            valueType: baseValueType,
            filters: [],
          },
          fetchPolicy: "network-only",
        });

        const items = data?.getComparison?.items ?? [];
        const allCustomers = ensureUnique(
          items
            .filter((item) => item.entityName)
            .map((item) => ({
              label: item.entityName,
              value: item.entityId ?? item.entityName,
            }))
        );

        setCustomerOptions(allCustomers);
      } catch (error) {
        console.warn("[GlobalFilterBar] Failed to load customers", error);
        setCustomerOptions([]);
      } finally {
        setCustomerLoading(false);
      }
    },
    [client, baseValueType]
  );

  const loadFactories = React.useCallback(
    async () => {
      setFactoryLoading(true);
      try {
        // Always use getComparison to populate the initial list
        // It provides all available factories from actual data
        const { data } = await client.query<GetComparisonData, GetComparisonVariables>({
          query: GET_COMPARISON,
          variables: {
            groupingType: "FACTORY",
            valueType: baseValueType,
            filters: [],
          },
          fetchPolicy: "network-only",
        });

        const items = data?.getComparison?.items ?? [];
        const allFactories = ensureUnique(
          items
            .filter((item) => item.entityName)
            .map((item) => ({
              label: item.entityName,
              value: item.entityId ?? item.entityName,
            }))
        );

        setFactoryOptions(allFactories);
      } catch (error) {
        console.warn("[GlobalFilterBar] Failed to load factories", error);
        setFactoryOptions([]);
      } finally {
        setFactoryLoading(false);
      }
    },
    [client, baseValueType]
  );

  // TEMPORARY: Using crmClient for user search (CRM query needs CRM backend)
  // TO REVERT: Change crmClient.query back to client.query
  const loadOutsideReps = React.useCallback(async (searchTerm: string = "") => {
    setOutsideRepLoading(true);
    try {
      const { data } = await crmClient.query<UserSearchData>({
        query: USER_SEARCH,
        variables: {
          searchTerm: searchTerm,
          limit: 1000,
          isOutside: true, // Get outside reps only
        },
        fetchPolicy: "network-only",
      });

      const reps: LabeledValue[] =
        data?.userSearch
          ?.map(
            (user) => {
              const label = user.fullName || labelFromName(
                user.firstName,
                user.lastName
              ).trim();
              return {
                label: label || user.email || "Outside Rep",
                value: user.id,
              };
            }
          )
          .sort((a, b) =>
            a.label.localeCompare(b.label)
          ) ?? [];

      setOutsideRepOptions(reps);
    } catch (error) {
      console.warn("[GlobalFilterBar] Failed to load outside reps", error);
    } finally {
      setOutsideRepLoading(false);
    }
  }, [client]);

  React.useEffect(() => {
    loadCustomers();
    loadFactories();
    loadOutsideReps(""); // Load with empty string on mount
  }, [loadCustomers, loadFactories, loadOutsideReps]);

  // Close dropdown when clicking outside
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

  // Compute placement and popup width to avoid viewport overflow
  React.useEffect(() => {
    if (!isOpen) return;

    const compute = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const margin = 16;
      const desiredWidth = 600;
      const maxWidth = Math.max(200, vw - margin * 2);
      const width = Math.min(desiredWidth, maxWidth);
      setPopupWidth(width);

      const spaceRight = vw - rect.right;
      const spaceLeft = rect.left;

      if (spaceRight < width + margin && spaceLeft >= width + margin) {
        setPlacement("right");
      } else {
        setPlacement("left");
      }
    };

    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [isOpen]);

  const handleCustomerToggle = React.useCallback(
    (option: LabeledValue) => {
      const existing = state.customers.some(
        (item) => item.value === option.value
      );
      setDimension(
        "customers",
        existing
          ? state.customers.filter((item) => item.value !== option.value)
          : ensureUnique([...state.customers, option])
      );
    },
    [setDimension, state.customers]
  );

  const handleFactoryToggle = React.useCallback(
    (option: LabeledValue) => {
      const existing = state.factories.some(
        (item) => item.value === option.value
      );
      setDimension(
        "factories",
        existing
          ? state.factories.filter((item) => item.value !== option.value)
          : ensureUnique([...state.factories, option])
      );
    },
    [setDimension, state.factories]
  );

  const handleOutsideRepToggle = React.useCallback(
    (option: LabeledValue) => {
      const existing = state.outsideReps.some(
        (item) => item.value === option.value
      );
      setDimension(
        "outsideReps",
        existing
          ? state.outsideReps.filter((item) => item.value !== option.value)
          : ensureUnique([...state.outsideReps, option])
      );
    },
    [setDimension, state.outsideReps]
  );

  const activeFilterCount =
    state.customers.length + state.factories.length + state.outsideReps.length;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-md hover:bg-blue-700 transition-all"
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

      {isOpen && (
        <div
          className={`absolute top-full mt-2 max-h-[600px] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 z-50 flex flex-col ${
            placement === "left" ? "left-0" : "right-0"
          }`}
          style={{ width: popupWidth }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-700 bg-blue-600">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Filter size={20} className="text-white" />
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Global Filters
                  </h2>
                  <p className="text-xs text-blue-100">
                    Apply selections to every comparison table
                  </p>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg text-sm font-medium transition-colors border border-white/30"
                  onClick={clearAll}
                >
                  <X size={14} />
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Filter Sections */}
          <div className="overflow-y-auto flex-1 p-4 space-y-4">
            <MultiSelect
              label="Customers"
              placeholder="Search customers…"
              options={customerOptions}
              loading={customerLoading}
              selected={state.customers}
              onToggle={handleCustomerToggle}
            />
            <MultiSelect
              label="Factories"
              placeholder="Search factories…"
              options={factoryOptions}
              loading={factoryLoading}
              selected={state.factories}
              onToggle={handleFactoryToggle}
            />
            <MultiSelect
              label="Outside Reps"
              placeholder="Search reps…"
              options={outsideRepOptions}
              loading={outsideRepLoading}
              selected={state.outsideReps}
              onToggle={handleOutsideRepToggle}
            />
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};



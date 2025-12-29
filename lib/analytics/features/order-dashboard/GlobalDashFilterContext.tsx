import React from "react";

export type LabeledValue = {
  label: string;
  value: string;
};

export type GlobalFilterState = {
  customers: LabeledValue[];
  factories: LabeledValue[];
  outsideReps: LabeledValue[];
  factoryPartNumbers: LabeledValue[];
};

export const defaultGlobalFilters: GlobalFilterState = {
  customers: [],
  factories: [],
  outsideReps: [],
  factoryPartNumbers: [],
};

type GlobalDashFilterContextValue = {
  state: GlobalFilterState;
  setState: React.Dispatch<React.SetStateAction<GlobalFilterState>>;
  setDimension: <K extends keyof GlobalFilterState>(
    key: K,
    values: GlobalFilterState[K]
  ) => void;
  clearAll: () => void;
  isActive: boolean;
};

const GlobalDashFilterContext =
  React.createContext<GlobalDashFilterContextValue | null>(null);

const cloneState = (state: GlobalFilterState): GlobalFilterState => ({
  customers: [...state.customers],
  factories: [...state.factories],
  outsideReps: [...state.outsideReps],
  factoryPartNumbers: [...state.factoryPartNumbers],
});

export const GlobalDashFilterProvider: React.FC<
  React.PropsWithChildren<{ initialValue?: GlobalFilterState }>
> = ({ initialValue = defaultGlobalFilters, children }) => {
  const [state, setState] = React.useState<GlobalFilterState>(() =>
    cloneState(initialValue)
  );

  const setDimension = React.useCallback<
    GlobalDashFilterContextValue["setDimension"]
  >((key, values) => {
    setState((prev) => ({
      ...prev,
      [key]: values,
    }));
  }, []);

  const clearAll = React.useCallback(() => {
    setState(cloneState(defaultGlobalFilters));
  }, []);

  const isActive = React.useMemo(() => {
    return (
      state.customers.length > 0 ||
      state.factories.length > 0 ||
      state.outsideReps.length > 0 ||
      state.factoryPartNumbers.length > 0
    );
  }, [state]);

  const value = React.useMemo<GlobalDashFilterContextValue>(
    () => ({
      state,
      setState,
      setDimension,
      clearAll,
      isActive,
    }),
    [state, setDimension, clearAll, isActive]
  );

  return (
    <GlobalDashFilterContext.Provider value={value}>
      {children}
    </GlobalDashFilterContext.Provider>
  );
};

export function useGlobalDashFilters(): GlobalDashFilterContextValue {
  const ctx = React.useContext(GlobalDashFilterContext);
  if (!ctx) {
    throw new Error(
      "useGlobalDashFilters must be used within a GlobalDashFilterProvider"
    );
  }
  return ctx;
}

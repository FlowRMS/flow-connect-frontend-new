import { FILTER_COLUMNS, SUPPORTS_IN_OPERATOR } from "./config";
import { GlobalFilterState } from "../GlobalDashFilterContext";
import { FilterInput } from "@/lib/analytics/graphql/types";

export function buildBackendFilters(state: GlobalFilterState): FilterInput[] {
  const result: FilterInput[] = [];

  const push = (columnName: string, values: string[]) => {
    if (!values.length) return;

    if (SUPPORTS_IN_OPERATOR) {
      result.push({ columnName, operator: "IN", values });
      return;
    }

    values.forEach((value) => {
      result.push({ columnName, operator: "EQ", value });
    });
  };

  push(
    FILTER_COLUMNS.customer,
    state.customers.map((customer) => customer.value)
  );
  push(
    FILTER_COLUMNS.factory,
    state.factories.map((factory) => factory.value)
  );
  push(
    FILTER_COLUMNS.outsideRep,
    state.outsideReps.map((rep) => rep.value)
  );
  push(
    FILTER_COLUMNS.factoryPartNumber,
    state.factoryPartNumbers.map((fpn) => fpn.value)
  );

  return result;
}



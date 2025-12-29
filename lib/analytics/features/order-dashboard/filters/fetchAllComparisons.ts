import { GET_COMPARISON, GET_COMPARISON_WITH_SUB_ENTITY } from "@/lib/analytics/graphql/queries/orderDashboard";
import {
  ComparisonData,
  GroupingType,
  ValueType,
  FilterInput,
  GetComparisonData,
  GetComparisonVariables,
} from "@/lib/analytics/graphql/types";
import { SUPPORTS_IN_OPERATOR } from "./config";

const GROUPINGS: GroupingType[] = ["CUSTOMER", "FACTORY", "PRODUCT", "OUTSIDE_SALES_REP", "CUSTOMER_AND_FPN", "CUSTOMER_AND_FACTORY"];

type ComparisonValueType = Exclude<ValueType, "BOTH">;

type ComparisonMap = Record<
  GroupingType,
  Partial<Record<ComparisonValueType, ComparisonData>>
>;

const ensureFilters = (filters?: FilterInput[]): FilterInput[] =>
  Array.isArray(filters) ? filters : [];

export async function fetchAllComparisons(
  client: ReturnType<typeof import("@apollo/client/react").useApolloClient>,
  valueType: ValueType,
  filters?: FilterInput[]
): Promise<ComparisonMap> {
  const normalizedFilters = ensureFilters(filters);

  if (!SUPPORTS_IN_OPERATOR) {
    console.warn(
      "[fetchAllComparisons] SUPPORTS_IN_OPERATOR=false. Implement union fallback if backend requires OR behaviour."
    );
  }

  const targetValueTypes: ComparisonValueType[] =
    valueType === "BOTH"
      ? ["COMMISSION", "SALES"]
      : [valueType];

  const result: ComparisonMap = {
    CUSTOMER: {},
    FACTORY: {},
    PRODUCT: {},
    OUTSIDE_SALES_REP: {},
    CUSTOMER_AND_FPN: {},
    CUSTOMER_AND_FACTORY: {},
  };

  const promises = GROUPINGS.flatMap((groupingType) =>
    targetValueTypes.map(async (vt) => {
      try {
        // Use different query for CUSTOMER_AND_FPN and CUSTOMER_AND_FACTORY to include subEntity fields
        const query = (groupingType === 'CUSTOMER_AND_FPN' || groupingType === 'CUSTOMER_AND_FACTORY')
          ? GET_COMPARISON_WITH_SUB_ENTITY 
          : GET_COMPARISON;

        const response = await client.query<GetComparisonData, GetComparisonVariables>({
          query,
          variables: {
            groupingType,
            valueType: vt,
            filters: normalizedFilters,
          },
          fetchPolicy: "network-only",
        });

        result[groupingType][vt] = response.data?.getComparison ?? {
          title: "",
          items: [],
        };
      } catch (error) {
        console.warn(`[fetchAllComparisons] Failed to fetch ${groupingType} - ${vt}:`, error);
        // Set empty data for failed requests to allow other tables to load
        result[groupingType][vt] = {
          title: "",
          items: [],
        };
      }
    })
  );

  await Promise.all(promises);

  return result;
}



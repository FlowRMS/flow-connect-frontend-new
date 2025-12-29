export const FILTER_COLUMNS = {
  customer: "soldToCustomerId",
  factory: "factoryId",
  outsideRep: "userId",
  factoryPartNumber: "factoryPartNumber",
} as const;

export const SUPPORTS_IN_OPERATOR = true as const;

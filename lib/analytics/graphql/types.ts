// GraphQL Schema Types
export type GroupingType = 'CUSTOMER' | 'PRODUCT' | 'FACTORY' | 'OUTSIDE_SALES_REP' | 'CUSTOMER_AND_FPN' | 'CUSTOMER_AND_FACTORY';
export type ValueType = 'COMMISSION' | 'SALES' | 'BOTH';

export type FilterOperator = 'EQ' | 'IN';

export interface FilterInput {
  columnName: string;
  operator: FilterOperator;
  value?: string;
  values?: string[];
}

// Dashboard Card Types
export interface DashboardPeriod {
  label: string;
  value: number;
}

export interface DashboardCard {
  name: string;
  changeAmount: number;
  changePercentage: number;
  currentPeriod: DashboardPeriod;
  previousPeriod: DashboardPeriod;
}

export interface GetDashboardCardsData {
  getDashboardCards: DashboardCard[];
}

// Comparison Types  
export interface ComparisonItem {
  entityId: string;
  entityName: string;
  lastYear: number;
  thisYear: number;
  variancePercentage: number;
  subEntityId?: string;
  subEntityName?: string;
}

export interface ComparisonData {
  title: string;
  items: ComparisonItem[];
}

export interface GetComparisonData {
  getComparison: ComparisonData;
}

export interface GetComparisonVariables {
  groupingType: GroupingType;
  valueType: ValueType;
  filters?: FilterInput[];
}

export type ReportType =
  | 'QUOTE_DETAIL_REPORT'
  | 'ORDER_DETAIL_REPORT'
  | 'INVOICE_DETAIL_REPORT'
  | 'CHECK_DETAIL_REPORT'
  | 'COMMISSION_BY_STATE_REPORT'
  | 'PIVOT_QUOTE_REPORT'
  | 'PIVOT_ORDER_REPORT'
  | 'PIVOT_INVOICE_REPORT'
  | 'PIVOT_CHECK_REPORT'
  | 'DASHBOARD_REPORT'
  | 'PRE_OPPORTUNITY_DETAIL_REPORT'
  | 'JOB_DETAIL_REPORT'
  | 'TASK_DETAIL_REPORT';

// Table Data Types
export type TableDataType = 'COMMISSION_BALANCE_OVER_TIME' | 'FACTORY_BALANCE';

export interface CommissionBalanceOverTimeResponse {
  __typename: 'CommissionBalanceOverTimeResponse';
  commissionBalance: number;
  expectedCommission: number;
  paidCommission: number;
  timeFrame: string;
}

export interface FactoryBalanceResponse {
  __typename: 'FactoryBalanceResponse';
  commissionBalance: number;
  expectedCommission: number;
  factoryName: string;
  paidCommission: number;
}

export type TableDataRow = CommissionBalanceOverTimeResponse | FactoryBalanceResponse;

export interface TableData {
  title: string;
  metadata: string;
  rows: TableDataRow[];
}

export interface GetTableDataVariables {
  dataType: TableDataType;
  startDate?: Date | null;
  endDate?: Date | null;
}

export interface GetTableDataResponse {
  getTableData: TableData;
}

export interface ReportTemplate {
  id: string;
  reportTemplateName: string;
  reportConfig: unknown;
  reportType: ReportType;
  createdAt?: string;
  userId?: string;
}

export interface ParsedReportTemplate<TConfig = unknown> extends ReportTemplate {
  parsedConfig: TConfig | null;
}

// Chart Data Types
export type ChartDataType = 'SALES_BY_MONTH' | 'COMMISSIONS_BY_MONTH';

export interface ChartDataPoint {
  label: string;
  value: string;
}

export interface ChartMetadata {
  start_date: string;
  end_date: string;
  record_count: number;
  total_value: string;
}

export interface ChartData {
  title: string;
  data: ChartDataPoint[];
  metadata: string;
}

export interface GetChartDataVariables {
  dataType: ChartDataType;
  startDate?: Date | null;
  endDate?: Date | null;
  filters?: FilterInput[] | null;
}

export interface GetChartDataResponse {
  getChartData: ChartData;
}

/**
 * Orders API Module
 * Re-exports from centralized GraphQL module for backward compatibility
 */

// Re-export everything from the centralized orders module
export {
  fetchOrdersWithPagination,
  fetchOrders,
  fetchOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  duplicateOrder,
  createOrderFromQuote,
  fetchAllOrderIds,
  type Order,
  type OrderLandingPage,
  type OrderBalance,
  type OrderCustomer,
  type OrderCreatedBy,
  type OrderSplitRate,
  type OrderDetail,
  type OrderInsideRep,
  type OrderOutsideRep,
  type OrderJob,
  type OrderFactory,
  type OrderProduct,
  type OrderUom,
  type OrderType,
  type OrderCreationType,
  type OrderHeaderStatus,
  type OrderDetailStatus,
  type CreateOrderInput,
  type UpdateOrderInput,
  type OrderDetailInput,
  type OrderSplitRateInput,
  type OrderLandingPageFilter,
  type OrderLandingPageOrderBy,
  type PaginatedOrdersResult,
  type CreateOrderFromQuoteInput,
} from '../../lib/graphql/orders';

// Re-export PaginationParams for backward compatibility
export type { PaginationParams } from '../../lib/graphql/orders';


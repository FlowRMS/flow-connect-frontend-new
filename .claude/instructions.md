# Flow CRM - Development Guidelines

## GraphQL API Architecture

All GraphQL queries, mutations, and types are centralized in one location. When adding or editing endpoints, always modify the centralized files.

### Centralized GraphQL Location

**Path:** `components/lib/graphql/`

| Module | File | Description |
|--------|------|-------------|
| Orders | `orders.ts` | Order queries, mutations, types |
| Invoices | `invoices.ts` | Invoice queries, mutations, types |
| Credits | `credits.ts` | Credit queries, mutations, types |
| Adjustments | `adjustments.ts` | Adjustment queries, mutations, types |
| Checks | `checks.ts` | Check queries, mutations, types |
| Jobs | `jobs.ts` | Job queries, mutations, types |
| Companies | `companies.ts` | Company queries, mutations, types |
| Contacts | `contacts.ts` | Contact queries, mutations, types |
| Pre-opportunities | `pre-opportunities.ts` | Pre-opportunity queries, mutations, types |
| Files | `files.ts` | File upload/download queries, mutations |
| Entity Links | `entity-links.ts` | Cross-entity linking and search |
| Universal Search | `universal-search.ts` | Global search functionality |
| Client | `client.ts` | GraphQL client configuration |
| Index | `index.ts` | Central export hub |

### Rules for Adding/Editing Endpoints

1. **Always add new queries/mutations to the centralized file** in `components/lib/graphql/`
2. **Export from `index.ts`** - Update `components/lib/graphql/index.ts` to export new functions/types
3. **Never duplicate GraphQL code** in component-level API files

### Component-Level API Files (Re-export Only)

These files exist for backward compatibility and React Query hooks only:

- `components/orders/api/ordersApi.ts` - Re-exports from `lib/graphql/orders`
- `components/orders/api/creditsApi.ts` - Re-exports + hooks
- `components/orders/api/adjustmentsApi.ts` - Re-exports + hooks
- `components/orders/api/checksApi.ts` - Re-exports + hooks
- `components/invoices/api/invoicesApi.ts` - Re-exports from `lib/graphql/invoices`
- `components/notes/api/notesApi.ts` - Contains notes GraphQL + hooks
- `components/tasks/api/tasksApi.ts` - Contains tasks GraphQL + hooks

### Adding a New Endpoint - Example

```typescript
// 1. Add to centralized file: components/lib/graphql/orders.ts
export async function fetchOrdersByCustomer(customerId: string): Promise<Order[]> {
  const query = `
    query GetOrdersByCustomer($customerId: ID!) {
      ordersByCustomer(customerId: $customerId) {
        id
        // ... fields
      }
    }
  `;
  const response = await crmGraphQLRequest<{ ordersByCustomer: Order[] }>(query, { customerId });
  return response.ordersByCustomer;
}

// 2. Export from index.ts: components/lib/graphql/index.ts
export { fetchOrdersByCustomer } from './orders';

// 3. If needed, add hook in component API file: components/orders/api/ordersApi.ts
// (only if React Query hook is needed for components)
```

## Tech Stack

- Next.js 16 with App Router
- React Query (TanStack Query) for data fetching
- GraphQL API backend
- TypeScript

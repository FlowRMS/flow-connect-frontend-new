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

## Code Quality Standards

### General Principles

1. **Write clean, modular, efficient, production-grade code** - Code should be readable, maintainable, and performant
2. **Security first** - Never introduce vulnerabilities (XSS, injection, etc.)
3. **No bugs or incomplete implementations** - Every feature must be fully functional before completion
4. **Test your changes mentally** - Consider edge cases, error states, and user interactions

### React & Component Best Practices

1. **Component structure**
   - Keep components focused and single-purpose
   - Extract reusable logic into custom hooks
   - Use proper TypeScript types for all props and state

2. **State management**
   - Minimize state; derive values when possible
   - Colocate state with components that need it
   - Use React Query for server state, local state for UI-only concerns

3. **Performance**
   - Memoize expensive calculations with `useMemo`
   - Memoize callbacks passed to children with `useCallback`
   - Avoid unnecessary re-renders by proper dependency arrays

4. **Accessibility**
   - Use semantic HTML elements
   - Include proper ARIA attributes where needed
   - Ensure keyboard navigation works

### CSS & Styling

1. Use CSS variables for theming (`var(--foreground)`, `var(--primary)`, etc.)
2. Use Tailwind utility classes consistently
3. Ensure responsive design works across screen sizes
4. Handle loading, empty, and error states visually

### Error Handling & User Feedback

1. Always handle API errors gracefully with user feedback
2. Use try-catch blocks for async operations
3. Provide meaningful error messages
4. Never let errors crash the application silently

### Toast Notifications

**Every user action that involves an API call must have proper toast feedback:**

1. **Success toasts** - Show confirmation when actions complete (save, create, delete, update)
2. **Error toasts** - Display clear error messages when operations fail
3. **Loading states** - Use loading indicators for async operations

```typescript
// Example pattern using react-hot-toast
import toast from 'react-hot-toast';

const handleSave = async () => {
  try {
    await saveData();
    toast.success('Changes saved successfully');
  } catch (error) {
    toast.error('Failed to save changes. Please try again.');
  }
};
```

**Toast guidelines:**
- Keep messages concise (under 10 words)
- Use appropriate toast types: `success`, `error`, `loading`
- Don't show toasts for every minor interaction (only meaningful actions)
- For destructive actions (delete), confirm with the user first, then show toast on completion

### Code Organization

1. Keep files under 400 lines; split if larger
2. Group related functionality together
3. Use clear, descriptive naming for variables and functions
4. Add comments only for complex logic, not obvious code

### Before Completing Any Task

1. Verify all functionality works as expected
2. Check for TypeScript errors
3. Ensure no console errors or warnings
4. Test edge cases (empty states, loading, errors)
5. Confirm UI matches design intent

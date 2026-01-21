# FlowCRM Frontend Development Guidelines

## Project Overview

FlowCRM is a Next.js 15+ frontend application that connects to multiple backend services:
- **flow-py-backend** (port 5555): CRM operations (Companies, Contacts, Jobs, Quotes, etc.)
- **flow-ai** (port 8005): AI-powered features (Takeoffs, Product Crosses, Document Processing)

## Code Standards

### File Size Limits
- **Maximum 500-600 lines per file**
- If a file exceeds this limit, refactor into smaller modules
- Split large components into subcomponents

### Code Quality
- **No garbage code**: Remove unused imports, variables, and dead code
- **Modular code**: Each component should have a single responsibility
- **Clean code**: Follow DRY (Don't Repeat Yourself) principles
- **Type safety**: Use TypeScript types for all props and state

## Feature Development Workflow

1. **Check existing code**: Look for existing implementations before creating new ones
2. **Use existing backends**: Prefer existing API endpoints over creating new ones
3. **Discuss with team**: For backend changes, discuss with Jamal first
4. **Follow UI patterns**: Match the FlowCRM design system (gray sidebar, grouped navigation)

## Error Handling

- Always handle loading states
- Display user-friendly error messages
- Provide retry functionality for API failures
- Log errors to console for debugging

## Testing Before PR

1. Run `npm run build` to check for type errors
2. Test all affected features manually
3. Verify environment variables are documented
4. Check for console errors/warnings

## Prohibited Actions

- Do NOT commit `.env` files with real credentials
- Do NOT push directly to main/staging branches
- Do NOT skip linting or type checking
- Do NOT create files over 600 lines
- Do NOT leave console.log statements in production code

# FlowCRM Frontend Development Guidelines

## Project Overview

FlowCRM is a Next.js 15+ frontend application that connects to multiple backend services:
- **flow-py-backend** (port 5555): CRM operations (Companies, Contacts, Jobs, Quotes, etc.)
- **flow-ai** (port 8005): AI-powered features (Takeoffs, Product Crosses, Document Processing)

## CRITICAL: Module Documentation

**Before working on ANY module, you MUST read its documentation file in `/docs/claude/`**

Each module has exhaustive technical documentation covering:
- Every feature and UI element
- All data types and their fields
- API endpoints with request/response shapes
- State management patterns
- Relationships with other entities
- Edge cases and special behaviors

### Documentation Index: `/docs/claude/README.md`

### Key Module Docs:
| Module | Documentation |
|--------|---------------|
| Companies | `/docs/claude/companies.claude.md` |
| Contacts | `/docs/claude/contacts.claude.md` |
| Jobs | `/docs/claude/jobs.claude.md` |
| Quotes | `/docs/claude/quotes.claude.md` |
| Orders | `/docs/claude/orders.claude.md` |
| *(more modules being documented)* | |

### MANDATORY: Keep Docs Updated

**When you modify ANY code in a module:**
1. Read the module's `.claude.md` file FIRST
2. After making changes, UPDATE the documentation to reflect:
   - New features or UI elements added
   - Changed data types or fields
   - New/modified API endpoints
   - Updated state management
   - New edge cases discovered
3. If the module lacks documentation, create it following the template in existing docs

**This is non-negotiable.** Accurate documentation ensures future Claude sessions can work effectively.

---

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

---

## Feature Development Workflow

1. **Read module documentation**: Check `/docs/claude/[module].claude.md` first
2. **Check existing code**: Look for existing implementations before creating new ones
3. **Use existing backends**: Prefer existing API endpoints over creating new ones
4. **Discuss with team**: For backend changes, discuss with Jamal first
5. **Follow UI patterns**: Match the FlowCRM design system (gray sidebar, grouped navigation)
6. **Update documentation**: After changes, update the module's `.claude.md` file

---

## Error Handling

- Always handle loading states
- Display user-friendly error messages
- Provide retry functionality for API failures
- Log errors to console for debugging

---

## Testing Before PR

1. Run `npm run build` to check for type errors
2. Test all affected features manually
3. Verify environment variables are documented
4. Check for console errors/warnings

---

## Prohibited Actions

- Do NOT commit `.env` files with real credentials
- Do NOT push directly to main/staging branches
- Do NOT skip linting or type checking
- Do NOT create files over 600 lines
- Do NOT leave console.log statements in production code
- Do NOT modify modules without reading their documentation first
- Do NOT make changes without updating module documentation

---

## Modules NOT Yet Implemented (Mock/Placeholder)

The following modules use mock data and are NOT production-ready:
- **Buy/Sell** - Mock implementation
- **Submittals/Spec Sheets** - Mock implementation
- **PDF Templates** - Mock implementation
- **Analytics** - Separate analytics system
- **DISC Analytics** - Separate analytics system

Do NOT work on these modules unless specifically asked to implement them.

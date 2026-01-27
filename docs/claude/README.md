# FlowCRM Module Documentation for Claude

This directory contains exhaustive technical documentation for every module in FlowCRM. These docs are designed to give Claude (and other AI assistants) complete understanding of each module's features, data structures, API endpoints, state management, and edge cases.

## How to Use These Docs

When working on a specific module, Claude should read the corresponding `.claude.md` file to understand:
- Every feature and UI element
- All data types and their fields
- API endpoints and their request/response shapes
- State management patterns
- Relationships with other entities
- Edge cases and special behaviors

## Module Documentation Index

### Core CRM Modules
| Module | File | Status | Description |
|--------|------|--------|-------------|
| Companies | [companies.claude.md](./companies.claude.md) | ✅ Complete | Company management, hierarchy, territories |
| Contacts | [contacts.claude.md](./contacts.claude.md) | ✅ Complete | Contact management, communication history |
| Jobs | [jobs.claude.md](./jobs.claude.md) | ✅ Complete | Job tracking, Kanban/list views, drag-drop |
| Customers | [customers.claude.md](./customers.claude.md) | 🔄 Pending | Customer records and management |
| Manufacturers | [manufacturers.claude.md](./manufacturers.claude.md) | 🔄 Pending | Manufacturer/factory profiles |

### Sales Pipeline
| Module | File | Status | Description |
|--------|------|--------|-------------|
| Pre-Opportunities | [pre-opportunities.claude.md](./pre-opportunities.claude.md) | 🔄 Pending | Lead capture, opportunity tracking |
| Quotes | [quotes.claude.md](./quotes.claude.md) | ✅ Complete | Quote creation, V1 & V2, conversion to orders |
| Orders | [orders.claude.md](./orders.claude.md) | ✅ Complete | Order management, line items, fulfillment |
| Invoices | [invoices.claude.md](./invoices.claude.md) | 🔄 Pending | Invoice generation, billing |
| Statements | [statements.claude.md](./statements.claude.md) | 🔄 Pending | Financial statements |

### Financial & Commission
| Module | File | Status | Description |
|--------|------|--------|-------------|
| Checks | [checks.claude.md](./checks.claude.md) | 🔄 Pending | Commission check processing |
| Commissions | [commissions.claude.md](./commissions.claude.md) | 🔄 Pending | Commission tracking, reconciliation |
| Credits | [credits.claude.md](./credits.claude.md) | 🔄 Pending | Credit management |
| Adjustments | [adjustments.claude.md](./adjustments.claude.md) | 🔄 Pending | Price/commission adjustments |
| Acknowledgements | [acknowledgements.claude.md](./acknowledgements.claude.md) | 🔄 Pending | Order acknowledgements |

### Products & Catalog
| Module | File | Status | Description |
|--------|------|--------|-------------|
| Products | [products.claude.md](./products.claude.md) | 🔄 Pending | Product catalog, pricing tiers |
| Product Crosses | [product-crosses.claude.md](./product-crosses.claude.md) | 🔄 Pending | AI-powered cross-selling |
| Takeoffs | [takeoffs.claude.md](./takeoffs.claude.md) | 🔄 Pending | PDF takeoff processing |

### Warehouse
| Module | File | Status | Description |
|--------|------|--------|-------------|
| Warehouse | [warehouse.claude.md](./warehouse.claude.md) | 🔄 Pending | Inventory, fulfillment, cycle counts |

### Communication & Content
| Module | File | Status | Description |
|--------|------|--------|-------------|
| Notes | [notes.claude.md](./notes.claude.md) | 🔄 Pending | Note management across entities |
| Tasks | [tasks.claude.md](./tasks.claude.md) | 🔄 Pending | Task management, assignments |
| Files | [files.claude.md](./files.claude.md) | 🔄 Pending | File uploads, organization |
| Email Templates | [email-templates.claude.md](./email-templates.claude.md) | 🔄 Pending | Email template builder |
| Campaigns | [campaigns.claude.md](./campaigns.claude.md) | 🔄 Pending | Email campaigns, automation |

### AI Features
| Module | File | Status | Description |
|--------|------|--------|-------------|
| Flow AI | [flow-ai.claude.md](./flow-ai.claude.md) | 🔄 Pending | AI workflows, data processing |
| FlowChat | [flowchat.claude.md](./flowchat.claude.md) | 🔄 Pending | AI chat assistant, context |

### Settings & Configuration
| Module | File | Status | Description |
|--------|------|--------|-------------|
| Settings | [settings.claude.md](./settings.claude.md) | 🔄 Pending | User/system settings |
| Shared Components | [shared-components.claude.md](./shared-components.claude.md) | 🔄 Pending | Reusable UI components |

## Modules NOT Documented (Mock/Unimplemented)

The following modules are NOT documented because they use mock data or are not yet implemented:
- **Buy/Sell** - Mock implementation
- **Submittals/Spec Sheets** - Mock implementation
- **PDF Templates** - Mock implementation
- **Analytics** - Separate system
- **DISC Analytics** - Separate system

## Documentation Standards

Each module doc follows this structure:
1. **Module Overview** - Purpose, location, technologies
2. **Entity & Data Types** - Complete TypeScript interfaces
3. **API Endpoints** - GraphQL queries/mutations with full signatures
4. **UI Components** - Component hierarchy, props, features
5. **State Management** - Hooks, state patterns, data flow
6. **Features** - Every feature with detailed behavior
7. **Modals & Actions** - All user interactions
8. **Relationships** - How this module connects to others
9. **Edge Cases** - Special behaviors, error handling

## Keeping Docs Updated

**CRITICAL**: These docs MUST be updated whenever code changes are made to a module.

When modifying any module:
1. Read the corresponding `.claude.md` file first
2. After making changes, update the documentation to reflect:
   - New features or UI elements
   - Changed data types or fields
   - New/modified API endpoints
   - Updated state management
   - New edge cases discovered

This ensures future Claude sessions have accurate information.

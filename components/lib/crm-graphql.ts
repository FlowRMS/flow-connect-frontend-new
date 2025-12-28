/**
 * FlowCRM GraphQL Client
 *
 * This file re-exports all GraphQL functionality from the modular graphql/ folder.
 * The code is organized by domain for better maintainability:
 *
 * - graphql/client.ts: Core GraphQL client and utilities
 * - graphql/types.ts: Shared type definitions
 * - graphql/jobs.ts: Jobs-related queries and mutations
 * - graphql/companies.ts: Companies-related queries and mutations
 * - graphql/contacts.ts: Contacts-related queries and mutations
 * - graphql/pre-opportunities.ts: Pre-opportunities-related queries and mutations
 * - graphql/entity-links.ts: Entity linking queries and mutations
 * - graphql/notes.ts: Notes-related queries and mutations
 * - graphql/tasks.ts: Tasks-related queries and mutations
 * - graphql/universal-search.ts: Universal search functionality
 * - graphql/landing-pages.ts: Combined landing page queries
 */

// Re-export everything from the modular graphql folder
export * from './graphql';

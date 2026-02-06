import { requestGraphQL } from './graphqlClient';
import type { EntityAlias, UnmatchedEntity } from './nemra-pos-data';
import {
  mockManufacturerContacts,
  mockDistributorContacts,
  mockRepFirmContacts,
  mockManufacturerAliases,
  mockDistributorAliases,
  mockRepFirmAliases,
  mockUnmatchedManufacturers,
  mockUnmatchedDistributors,
  mockUnmatchedRepFirms,
} from './nemra-pos-data';

export type RoutingEntityType = 'manufacturer' | 'distributor' | 'repFirm';

export interface RoutingConfig {
  method: 'column' | 'file' | 'territory';
  routingColumn?: string;
  useSeparateColumns?: boolean;
  posRoutingColumn?: string;
  potRoutingColumn?: string;
}

// Fetch entities based on role
export async function fetchRoutingEntitiesGql(entityType: RoutingEntityType) {
  const query = `
    query GetRoutingEntities($entityType: String!) {
      routingEntities(type: $entityType) {
        id
        name
        inviteStatus
        territory
      }
    }
  `;

  try {
    const res = await requestGraphQL<{ routingEntities: any[] }>(query, { entityType });
    return res.routingEntities;
  } catch (e) {
    console.warn('fetchRoutingEntitiesGql failed, falling back to mock data', e);
    switch (entityType) {
      case 'manufacturer':
        return mockManufacturerContacts.filter(m => m.inviteStatus === 'active');
      case 'distributor':
        return mockDistributorContacts.filter(d => d.inviteStatus === 'active');
      case 'repFirm':
        return mockRepFirmContacts.filter(r => r.inviteStatus === 'active');
      default:
        return [];
    }
  }
}

// Fetch aliases for an entity type
export async function fetchAliasesGql(entityType: RoutingEntityType): Promise<EntityAlias[]> {
  const query = `
    query GetAliases($entityType: String!) {
      aliases(type: $entityType) {
        id
        entityId
        entityName
        alias
      }
    }
  `;

  try {
    const res = await requestGraphQL<{ aliases: EntityAlias[] }>(query, { entityType });
    return res.aliases;
  } catch (e) {
    console.warn('fetchAliasesGql failed, falling back to mock data', e);
    switch (entityType) {
      case 'manufacturer':
        return mockManufacturerAliases;
      case 'distributor':
        return mockDistributorAliases;
      case 'repFirm':
        return mockRepFirmAliases;
      default:
        return [];
    }
  }
}

// Fetch unmatched entities
export async function fetchUnmatchedEntitiesGql(entityType: RoutingEntityType): Promise<UnmatchedEntity[]> {
  const query = `
    query GetUnmatchedEntities($entityType: String!) {
      unmatchedEntities(type: $entityType) {
        id
        name
        firstSeen
        recordCount
      }
    }
  `;

  try {
    const res = await requestGraphQL<{ unmatchedEntities: UnmatchedEntity[] }>(query, { entityType });
    return res.unmatchedEntities;
  } catch (e) {
    console.warn('fetchUnmatchedEntitiesGql failed, falling back to mock data', e);
    switch (entityType) {
      case 'manufacturer':
        return mockUnmatchedManufacturers;
      case 'distributor':
        return mockUnmatchedDistributors;
      case 'repFirm':
        return mockUnmatchedRepFirms;
      default:
        return [];
    }
  }
}

// Add alias
export async function addAliasGql(entityType: RoutingEntityType, alias: EntityAlias): Promise<EntityAlias> {
  const mutation = `
    mutation AddAlias($input: AddAliasInput!) {
      addAlias(input: $input) {
        id
        entityId
        entityName
        alias
      }
    }
  `;

  try {
    const res = await requestGraphQL<{ addAlias: EntityAlias }>(mutation, {
      input: {
        entityType,
        entityId: alias.entityId,
        entityName: alias.entityName,
        alias: alias.alias,
      },
    });
    return res.addAlias;
  } catch (e) {
    console.warn('addAliasGql failed, falling back to local change', e);
    return alias;
  }
}

// Remove alias
export async function removeAliasGql(entityType: RoutingEntityType, aliasId: string): Promise<{ success: boolean; id: string }> {
  const mutation = `
    mutation RemoveAlias($entityType: String!, $id: ID!) {
      removeAlias(entityType: $entityType, id: $id) {
        success
        id
      }
    }
  `;

  try {
    const res = await requestGraphQL<{ removeAlias: { success: boolean; id: string } }>(mutation, { entityType, id: aliasId });
    return res.removeAlias;
  } catch (e) {
    console.warn('removeAliasGql failed, falling back to local change', e);
    return { success: true, id: aliasId };
  }
}

// Match unmatched entity
export async function matchUnmatchedEntityGql(
  entityType: RoutingEntityType,
  unmatchedId: string,
  targetEntityId: string
): Promise<{ success: boolean }> {
  const mutation = `
    mutation MatchUnmatchedEntity($input: MatchUnmatchedEntityInput!) {
      matchUnmatchedEntity(input: $input) {
        success
      }
    }
  `;

  try {
    const res = await requestGraphQL<{ matchUnmatchedEntity: { success: boolean } }>(mutation, {
      input: { entityType, unmatchedId, targetEntityId },
    });
    return res.matchUnmatchedEntity;
  } catch (e) {
    console.warn('matchUnmatchedEntityGql failed, falling back to local change', e);
    return { success: true };
  }
}

// Fetch routing config
export async function fetchRoutingConfigGql(role: string): Promise<RoutingConfig> {
  const query = `
    query GetRoutingConfig($role: String!) {
      routingConfig(role: $role) {
        method
        routingColumn
        useSeparateColumns
        posRoutingColumn
        potRoutingColumn
      }
    }
  `;

  try {
    const res = await requestGraphQL<{ routingConfig: RoutingConfig }>(query, { role });
    return res.routingConfig;
  } catch (e) {
    console.warn('fetchRoutingConfigGql failed, falling back to defaults', e);
    // Default config based on role
    if (role === 'manufacturer') {
      return { method: 'territory' };
    }
    return { method: 'column', routingColumn: 'manufacturer', useSeparateColumns: false, posRoutingColumn: 'manufacturer', potRoutingColumn: 'manufacturer' };
  }
}

// Save routing config
export async function saveRoutingConfigGql(role: string, config: RoutingConfig): Promise<{ success: boolean }> {
  const mutation = `
    mutation SaveRoutingConfig($role: String!, $input: RoutingConfigInput!) {
      saveRoutingConfig(role: $role, input: $input) {
        success
      }
    }
  `;

  try {
    const res = await requestGraphQL<{ saveRoutingConfig: { success: boolean } }>(mutation, { role, input: config });
    return res.saveRoutingConfig;
  } catch (e) {
    console.warn('saveRoutingConfigGql failed, simulating success', e);
    return { success: true };
  }
}


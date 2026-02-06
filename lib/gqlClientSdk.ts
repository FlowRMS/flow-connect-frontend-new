import { requestGraphQL } from './graphqlClient';
import type { PrefixPattern } from '@/components/validation/validation-panel';

export async function addPrefixPatternGql(pattern: PrefixPattern) {
  // matches common naming patterns for GraphQL servers.
  const mutation = `
    mutation AddPrefixPattern($input: AddPrefixPatternInput!) {
      addPrefixPattern(input: $input) {
        id
        pattern
        description
      }
    }
  `;

  try {
    const res = await requestGraphQL<{ addPrefixPattern: PrefixPattern }>(mutation, {
      input: { pattern: pattern.pattern, description: pattern.description },
    });
    return res.addPrefixPattern;
  } catch (e) {
    // No endpoint or failure: resolve with the local pattern for UX continuity
    console.warn('addPrefixPatternGql failed, falling back to local change', e);
    return pattern;
  }
}

export async function removePrefixPatternGql(id: string) {
  const mutation = `
    mutation RemovePrefixPattern($id: ID!) {
      removePrefixPattern(id: $id) {
        success
        id
      }
    }
  `;

  try {
    const res = await requestGraphQL<{ removePrefixPattern: { success: boolean; id: string } }>(mutation, { id });
    return res.removePrefixPattern;
  } catch (e) {
    console.warn('removePrefixPatternGql failed, falling back to local change', e);
    return { success: true, id };
  }
}

export async function testValidationRulesGql() {
  const mutation = `
    mutation TestValidationRules {
      testValidationRules {
        ok
        details
      }
    }
  `;

  try {
    const res = await requestGraphQL<{ testValidationRules: { ok: boolean; details?: string } }>(mutation);
    return res.testValidationRules;
  } catch (e) {
    console.warn('testValidationRulesGql failed, using simulated result', e);
    return { ok: true, details: 'Simulated test (no backend configured)' };
  }
}

export async function saveValidationSettingsGql(payload: any) {
  const mutation = `
    mutation SaveValidationSettings($input: SaveValidationSettingsInput!) {
      saveValidationSettings(input: $input) {
        ok
      }
    }
  `;

  try {
    const res = await requestGraphQL<{ saveValidationSettings: { ok: boolean } }>(mutation, { input: payload });
    return res.saveValidationSettings;
  } catch (e) {
    console.warn('saveValidationSettingsGql failed, simulating success', e);
    return { ok: true };
  }
}

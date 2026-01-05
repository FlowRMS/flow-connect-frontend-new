'use client';

import type { ExtractedField } from '@/components/flow-ai/flowrms/FieldsExtractedPane';
import type { OtherField, PrimaryField } from '@/lib/flow-ai/parseExtracted';

export function buildExtractedFields(primary: PrimaryField[], other: OtherField[]): ExtractedField[] {
  const primaryMapped = primary.map<ExtractedField>((item, index) => ({
    id: `primary-${index}`,
    key: item.key,
    value: item.value,
    category: 'Primary',
    sourcePath: item.sourcePath,
    nested: item.nested?.map((nestedField, nestedIndex) => ({
      id: `primary-${index}-nested-${nestedIndex}`,
      key: nestedField.key,
      value: nestedField.value,
      category: 'Primary',
      sourcePath: nestedField.sourcePath,
    })),
  }));

  const otherMapped = other.map<ExtractedField>((item, index) => ({
    id: `other-${index}`,
    key: item.key,
    value: item.value,
    category: 'Other',
    sourcePath: item.sourcePath,
  }));

  return [...primaryMapped, ...otherMapped];
}






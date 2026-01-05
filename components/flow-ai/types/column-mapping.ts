export type ColumnMapping = {
  reasoning: string;
  confidence: number;
  column_name: string;
  dto_field_path: string;
};

export type ParsedMappingData = {
  s3_key: string;
  mappings: {
    mappings: ColumnMapping[];
    unmapped_columns: string[];
    overall_confidence: number;
    unmapped_dto_fields: string[];
  };
  original_s3_key: string;
  original_presigned_url: string;
  required_fields?: string[];
};

export type MappingRow = {
  columnName: string;
  suggestedDtoField: string | null;
  confidence: number | null;
  reasoning: string | null;
  isAutoMapped: boolean;
};

export type MappingHint = {
  column_name: string;
  dto_field_path: string;
};

// For duplicating a source column to multiple DTO fields
export type ColumnDuplicateInput = {
  sourceColumn: string;    // The column name in the spreadsheet
  targetDtoField: string;  // The DTO field to duplicate the mapping to
};





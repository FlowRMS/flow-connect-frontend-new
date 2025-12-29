import { gql } from '@apollo/client';

export const TRANSFORM_TO_EXCEL = gql`
  query TransformToExcel($file: Upload!) {
    transformToExcel(csvFile: $file)
  }
`;

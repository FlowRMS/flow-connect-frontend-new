import { gql } from '@apollo/client';

export const GET_REPORT_TEMPLATES_BY_USER = gql`
  query ReportTemplatesByUser {
    reportTemplatesByUser {
      id
      reportTemplateName
      reportConfig
      reportType
      createdAt
      userId
    }
  }
`;

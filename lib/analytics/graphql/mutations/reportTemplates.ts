import { gql } from '@apollo/client';

export const CREATE_REPORT_TEMPLATE = gql`
  mutation CreateReportTemplate($input: ReportTemplateInput!) {
    createReportTemplate(reportTemplateInput: $input) {
      id
      reportTemplateName
      reportConfig
      reportType
      createdAt
      userId
    }
  }
`;

export const UPDATE_REPORT_TEMPLATE = gql`
  mutation UpdateReportTemplate(
    $reportTemplateId: UUID!
    $reportConfig: JSON!
    $reportTemplateName: String!
  ) {
    updateReportTemplate(
      reportTemplateId: $reportTemplateId
      reportConfig: $reportConfig
      reportTemplateName: $reportTemplateName
    ) {
      id
      reportTemplateName
      reportConfig
      reportType
      createdAt
      userId
    }
  }
`;

export const DELETE_REPORT_TEMPLATE = gql`
  mutation DeleteReportTemplate($templateId: UUID!) {
    deleteReportTemplate(templateId: $templateId)
  }
`;

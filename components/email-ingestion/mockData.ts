/**
 * Mock Data for Email Ingestion
 */

import type { MockEmail } from './types';

export const initialEmails: MockEmail[] = [
  {
    id: 'E-001',
    sender: 'Marcus Chen',
    recipient: 'Sarah Johnson',
    subject: 'RE: Downtown Plaza - Updated Lighting Quote Request',
    preview: 'Hi Team, Thanks for the initial quote on the lighting package. After reviewing with our electrical contractor, we\'d like to request some modifications to the scope. Can you please revise to include an additional 20 LED fixtures for the lobby area? We\'ll need this by end of week to stay on schedule. Also attached is our latest purchase order template for your reference.',
    date: '2025-11-23T09:15:00',
    status: 'Needs Attention',
    documentTypes: ['Quote', 'Order'],
    connections: {
      contacts: ['Marcus Chen'],
      companies: ['Turner Construction'],
      jobs: ['Downtown Plaza Renovation']
    },
    suggestedTasks: [
      'Revise lighting quote for Downtown Plaza - add 20 LED fixtures',
      'Review purchase order template from Turner',
      'Follow up with quote by end of week'
    ]
  },
  {
    id: 'E-002',
    sender: 'David Miller',
    recipient: 'Emily Roberts',
    subject: 'Payment Confirmation - Invoice #10245',
    preview: 'Dear FlowConnect Team, This email confirms that we have processed payment for Invoice #10245 dated November 15, 2025 in the amount of $45,230.00. The check (#8847) was mailed today via USPS priority mail and should arrive within 2-3 business days. Please update your records accordingly. Let us know if you need any additional documentation.',
    date: '2025-11-22T14:30:00',
    status: 'Needs Attention',
    documentTypes: ['Invoice', 'Check'],
    connections: {
      companies: ['Miller Electric'],
      jobs: ['Riverside Medical Center']
    },
    suggestedTasks: [
      'Record check payment #8847 for $45,230.00',
      'Update invoice #10245 status to paid',
      'Watch for check arrival in 2-3 days'
    ]
  },
  {
    id: 'E-003',
    sender: 'Sarah Johnson',
    recipient: 'Marcus Chen',
    subject: 'New Project Opportunity - University Science Building',
    preview: 'Hello, We\'re currently in the design phase for a new 4-story science building at State University and wanted to reach out about lighting controls for the facility. The project is approximately 85,000 sq ft with labs, classrooms, and office space. Budget is around $200k for the lighting control system. Are you available for a call next week to discuss our needs and timeline?',
    date: '2025-11-22T11:00:00',
    status: 'Needs Attention',
    documentTypes: [],
    connections: {
      contacts: ['Sarah Johnson'],
      companies: ['Smith & Associates']
    },
    suggestedTasks: [
      'Create pre-opportunity for University Science Building',
      'Schedule call with Sarah Johnson',
      'Prepare lighting controls proposal for 85,000 sq ft facility'
    ]
  },
  {
    id: 'E-004',
    sender: 'James Wilson',
    recipient: 'Sarah Johnson',
    subject: 'Purchase Order #JCI-2025-1847',
    preview: 'Please find attached Purchase Order #JCI-2025-1847 for the Seattle Convention Center project. This PO covers the lighting fixtures and controls as outlined in quote Q-2025-442. Total amount: $127,500.00. Net 30 terms. Please confirm receipt and expected delivery date. Our project manager will reach out separately regarding the installation schedule.',
    date: '2025-11-21T16:45:00',
    status: 'Processed',
    documentTypes: ['Order'],
    connections: {
      companies: ['Johnson Controls'],
      jobs: ['Seattle Convention Center']
    },
    suggestedTasks: []
  },
  {
    id: 'E-005',
    sender: 'John Williams',
    recipient: 'David Torres',
    subject: 'Technical Question - Control Panel Configuration',
    preview: 'Hi Support Team, We\'re installing the control panels on the Denver Education Center project and have a question about the configuration. The spec calls for integration with the existing BMS system, but we\'re not seeing the communication protocol options in the manual. Can you provide guidance on how to configure the Modbus connection? Site team needs this resolved ASAP.',
    date: '2025-11-21T10:20:00',
    status: 'Processed',
    documentTypes: [],
    connections: {
      contacts: ['John Williams'],
      companies: ['Hensel Phelps'],
      jobs: ['Denver Education Center']
    },
    suggestedTasks: []
  },
  {
    id: 'E-006',
    sender: 'Robert Martinez',
    recipient: 'Emily Roberts',
    subject: 'Invoice Dispute - Project #SE-8472',
    preview: 'Attention Billing Department, We received invoice #INV-2025-0892 but there appears to be a discrepancy with the quantities billed. Our records show we ordered 45 units of the LED-200 series, but the invoice shows 55 units. Can you please review and send a corrected invoice? We want to process payment but need this resolved first. I\'ve attached our original PO for reference.',
    date: '2025-11-20T13:15:00',
    status: 'Needs Attention',
    documentTypes: ['Invoice', 'Order'],
    connections: {
      companies: ['Summit Electric']
    },
    suggestedTasks: [
      'Review invoice #INV-2025-0892 quantity discrepancy',
      'Compare against original PO from Summit Electric',
      'Issue corrected invoice if needed'
    ]
  },
  {
    id: 'E-007',
    sender: 'Jennifer Lee',
    recipient: 'Marcus Chen',
    subject: 'RFQ - Phoenix Healthcare Campus',
    preview: 'Good morning, McCarthy Building is requesting quotes for the Phoenix Healthcare Campus project. We need pricing for lighting controls across three buildings totaling 220,000 sq ft. Bid due date is December 5, 2025. Plans and specifications are available via the project portal (link below). Please confirm you\'ll be submitting a quote. This is a design-build project with an estimated construction start of March 2026.',
    date: '2025-11-20T08:30:00',
    status: 'Needs Attention',
    documentTypes: ['Quote'],
    connections: {
      companies: ['McCarthy Building']
    },
    suggestedTasks: [
      'Create pre-opportunity for Phoenix Healthcare Campus',
      'Download plans and specifications',
      'Prepare quote - due December 5, 2025',
      'Confirm bid submission to McCarthy Building'
    ]
  },
  {
    id: 'E-008',
    sender: 'David Chen',
    recipient: 'Sarah Johnson',
    subject: 'Change Order Request - Oakland Multi-family Project',
    preview: 'Hi team, we need to submit a change order for the Oakland Multi-family project. Owner has requested to upgrade from standard to premium lighting controls in units on floors 4-8. That\'s 48 units total. Can you provide pricing for the upgrade? We need this within 48 hours to submit to the owner. Current contract value is $89,000. Let me know if you need any additional details.',
    date: '2025-11-19T15:45:00',
    status: 'Processed',
    documentTypes: ['Quote'],
    connections: {
      contacts: ['David Chen'],
      companies: ['Bay Area Electric'],
      jobs: ['Oakland Multi-family']
    },
    suggestedTasks: []
  }
];

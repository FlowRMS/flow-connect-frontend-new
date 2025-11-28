/**
 * Report Scheduler State Hook
 * Manages all state and state-related logic for the Report Scheduler
 */

import { useState } from 'react';
import type { Report, TabType } from '../types';
import { mockReports } from '../mockData';

export function useReportSchedulerState() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('reports');

  // Reports state
  const [reports, setReports] = useState<Report[]>(mockReports);

  // Form state
  const [reportName, setReportName] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [selectedScope, setSelectedScope] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState('');
  const [filterCompanies, setFilterCompanies] = useState('');
  const [filterContacts, setFilterContacts] = useState('');
  const [emailRecipients, setEmailRecipients] = useState('');

  // Preview state
  const [previewReport, setPreviewReport] = useState<Report | null>(null);

  // Helper: Toggle report type selection
  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  // Helper: Load report for editing
  const loadReportForEditing = (report: Report) => {
    setReportName(report.name);
    setSelectedTypes(report.types);
    setSelectedDateFilter(report.dateFilter);
    setSelectedScope(report.assignedTo);
    setSelectedFrequency(report.frequency);
    setFilterCompanies(report.additionalFilters?.companies?.join(', ') || '');
    setFilterContacts(report.additionalFilters?.contacts?.join(', ') || '');
    setEmailRecipients(report.recipients.join(', '));
    setActiveTab('create');
  };

  // Helper: Toggle report enabled status
  const toggleReportEnabled = (reportId: string) => {
    const updatedReports = reports.map((r) =>
      r.id === reportId ? { ...r, enabled: !r.enabled } : r
    );
    setReports(updatedReports);
  };

  // Helper: Reset form
  const resetForm = () => {
    setReportName('');
    setSelectedTypes([]);
    setSelectedDateFilter('');
    setSelectedScope('');
    setSelectedFrequency('');
    setFilterCompanies('');
    setFilterContacts('');
    setEmailRecipients('');
  };

  return {
    // Tab state
    activeTab,
    setActiveTab,

    // Reports state
    reports,
    setReports,

    // Form state
    reportName,
    setReportName,
    selectedTypes,
    setSelectedTypes,
    selectedDateFilter,
    setSelectedDateFilter,
    selectedScope,
    setSelectedScope,
    selectedFrequency,
    setSelectedFrequency,
    filterCompanies,
    setFilterCompanies,
    filterContacts,
    setFilterContacts,
    emailRecipients,
    setEmailRecipients,

    // Preview state
    previewReport,
    setPreviewReport,

    // Helper functions
    toggleType,
    loadReportForEditing,
    toggleReportEnabled,
    resetForm,
  };
}

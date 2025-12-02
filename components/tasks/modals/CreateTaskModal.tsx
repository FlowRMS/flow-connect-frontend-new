/**
 * Create Task Modal Component
 * Modal for creating new tasks with title, description, priority, status, and entity relations
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  useCreateCRMTask, 
  useAddCRMTaskRelation,
  useCRMJobLandingPages,
  useCRMContactLandingPages,
  useCRMCompanyLandingPages
} from '../../hooks/useCRMApi';
import { taskToasts } from '../../lib/toast';
import { AVAILABLE_TAGS, API_PRIORITY_OPTIONS, API_STATUS_OPTIONS } from '../constants';
import type { TaskPriorityAPI, TaskStatusAPI } from '../types';
import type { SelectedRelation } from '../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTaskModal({ isOpen, onClose, onSuccess }: CreateTaskModalProps) {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatusAPI>('TODO');
  const [priority, setPriority] = useState<TaskPriorityAPI>('NORMAL');
  const [dueDate, setDueDate] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  
  // Relations state
  const [selectedJobs, setSelectedJobs] = useState<SelectedRelation[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<SelectedRelation[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<SelectedRelation[]>([]);
  
  // Search state
  const [jobSearch, setJobSearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  // Dropdown refs for portal positioning
  const jobInputRef = useRef<HTMLInputElement>(null);
  const contactInputRef = useRef<HTMLInputElement>(null);
  const companyInputRef = useRef<HTMLInputElement>(null);
  const jobDropdownRef = useRef<HTMLDivElement>(null);
  const contactDropdownRef = useRef<HTMLDivElement>(null);
  const companyDropdownRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Fetch entities for selection - using landing pages endpoints
  // These are cached by React Query and only fetch when modal is open
  const { data: jobs = [], isLoading: isLoadingJobs } = useCRMJobLandingPages();
  const { data: contacts = [], isLoading: isLoadingContacts } = useCRMContactLandingPages();
  const { data: companies = [], isLoading: isLoadingCompanies } = useCRMCompanyLandingPages();

  // Mutations
  const createMutation = useCreateCRMTask();
  const addRelationMutation = useAddCRMTaskRelation();

  // Mount check for portal
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      
      if (jobInputRef.current && !jobInputRef.current.contains(target) && 
          jobDropdownRef.current && !jobDropdownRef.current.contains(target)) {
        setShowJobDropdown(false);
      }
      if (contactInputRef.current && !contactInputRef.current.contains(target) && 
          contactDropdownRef.current && !contactDropdownRef.current.contains(target)) {
        setShowContactDropdown(false);
      }
      if (companyInputRef.current && !companyInputRef.current.contains(target) && 
          companyDropdownRef.current && !companyDropdownRef.current.contains(target)) {
        setShowCompanyDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // Filter jobs based on search
  const filteredJobs = jobs.filter(job => 
    job.jobName?.toLowerCase().includes(jobSearch.toLowerCase()) &&
    !selectedJobs.find(s => s.id === job.id)
  );

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact => {
    const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.toLowerCase();
    return fullName.includes(contactSearch.toLowerCase()) &&
      !selectedContacts.find(s => s.id === contact.id);
  });

  // Filter companies based on search
  const filteredCompanies = companies.filter(company => 
    company.name?.toLowerCase().includes(companySearch.toLowerCase()) &&
    !selectedCompanies.find(s => s.id === company.id)
  );

  const handleAddTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags([...selectedTags, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleSelectJob = (job: { id: string; jobName?: string | null }) => {
    setSelectedJobs([...selectedJobs, { id: job.id, name: job.jobName || 'Unnamed Job', type: 'job' }]);
    setJobSearch('');
    setShowJobDropdown(false);
  };

  const handleSelectContact = (contact: { id: string; firstName?: string | null; lastName?: string | null }) => {
    setSelectedContacts([...selectedContacts, { 
      id: contact.id, 
      name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unnamed Contact', 
      type: 'contact' 
    }]);
    setContactSearch('');
    setShowContactDropdown(false);
  };

  const handleSelectCompany = (company: { id: string; name?: string | null }) => {
    setSelectedCompanies([...selectedCompanies, { id: company.id, name: company.name || 'Unnamed Company', type: 'company' }]);
    setCompanySearch('');
    setShowCompanyDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    try {
      // Create the task
      const task = await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        dueDate: dueDate || undefined,
        tags: selectedTags.join(','),
      });

      // Create relations for jobs
      for (const job of selectedJobs) {
        await addRelationMutation.mutateAsync({
          taskId: task.id,
          relatedType: 'JOB',
          relatedId: job.id,
        });
      }

      // Create relations for contacts
      for (const contact of selectedContacts) {
        await addRelationMutation.mutateAsync({
          taskId: task.id,
          relatedType: 'CONTACT',
          relatedId: contact.id,
        });
      }

      // Create relations for companies
      for (const company of selectedCompanies) {
        await addRelationMutation.mutateAsync({
          taskId: task.id,
          relatedType: 'COMPANY',
          relatedId: company.id,
        });
      }

      taskToasts.createSuccess(title);
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
      taskToasts.createError(error instanceof Error ? error.message : undefined);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatus('TODO');
    setPriority('NORMAL');
    setDueDate('');
    setSelectedTags([]);
    setSelectedJobs([]);
    setSelectedContacts([]);
    setSelectedCompanies([]);
    setCustomTag('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isPending = createMutation.isPending || addRelationMutation.isPending;

  const labelClass = "flex items-center gap-2 text-sm font-medium text-gray-700 mb-2";
  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400";
  const selectClass = "w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

  // Priority display names
  const priorityLabels: Record<TaskPriorityAPI, string> = {
    'LOW': 'Low',
    'NORMAL': 'Normal',
    'URGENT': 'Urgent',
    'CRITICAL': 'Critical'
  };

  // Status display names
  const statusLabels: Record<TaskStatusAPI, string> = {
    'TODO': 'To Do',
    'IN_PROGRESS': 'In Progress',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Create New Task</h2>
                <p className="text-sm text-gray-500">Add a new task to track your work</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {/* Task Details Section */}
            <div className="bg-gray-50 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Task Details
              </h3>

              {/* Title */}
              <div>
                <label className={labelClass}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                  placeholder="Enter task title..."
                />
              </div>

              {/* Description */}
              <div>
                <label className={labelClass}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className={`${inputClass} resize-none`}
                  placeholder="Describe the task..."
                />
              </div>

              {/* Status and Priority Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatusAPI)}
                    className={selectClass}
                  >
                    {API_STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{statusLabels[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriorityAPI)}
                    className={selectClass}
                  >
                    {API_PRIORITY_OPTIONS.map(p => (
                      <option key={p} value={p}>{priorityLabels[p]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className={labelClass}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Relations Section */}
            <div className="bg-gray-50 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Link to Entities
              </h3>

              {/* Jobs */}
              <div className="relative">
                <label className={labelClass}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Jobs
                </label>
                {selectedJobs.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedJobs.map(job => (
                      <span
                        key={job.id}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-2"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {job.name}
                        <button
                          type="button"
                          onClick={() => setSelectedJobs(selectedJobs.filter(j => j.id !== job.id))}
                          className="hover:text-green-900"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  ref={jobInputRef}
                  type="text"
                  value={jobSearch}
                  onChange={(e) => {
                    setJobSearch(e.target.value);
                    setShowJobDropdown(true);
                  }}
                  onFocus={() => setShowJobDropdown(true)}
                  className={inputClass}
                  placeholder={isLoadingJobs ? "Loading jobs..." : selectedJobs.length > 0 ? "Add more jobs..." : "Search jobs..."}
                  disabled={isLoadingJobs}
                />
                {showJobDropdown && isMounted && createPortal(
                  <div 
                    ref={jobDropdownRef}
                    style={{
                      position: 'fixed',
                      top: jobInputRef.current ? jobInputRef.current.getBoundingClientRect().bottom + 4 : 0,
                      left: jobInputRef.current ? jobInputRef.current.getBoundingClientRect().left : 0,
                      width: jobInputRef.current ? jobInputRef.current.offsetWidth : 'auto',
                      zIndex: 9999,
                    }}
                    className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                  >
                    {isLoadingJobs ? (
                      <div className="px-4 py-6 text-center">
                        <svg className="animate-spin w-5 h-5 text-green-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        <p className="text-sm text-gray-500">Loading jobs...</p>
                      </div>
                    ) : filteredJobs.length > 0 ? (
                      filteredJobs.slice(0, 10).map(job => (
                        <button
                          key={job.id}
                          type="button"
                          onClick={() => handleSelectJob(job)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{job.jobName}</p>
                            {job.jobType && <p className="text-xs text-gray-500 truncate">{job.jobType}</p>}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-sm text-gray-500">
                        {jobSearch ? 'No jobs found' : 'No jobs available'}
                      </div>
                    )}
                  </div>,
                  document.body
                )}
              </div>

              {/* Contacts */}
              <div className="relative">
                <label className={labelClass}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Contacts
                </label>
                {selectedContacts.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedContacts.map(contact => (
                      <span
                        key={contact.id}
                        className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm flex items-center gap-2"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {contact.name}
                        <button
                          type="button"
                          onClick={() => setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id))}
                          className="hover:text-orange-900"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  ref={contactInputRef}
                  type="text"
                  value={contactSearch}
                  onChange={(e) => {
                    setContactSearch(e.target.value);
                    setShowContactDropdown(true);
                  }}
                  onFocus={() => setShowContactDropdown(true)}
                  className={inputClass}
                  placeholder={isLoadingContacts ? "Loading contacts..." : selectedContacts.length > 0 ? "Add more contacts..." : "Search contacts..."}
                  disabled={isLoadingContacts}
                />
                {showContactDropdown && isMounted && createPortal(
                  <div 
                    ref={contactDropdownRef}
                    style={{
                      position: 'fixed',
                      top: contactInputRef.current ? contactInputRef.current.getBoundingClientRect().bottom + 4 : 0,
                      left: contactInputRef.current ? contactInputRef.current.getBoundingClientRect().left : 0,
                      width: contactInputRef.current ? contactInputRef.current.offsetWidth : 'auto',
                      zIndex: 9999,
                    }}
                    className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                  >
                    {isLoadingContacts ? (
                      <div className="px-4 py-6 text-center">
                        <svg className="animate-spin w-5 h-5 text-orange-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        <p className="text-sm text-gray-500">Loading contacts...</p>
                      </div>
                    ) : filteredContacts.length > 0 ? (
                      filteredContacts.slice(0, 10).map(contact => (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => handleSelectContact(contact)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-orange-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{contact.firstName} {contact.lastName}</p>
                            {contact.email && <p className="text-xs text-gray-500 truncate">{contact.email}</p>}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-sm text-gray-500">
                        {contactSearch ? 'No contacts found' : 'No contacts available'}
                      </div>
                    )}
                  </div>,
                  document.body
                )}
              </div>

              {/* Companies */}
              <div className="relative">
                <label className={labelClass}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Companies
                </label>
                {selectedCompanies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedCompanies.map(company => (
                      <span
                        key={company.id}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-2"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {company.name}
                        <button
                          type="button"
                          onClick={() => setSelectedCompanies(selectedCompanies.filter(c => c.id !== company.id))}
                          className="hover:text-indigo-900"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  ref={companyInputRef}
                  type="text"
                  value={companySearch}
                  onChange={(e) => {
                    setCompanySearch(e.target.value);
                    setShowCompanyDropdown(true);
                  }}
                  onFocus={() => setShowCompanyDropdown(true)}
                  className={inputClass}
                  placeholder={isLoadingCompanies ? "Loading companies..." : selectedCompanies.length > 0 ? "Add more companies..." : "Search companies..."}
                  disabled={isLoadingCompanies}
                />
                {showCompanyDropdown && isMounted && createPortal(
                  <div 
                    ref={companyDropdownRef}
                    style={{
                      position: 'fixed',
                      top: companyInputRef.current ? companyInputRef.current.getBoundingClientRect().bottom + 4 : 0,
                      left: companyInputRef.current ? companyInputRef.current.getBoundingClientRect().left : 0,
                      width: companyInputRef.current ? companyInputRef.current.offsetWidth : 'auto',
                      zIndex: 9999,
                    }}
                    className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                  >
                    {isLoadingCompanies ? (
                      <div className="px-4 py-6 text-center">
                        <svg className="animate-spin w-5 h-5 text-indigo-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        <p className="text-sm text-gray-500">Loading companies...</p>
                      </div>
                    ) : filteredCompanies.length > 0 ? (
                      filteredCompanies.slice(0, 10).map(company => (
                        <button
                          key={company.id}
                          type="button"
                          onClick={() => handleSelectCompany(company)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-indigo-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{company.name}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-sm text-gray-500">
                        {companySearch ? 'No companies found' : 'No companies available'}
                      </div>
                    )}
                  </div>,
                  document.body
                )}
              </div>
            </div>

            {/* Tags Section */}
            <div className="bg-gray-50 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Tags
              </h3>

              {/* Selected Tags */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-blue-900"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Available Tags */}
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.filter(tag => !selectedTags.includes(tag)).slice(0, 12).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>

              {/* Custom Tag Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTag();
                    }
                  }}
                  className={`flex-1 ${inputClass}`}
                  placeholder="Add custom tag..."
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  disabled={!customTag.trim()}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="text-sm text-gray-500">
              <span className="text-red-500">*</span> Required fields
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !title.trim()}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Task
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

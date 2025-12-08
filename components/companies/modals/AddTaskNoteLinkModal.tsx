/**
 * Add Task/Note Link Modal Component for Companies
 * Allows users to link Task or Note entities to a Company
 * Uses server-side search for real-time filtering
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useCreateCRMLink } from '../../hooks/useCRMApi';
import { useTaskSearch, type TaskSearchResult } from '../../notes/api';
import { useNoteSearch, type NoteSearchResult } from '../../tasks/api';
import type { CRMEntityType } from '../../lib/crm-graphql';
import { linkToasts } from '../../lib/toast';

// Linkable entity types
type LinkEntityType = 'TASK' | 'NOTE';

// Entity type configuration for display
const ENTITY_TYPE_CONFIG: Record<LinkEntityType, { label: string; plural: string; color: string; icon: React.ReactNode }> = {
  TASK: {
    label: 'Task',
    plural: 'Tasks',
    color: 'bg-orange-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  NOTE: {
    label: 'Note',
    plural: 'Notes',
    color: 'bg-yellow-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
};

const ALL_ENTITY_TYPES: LinkEntityType[] = ['TASK', 'NOTE'];

interface AddTaskNoteLinkModalProps {
  isOpen: boolean;
  entityId: string;
  entityType: 'CONTACT' | 'COMPANY';
  initialLinkType?: LinkEntityType;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTaskNoteLinkModal({ 
  isOpen, 
  entityId, 
  entityType,
  initialLinkType = 'TASK', 
  onClose, 
  onSuccess 
}: AddTaskNoteLinkModalProps) {
  const [linkType, setLinkType] = useState<LinkEntityType>(initialLinkType);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Reset state when modal opens with a new initialLinkType
  useEffect(() => {
    if (isOpen) {
      setLinkType(initialLinkType);
      setSelectedEntityId('');
      setSearchTerm('');
    }
  }, [isOpen, initialLinkType]);

  // Search-based entity fetching - pass searchTerm to trigger API searches on typing
  const { data: tasks = [], isLoading: tasksLoading } = useTaskSearch(searchTerm, isOpen);
  const { data: notes = [], isLoading: notesLoading } = useNoteSearch(searchTerm, isOpen);

  // Create link mutation
  const createLinkMutation = useCreateCRMLink();

  // Get display info for an entity
  const getEntityDisplay = (entity: TaskSearchResult | NoteSearchResult, type: LinkEntityType): { name: string; subtitle: string } => {
    switch (type) {
      case 'TASK': {
        const taskEntity = entity as TaskSearchResult;
        return { 
          name: taskEntity.title || 'Untitled Task', 
          subtitle: `${taskEntity.status || ''} - ${taskEntity.priority || ''}`.trim().replace(/^-\s*|-\s*$/g, '') 
        };
      }
      case 'NOTE': {
        const noteEntity = entity as NoteSearchResult;
        const contentPreview = noteEntity.content ? noteEntity.content.substring(0, 50) : '';
        return { 
          name: noteEntity.title || 'Untitled Note', 
          subtitle: contentPreview 
        };
      }
      default:
        return { name: entity.id, subtitle: '' };
    }
  };

  // Get entities and loading state based on current type
  const { entities, isLoading } = useMemo(() => {
    switch (linkType) {
      case 'TASK':
        return {
          entities: tasks as TaskSearchResult[],
          isLoading: tasksLoading,
        };
      case 'NOTE':
        return {
          entities: notes as NoteSearchResult[],
          isLoading: notesLoading,
        };
      default:
        return { entities: [], isLoading: false };
    }
  }, [linkType, tasks, tasksLoading, notes, notesLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEntityId) return;

    const runSubmit = async () => {
      try {
        await createLinkMutation.mutateAsync({
          sourceEntityType: entityType as CRMEntityType,
          sourceEntityId: entityId,
          targetEntityType: linkType as CRMEntityType,
          targetEntityId: selectedEntityId,
        });
        
        // Show success toast
        const config = ENTITY_TYPE_CONFIG[linkType];
        linkToasts.createSuccess(config.label);
        
        // Reset and close
        setSelectedEntityId('');
        setSearchTerm('');
        onSuccess();
        onClose();
      } catch (error: any) {
        console.error('Failed to create link:', error);
        
        // Check if it's a "link already exists" error
        const errorMessage = error?.message || '';
        const config = ENTITY_TYPE_CONFIG[linkType];
        
        if (errorMessage.includes('Link already exists') || errorMessage.includes('already exists')) {
          linkToasts.alreadyExists(config.label);
        } else {
          linkToasts.createError(errorMessage || undefined);
        }
      }
    };

    void runSubmit();
  };

  const handleLinkTypeChange = (type: LinkEntityType) => {
    setLinkType(type);
    setSelectedEntityId('');
    setSearchTerm('');
  };

  if (!isOpen) return null;

  const safeLinkType = ALL_ENTITY_TYPES.includes(linkType) ? linkType : 'TASK';
  const config = ENTITY_TYPE_CONFIG[safeLinkType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Link Entity</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Entity Type Tabs */}
        <div className="flex border-b border-gray-200 px-4">
          {ALL_ENTITY_TYPES.map((type) => {
            const typeConfig = ENTITY_TYPE_CONFIG[type];
            const colorClass = typeConfig.color;
            return (
              <button
                key={type}
                onClick={() => { handleLinkTypeChange(type); }}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors
                  ${linkType === type 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center text-white ${colorClass}`}>
                  {typeConfig.icon}
                </div>
                {typeConfig.plural}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <form onSubmit={(e) => { handleSubmit(e); }} className="flex-1 overflow-hidden flex flex-col">
          <div className="p-6 flex-1 overflow-y-auto">
            {/* Search Input */}
            <div className="mb-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={`Search ${config.plural.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Entity List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading...
                </div>
              ) : entities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No {config.plural.toLowerCase()} found</p>
                </div>
              ) : (
                entities.map((entity) => {
                  const display = getEntityDisplay(entity, linkType);
                  const isSelected = selectedEntityId === entity.id;
                  
                  return (
                    <button
                      key={entity.id}
                      type="button"
                      onClick={() => { setSelectedEntityId(entity.id); }}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all
                        ${isSelected 
                          ? 'bg-blue-50 border-2 border-blue-500' 
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }
                      `}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 ${config.color}`}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                          {display.name}
                        </p>
                        {display.subtitle && (
                          <p className="text-xs text-gray-500 truncate">{display.subtitle}</p>
                        )}
                      </div>
                      {isSelected && (
                        <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedEntityId || createLinkMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createLinkMutation.isPending ? 'Linking...' : `Link ${config.label}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

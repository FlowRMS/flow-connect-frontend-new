'use client';

import React, { useState, useRef } from 'react';
import { useSidebarConfig, NavGroupConfig, NavItemConfig } from '@/contexts/SidebarConfigContext';

interface DragState {
  type: 'group' | 'item';
  groupId: string;
  itemId?: string;
  sourceIndex: number;
}

export default function SidebarSettings() {
  const { config, updateConfig, toggleItem, moveGroup, moveItem, resetToDefault } = useSidebarConfig();
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragOverState, setDragOverState] = useState<{ groupId: string; itemIndex?: number } | null>(null);
  const [saved, setSaved] = useState(false);

  const handleDragStartGroup = (e: React.DragEvent, groupId: string, index: number) => {
    setDragState({ type: 'group', groupId, sourceIndex: index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragStartItem = (e: React.DragEvent, groupId: string, itemId: string, index: number) => {
    e.stopPropagation();
    setDragState({ type: 'item', groupId, itemId, sourceIndex: index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragOverGroup = (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    if (dragState?.type === 'group') {
      setDragOverState({ groupId });
    }
  };

  const handleDragOverItem = (e: React.DragEvent, groupId: string, itemIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragState?.type === 'item') {
      setDragOverState({ groupId, itemIndex });
    }
  };

  const handleDropGroup = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (dragState?.type === 'group' && dragState.sourceIndex !== targetIndex) {
      moveGroup(dragState.sourceIndex, targetIndex);
    }
    setDragState(null);
    setDragOverState(null);
  };

  const handleDropItem = (e: React.DragEvent, targetGroupId: string, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragState?.type === 'item' && dragState.itemId) {
      moveItem(dragState.groupId, dragState.sourceIndex, targetGroupId, targetIndex);
    }
    setDragState(null);
    setDragOverState(null);
  };

  const handleDragEnd = () => {
    setDragState(null);
    setDragOverState(null);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the sidebar to its default configuration?')) {
      resetToDefault();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Sidebar Configuration</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Drag and drop to reorder groups and items. Toggle items on or off to customize your sidebar.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
        >
          Reset to Default
        </button>
      </div>

      <div className="space-y-4">
        {config.groups.map((group, groupIndex) => (
          <div
            key={group.id}
            draggable
            onDragStart={(e) => handleDragStartGroup(e, group.id, groupIndex)}
            onDragOver={(e) => handleDragOverGroup(e, group.id)}
            onDrop={(e) => handleDropGroup(e, groupIndex)}
            onDragEnd={handleDragEnd}
            className={`border rounded-lg transition-all ${
              dragOverState?.groupId === group.id && dragState?.type === 'group'
                ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                : 'border-[var(--border)]'
            } ${dragState?.groupId === group.id && dragState?.type === 'group' ? 'opacity-50' : ''}`}
          >
            {/* Group Header */}
            <div className="flex items-center gap-3 p-4 bg-[var(--muted)]/30 border-b border-[var(--border)] cursor-grab active:cursor-grabbing">
              <div className="text-[var(--muted-foreground)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="font-bold text-[var(--foreground)] uppercase tracking-wider text-sm flex-1">
                {group.label}
              </span>
              <span className="text-xs text-[var(--muted-foreground)]">
                {group.items.filter(i => i.enabled).length}/{group.items.length} visible
              </span>
            </div>

            {/* Items */}
            <div className="p-2">
              {group.items.map((item, itemIndex) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStartItem(e, group.id, item.id, itemIndex)}
                  onDragOver={(e) => handleDragOverItem(e, group.id, itemIndex)}
                  onDrop={(e) => handleDropItem(e, group.id, itemIndex)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    dragOverState?.groupId === group.id && dragOverState?.itemIndex === itemIndex && dragState?.type === 'item'
                      ? 'bg-[var(--primary)]/10 border-2 border-dashed border-[var(--primary)]'
                      : 'hover:bg-[var(--muted)]/50'
                  } ${dragState?.itemId === item.id ? 'opacity-50' : ''} ${!item.enabled ? 'opacity-60' : ''}`}
                >
                  {/* Drag Handle */}
                  <div className="text-[var(--muted-foreground)] cursor-grab active:cursor-grabbing">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01" strokeLinecap="round"/>
                    </svg>
                  </div>

                  {/* Item Name */}
                  <span className={`flex-1 text-sm ${item.enabled ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>
                    {item.name}
                  </span>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={() => toggleItem(group.id, item.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary)]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                  </label>
                </div>
              ))}

              {/* Drop zone at end of items */}
              {dragState?.type === 'item' && dragState.groupId !== group.id && (
                <div
                  onDragOver={(e) => handleDragOverItem(e, group.id, group.items.length)}
                  onDrop={(e) => handleDropItem(e, group.id, group.items.length)}
                  className="p-3 mt-1 border-2 border-dashed border-[var(--border)] rounded-lg text-center text-sm text-[var(--muted-foreground)]"
                >
                  Drop here to add to {group.label}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-900">Tips</h4>
            <ul className="text-sm text-blue-700 mt-1 list-disc list-inside space-y-1">
              <li>Drag groups by their header to reorder entire sections</li>
              <li>Drag individual items between groups to reorganize</li>
              <li>Toggle the switch to show or hide items in the sidebar</li>
              <li>Changes are saved automatically</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

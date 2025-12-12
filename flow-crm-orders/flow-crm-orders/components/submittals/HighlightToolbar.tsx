'use client';

import React from 'react';
import type { HighlightShape } from '../../lib/types/submittals';

export interface HighlightToolbarProps {
  activeTool: HighlightShape | 'select';
  onToolChange: (tool: HighlightShape | 'select') => void;
  activeColor: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClearAll: () => void;
}

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#FFEB3B' },
  { name: 'Pink', value: '#F48FB1' },
  { name: 'Green', value: '#A5D6A7' },
  { name: 'Blue', value: '#90CAF9' },
  { name: 'Orange', value: '#FFCC80' },
  { name: 'Red', value: '#EF5350' },
];

const STROKE_COLORS = [
  { name: 'Red', value: '#EF5350' },
  { name: 'Blue', value: '#2196F3' },
  { name: 'Green', value: '#4CAF50' },
  { name: 'Orange', value: '#FF9800' },
  { name: 'Purple', value: '#9C27B0' },
  { name: 'Black', value: '#212121' },
];

export default function HighlightToolbar({
  activeTool,
  onToolChange,
  activeColor,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearAll,
}: HighlightToolbarProps) {
  const isHighlightTool = activeTool === 'highlight';
  const colors = isHighlightTool ? HIGHLIGHT_COLORS : STROKE_COLORS;

  return (
    <div className="flex items-center gap-1 p-2 bg-[var(--card)] border-b border-[var(--border)]">
      {/* Selection Tool */}
      <ToolButton
        active={activeTool === 'select'}
        onClick={() => onToolChange('select')}
        title="Select (V)"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3l7 17 2.5-6.5L19 11 3 3z" strokeLinejoin="round"/>
        </svg>
      </ToolButton>

      <div className="w-px h-6 bg-[var(--border)] mx-1"/>

      {/* Highlighter Tool */}
      <ToolButton
        active={activeTool === 'highlight'}
        onClick={() => onToolChange('highlight')}
        title="Highlighter (H)"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 17h14M5 13l2-8h6l2 8H5z" strokeLinejoin="round"/>
          <path d="M8 5V3M12 5V3" strokeLinecap="round"/>
        </svg>
      </ToolButton>

      {/* Rectangle Tool */}
      <ToolButton
        active={activeTool === 'rectangle'}
        onClick={() => onToolChange('rectangle')}
        title="Rectangle (R)"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="14" height="12" rx="1"/>
        </svg>
      </ToolButton>

      {/* Oval Tool */}
      <ToolButton
        active={activeTool === 'oval'}
        onClick={() => onToolChange('oval')}
        title="Oval (O)"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="10" cy="10" rx="7" ry="5"/>
        </svg>
      </ToolButton>

      {/* Arrow Tool */}
      <ToolButton
        active={activeTool === 'arrow'}
        onClick={() => onToolChange('arrow')}
        title="Arrow (A)"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 16L16 4M16 4v8M16 4H8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </ToolButton>

      {/* Underline Tool */}
      <ToolButton
        active={activeTool === 'underline'}
        onClick={() => onToolChange('underline')}
        title="Underline (U)"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 3v7a5 5 0 0010 0V3M3 17h14" strokeLinecap="round"/>
        </svg>
      </ToolButton>

      {/* Text Tool */}
      <ToolButton
        active={activeTool === 'text'}
        onClick={() => onToolChange('text')}
        title="Text Box (T)"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 5h12M10 5v12M7 17h6" strokeLinecap="round"/>
        </svg>
      </ToolButton>

      <div className="w-px h-6 bg-[var(--border)] mx-1"/>

      {/* Color Picker */}
      <div className="flex items-center gap-1">
        {colors.map(color => (
          <button
            key={color.value}
            onClick={() => onColorChange(color.value)}
            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
              activeColor === color.value ? 'border-[var(--foreground)] scale-110' : 'border-transparent'
            }`}
            style={{ backgroundColor: color.value }}
            title={color.name}
          />
        ))}
      </div>

      <div className="w-px h-6 bg-[var(--border)] mx-1"/>

      {/* Stroke Width (for non-highlight tools) */}
      {activeTool !== 'highlight' && activeTool !== 'select' && (
        <>
          <div className="flex items-center gap-1">
            <span className="text-xs text-[var(--muted-foreground)]">Width:</span>
            <select
              value={strokeWidth}
              onChange={(e) => onStrokeWidthChange(parseInt(e.target.value))}
              className="px-2 py-1 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
            >
              <option value={1}>Thin</option>
              <option value={2}>Medium</option>
              <option value={3}>Thick</option>
              <option value={4}>Extra Thick</option>
            </select>
          </div>
          <div className="w-px h-6 bg-[var(--border)] mx-1"/>
        </>
      )}

      {/* Undo/Redo */}
      <ToolButton
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7h11a4 4 0 010 8H7M3 7l4-4M3 7l4 4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </ToolButton>

      <ToolButton
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Shift+Z)"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 7H6a4 4 0 000 8h7M17 7l-4-4M17 7l-4 4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </ToolButton>

      <div className="w-px h-6 bg-[var(--border)] mx-1"/>

      {/* Clear All */}
      <ToolButton
        onClick={onClearAll}
        title="Clear All"
        className="text-red-500 hover:bg-red-50"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h14M8 6V4h4v2M5 6v12a2 2 0 002 2h6a2 2 0 002-2V6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </ToolButton>
    </div>
  );
}

// Tool Button Component
function ToolButton({
  children,
  active,
  disabled,
  onClick,
  title,
  className = '',
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded transition-colors ${
        active
          ? 'bg-[var(--primary)] text-white'
          : disabled
          ? 'text-[var(--muted-foreground)] opacity-50 cursor-not-allowed'
          : `text-[var(--foreground)] hover:bg-[var(--muted)] ${className}`
      }`}
    >
      {children}
    </button>
  );
}

// Keyboard shortcuts helper
export function useHighlightKeyboardShortcuts({
  onToolChange,
  onUndo,
  onRedo,
}: {
  onToolChange: (tool: HighlightShape | 'select') => void;
  onUndo: () => void;
  onRedo: () => void;
}) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Tool shortcuts
      if (!e.ctrlKey && !e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            onToolChange('select');
            break;
          case 'h':
            onToolChange('highlight');
            break;
          case 'r':
            onToolChange('rectangle');
            break;
          case 'o':
            onToolChange('oval');
            break;
          case 'a':
            onToolChange('arrow');
            break;
          case 'u':
            onToolChange('underline');
            break;
          case 't':
            onToolChange('text');
            break;
        }
      }

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          onRedo();
        } else {
          onUndo();
        }
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToolChange, onUndo, onRedo]);
}

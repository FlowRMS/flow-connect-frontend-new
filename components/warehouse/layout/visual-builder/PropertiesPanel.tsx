'use client';

import React, { useState, useEffect } from 'react';
import type { VisualElement } from '../types';
import { LevelIcons, levelColors } from '../constants';
import { pixelsToFeet, feetToPixels } from './canvas-utils';

interface PropertiesPanelProps {
  selectedElement: VisualElement | null;
  onUpdate: (id: string, updates: Partial<VisualElement>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function PropertiesPanel({ selectedElement, onUpdate, onDelete, onClose }: PropertiesPanelProps) {
  const [name, setName] = useState('');
  const [widthFeet, setWidthFeet] = useState(0);
  const [heightFeet, setHeightFeet] = useState(0);
  const [xPos, setXPos] = useState(0);
  const [yPos, setYPos] = useState(0);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (selectedElement) {
      setName(selectedElement.name);
      setWidthFeet(pixelsToFeet(selectedElement.width));
      setHeightFeet(pixelsToFeet(selectedElement.height));
      setXPos(Math.round(selectedElement.x));
      setYPos(Math.round(selectedElement.y));
      setRotation(selectedElement.rotation || 0);
    }
  }, [selectedElement]);

  if (!selectedElement) return null;

  const colors = levelColors[selectedElement.type];

  const handleUpdate = () => {
    onUpdate(selectedElement.id, {
      name,
      width: feetToPixels(widthFeet),
      height: feetToPixels(heightFeet),
      x: xPos,
      y: yPos,
      rotation,
    });
  };

  return (
    <div className="absolute left-4 bottom-4 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div className={`px-3 py-2 border-b border-[var(--border)] ${colors.bg} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className={colors.text}>{LevelIcons[selectedElement.type]}</span>
          <span className="text-xs font-semibold text-[var(--foreground)]">Properties</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Properties Form */}
      <div className="p-3 space-y-3">
        {/* Name */}
        <div>
          <label className="block text-[10px] font-medium text-[var(--muted-foreground)] mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleUpdate}
            className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-medium text-[var(--muted-foreground)] mb-1">Width (ft)</label>
            <input
              type="number"
              value={widthFeet}
              onChange={(e) => setWidthFeet(Number(e.target.value))}
              onFocus={(e) => e.target.select()}
              onBlur={handleUpdate}
              min={1}
              className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-[var(--muted-foreground)] mb-1">Height (ft)</label>
            <input
              type="number"
              value={heightFeet}
              onChange={(e) => setHeightFeet(Number(e.target.value))}
              onFocus={(e) => e.target.select()}
              onBlur={handleUpdate}
              min={1}
              className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        {/* Position */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-medium text-[var(--muted-foreground)] mb-1">X Position</label>
            <input
              type="number"
              value={xPos}
              onChange={(e) => setXPos(Number(e.target.value))}
              onFocus={(e) => e.target.select()}
              onBlur={handleUpdate}
              className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-[var(--muted-foreground)] mb-1">Y Position</label>
            <input
              type="number"
              value={yPos}
              onChange={(e) => setYPos(Number(e.target.value))}
              onFocus={(e) => e.target.select()}
              onBlur={handleUpdate}
              className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        {/* Rotation */}
        <div>
          <label className="block text-[10px] font-medium text-[var(--muted-foreground)] mb-1">
            Rotation ({rotation}°)
          </label>
          <input
            type="range"
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            onMouseUp={handleUpdate}
            min={0}
            max={360}
            className="w-full"
          />
        </div>

        {/* Delete Button */}
        <button
          onClick={() => {
            onDelete(selectedElement.id);
            onClose();
          }}
          className="w-full px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
        >
          Delete Element
        </button>
      </div>
    </div>
  );
}

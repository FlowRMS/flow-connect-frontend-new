"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Calendar, ChevronDown } from "lucide-react";

export const DATE_FORMATS = {
  DEFAULT: "default",
  MM_YYYY: "mm-yyyy", 
  YYYY: "yyyy",
  QUARTER: "quarter"
};

export const DATE_FORMAT_LABELS = {
  [DATE_FORMATS.DEFAULT]: "Default (MM/DD/YYYY)",
  [DATE_FORMATS.MM_YYYY]: "MM-YYYY",
  [DATE_FORMATS.YYYY]: "YYYY",
  [DATE_FORMATS.QUARTER]: "Quarter (Q1 YYYY)"
};

export function formatDateByType(value, formatType) {
  if (!value) return "N/A";
  
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  switch (formatType) {
    case DATE_FORMATS.MM_YYYY:
      return date.toLocaleDateString('en-US', { 
        month: '2-digit', 
        year: 'numeric' 
      }).replace('/', '-');
      
    case DATE_FORMATS.YYYY:
      return date.getFullYear().toString();
      
    case DATE_FORMATS.QUARTER:
      const quarter = Math.floor((date.getMonth() + 3) / 3);
      return `Q${quarter} ${date.getFullYear()}`;
      
    case DATE_FORMATS.DEFAULT:
    default:
      return date.toLocaleDateString();
  }
}

export function DateFormatDropdown({ 
  selectedFormat = DATE_FORMATS.DEFAULT, 
  onFormatChange, 
  disabled = false 
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={disabled}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
          title="Change Date Format"
        >
          <Calendar size={16} />
          <span>Date Format</span>
          <ChevronDown size={14} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {Object.entries(DATE_FORMAT_LABELS).map(([formatKey, label]) => (
          <DropdownMenuItem
            key={formatKey}
            onSelect={() => onFormatChange(formatKey)}
            className={`flex items-center gap-2 cursor-pointer ${
              selectedFormat === formatKey ? 'bg-blue-50 text-blue-600' : ''
            }`}
          >
            <Calendar size={16} />
            <span>{label}</span>
            {selectedFormat === formatKey && (
              <span className="ml-auto text-blue-600">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
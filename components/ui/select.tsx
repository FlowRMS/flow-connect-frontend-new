'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined);

const useSelectContext = () => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within Select');
  }
  return context;
};

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function Select({ value = '', onValueChange, disabled = false, children }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleValueChange = (newValue: string) => {
    onValueChange?.(newValue);
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as Node | null;
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [isOpen]);

  return (
    <SelectContext.Provider value={{ isOpen, setIsOpen, value, onValueChange: handleValueChange, disabled }}>
      <div ref={containerRef} className="relative inline-block w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

interface SelectTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function SelectTrigger({ children, className, onClick, ...props }: SelectTriggerProps) {
  const { isOpen, setIsOpen, disabled } = useSelectContext();

  return (
    <button
      onClick={(e) => {
        if (!disabled) {
          setIsOpen(!isOpen);
        }
        onClick?.(e);
      }}
      disabled={disabled}
      className={cn(
        'flex items-center justify-between w-full px-3 py-2 text-sm bg-background border-2 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className={cn('w-4 h-4 opacity-50 transition-transform', isOpen && 'rotate-180')} />
    </button>
  );
}

interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder }: SelectValueProps) {
  const { value } = useSelectContext();
  return <span>{value || placeholder}</span>;
}

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function SelectContent({ children, className, ...props }: SelectContentProps) {
  const { isOpen } = useSelectContext();

  if (!isOpen) {
    return null;
  }

  return (
    <div className={cn('absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-input rounded-md shadow-md shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2', className)} {...props}>
      {children}
    </div>
  );
}

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

export function SelectItem({ value, children, className, onClick, ...props }: SelectItemProps) {
  const { value: selectedValue, onValueChange } = useSelectContext();
  const isSelected = selectedValue === value;

  return (
    <div
      onClick={(e) => {
        onValueChange(value);
        onClick?.(e);
      }}
      className={cn(
        'px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground',
        isSelected && 'bg-accent text-accent-foreground',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

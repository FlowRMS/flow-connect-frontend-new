'use client'

import { cn } from '@/lib/flow-ai/cn';
import { Button } from '@/components/flow-ai/ui/button';
import { Badge } from '@/components/flow-ai/ui/badge';
import { FileStack } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface DataSetTab {
  index: number;
  label: string; // e.g., "Order #", "Quote #"
  value: string; // e.g., "25990448"
}

interface DataSetTabsProps {
  tabs: DataSetTab[];
  activeIndex: number;
  onTabChange: (index: number) => void;
}

export function DataSetTabs({ tabs, activeIndex, onTabChange }: DataSetTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  const checkScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setShowLeftScroll(container.scrollLeft > 0);
    setShowRightScroll(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollButtons();
    const handleScroll = () => checkScrollButtons();
    const resizeObserver = new ResizeObserver(checkScrollButtons);

    container.addEventListener('scroll', handleScroll);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [tabs]);

  // Don't render if there's only one tab
  if (tabs.length <= 1) {
    return null;
  }

  return (
    <div className="relative border-b bg-muted/30">
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <FileStack className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Data Sets:</span>
          <Badge variant="secondary" className="text-xs">
            {tabs.length}
          </Badge>
        </div>

        <div className="flex-1 relative min-w-0">
          <div
            ref={scrollContainerRef}
            className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 py-1"
            style={{ 
              paddingLeft: showLeftScroll ? '40px' : '0',
              paddingRight: showRightScroll ? '40px' : '0',
            }}
          >
            {tabs.map((tab) => (
              <Button
                key={tab.index}
                variant={activeIndex === tab.index ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onTabChange(tab.index)}
                className={cn(
                  "flex-shrink-0 transition-all whitespace-nowrap",
                  activeIndex === tab.index
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <span className="text-xs font-medium">
                  {tab.label} {tab.value}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}










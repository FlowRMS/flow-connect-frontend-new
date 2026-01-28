'use client'

import { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react';
import { Sparkles, Clock, ArrowLeftRight, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/flow-ai/ui/card';
import { Badge } from '@/components/flow-ai/ui/badge';
import { Separator } from '@/components/flow-ai/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { formatDisplayValue } from '@/lib/flow-ai/format-utils';
import type { ParsedCorrection } from '@/components/flow-ai/hooks/usePendingReview';

interface ChangesFeedProps {
  items: ParsedCorrection[];
}

const PAGE_SIZE = 30;

const ChangeItem = memo(function ChangeItem({ item }: { item: ParsedCorrection }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 mt-1">
        <div className="p-2 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
      </div>

      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs border-primary/20">
              {item.action || 'Correction'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {item.reasoning ? (
          <div className="rounded-lg border border-primary/10 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Reasoning: </span>
            {item.reasoning}
          </div>
        ) : (
          <div className="rounded-lg border border-primary/10 bg-muted/30 px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
            <ArrowLeftRight className="w-3 h-3 text-primary" />
            <span>Updated via review instructions</span>
          </div>
        )}

        <div className="text-xs space-y-2">
          <div>
            <span className="font-medium text-foreground">Before</span>
            <PreBlock value={item.before} tone="destructive" />
          </div>
          <div>
            <span className="font-medium text-foreground">After</span>
            <PreBlock value={item.after} tone="success" />
          </div>
        </div>
      </div>
    </div>
  );
});

export function ChangesFeed({ items }: ChangesFeedProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset visible count when items change significantly
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [items.length]);

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount]
  );

  const hasMore = visibleCount < items.length;

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !hasMore) return;
    // Load more when within 200px of bottom
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
      setVisibleCount(prev => Math.min(prev + PAGE_SIZE, items.length));
    }
  }, [hasMore, items.length]);

  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + PAGE_SIZE, items.length));
  }, [items.length]);

  if (items.length === 0) {
    return (
      <Card className="flow-card h-full flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <div className="p-6 bg-muted rounded-2xl inline-flex">
            <Clock className="w-12 h-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No Changes Yet</h3>
            <p className="text-sm text-muted-foreground">
              Use the prompt composer to make corrections and they&apos;ll appear here
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flow-card flex flex-col animated-border h-[400px]">
      <CardHeader className="flex-none border-b bg-gradient-to-r from-success/10 to-primary/10">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Changes Made
          <Badge variant="secondary" className="ml-auto pulse-glow">
            {items.length} change{items.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden min-h-0">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        >
          <div className="p-4 space-y-4">
            {visibleItems.map((item, idx) => (
              <div key={item.id}>
                <ChangeItem item={item} />
                {idx < visibleItems.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}

            {hasMore && (
              <div className="flex justify-center py-2">
                <button
                  onClick={loadMore}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-muted"
                >
                  <ChevronDown className="w-3 h-3" />
                  Show more ({items.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const PreBlock = memo(function PreBlock({ value, tone }: { value: unknown; tone: "success" | "destructive" }) {
  const borderClass =
    tone === "success" ? "border-success/20 bg-success/10 text-success" : "border-destructive/20 bg-destructive/10 text-destructive";

  const formatted = useMemo(() => formatValue(value), [value]);

  return (
    <div
      className={`mt-1 whitespace-pre-wrap break-words rounded-md border px-3 py-2 text-xs ${borderClass}`}
    >
      {formatted}
    </div>
  );
});

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "—";

  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === "object" && parsed !== null) {
        if (Array.isArray(parsed)) {
          return parsed.map(item =>
            typeof item === "object" ? Object.values(item).map(v => formatDisplayValue(v)).join(" | ") : formatDisplayValue(item)
          ).join(", ");
        } else {
          return Object.entries(parsed)
            .map(([key, value]) => `${key}: ${formatDisplayValue(value)}`)
            .join(", ");
        }
      }
    } catch {
      return formatDisplayValue(val);
    }
  }

  if (typeof val === "object") {
    if (Array.isArray(val)) {
      return val.map(item =>
        typeof item === "object" ? Object.values(item).map(v => formatDisplayValue(v)).join(" | ") : formatDisplayValue(item)
      ).join(", ");
    } else {
      const obj = val as Record<string, unknown>;
      if (obj.row && obj.field && 'value' in obj) {
        return `Row ${obj.row}, ${obj.field}: ${formatDisplayValue(obj.value)}`;
      } else if (obj.row && obj.data) {
        const data = obj.data as Record<string, unknown>;
        const entries = Object.entries(data)
          .filter(([key]) => !key.startsWith('_'))
          .slice(0, 3)
          .map(([key, value]) => `${key}: ${formatDisplayValue(value)}`);
        return `Row ${obj.row} - ${entries.join(', ')}${Object.keys(data).length > 3 ? '...' : ''}`;
      } else {
        return Object.entries(obj)
          .map(([key, value]) => `${key}: ${formatDisplayValue(value)}`)
          .join(", ");
      }
    }
  }

  return formatDisplayValue(val);
}

/**
 * Infinite Scroll Hook
 * Detects when user scrolls near the bottom and triggers loading more data
 * Uses callback ref pattern to properly handle conditionally rendered elements
 */

import { useEffect, useRef, useCallback, useState } from 'react';

interface UseInfiniteScrollOptions {
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  threshold?: number; // pixels from bottom to trigger load
}

export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  threshold = 200,
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Use state to track the element - this ensures re-render when element is attached
  const [element, setElement] = useState<HTMLDivElement | null>(null);

  // Use refs to store the latest values to avoid recreating the observer
  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingNextPageRef = useRef(isFetchingNextPage);
  const fetchNextPageRef = useRef(fetchNextPage);

  // Track if we're currently triggering a fetch to prevent duplicates
  const isTriggeringRef = useRef(false);

  // Update refs when values change
  useEffect(() => {
    hasNextPageRef.current = hasNextPage;
  }, [hasNextPage]);

  useEffect(() => {
    isFetchingNextPageRef.current = isFetchingNextPage;
    // Reset triggering flag when fetch completes
    if (!isFetchingNextPage) {
      isTriggeringRef.current = false;
    }
  }, [isFetchingNextPage]);

  useEffect(() => {
    fetchNextPageRef.current = fetchNextPage;
  }, [fetchNextPage]);

  // Stable callback that reads from refs - doesn't cause observer recreation
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (
        target.isIntersecting &&
        hasNextPageRef.current &&
        !isFetchingNextPageRef.current &&
        !isTriggeringRef.current
      ) {
        isTriggeringRef.current = true;
        fetchNextPageRef.current();
      }
    },
    [] // Empty deps - uses refs for all values
  );

  // Callback ref - this gets called when element is attached/detached
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    setElement(node);
  }, []);

  // Create observer when element is available
  useEffect(() => {
    if (!element) return;

    // Disconnect existing observer if any
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [element, handleObserver, threshold]);

  return { loadMoreRef };
}

/**
 * Simple scroll-based infinite loading
 * Attaches to a scrollable container
 * Uses stable refs to prevent scroll handler recreation and flickering
 */
export function useScrollPagination(
  containerRef: React.RefObject<HTMLElement>,
  options: UseInfiniteScrollOptions
) {
  const { hasNextPage, isFetchingNextPage, fetchNextPage, threshold = 200 } = options;

  // Use refs to store the latest values
  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingNextPageRef = useRef(isFetchingNextPage);
  const fetchNextPageRef = useRef(fetchNextPage);
  const isTriggeringRef = useRef(false);

  // Update refs when values change
  useEffect(() => {
    hasNextPageRef.current = hasNextPage;
  }, [hasNextPage]);

  useEffect(() => {
    isFetchingNextPageRef.current = isFetchingNextPage;
    if (!isFetchingNextPage) {
      isTriggeringRef.current = false;
    }
  }, [isFetchingNextPage]);

  useEffect(() => {
    fetchNextPageRef.current = fetchNextPage;
  }, [fetchNextPage]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      if (
        distanceFromBottom < threshold &&
        hasNextPageRef.current &&
        !isFetchingNextPageRef.current &&
        !isTriggeringRef.current
      ) {
        isTriggeringRef.current = true;
        fetchNextPageRef.current();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef, threshold]); // Only recreate on container or threshold change
}

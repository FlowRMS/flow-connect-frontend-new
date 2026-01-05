"use client";

import { useEffect } from 'react';
import {
  extractLegacyParams,
  persistLegacyParams,
  removeLegacyParams,
} from '@/lib/flow-ai/legacy-redirect';

// Pages where URL params should NOT be stripped (they need the params in the URL)
const PAGES_TO_PRESERVE_PARAMS = [
  '/flow-ai/upload-complete',
  '/flow-ai/entity-matching',
  '/flow-ai/column-mapping',
  '/flow-ai/processing-errors',
  '/flow-ai/queue',
];

export function useLegacyRedirectParams() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const pathname = window.location.pathname;

    // Don't strip params on pages that need them in the URL
    const shouldPreserveParams = PAGES_TO_PRESERVE_PARAMS.some(
      (page) => pathname.startsWith(page)
    );

    // Early return - don't touch anything on these pages
    if (shouldPreserveParams) {
      console.debug('[legacy-redirect] Preserving URL params on:', pathname);
      return;
    }

    const url = new URL(window.location.href);
    const params = extractLegacyParams(url.searchParams);
    const stored = persistLegacyParams(params);

    const stripped = removeLegacyParams(url.searchParams);

    if (stripped) {
      const sanitizedUrl =
        url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '') + url.hash;
      window.history.replaceState({}, document.title, sanitizedUrl);
    }

    if (!stored) {
      console.debug('[legacy-redirect] No legacy redirect parameters detected');
    }
  }, []);
}






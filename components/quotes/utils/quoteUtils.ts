import type { Quote } from '../types';

/**
 * Returns the appropriate CSS class for a quote stage color
 */
export const getStageColor = (stage: string): string => {
  switch (stage) {
    case 'Draft': return 'bg-gray-500 text-white';
    case 'Review': return 'bg-blue-500 text-white';
    case 'Sent': return 'bg-purple-500 text-white';
    case 'Negotiating': return 'bg-yellow-500 text-white';
    case 'Won': return 'bg-green-500 text-white';
    case 'Lost': return 'bg-red-500 text-white';
    case 'Dormant': return 'bg-purple-300 text-purple-900';
    default: return 'bg-gray-500 text-white';
  }
};

/**
 * Check if a quote is linked to other entities (orders, etc.)
 */
export const isQuoteLinked = (quote: Quote): boolean => {
  // Quote is linked if it's been Won (converted to order) or is Closed
  return quote.stage === 'Won' || quote.status === 'Closed';
};

/**
 * Get the reason why a quote cannot be selected
 */
export const getQuoteLinkedReason = (quote: Quote): string => {
  const reasons: string[] = [];
  if (quote.stage === 'Won') {
    reasons.push('has been converted to an order');
  }
  if (quote.status === 'Closed') {
    reasons.push('is closed');
  }
  return `Cannot select: Quote ${reasons.join(' and ')}`;
};

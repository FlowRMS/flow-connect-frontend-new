/**
 * Contact Utility Functions
 */

import { AVATAR_COLORS } from './constants';

/**
 * Get initials from a full name
 */
export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('');
}

/**
 * Get avatar color based on contact ID
 */
export function getAvatarColor(id: string): string {
  const index = id.charCodeAt(id.length - 1) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

/**
 * Format date to human-readable format
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const today = new Date();

  // Reset times to midnight for accurate day comparison
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const diffTime = todayDay.getTime() - dateDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7 && diffDays > 0) return `${diffDays} days ago`;
  if (diffDays < 0) return 'Today'; // Future date (edge case)
  return date.toLocaleDateString();
}

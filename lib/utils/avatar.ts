/**
 * Avatar Utilities
 * Consistent avatar colors and formatting across the app
 */

// Cool gradient color palette for avatars - these are safelisted in tailwind.config.js
const AVATAR_COLORS = [
  { bg: 'bg-gradient-to-br from-violet-500 to-purple-600', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-blue-500 to-cyan-500', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-emerald-500 to-teal-500', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-orange-500 to-amber-500', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-pink-500 to-rose-500', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-indigo-500 to-blue-600', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-teal-500 to-green-500', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-red-500 to-orange-500', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-fuchsia-500 to-pink-500', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-cyan-500 to-blue-500', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-lime-500 to-green-500', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-amber-500 to-yellow-500', text: 'text-white' },
];

/**
 * Generate a consistent color index based on a string (name)
 * Uses a simple hash function to ensure the same name always gets the same color
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get avatar color classes based on name (using Tailwind gradient classes)
 * These classes are safelisted in tailwind.config.js
 */
export function getAvatarColors(name: string | null | undefined): { bg: string; text: string } {
  if (!name) {
    return { bg: 'bg-gray-400', text: 'text-white' };
  }
  const index = hashString(name) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

/**
 * Get avatar style based on name (for inline styles - fallback)
 */
export function getAvatarStyle(name: string | null | undefined): { background: string; color: string } {
  // Map to inline styles for compatibility
  const colorMap = [
    { background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#ffffff' },
    { background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', color: '#ffffff' },
    { background: 'linear-gradient(135deg, #10b981, #14b8a6)', color: '#ffffff' },
    { background: 'linear-gradient(135deg, #f97316, #f59e0b)', color: '#ffffff' },
    { background: 'linear-gradient(135deg, #ec4899, #f43f5e)', color: '#ffffff' },
    { background: 'linear-gradient(135deg, #6366f1, #2563eb)', color: '#ffffff' },
    { background: 'linear-gradient(135deg, #14b8a6, #22c55e)', color: '#ffffff' },
    { background: 'linear-gradient(135deg, #ef4444, #f97316)', color: '#ffffff' },
    { background: 'linear-gradient(135deg, #d946ef, #ec4899)', color: '#ffffff' },
    { background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: '#ffffff' },
    { background: 'linear-gradient(135deg, #84cc16, #22c55e)', color: '#ffffff' },
    { background: 'linear-gradient(135deg, #f59e0b, #eab308)', color: '#ffffff' },
  ];

  if (!name) {
    return { background: '#9ca3af', color: '#ffffff' };
  }
  const index = hashString(name) % colorMap.length;
  return colorMap[index];
}

/**
 * Get initials from a name (up to 2 characters)
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Format date to readable format
 */
export function formatCreatedDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date with time
 */
export function formatCreatedDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

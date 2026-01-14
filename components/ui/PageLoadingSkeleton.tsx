'use client';

import { motion } from 'framer-motion';

/**
 * A beautiful skeleton loading state that shows instantly during navigation.
 * This creates the perception of instant page loads.
 */
export function PageLoadingSkeleton() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <motion.div
            className="h-8 w-48 bg-[var(--muted)]/50 rounded-lg"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="h-6 w-24 bg-[var(--muted)]/30 rounded-md"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
          />
        </div>
        <div className="flex items-center gap-3">
          <motion.div
            className="h-9 w-24 bg-[var(--muted)]/40 rounded-lg"
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
          />
          <motion.div
            className="h-9 w-32 bg-[var(--primary)]/20 rounded-lg"
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          />
        </div>
      </div>

      {/* Table/Content skeleton */}
      <div className="flex-1 bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/20">
          {[120, 180, 100, 140, 80].map((width, i) => (
            <motion.div
              key={i}
              className="h-4 bg-[var(--muted)]/40 rounded"
              style={{ width }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.05 }}
            />
          ))}
        </div>

        {/* Table rows */}
        {[...Array(8)].map((_, rowIndex) => (
          <motion.div
            key={rowIndex}
            className="flex items-center gap-4 px-4 py-4 border-b border-[var(--border)] last:border-b-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: rowIndex * 0.03 }}
          >
            {[100, 160, 80, 120, 60].map((width, colIndex) => (
              <motion.div
                key={colIndex}
                className="h-4 bg-[var(--muted)]/30 rounded"
                style={{ width: width + Math.random() * 40 }}
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: (rowIndex * 0.05) + (colIndex * 0.02)
                }}
              />
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/**
 * A simpler, smaller loading skeleton for cards/smaller sections
 */
export function CardLoadingSkeleton() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <motion.div
              className="h-5 w-3/4 bg-[var(--muted)]/50 rounded mb-3"
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="h-4 w-full bg-[var(--muted)]/30 rounded mb-2"
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
            />
            <motion.div
              className="h-4 w-2/3 bg-[var(--muted)]/30 rounded"
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default PageLoadingSkeleton;

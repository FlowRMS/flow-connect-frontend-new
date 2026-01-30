'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { morphEase } from '@/contexts/NavigationMorphContext';
import { HeaderIconAnimation } from '@/components/ui/HeaderIconAnimations';
import { iconMap } from '@/components/Sidebar';
import type { RefObject } from 'react';

interface ProductsHeaderProps {
  headerIconRef: RefObject<HTMLDivElement>;
  isReceivingAnimation: boolean;
  onManageUoms: () => void;
  onManageCategories: () => void;
}

export function ProductsHeader({
  headerIconRef,
  isReceivingAnimation,
  onManageUoms,
  onManageCategories,
}: ProductsHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-start gap-4 flex-shrink-0">
        <HeaderIconAnimation
          isReceivingAnimation={isReceivingAnimation}
          animationStyle="cube-rotate"
          headerIconRef={headerIconRef as RefObject<HTMLDivElement>}
        >
          {iconMap['products']}
        </HeaderIconAnimation>
        <div className="overflow-hidden">
          <motion.h1
            className="text-2xl font-semibold text-[var(--foreground)]"
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.35, delay: 0.1, ease: morphEase }}
          >
            Products
          </motion.h1>
          <motion.p
            className="text-sm text-[var(--muted-foreground)] mt-1"
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.3, delay: 0.2, ease: morphEase }}
          >
            Manage your product catalog, categories, and units of measure
          </motion.p>
        </div>
      </div>
      <motion.div
        className="flex items-center gap-2 sm:gap-3 flex-wrap"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, delay: 0.25, ease: morphEase }}
      >
        <button
          onClick={onManageUoms}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-[var(--border)] rounded-lg text-xs sm:text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors whitespace-nowrap"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span className="hidden sm:inline">Manage UOMs</span>
          <span className="sm:hidden">UOMs</span>
        </button>
        <button
          onClick={onManageCategories}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-[var(--border)] rounded-lg text-xs sm:text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors whitespace-nowrap"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          <span className="hidden sm:inline">Manage Categories</span>
          <span className="sm:hidden">Categories</span>
        </button>
        <button
          onClick={() => router.push('/products/new')}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-xs sm:text-sm hover:bg-[var(--primary-hover)] transition-colors whitespace-nowrap"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="10" cy="10" r="7"/>
            <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
          </svg>
          <span className="hidden sm:inline">Add Product</span>
          <span className="sm:hidden">Add</span>
        </button>
      </motion.div>
    </div>
  );
}

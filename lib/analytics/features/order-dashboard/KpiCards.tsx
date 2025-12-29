'use client';
import React from 'react';
import { useQuery } from '@apollo/client/react';
import { StatsCard } from '@/components/analytics/stats-card/stats-card';
import { StatsCardSkeleton } from '@/components/analytics/stats-card/StatsCardSkeleton';
import { GET_DASHBOARD_CARDS } from '@/lib/analytics/graphql/queries/orderDashboard';
import { GetDashboardCardsData } from '@/lib/analytics/graphql/types';
import { formatCurrency, formatPercentage } from '@/lib/analytics/lib/format';

interface KpiCardsProps {
  className?: string;
  hideSales?: boolean;
  hideCommission?: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ className = '', hideSales = false, hideCommission = false }) => {
  const { data, loading, error } = useQuery<GetDashboardCardsData>(GET_DASHBOARD_CARDS, {
    errorPolicy: 'all'
  });

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 ${className}`}>
        {Array.from({ length: 4 }).map((_, index) => (
          <StatsCardSkeleton key={index} className="" />
        ))}
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <p className="text-red-600 text-sm">
          Error loading dashboard cards: {error.message}
        </p>
      </div>
    );
  }

  const cards = data?.getDashboardCards || [];

  // Filter out financial cards based on hideSales and hideCommission flags
  const visibleCards = cards.filter(card => {
    if (!card || !card.name) return false;
    
    const lowerName = card.name.toLowerCase();
    const isSales = lowerName.includes('sale');
    const isCommission = lowerName.includes('commission');
    
    // Hide sales cards if hideSales is true
    if (hideSales && isSales) return false;
    
    // Hide commission cards if hideCommission is true
    if (hideCommission && isCommission) return false;
    
    return true;
  });

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 ${className}`}>
      {visibleCards.map((card, index) => {
        if (!card || !card.name || !card.currentPeriod || !card.previousPeriod) {
          return null;
        }

        // Determine if this is a currency or percentage value based on the name
        const lowerName = card.name.toLowerCase();
        const isSales = lowerName.includes('sale');
        const isCommission = lowerName.includes('commission');
        const isCurrency =
          isSales ||
          isCommission ||
          lowerName.includes('revenue') ||
          lowerName.includes('order') ||
          lowerName.includes('amount');

        const formattedValue = isCurrency
          ? formatCurrency(card.currentPeriod.value || 0)
          : (card.currentPeriod.value || 0).toString();

        // Normalize changePercentage: could be decimal or percent
        let changePercentageRaw = card.changePercentage ?? 0;
        if (typeof changePercentageRaw !== 'number') {
          changePercentageRaw = parseFloat(String(changePercentageRaw).replace(/[^\d.-]/g, ''));
        }
        // If we get a fractional value (<=1), treat as decimal and convert to percent
        let changePercentage = Number.isFinite(changePercentageRaw) ? changePercentageRaw : 0;
        if (Math.abs(changePercentage) <= 1) changePercentage = changePercentage * 100;

        const changeAmountRaw =
          typeof card.changeAmount === 'number'
            ? card.changeAmount
            : parseFloat(String(card.changeAmount ?? '')) || 0;

        // For Sales and Commission cards, show percentage change but keep currency values
        const changeValue = changePercentage;
        const changeText = formatPercentage(changePercentage);
        const isPositive = changePercentage >= 0;

        // Calculate progress value for visual indicator: map -100..+100 -> 0..100 with center at 50
        const progressValue = Math.max(0, Math.min(100, 50 + (changePercentage / 2)));
        const progressColor = isPositive ? "#22c55e" : "#ef4444";

        const comparisonText = (isSales || isCommission)
          ? `vs ${card.previousPeriod.label || 'previous period'} ${formatCurrency(card.previousPeriod.value || 0)}`
          : `vs ${card.previousPeriod.label || 'previous period'}`;

        return (
          <StatsCard
            key={index}
            title={card.name}
            value={formattedValue}
            change={changeValue}
            changeVariant="percentage"
            progress={progressValue}
            progressColor={progressColor}
            comparisonText={comparisonText}
            progressLabel={changeText}
          />
        );
      })}
    </div>
  );
};





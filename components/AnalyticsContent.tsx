'use client';

import React, { useState, type ReactElement } from 'react';
import LineChart from './charts/LineChart';
import BarChart from './charts/BarChart';
import PieChart from './charts/PieChart';
import FunnelChart from './charts/FunnelChart';
import DataTable from './charts/DataTable';

type TabId = 'activity' | 'pipeline' | 'sales' | 'contacts' | 'forecast' | 'performance';

type Tab = {
  id: TabId;
  name: string;
  icon: ReactElement;
};

// Chart wrapper component
function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--muted-foreground)] mb-4">{description}</p>
      <div className="flex justify-center">
        {children}
      </div>
    </div>
  );
}

// Placeholder chart component for remaining charts
function PlaceholderChart({ title, description, type }: { title: string; description: string; type: string }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--muted-foreground)] mb-4">{description}</p>
      <div className="h-64 bg-[var(--muted)] rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-sm text-[var(--muted-foreground)]">{type} Visualization</div>
        </div>
      </div>
    </div>
  );
}

// Activity Reports Tab
function ActivityReportsTab() {
  // Sample data for activity timeline
  const activityTimelineData = [
    { label: 'Nov 1', value: 35 },
    { label: 'Nov 5', value: 42 },
    { label: 'Nov 10', value: 38 },
    { label: 'Nov 15', value: 51 },
    { label: 'Nov 20', value: 48 },
    { label: 'Nov 25', value: 55 },
    { label: 'Nov 30', value: 62 }
  ];

  // Sample data for activity by type
  const activityByTypeData = [
    { label: 'Calls', value: 438, color: '#3b82f6' },
    { label: 'Emails', value: 562, color: '#10b981' },
    { label: 'Meetings', value: 247, color: '#f59e0b' }
  ];

  // Sample data for team leaderboard
  const teamLeaderboardData = [
    { label: 'Sarah J.', value: 156 },
    { label: 'Mike T.', value: 142 },
    { label: 'Lisa K.', value: 138 },
    { label: 'John D.', value: 127 },
    { label: 'Emma R.', value: 115 }
  ];

  // Sample data for response times
  const responseTimeData = [
    { label: 'Calls', value: 2.5 },
    { label: 'Emails', value: 4.2 },
    { label: 'Meetings', value: 1.8 }
  ];

  // Sample data for recent activities
  const recentActivitiesData = [
    { date: '2024-11-24', user: 'Sarah Johnson', activityType: 'Call', entity: 'Acme Corp', duration: '15 min', outcome: 'Follow-up scheduled' },
    { date: '2024-11-24', user: 'Mike Thompson', activityType: 'Email', entity: 'TechStart Inc', duration: '-', outcome: 'Quote sent' },
    { date: '2024-11-23', user: 'Lisa Kim', activityType: 'Meeting', entity: 'BuildCo', duration: '45 min', outcome: 'Spec review completed' },
    { date: '2024-11-23', user: 'John Davis', activityType: 'Call', entity: 'Green Energy', duration: '20 min', outcome: 'Technical questions answered' },
    { date: '2024-11-23', user: 'Emma Roberts', activityType: 'Email', entity: 'SmartTech', duration: '-', outcome: 'Proposal sent' },
    { date: '2024-11-22', user: 'Sarah Johnson', activityType: 'Meeting', entity: 'Urban Dev', duration: '30 min', outcome: 'Site visit arranged' },
    { date: '2024-11-22', user: 'Mike Thompson', activityType: 'Call', entity: 'Coastal Builders', duration: '12 min', outcome: 'Price confirmation' }
  ];

  // Sample data for activity by user
  const activityByUserData = [
    { user: 'Sarah Johnson', calls: 87, emails: 124, meetings: 42, notes: 95, total: 348, avgPerDay: 11.6 },
    { user: 'Mike Thompson', calls: 93, emails: 98, meetings: 38, notes: 82, total: 311, avgPerDay: 10.4 },
    { user: 'Lisa Kim', calls: 76, emails: 115, meetings: 51, notes: 89, total: 331, avgPerDay: 11.0 },
    { user: 'John Davis', calls: 82, emails: 107, meetings: 45, notes: 74, total: 308, avgPerDay: 10.3 },
    { user: 'Emma Roberts', calls: 100, emails: 118, meetings: 71, notes: 103, total: 392, avgPerDay: 13.1 }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-1">Activity Reports</h2>
        <p className="text-sm text-[var(--muted-foreground)]">Track team activities, engagement patterns, and productivity metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Total Activities</div>
          <div className="text-3xl font-bold text-[var(--foreground)]">1,247</div>
          <div className="text-xs text-[var(--success)] mt-1">↑ 12% vs last month</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Calls Made</div>
          <div className="text-3xl font-bold text-[var(--foreground)]">438</div>
          <div className="text-xs text-[var(--success)] mt-1">↑ 8% vs last month</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Emails Sent</div>
          <div className="text-3xl font-bold text-[var(--foreground)]">562</div>
          <div className="text-xs text-red-500 mt-1">↓ 3% vs last month</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Meetings</div>
          <div className="text-3xl font-bold text-[var(--foreground)]">247</div>
          <div className="text-xs text-[var(--success)] mt-1">↑ 15% vs last month</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        <ChartCard
          title="Activity Timeline"
          description="Daily activity breakdown over the last 30 days"
        >
          <LineChart data={activityTimelineData} color="#3b82f6" />
        </ChartCard>

        <ChartCard
          title="Activity by Type"
          description="Distribution of activities across different categories"
        >
          <PieChart data={activityByTypeData} />
        </ChartCard>

        <ChartCard
          title="Team Activity Leaderboard"
          description="Top performers by activity volume"
        >
          <BarChart data={teamLeaderboardData} />
        </ChartCard>

        <ChartCard
          title="Avg Response Time (hours)"
          description="Average time to respond by activity type"
        >
          <BarChart data={responseTimeData} showValues={true} />
        </ChartCard>
      </div>

      {/* Tables */}
      <DataTable
        title="Recent Activities"
        description="Most recent team activities across all types"
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'user', label: 'User' },
          { key: 'activityType', label: 'Activity Type' },
          { key: 'entity', label: 'Contact/Company' },
          { key: 'duration', label: 'Duration' },
          { key: 'outcome', label: 'Outcome' }
        ]}
        data={recentActivitiesData}
        pageSize={5}
      />

      <DataTable
        title="Activity by User"
        description="Detailed breakdown of activities per team member"
        columns={[
          { key: 'user', label: 'User' },
          { key: 'calls', label: 'Calls', align: 'right' },
          { key: 'emails', label: 'Emails', align: 'right' },
          { key: 'meetings', label: 'Meetings', align: 'right' },
          { key: 'notes', label: 'Notes', align: 'right' },
          { key: 'total', label: 'Total', align: 'right' },
          { key: 'avgPerDay', label: 'Avg per Day', align: 'right' }
        ]}
        data={activityByUserData}
        pageSize={10}
      />
    </div>
  );
}

// Pipeline Reports Tab
function PipelineReportsTab() {
  // Sample data for pipeline by stage
  const pipelineStagesData = [
    { label: 'Lead', value: 1200000, count: 28 },
    { label: 'Qualified', value: 950000, count: 18 },
    { label: 'Proposal', value: 720000, count: 12 },
    { label: 'Negotiation', value: 450000, count: 7 },
    { label: 'Closed Won', value: 280000, count: 4 }
  ];

  // Sample data for pipeline velocity
  const velocityData = [
    { label: 'Week 1', value: 18 },
    { label: 'Week 2', value: 15 },
    { label: 'Week 3', value: 21 },
    { label: 'Week 4', value: 16 },
    { label: 'Week 5', value: 19 },
    { label: 'Week 6', value: 14 }
  ];

  // Sample data for conversion rates
  const conversionRatesData = [
    { label: 'Lead → Qualified', value: 79 },
    { label: 'Qualified → Proposal', value: 67 },
    { label: 'Proposal → Negotiation', value: 58 },
    { label: 'Negotiation → Won', value: 62 }
  ];

  // Sample data for pipeline trends
  const pipelineTrendsData = [
    { label: 'Jun', value: 3200 },
    { label: 'Jul', value: 3500 },
    { label: 'Aug', value: 3800 },
    { label: 'Sep', value: 3600 },
    { label: 'Oct', value: 4000 },
    { label: 'Nov', value: 4200 }
  ];

  // Sample data for top opportunities
  const topOpportunitiesData = [
    { jobName: 'Downtown Plaza Renovation', stage: 'Negotiation', value: '$385K', probability: '85%', expectedClose: '2024-12-15', owner: 'Sarah Johnson', daysInStage: 12 },
    { jobName: 'TechCorp HQ Expansion', stage: 'Proposal', value: '$342K', probability: '65%', expectedClose: '2025-01-10', owner: 'Mike Thompson', daysInStage: 8 },
    { jobName: 'Harbor View Apartments', stage: 'Negotiation', value: '$298K', probability: '80%', expectedClose: '2024-12-20', owner: 'Lisa Kim', daysInStage: 15 },
    { jobName: 'Riverside Medical Center', stage: 'Proposal', value: '$275K', probability: '60%', expectedClose: '2025-01-15', owner: 'John Davis', daysInStage: 5 },
    { jobName: 'University Lab Building', stage: 'Qualified', value: '$412K', probability: '45%', expectedClose: '2025-02-01', owner: 'Emma Roberts', daysInStage: 18 }
  ];

  // Sample data for pipeline by owner
  const pipelineByOwnerData = [
    { owner: 'Sarah Johnson', opportunities: 12, totalValue: '$1.2M', avgDealSize: '$100K', winRate: '38%', avgDaysToClose: 45 },
    { owner: 'Mike Thompson', opportunities: 9, totalValue: '$890K', avgDealSize: '$99K', winRate: '33%', avgDaysToClose: 52 },
    { owner: 'Lisa Kim', opportunities: 11, totalValue: '$1.1M', avgDealSize: '$100K', winRate: '36%', avgDaysToClose: 48 },
    { owner: 'John Davis', opportunities: 8, totalValue: '$720K', avgDealSize: '$90K', winRate: '31%', avgDaysToClose: 55 },
    { owner: 'Emma Roberts', opportunities: 7, totalValue: '$670K', avgDealSize: '$96K', winRate: '29%', avgDaysToClose: 58 }
  ];

  // Sample data for stale opportunities
  const staleOpportunitiesData = [
    { jobName: 'Green Energy Campus', stage: 'Proposal', value: '$225K', owner: 'Mike Thompson', daysStale: 47, lastActivity: '2024-10-08' },
    { jobName: 'Coastal Office Park', stage: 'Qualified', value: '$189K', owner: 'John Davis', daysStale: 38, lastActivity: '2024-10-17' },
    { jobName: 'Metro Transit Hub', stage: 'Negotiation', value: '$395K', owner: 'Sarah Johnson', daysStale: 35, lastActivity: '2024-10-20' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-1">Pipeline Reports</h2>
        <p className="text-sm text-[var(--muted-foreground)]">Analyze pipeline health, conversion rates, and revenue forecasts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Pipeline Value</div>
          <div className="text-3xl font-bold text-[var(--foreground)]">$4.2M</div>
          <div className="text-xs text-[var(--success)] mt-1">↑ 18% vs last quarter</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Active Opportunities</div>
          <div className="text-3xl font-bold text-[var(--foreground)]">47</div>
          <div className="text-xs text-[var(--success)] mt-1">↑ 5 new this month</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Avg Deal Size</div>
          <div className="text-3xl font-bold text-[var(--foreground)]">$89K</div>
          <div className="text-xs text-[var(--success)] mt-1">↑ 12% vs last quarter</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Win Rate</div>
          <div className="text-3xl font-bold text-[var(--foreground)]">34%</div>
          <div className="text-xs text-red-500 mt-1">↓ 2% vs last quarter</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        <ChartCard
          title="Pipeline by Stage"
          description="Value distribution across pipeline stages"
        >
          <FunnelChart data={pipelineStagesData} />
        </ChartCard>

        <ChartCard
          title="Avg Days in Stage"
          description="Average time spent in each pipeline stage"
        >
          <LineChart data={velocityData} color="#10b981" />
        </ChartCard>

        <ChartCard
          title="Conversion Rates by Stage"
          description="Stage-to-stage conversion percentages"
        >
          <BarChart data={conversionRatesData} horizontal={true} />
        </ChartCard>

        <ChartCard
          title="Pipeline Trends (6 Months)"
          description="Historical pipeline value ($K)"
        >
          <LineChart data={pipelineTrendsData} color="#8b5cf6" />
        </ChartCard>
      </div>

      {/* Tables */}
      <DataTable
        title="Top Opportunities"
        description="Highest value deals currently in pipeline"
        columns={[
          { key: 'jobName', label: 'Job Name' },
          { key: 'stage', label: 'Stage' },
          { key: 'value', label: 'Value', align: 'right' },
          { key: 'probability', label: 'Probability', align: 'right' },
          { key: 'expectedClose', label: 'Expected Close' },
          { key: 'owner', label: 'Owner' },
          { key: 'daysInStage', label: 'Days in Stage', align: 'right' }
        ]}
        data={topOpportunitiesData}
        pageSize={5}
      />

      <DataTable
        title="Pipeline by Owner"
        description="Pipeline breakdown by sales rep"
        columns={[
          { key: 'owner', label: 'Owner' },
          { key: 'opportunities', label: 'Opportunities', align: 'right' },
          { key: 'totalValue', label: 'Total Value', align: 'right' },
          { key: 'avgDealSize', label: 'Avg Deal Size', align: 'right' },
          { key: 'winRate', label: 'Win Rate', align: 'right' },
          { key: 'avgDaysToClose', label: 'Avg Days to Close', align: 'right' }
        ]}
        data={pipelineByOwnerData}
        pageSize={10}
      />

      <DataTable
        title="Stale Opportunities"
        description="Deals that haven't progressed in 30+ days"
        columns={[
          { key: 'jobName', label: 'Job Name' },
          { key: 'stage', label: 'Stage' },
          { key: 'value', label: 'Value', align: 'right' },
          { key: 'owner', label: 'Owner' },
          { key: 'daysStale', label: 'Days Stale', align: 'right' },
          { key: 'lastActivity', label: 'Last Activity' }
        ]}
        data={staleOpportunitiesData}
        pageSize={10}
      />
    </div>
  );
}

// Sales Performance Tab
function SalesPerformanceTab() {
  // Sample data for monthly revenue trend
  const monthlyRevenueData = [
    { label: 'Jan', value: 245 },
    { label: 'Feb', value: 268 },
    { label: 'Mar', value: 282 },
    { label: 'Apr', value: 251 },
    { label: 'May', value: 295 },
    { label: 'Jun', value: 308 },
    { label: 'Jul', value: 285 },
    { label: 'Aug', value: 312 },
    { label: 'Sep', value: 298 },
    { label: 'Oct', value: 325 },
    { label: 'Nov', value: 342 },
    { label: 'Dec', value: 358 }
  ];

  // Sample data for quota attainment
  const quotaAttainmentData = [
    { label: 'Sarah J.', value: 96, color: '#10b981' },
    { label: 'Lisa K.', value: 88, color: '#10b981' },
    { label: 'Mike T.', value: 82, color: '#f59e0b' },
    { label: 'John D.', value: 75, color: '#f59e0b' },
    { label: 'Emma R.', value: 68, color: '#ef4444' }
  ];

  // Sample data for revenue by product
  const revenueByProductData = [
    { label: 'Lighting Controls', value: 1200, color: '#3b82f6' },
    { label: 'HVAC Controls', value: 980, color: '#10b981' },
    { label: 'Energy Management', value: 720, color: '#f59e0b' },
    { label: 'Building Automation', value: 620, color: '#8b5cf6' }
  ];

  // Sample data for win/loss
  const winLossData = [
    { label: 'Won', value: 23, color: '#10b981' },
    { label: 'Lost - Price', value: 12, color: '#ef4444' },
    { label: 'Lost - Timeline', value: 8, color: '#f59e0b' },
    { label: 'Lost - Competitor', value: 11, color: '#dc2626' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-1">Sales Performance</h2>
        <p className="text-sm text-[var(--muted-foreground)]">Track quota attainment, revenue metrics, and individual performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Revenue (YTD)</div>
          <div className="text-3xl font-bold text-[var(--foreground)]">$3.1M</div>
          <div className="text-xs text-[var(--success)] mt-1">78% of annual goal</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Deals Closed</div>
          <div className="text-3xl font-bold text-[var(--foreground)]">23</div>
          <div className="text-xs text-[var(--success)] mt-1">↑ 15% vs last quarter</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Avg Sales Cycle</div>
          <div className="text-3xl font-bold text-[var(--foreground)]">42d</div>
          <div className="text-xs text-[var(--success)] mt-1">↓ 5 days vs last quarter</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Team Quota Attainment</div>
          <div className="text-3xl font-bold text-[var(--foreground)]">87%</div>
          <div className="text-xs text-[var(--success)] mt-1">↑ 8% vs last month</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        <ChartCard
          title="Monthly Revenue Trend"
          description="Revenue performance over the last 12 months ($K)"
        >
          <LineChart data={monthlyRevenueData} color="#10b981" />
        </ChartCard>

        <ChartCard
          title="Quota Attainment by Rep"
          description="Individual performance against quota (%)"
        >
          <BarChart data={quotaAttainmentData} horizontal={true} />
        </ChartCard>

        <ChartCard
          title="Revenue by Product/Service"
          description="Breakdown of revenue by offering type ($K)"
        >
          <PieChart data={revenueByProductData} />
        </ChartCard>

        <ChartCard
          title="Win/Loss Analysis"
          description="Won vs lost deals and reasons"
        >
          <BarChart data={winLossData} />
        </ChartCard>
      </div>

      {/* Tables */}
      <DataTable
        title="Sales Rep Performance"
        description="Comprehensive performance metrics by team member"
        columns={[
          { key: 'rep', label: 'Rep' },
          { key: 'dealsWon', label: 'Deals Won', align: 'right' },
          { key: 'revenue', label: 'Revenue', align: 'right' },
          { key: 'quotaPercent', label: 'Quota %', align: 'right' },
          { key: 'winRate', label: 'Win Rate', align: 'right' },
          { key: 'avgDealSize', label: 'Avg Deal Size', align: 'right' },
          { key: 'activities', label: 'Activities', align: 'right' }
        ]}
        data={[
          { rep: 'Sarah Johnson', dealsWon: 8, revenue: '$720K', quotaPercent: '96%', winRate: '38%', avgDealSize: '$90K', activities: 348 },
          { rep: 'Mike Thompson', dealsWon: 5, revenue: '$495K', quotaPercent: '82%', winRate: '33%', avgDealSize: '$99K', activities: 311 },
          { rep: 'Lisa Kim', dealsWon: 6, revenue: '$600K', quotaPercent: '88%', winRate: '36%', avgDealSize: '$100K', activities: 331 },
          { rep: 'John Davis', dealsWon: 4, revenue: '$360K', quotaPercent: '75%', winRate: '31%', avgDealSize: '$90K', activities: 308 }
        ]}
        pageSize={10}
      />

      <DataTable
        title="Recent Wins"
        description="Recently closed deals"
        columns={[
          { key: 'jobName', label: 'Job Name' },
          { key: 'value', label: 'Value', align: 'right' },
          { key: 'owner', label: 'Owner' },
          { key: 'closeDate', label: 'Close Date' },
          { key: 'daysToClose', label: 'Days to Close', align: 'right' },
          { key: 'marginPercent', label: 'Margin %', align: 'right' }
        ]}
        data={[
          { jobName: 'City Hall Renovation', value: '$142K', owner: 'Sarah Johnson', closeDate: '2024-11-20', daysToClose: 38, marginPercent: '28%' },
          { jobName: 'Retail Center Lighting', value: '$98K', owner: 'Mike Thompson', closeDate: '2024-11-18', daysToClose: 42, marginPercent: '32%' },
          { jobName: 'Hospital Wing Addition', value: '$215K', owner: 'Lisa Kim', closeDate: '2024-11-15', daysToClose: 51, marginPercent: '25%' }
        ]}
        pageSize={5}
      />

      <DataTable
        title="Lost Opportunities"
        description="Recent losses and reasons"
        columns={[
          { key: 'jobName', label: 'Job Name' },
          { key: 'value', label: 'Value', align: 'right' },
          { key: 'owner', label: 'Owner' },
          { key: 'lostDate', label: 'Lost Date' },
          { key: 'lossReason', label: 'Loss Reason' },
          { key: 'competitor', label: 'Competitor' }
        ]}
        data={[
          { jobName: 'Airport Terminal', value: '$385K', owner: 'John Davis', lostDate: '2024-11-10', lossReason: 'Price', competitor: 'ElectroTech Inc' },
          { jobName: 'Shopping Mall', value: '$225K', owner: 'Emma Roberts', lostDate: '2024-11-05', lossReason: 'Timeline', competitor: 'FastBuild Electric' }
        ]}
        pageSize={5}
      />
    </div>
  );
}

// Contact & Company Analytics Tab
function ContactCompanyAnalyticsTab() {
  // Sample data for contact growth
  const contactGrowthData = [
    { label: 'Jan', value: 95 },
    { label: 'Feb', value: 112 },
    { label: 'Mar', value: 108 },
    { label: 'Apr', value: 125 },
    { label: 'May', value: 118 },
    { label: 'Jun', value: 132 },
    { label: 'Jul', value: 145 },
    { label: 'Aug', value: 138 },
    { label: 'Sep', value: 152 },
    { label: 'Oct', value: 148 },
    { label: 'Nov', value: 165 },
    { label: 'Dec', value: 158 }
  ];

  // Sample data for engagement score distribution
  const engagementDistributionData = [
    { label: 'High (8-10)', value: 342, color: '#10b981' },
    { label: 'Medium (5-7)', value: 687, color: '#f59e0b' },
    { label: 'Low (3-4)', value: 213, color: '#ef4444' },
    { label: 'Inactive (0-2)', value: 100, color: '#6b7280' }
  ];

  // Sample data for contact sources
  const contactSourceData = [
    { label: 'Referrals', value: 485, color: '#3b82f6' },
    { label: 'Trade Shows', value: 312, color: '#10b981' },
    { label: 'Website', value: 268, color: '#f59e0b' },
    { label: 'Cold Outreach', value: 187, color: '#8b5cf6' },
    { label: 'LinkedIn', value: 90, color: '#ec4899' }
  ];

  // Sample data for company size distribution
  const companySizeData = [
    { label: '<50 emp', value: 78 },
    { label: '50-200', value: 95 },
    { label: '200-500', value: 62 },
    { label: '500-1000', value: 32 },
    { label: '1000+', value: 17 }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-1">Contact & Company Analytics</h2>
        <p className="text-sm text-[var(--muted-foreground)]">Analyze relationship strength, engagement, and account health</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Total Contacts</div>
          <div className="text-3xl font-bold text-[var(--foreground)]">1,342</div>
          <div className="text-xs text-[var(--success)] mt-1">+47 this month</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Active Companies</div>
          <div className="text-3xl font-bold text-[var(--foreground)]">284</div>
          <div className="text-xs text-[var(--success)] mt-1">+12 this month</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Engagement Score</div>
          <div className="text-3xl font-bold text-[var(--foreground)]">7.8</div>
          <div className="text-xs text-[var(--success)] mt-1">↑ 0.3 vs last month</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">At-Risk Accounts</div>
          <div className="text-3xl font-bold text-[var(--foreground)]">12</div>
          <div className="text-xs text-red-500 mt-1">Requires attention</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        <ChartCard
          title="Contact Growth Over Time"
          description="New contacts added per month"
        >
          <LineChart data={contactGrowthData} color="#8b5cf6" />
        </ChartCard>

        <ChartCard
          title="Engagement Score Distribution"
          description="Contacts by engagement level"
        >
          <BarChart data={engagementDistributionData} />
        </ChartCard>

        <ChartCard
          title="Contact Source Analysis"
          description="Where contacts are coming from"
        >
          <PieChart data={contactSourceData} />
        </ChartCard>

        <ChartCard
          title="Company Size Distribution"
          description="Breakdown by employee count"
        >
          <BarChart data={companySizeData} />
        </ChartCard>
      </div>

      {/* Tables */}
      <DataTable
        title="Top Engaged Contacts"
        description="Most active contacts by interaction volume"
        columns={[
          { key: 'contact', label: 'Contact' },
          { key: 'company', label: 'Company' },
          { key: 'title', label: 'Title' },
          { key: 'engagementScore', label: 'Engagement Score', align: 'right' },
          { key: 'lastActivity', label: 'Last Activity' },
          { key: 'totalActivities', label: 'Total Activities', align: 'right' }
        ]}
        data={[
          { contact: 'Marcus Chen', company: 'BuildPro Corp', title: 'VP Engineering', engagementScore: 9.2, lastActivity: '2024-11-23', totalActivities: 47 },
          { contact: 'Jennifer Wu', company: 'TechStart Inc', title: 'Project Manager', engagementScore: 8.8, lastActivity: '2024-11-24', totalActivities: 42 },
          { contact: 'David Park', company: 'Green Energy', title: 'Facilities Director', engagementScore: 8.5, lastActivity: '2024-11-22', totalActivities: 38 }
        ]}
        pageSize={5}
      />

      <DataTable
        title="Key Accounts"
        description="Highest value companies and their health"
        columns={[
          { key: 'company', label: 'Company' },
          { key: 'totalRevenue', label: 'Total Revenue', align: 'right' },
          { key: 'openOpportunities', label: 'Open Opportunities', align: 'right' },
          { key: 'contacts', label: 'Contacts', align: 'right' },
          { key: 'healthScore', label: 'Health Score', align: 'right' },
          { key: 'lastTouch', label: 'Last Touch' }
        ]}
        data={[
          { company: 'BuildPro Corp', totalRevenue: '$2.4M', openOpportunities: 8, contacts: 23, healthScore: 9.1, lastTouch: '2024-11-23' },
          { company: 'TechStart Inc', totalRevenue: '$1.8M', openOpportunities: 5, contacts: 18, healthScore: 8.7, lastTouch: '2024-11-24' },
          { company: 'Urban Development', totalRevenue: '$1.5M', openOpportunities: 6, contacts: 15, healthScore: 8.2, lastTouch: '2024-11-22' }
        ]}
        pageSize={5}
      />

      <DataTable
        title="Inactive Contacts"
        description="Contacts with no activity in 90+ days"
        columns={[
          { key: 'contact', label: 'Contact' },
          { key: 'company', label: 'Company' },
          { key: 'title', label: 'Title' },
          { key: 'lastActivity', label: 'Last Activity' },
          { key: 'daysInactive', label: 'Days Inactive', align: 'right' },
          { key: 'owner', label: 'Owner' }
        ]}
        data={[
          { contact: 'Robert Lee', company: 'Coastal Builders', title: 'Procurement', lastActivity: '2024-08-15', daysInactive: 101, owner: 'Mike Thompson' },
          { contact: 'Amanda Garcia', company: 'Metro Transit', title: 'Engineer', lastActivity: '2024-08-20', daysInactive: 96, owner: 'John Davis' }
        ]}
        pageSize={5}
      />
    </div>
  );
}

// Forecast Tab
function ForecastTab() {
  // Sample data for 12-month forecast
  const forecastData = [
    { label: 'Dec', value: 358 },
    { label: 'Jan', value: 385 },
    { label: 'Feb', value: 402 },
    { label: 'Mar', value: 420 },
    { label: 'Apr', value: 395 },
    { label: 'May', value: 445 },
    { label: 'Jun', value: 468 },
    { label: 'Jul', value: 455 },
    { label: 'Aug', value: 485 },
    { label: 'Sep', value: 502 },
    { label: 'Oct', value: 520 },
    { label: 'Nov', value: 545 }
  ];

  // Sample data for forecast vs actual (last 6 months)
  const forecastVsActualData = [
    { label: 'Jun', value: 308 }, // actual
    { label: 'Jul', value: 285 },
    { label: 'Aug', value: 312 },
    { label: 'Sep', value: 298 },
    { label: 'Oct', value: 325 },
    { label: 'Nov', value: 342 }
  ];

  // Sample data for forecast by stage (weighted pipeline)
  const forecastByStageData = [
    { label: 'Commit', value: 828, color: '#10b981' },
    { label: 'Best Case', value: 1040, color: '#3b82f6' },
    { label: 'Pipeline', value: 1080, color: '#f59e0b' },
    { label: 'Upside', value: 340, color: '#8b5cf6' }
  ];

  // Sample data for forecast by product line
  const forecastByProductData = [
    { label: 'Lighting', value: 445 },
    { label: 'HVAC', value: 385 },
    { label: 'Energy Mgmt', value: 298 },
    { label: 'Automation', value: 252 }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-1">Revenue Forecast</h2>
        <p className="text-sm text-[var(--muted-foreground)]">Predict future revenue based on pipeline and historical data</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Q4 Forecast</div>
          <div className="text-3xl font-bold text-[var(--foreground)]">$1.2M</div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">Confidence: 85%</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Next Quarter</div>
          <div className="text-3xl font-bold text-[var(--foreground)]">$1.4M</div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">Confidence: 72%</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Annual Projection</div>
          <div className="text-3xl font-bold text-[var(--foreground)]">$4.8M</div>
          <div className="text-xs text-[var(--success)] mt-1">120% of goal</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Forecast Accuracy</div>
          <div className="text-3xl font-bold text-[var(--foreground)]">92%</div>
          <div className="text-xs text-[var(--success)] mt-1">Based on last 6 months</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        <ChartCard
          title="Revenue Forecast (Next 12 Months)"
          description="Projected revenue trend ($K)"
        >
          <LineChart data={forecastData} color="#3b82f6" />
        </ChartCard>

        <ChartCard
          title="Forecast vs Actual (Last 6M)"
          description="Historical forecast accuracy ($K)"
        >
          <LineChart data={forecastVsActualData} color="#10b981" />
        </ChartCard>

        <ChartCard
          title="Forecast by Confidence Level"
          description="Weighted pipeline breakdown ($K)"
        >
          <BarChart data={forecastByStageData} />
        </ChartCard>

        <ChartCard
          title="Forecast by Product Line"
          description="Projected revenue by offering ($K)"
        >
          <BarChart data={forecastByProductData} />
        </ChartCard>
      </div>

      {/* Tables */}
      <DataTable
        title="Forecast Breakdown"
        description="Detailed monthly forecast for next quarter"
        columns={[
          { key: 'month', label: 'Month' },
          { key: 'bestCase', label: 'Best Case', align: 'right' },
          { key: 'mostLikely', label: 'Most Likely', align: 'right' },
          { key: 'worstCase', label: 'Worst Case', align: 'right' },
          { key: 'weighted', label: 'Weighted', align: 'right' },
          { key: 'confidence', label: 'Confidence', align: 'right' }
        ]}
        data={[
          { month: 'December 2024', bestCase: '$580K', mostLikely: '$420K', worstCase: '$280K', weighted: '$395K', confidence: '85%' },
          { month: 'January 2025', bestCase: '$620K', mostLikely: '$465K', worstCase: '$320K', weighted: '$445K', confidence: '78%' },
          { month: 'February 2025', bestCase: '$680K', mostLikely: '$515K', worstCase: '$360K', weighted: '$495K', confidence: '72%' }
        ]}
        pageSize={5}
      />

      <DataTable
        title="Commit vs Best Case"
        description="Deals by confidence level"
        columns={[
          { key: 'category', label: 'Category' },
          { key: 'dealCount', label: 'Deal Count', align: 'right' },
          { key: 'totalValue', label: 'Total Value', align: 'right' },
          { key: 'weightedValue', label: 'Weighted Value', align: 'right' },
          { key: 'probability', label: 'Probability', align: 'right' },
          { key: 'expectedClose', label: 'Expected Close' }
        ]}
        data={[
          { category: 'Commit (90%+)', dealCount: 8, totalValue: '$920K', weightedValue: '$828K', probability: '92%', expectedClose: 'Dec 2024' },
          { category: 'Best Case (70-89%)', dealCount: 12, totalValue: '$1.3M', weightedValue: '$1.04M', probability: '80%', expectedClose: 'Jan 2025' },
          { category: 'Pipeline (50-69%)', dealCount: 18, totalValue: '$1.8M', weightedValue: '$1.08M', probability: '60%', expectedClose: 'Feb 2025' },
          { category: 'Upside (<50%)', dealCount: 9, totalValue: '$850K', weightedValue: '$340K', probability: '40%', expectedClose: 'Mar 2025' }
        ]}
        pageSize={10}
      />
    </div>
  );
}

// Performance Metrics Tab
function PerformanceMetricsTab() {
  // Sample data for revenue growth rate
  const revenueGrowthData = [
    { label: 'Jan', value: 8.2 },
    { label: 'Feb', value: 9.4 },
    { label: 'Mar', value: 5.2 },
    { label: 'Apr', value: -11.0 },
    { label: 'May', value: 17.5 },
    { label: 'Jun', value: 4.4 },
    { label: 'Jul', value: -7.5 },
    { label: 'Aug', value: 9.5 },
    { label: 'Sep', value: -4.5 },
    { label: 'Oct', value: 9.1 },
    { label: 'Nov', value: 5.2 },
    { label: 'Dec', value: 4.7 }
  ];

  // Sample data for CAC trend
  const cacTrendData = [
    { label: 'Jan', value: 14.5 },
    { label: 'Feb', value: 13.8 },
    { label: 'Mar', value: 14.2 },
    { label: 'Apr', value: 13.5 },
    { label: 'May', value: 12.9 },
    { label: 'Jun', value: 12.5 },
    { label: 'Jul', value: 12.8 },
    { label: 'Aug', value: 12.3 },
    { label: 'Sep', value: 12.1 },
    { label: 'Oct', value: 11.8 },
    { label: 'Nov', value: 12.0 },
    { label: 'Dec', value: 11.5 }
  ];

  // Sample data for lead to customer funnel
  const conversionFunnelData = [
    { label: 'Leads', value: 2400, count: 2400 },
    { label: 'Qualified', value: 1680, count: 1680 },
    { label: 'Opportunity', value: 840, count: 840 },
    { label: 'Proposal', value: 420, count: 420 },
    { label: 'Customer', value: 142, count: 142 }
  ];

  // Sample data for sales efficiency (quarterly performance)
  const salesEfficiencyData = [
    { label: 'Q1', value: 0.82, color: '#f59e0b' },
    { label: 'Q2', value: 0.95, color: '#10b981' },
    { label: 'Q3', value: 0.88, color: '#10b981' },
    { label: 'Q4', value: 1.12, color: '#10b981' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-1">Key Performance Indicators</h2>
        <p className="text-sm text-[var(--muted-foreground)]">Executive dashboard with critical business metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Customer Lifetime Value</div>
          <div className="text-3xl font-bold text-[var(--foreground)]">$247K</div>
          <div className="text-xs text-[var(--success)] mt-1">↑ 18% YoY</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">CAC</div>
          <div className="text-3xl font-bold text-[var(--foreground)]">$12K</div>
          <div className="text-xs text-[var(--success)] mt-1">↓ 8% vs last quarter</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">CAC:LTV Ratio</div>
          <div className="text-3xl font-bold text-[var(--foreground)]">1:20</div>
          <div className="text-xs text-[var(--success)] mt-1">Healthy ratio</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Monthly Recurring</div>
          <div className="text-3xl font-bold text-[var(--foreground)]">$184K</div>
          <div className="text-xs text-[var(--success)] mt-1">↑ 12% MoM</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        <ChartCard
          title="Revenue Growth Rate"
          description="Month-over-month growth (%)"
        >
          <LineChart data={revenueGrowthData} color="#10b981" />
        </ChartCard>

        <ChartCard
          title="Customer Acquisition Cost Trend"
          description="CAC over time ($K)"
        >
          <LineChart data={cacTrendData} color="#ef4444" />
        </ChartCard>

        <ChartCard
          title="Lead to Customer Conversion"
          description="Full funnel conversion rates"
        >
          <FunnelChart data={conversionFunnelData} />
        </ChartCard>

        <ChartCard
          title="Sales Efficiency by Quarter"
          description="Magic number (>1.0 is excellent)"
        >
          <BarChart data={salesEfficiencyData} />
        </ChartCard>
      </div>

      {/* Tables */}
      <DataTable
        title="Executive Summary"
        description="Key metrics dashboard"
        columns={[
          { key: 'metric', label: 'Metric' },
          { key: 'current', label: 'Current', align: 'right' },
          { key: 'target', label: 'Target', align: 'right' },
          { key: 'vsTarget', label: 'vs Target', align: 'right' },
          { key: 'lastMonth', label: 'Last Month', align: 'right' },
          { key: 'momChange', label: 'MoM Change', align: 'right' }
        ]}
        data={[
          { metric: 'Revenue', current: '$3.1M', target: '$3.5M', vsTarget: '89%', lastMonth: '$2.8M', momChange: '+11%' },
          { metric: 'New Customers', current: 23, target: 25, vsTarget: '92%', lastMonth: 19, momChange: '+21%' },
          { metric: 'Pipeline Value', current: '$4.2M', target: '$4.0M', vsTarget: '105%', lastMonth: '$3.9M', momChange: '+8%' },
          { metric: 'Win Rate', current: '34%', target: '35%', vsTarget: '97%', lastMonth: '36%', momChange: '-2%' },
          { metric: 'Avg Sales Cycle', current: '42d', target: '45d', vsTarget: '107%', lastMonth: '47d', momChange: '-11%' }
        ]}
        pageSize={10}
      />

      <DataTable
        title="Product Performance"
        description="Performance by product/service line"
        columns={[
          { key: 'product', label: 'Product' },
          { key: 'revenue', label: 'Revenue', align: 'right' },
          { key: 'deals', label: 'Deals', align: 'right' },
          { key: 'avgDealSize', label: 'Avg Deal Size', align: 'right' },
          { key: 'marginPercent', label: 'Margin %', align: 'right' },
          { key: 'growthPercent', label: 'Growth %', align: 'right' }
        ]}
        data={[
          { product: 'Lighting Controls', revenue: '$1.2M', deals: 14, avgDealSize: '$86K', marginPercent: '32%', growthPercent: '+18%' },
          { product: 'HVAC Controls', revenue: '$980K', deals: 11, avgDealSize: '$89K', marginPercent: '28%', growthPercent: '+12%' },
          { product: 'Energy Management', revenue: '$720K', deals: 8, avgDealSize: '$90K', marginPercent: '35%', growthPercent: '+22%' },
          { product: 'Building Automation', revenue: '$620K', deals: 7, avgDealSize: '$89K', marginPercent: '30%', growthPercent: '+8%' }
        ]}
        pageSize={10}
      />

      <DataTable
        title="Regional Performance"
        description="Sales performance by territory/region"
        columns={[
          { key: 'region', label: 'Region' },
          { key: 'revenue', label: 'Revenue', align: 'right' },
          { key: 'deals', label: 'Deals', align: 'right' },
          { key: 'quotaPercent', label: 'Quota %', align: 'right' },
          { key: 'winRate', label: 'Win Rate', align: 'right' },
          { key: 'reps', label: 'Reps', align: 'right' }
        ]}
        data={[
          { region: 'Northeast', revenue: '$1.2M', deals: 15, quotaPercent: '92%', winRate: '36%', reps: 3 },
          { region: 'Southeast', revenue: '$890K', deals: 11, quotaPercent: '85%', winRate: '32%', reps: 2 },
          { region: 'Midwest', revenue: '$780K', deals: 9, quotaPercent: '88%', winRate: '34%', reps: 2 },
          { region: 'West', revenue: '$650K', deals: 8, quotaPercent: '78%', winRate: '30%', reps: 2 }
        ]}
        pageSize={10}
      />
    </div>
  );
}

export default function AnalyticsContent() {
  const [activeTab, setActiveTab] = useState<TabId>('activity');

  const tabs: Tab[] = [
    {
      id: 'activity',
      name: 'Activity Reports',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      ),
    },
    {
      id: 'pipeline',
      name: 'Pipeline Reports',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3L2 12h3v8h14v-8h3L12 3z"/>
        </svg>
      ),
    },
    {
      id: 'sales',
      name: 'Sales Performance',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      ),
    },
    {
      id: 'contacts',
      name: 'Contacts & Companies',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      id: 'forecast',
      name: 'Revenue Forecast',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      ),
    },
    {
      id: 'performance',
      name: 'KPIs & Metrics',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20V10"/>
          <path d="M18 20V4"/>
          <path d="M6 20v-4"/>
        </svg>
      ),
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'activity':
        return <ActivityReportsTab />;
      case 'pipeline':
        return <PipelineReportsTab />;
      case 'sales':
        return <SalesPerformanceTab />;
      case 'contacts':
        return <ContactCompanyAnalyticsTab />;
      case 'forecast':
        return <ForecastTab />;
      case 'performance':
        return <PerformanceMetricsTab />;
      default:
        return <ActivityReportsTab />;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)]">
      {/* Sticky Header with Tabs */}
      <div className="sticky top-0 bg-[var(--background)] border-b border-[var(--border)] z-10">
        <div className="px-6 pt-6 pb-4">
          <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-1">Analytics</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Comprehensive reporting and insights for data-driven decision making
          </p>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[var(--card)] text-[var(--foreground)] border-t border-l border-r border-[var(--border)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
                }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {renderTabContent()}
      </div>
    </main>
  );
}

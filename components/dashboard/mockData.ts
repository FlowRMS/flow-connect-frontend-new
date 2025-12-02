/**
 * Dashboard Mock Data
 * 
 * @deprecated This file is deprecated. The dashboard now uses real data from the CRM API.
 * See useActivityFeed hook for the actual data fetching implementation.
 * 
 * This file is kept for reference purposes only and will be removed in a future update.
 */

import type { Activity } from './types';

// Mock data has been deprecated in favor of real CRM data
// The activity feed now fetches from:
// - Jobs (findLandingPages with sourceType: JOBS)
// - Companies (findLandingPages with sourceType: COMPANIES)
// - Contacts (findLandingPages with sourceType: CONTACTS)
// - Pre-Opportunities (findLandingPages with sourceType: PRE_OPPORTUNITIES)
// - Notes (findLandingPages with sourceType: NOTES)
// - Tasks (findLandingPages with sourceType: TASKS)

export const mockActivities: Activity[] = [];

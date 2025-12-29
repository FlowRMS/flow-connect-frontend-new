'use client';

import { useEffect, useState } from 'react';
import { checkAuthAsync } from '@/lib/analytics/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * AuthGuard for Analytics pages
 * 
 * In the CRM, authentication is handled by CRM middleware (WorkOS).
 * This guard checks if the user has a valid token by calling the async auth check.
 * If the user is not authenticated, the CRM middleware will redirect them.
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      try {
        // Use async check which fetches token from WorkOS
        const authenticated = await checkAuthAsync();
        if (mounted) {
          setIsAuth(authenticated);
        }
      } catch (error) {
        console.error('[AuthGuard] Auth check failed:', error);
        if (mounted) {
          // If auth check fails, let CRM middleware handle it
          // Just render children - middleware will redirect if needed
          setIsAuth(true);
        }
      }
    };

    checkAuth();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Show loading spinner while checking auth
  if (isAuth === null) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render children - CRM middleware handles actual auth redirects
  return <>{children}</>;
}

// @ts-strict-ignore
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { send } from 'loot-core/src/platform/client/fetch';
import type { ScreenContext } from 'loot-core/src/types/models/ai-chat';

import { useAccounts } from './useAccounts';

export function useScreenContext() {
  const location = useLocation();
  const accounts = useAccounts();

  useEffect(() => {
    const captureContext = async () => {
      const pathname = location.pathname;
      const context: ScreenContext = {
        route: pathname,
        type: getScreenType(pathname),
        data: {},
        timestamp: Date.now(),
      };

      // Capture screen-specific data
      if (pathname.startsWith('/accounts/')) {
        const accountId = pathname.split('/')[2];
        context.data.accountId = accountId;
        
        // Get visible transactions if on account screen
        // This would be enhanced to capture actual visible data
      } else if (pathname.startsWith('/budget')) {
        // Extract current month from URL or state
        const searchParams = new URLSearchParams(location.search);
        context.data.currentMonth = searchParams.get('month') || undefined;
      } else if (pathname.startsWith('/reports')) {
        // Capture report type and filters
        context.data.reportData = {}; // Would capture actual report state
      }

      // Send context to backend (non-blocking)
      try {
        // Note: This would need a handler to receive context
        // For now, context is captured client-side and sent with messages
      } catch (error) {
        console.error('Failed to capture screen context:', error);
      }
    };

    captureContext();
  }, [location, accounts]);

  const getScreenContext = (): ScreenContext => {
    const pathname = location.pathname;
    return {
      route: pathname,
      type: getScreenType(pathname),
      data: {}, // Would capture actual visible data
      timestamp: Date.now(),
    };
  };

  return { getScreenContext };
}

function getScreenType(pathname: string): ScreenContext['type'] {
  if (pathname.startsWith('/budget')) return 'budget';
  if (pathname.startsWith('/accounts')) return 'transactions';
  if (pathname.startsWith('/reports')) return 'reports';
  if (pathname.startsWith('/settings')) return 'settings';
  if (pathname === '/' || pathname.startsWith('/dashboard')) return 'dashboard';
  return 'dashboard';
}

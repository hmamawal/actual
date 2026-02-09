import { useLocation } from 'react-router';

export type ScreenContext = {
  currentRoute: string;
  screenName: string;
  description: string;
};

/**
 * Maps routes to user-friendly screen names and descriptions
 */
const ROUTE_INFO: Record<string, { name: string; description: string }> = {
  '/budget': {
    name: 'Budget',
    description: 'Monthly budget view showing categories, spending, and available amounts',
  },
  '/accounts': {
    name: 'Accounts',
    description: 'List of all accounts and their balances',
  },
  '/reports': {
    name: 'Reports',
    description: 'Financial reports and analytics dashboard',
  },
  '/schedules': {
    name: 'Schedules',
    description: 'Recurring transactions and bill schedules',
  },
  '/payees': {
    name: 'Payees',
    description: 'List of all payees and merchants',
  },
  '/rules': {
    name: 'Rules',
    description: 'Transaction rules for automatic categorization',
  },
  '/settings': {
    name: 'Settings',
    description: 'Application settings and preferences',
  },
  '/tags': {
    name: 'Tags',
    description: 'Tag management for organizing transactions',
  },
  '/bank-sync': {
    name: 'Bank Sync',
    description: 'Bank synchronization settings',
  },
};

/**
 * Hook to get current screen context
 * Returns information about the current route/screen the user is viewing
 */
export function useScreenContext(): ScreenContext {
  const location = useLocation();
  const pathname = location.pathname;

  // Check for exact matches first
  if (ROUTE_INFO[pathname]) {
    return {
      currentRoute: pathname,
      screenName: ROUTE_INFO[pathname].name,
      description: ROUTE_INFO[pathname].description,
    };
  }

  // Check for partial matches (e.g., /accounts/123, /reports/net-worth)
  for (const [route, info] of Object.entries(ROUTE_INFO)) {
    if (pathname.startsWith(route)) {
      // Handle special cases for sub-routes
      if (pathname.startsWith('/accounts/')) {
        return {
          currentRoute: pathname,
          screenName: 'Account Details',
          description: 'Detailed view of a specific account with transactions',
        };
      }
      if (pathname.startsWith('/reports/')) {
        const reportName = pathname.split('/')[2];
        return {
          currentRoute: pathname,
          screenName: `${formatReportName(reportName)} Report`,
          description: `Viewing ${formatReportName(reportName)} report with charts and analysis`,
        };
      }

      return {
        currentRoute: pathname,
        screenName: info.name,
        description: info.description,
      };
    }
  }

  // Default for unknown routes
  return {
    currentRoute: pathname,
    screenName: 'Unknown Screen',
    description: 'Current screen',
  };
}

/**
 * Formats report names from URL slugs
 */
function formatReportName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

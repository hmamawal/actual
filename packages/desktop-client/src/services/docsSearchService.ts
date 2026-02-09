/**
 * Documentation Search Service
 * 
 * Provides search functionality over Actual Budget documentation.
 * This service creates an in-memory search index of documentation topics
 * and allows searching for relevant documentation via the /docs command.
 */

type DocEntry = {
  title: string;
  category: string;
  url: string;
  description: string;
  keywords: string[];
};

/**
 * Documentation index - key documentation topics
 * This is a curated list of important documentation pages
 * Full text search would require a more sophisticated approach
 */
const DOCS_INDEX: DocEntry[] = [
  // Getting Started
  {
    title: 'Getting Started',
    category: 'Basics',
    url: 'https://actualbudget.org/docs/getting-started',
    description: 'Introduction to Actual Budget and how to get started with budgeting',
    keywords: ['start', 'begin', 'intro', 'introduction', 'basics', 'new user', 'setup'],
  },
  {
    title: 'Budgeting - The Basics',
    category: 'Budgeting',
    url: 'https://actualbudget.org/docs/budgeting',
    description: 'Learn the fundamentals of budgeting in Actual Budget',
    keywords: ['budget', 'budgeting', 'basics', 'categories', 'envelope', 'zero-based'],
  },

  // Tour
  {
    title: 'User Interface Tour',
    category: 'Tour',
    url: 'https://actualbudget.org/docs/tour/user-interface',
    description: 'Complete tour of the Actual Budget user interface',
    keywords: ['ui', 'interface', 'layout', 'navigation', 'tour'],
  },
  {
    title: 'Budget View',
    category: 'Tour',
    url: 'https://actualbudget.org/docs/tour/budget',
    description: 'Understanding the budget view and how to use it',
    keywords: ['budget', 'view', 'categories', 'spending', 'income'],
  },
  {
    title: 'Accounts',
    category: 'Tour',
    url: 'https://actualbudget.org/docs/tour/accounts',
    description: 'Managing your accounts in Actual Budget',
    keywords: ['accounts', 'bank', 'checking', 'savings', 'credit card'],
  },
  {
    title: 'Reports',
    category: 'Tour',
    url: 'https://actualbudget.org/docs/tour/reports',
    description: 'Understanding and using reports',
    keywords: ['reports', 'analytics', 'graphs', 'charts', 'spending', 'net worth'],
  },
  {
    title: 'Rules',
    category: 'Tour',
    url: 'https://actualbudget.org/docs/tour/rules',
    description: 'Creating and managing transaction rules',
    keywords: ['rules', 'automation', 'auto-assign', 'categories', 'payees'],
  },
  {
    title: 'Schedules',
    category: 'Tour',
    url: 'https://actualbudget.org/docs/tour/schedules',
    description: 'Setting up recurring transactions and schedules',
    keywords: ['schedules', 'recurring', 'automatic', 'bills', 'income'],
  },

  // Accounts
  {
    title: 'Account Reconciliation',
    category: 'Accounts',
    url: 'https://actualbudget.org/docs/accounts/reconciliation',
    description: 'How to reconcile your accounts with bank statements',
    keywords: ['reconcile', 'reconciliation', 'balance', 'verify', 'bank statement'],
  },

  // Reports
  {
    title: 'Custom Reports',
    category: 'Reports',
    url: 'https://actualbudget.org/docs/reports/custom-reports',
    description: 'Creating custom reports to analyze your finances',
    keywords: ['custom reports', 'reports', 'analytics', 'filters', 'queries'],
  },

  // Transactions
  {
    title: 'Managing Transactions',
    category: 'Transactions',
    url: 'https://actualbudget.org/docs/transactions',
    description: 'Adding, editing, and organizing transactions',
    keywords: ['transactions', 'add', 'edit', 'split', 'transfer', 'payee'],
  },

  // Settings
  {
    title: 'Settings',
    category: 'Settings',
    url: 'https://actualbudget.org/docs/settings',
    description: 'Configuring Actual Budget settings',
    keywords: ['settings', 'preferences', 'configuration', 'options'],
  },

  // Advanced
  {
    title: 'Bank Sync',
    category: 'Advanced',
    url: 'https://actualbudget.org/docs/advanced/bank-sync',
    description: 'Setting up automatic bank synchronization',
    keywords: ['bank sync', 'automatic', 'import', 'download', 'gocardless', 'simplefin'],
  },
  {
    title: 'GoCardless Bank Sync',
    category: 'Advanced',
    url: 'https://actualbudget.org/docs/advanced/bank-sync/gocardless',
    description: 'Setting up GoCardless for automatic bank sync',
    keywords: ['gocardless', 'bank sync', 'europe', 'automatic'],
  },
  {
    title: 'SimpleFIN Bank Sync',
    category: 'Advanced',
    url: 'https://actualbudget.org/docs/advanced/bank-sync/simplefin',
    description: 'Setting up SimpleFIN for automatic bank sync',
    keywords: ['simplefin', 'bank sync', 'usa', 'automatic'],
  },

  // API
  {
    title: 'API Reference',
    category: 'API',
    url: 'https://actualbudget.org/docs/api',
    description: 'Using the Actual Budget API for automation and integrations',
    keywords: ['api', 'javascript', 'nodejs', 'automation', 'integration', 'programming'],
  },
  {
    title: 'ActualQL Query Language',
    category: 'API',
    url: 'https://actualbudget.org/docs/api/actual-ql',
    description: 'Query language for advanced data queries',
    keywords: ['actualql', 'query', 'language', 'data', 'filter', 'search'],
  },

  // Migration
  {
    title: 'Migrating to Actual',
    category: 'Migration',
    url: 'https://actualbudget.org/docs/migration',
    description: 'How to migrate from other budgeting apps to Actual',
    keywords: ['migrate', 'migration', 'import', 'ynab', 'mint', 'transfer'],
  },

  // Troubleshooting
  {
    title: 'Troubleshooting',
    category: 'Troubleshooting',
    url: 'https://actualbudget.org/docs/troubleshooting',
    description: 'Common issues and how to resolve them',
    keywords: ['troubleshoot', 'problems', 'issues', 'errors', 'help', 'fix'],
  },

  // Contributing
  {
    title: 'Contributing to Actual',
    category: 'Contributing',
    url: 'https://actualbudget.org/docs/contributing',
    description: 'How to contribute to the Actual Budget project',
    keywords: ['contribute', 'contributing', 'development', 'open source', 'github'],
  },
];

export type DocSearchResult = {
  title: string;
  category: string;
  url: string;
  description: string;
  relevance: number;
};

/**
 * Searches documentation based on query
 * @param query - Search query
 * @param maxResults - Maximum number of results to return
 * @returns Array of matching documentation entries
 */
export function searchDocs(
  query: string,
  maxResults: number = 5,
): DocSearchResult[] {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

  // Score each doc entry
  const scored = DOCS_INDEX.map(doc => {
    let score = 0;

    // Check title
    if (doc.title.toLowerCase().includes(queryLower)) {
      score += 50;
    }

    // Check keywords
    doc.keywords.forEach(keyword => {
      if (keyword.includes(queryLower)) {
        score += 30;
      }
      queryWords.forEach(word => {
        if (keyword.includes(word)) {
          score += 10;
        }
      });
    });

    // Check description
    if (doc.description.toLowerCase().includes(queryLower)) {
      score += 20;
    }

    // Check category
    if (doc.category.toLowerCase().includes(queryLower)) {
      score += 15;
    }

    return {
      ...doc,
      relevance: score,
    };
  });

  // Filter and sort
  return scored
    .filter(doc => doc.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxResults);
}

/**
 * Formats documentation search results for chat display
 * @param results - Array of search results
 * @param query - The original search query
 * @returns Markdown formatted string
 */
export function formatDocsForChat(
  results: DocSearchResult[],
  query: string,
): string {
  if (results.length === 0) {
    return `**No documentation found for:** "${query}"\n\nTry searching for topics like: budgeting, reports, accounts, bank sync, rules, schedules`;
  }

  const formattedResults = results
    .map((result, index) => {
      return `**${index + 1}. [${result.title}](${result.url})**\n*${result.category}*\n${result.description}`;
    })
    .join('\n\n---\n\n');

  return `**📚 Documentation for:** "${query}"\n\n${formattedResults}\n\n---\n\n*View all documentation at: https://actualbudget.org/docs*`;
}

/**
 * Formats documentation search results for AI consumption
 * @param results - Array of search results
 * @returns Formatted string for AI context
 */
export function formatDocsForAI(results: DocSearchResult[]): string {
  if (results.length === 0) {
    return 'No documentation found.';
  }

  const formattedResults = results
    .map((result, index) => {
      return `
${index + 1}. ${result.title} (${result.category})
   URL: ${result.url}
   ${result.description}
`.trim();
    })
    .join('\n\n');

  return `Actual Budget Documentation:\n${'='.repeat(50)}\n\n${formattedResults}`;
}

/**
 * Gets a list of popular documentation topics
 * @returns Array of popular topics
 */
export function getPopularTopics(): string[] {
  return [
    'Getting Started',
    'Budgeting Basics',
    'Reports',
    'Bank Sync',
    'Rules',
    'Schedules',
    'API',
    'Troubleshooting',
  ];
}

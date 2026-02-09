/**
 * Google Search Service
 * 
 * Provides web search functionality using Google's Custom Search JSON API.
 * 
 * Setup Instructions:
 * 1. Get a Google API key: https://console.cloud.google.com/apis/credentials
 * 2. Create a Custom Search Engine: https://programmablesearchengine.google.com/
 * 3. Add keys to .env.local:
 *    VITE_GOOGLE_API_KEY=your-api-key
 *    VITE_GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id
 */

export type SearchResult = {
  title: string;
  link: string;
  snippet: string;
  displayLink?: string;
};

type GoogleSearchResponse = {
  items?: Array<{
    title: string;
    link: string;
    snippet: string;
    displayLink?: string;
  }>;
  error?: {
    message: string;
  };
};

/**
 * Performs a web search using Google Custom Search API
 * @param query - The search query
 * @param numResults - Number of results to return (default: 5, max: 10)
 * @returns Array of search results
 */
export async function searchWeb(
  query: string,
  numResults: number = 5,
): Promise<SearchResult[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  const searchEngineId = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    throw new Error(
      'Google Search is not configured. Please add VITE_GOOGLE_API_KEY and VITE_GOOGLE_SEARCH_ENGINE_ID to your .env.local file. See .env.local.example for details.',
    );
  }

  if (
    apiKey === 'your-google-api-key-here' ||
    searchEngineId === 'your-search-engine-id-here'
  ) {
    throw new Error(
      'Please replace the placeholder values in .env.local with your actual Google API credentials.',
    );
  }

  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.append('key', apiKey);
  url.searchParams.append('cx', searchEngineId);
  url.searchParams.append('q', query);
  url.searchParams.append('num', Math.min(numResults, 10).toString());

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData: GoogleSearchResponse = await response.json();
      throw new Error(
        errorData.error?.message ||
          `Search failed with status ${response.status}`,
      );
    }

    const data: GoogleSearchResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      return [];
    }

    return data.items.map(item => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      displayLink: item.displayLink,
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to perform web search');
  }
}

/**
 * Formats search results for AI consumption
 * @param results - Array of search results
 * @returns Formatted string for AI context
 */
export function formatSearchResultsForAI(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No search results found.';
  }

  const formattedResults = results
    .map((result, index) => {
      return `
${index + 1}. ${result.title}
   URL: ${result.link}
   ${result.snippet}
${result.displayLink ? `   Source: ${result.displayLink}` : ''}
`.trim();
    })
    .join('\n\n');

  return `Web Search Results:\n${'='.repeat(50)}\n\n${formattedResults}`;
}

/**
 * Formats search results for display in chat
 * @param results - Array of search results
 * @param query - The original search query
 * @returns Markdown formatted string for chat display
 */
export function formatSearchResultsForChat(
  results: SearchResult[],
  query: string,
): string {
  if (results.length === 0) {
    return `**No results found for:** "${query}"`;
  }

  const formattedResults = results
    .map((result, index) => {
      return `**${index + 1}. [${result.title}](${result.link})**\n${result.snippet}\n*Source: ${result.displayLink || result.link}*`;
    })
    .join('\n\n---\n\n');

  return `**Web Search Results for:** "${query}"\n\n${formattedResults}`;
}

/**
 * Checks if Google Search is configured and available
 * @returns true if search is configured
 */
export function isSearchConfigured(): boolean {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  const searchEngineId = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;

  return (
    !!apiKey &&
    !!searchEngineId &&
    apiKey !== 'your-google-api-key-here' &&
    searchEngineId !== 'your-search-engine-id-here'
  );
}

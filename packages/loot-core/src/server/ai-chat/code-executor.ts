// @ts-strict-ignore
import type { Visualization } from '../../types/models/ai-chat';

export class CodeExecutor {
  /**
   * Safely executes code to generate visualizations
   * Uses a restricted context with access to data and chart libraries
   */
  async executeVisualizationCode(
    code: string,
    data: unknown,
  ): Promise<{ result: unknown; visualization?: Visualization }> {
    try {
      // Create a safe execution context
      const context = this.createSafeContext(data);
      
      // Parse the code to extract chart configuration
      const chartConfig = this.extractChartConfig(code);
      
      if (chartConfig) {
        return {
          result: chartConfig,
          visualization: {
            id: this.generateId(),
            type: 'chart',
            title: chartConfig.title || 'Generated Chart',
            code,
            data,
            config: chartConfig,
          },
        };
      }

      // For table visualizations
      if (code.includes('createTable') || code.includes('table:')) {
        const tableConfig = this.extractTableConfig(code);
        return {
          result: tableConfig,
          visualization: {
            id: this.generateId(),
            type: 'table',
            title: tableConfig.title || 'Generated Table',
            code,
            data,
            config: tableConfig,
          },
        };
      }

      // Fallback: return data as-is
      return {
        result: data,
      };
    } catch (error) {
      throw new Error(`Code execution failed: ${error.message}`);
    }
  }

  private createSafeContext(data: unknown) {
    // Limited context with utility functions
    return {
      data,
      // Math utilities
      sum: (arr: number[]) => arr.reduce((a, b) => a + b, 0),
      avg: (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length,
      max: Math.max,
      min: Math.min,
      // Date utilities
      formatDate: (date: string) => new Date(date).toLocaleDateString(),
      // Data transformation
      groupBy: this.groupBy,
      sortBy: this.sortBy,
    };
  }

  private extractChartConfig(code: string): unknown | null {
    // Look for chart configuration patterns
    const patterns = [
      /createChart\s*\(\s*({[\s\S]*?})\s*\)/,
      /chart:\s*({[\s\S]*?})/,
      /{\s*type:\s*['"](?:bar|line|pie|area)['"]/,
    ];

    for (const pattern of patterns) {
      const match = code.match(pattern);
      if (match) {
        try {
          // Extract the configuration object
          const configStr = match[1] || match[0];
          // Use a safe eval alternative or return structured config
          return this.parseChartConfig(configStr);
        } catch (e) {
          continue;
        }
      }
    }

    return null;
  }

  private parseChartConfig(configStr: string): unknown {
    // Basic chart config parser
    // In production, use a proper parser or AST
    const config: {
      type?: string;
      title?: string;
      xAxis?: unknown;
      yAxis?: unknown;
      series?: unknown[];
    } = {};

    // Extract type
    const typeMatch = configStr.match(/type:\s*['"](\w+)['"]/);
    if (typeMatch) config.type = typeMatch[1];

    // Extract title
    const titleMatch = configStr.match(/title:\s*['"]([^'"]+)['"]/);
    if (titleMatch) config.title = titleMatch[1];

    // For now, return a basic structure
    // The frontend will handle the actual rendering
    return {
      ...config,
      rawConfig: configStr,
    };
  }

  private extractTableConfig(code: string): unknown {
    return {
      columns: [],
      data: [],
      rawConfig: code,
    };
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce(
      (result, item) => {
        const groupKey = String(item[key]);
        if (!result[groupKey]) {
          result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
      },
      {} as Record<string, T[]>,
    );
  }

  private sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private generateId(): string {
    return `viz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generates visualization code from a natural language description
   */
  generateVisualizationCode(
    description: string,
    dataSchema: unknown,
  ): string {
    // This would be enhanced by the AI to generate actual code
    // For now, return a template
    const descLower = description.toLowerCase();

    if (descLower.includes('bar') || descLower.includes('column')) {
      return `
// Bar chart visualization
createChart({
  type: 'bar',
  title: '${description}',
  xAxis: { /* configure x-axis */ },
  yAxis: { /* configure y-axis */ },
  series: [{ data: /* process data */ }]
})`;
    }

    if (descLower.includes('line') || descLower.includes('trend')) {
      return `
// Line chart visualization
createChart({
  type: 'line',
  title: '${description}',
  xAxis: { /* configure x-axis */ },
  yAxis: { /* configure y-axis */ },
  series: [{ data: /* process data */ }]
})`;
    }

    if (descLower.includes('pie') || descLower.includes('donut')) {
      return `
// Pie chart visualization
createChart({
  type: 'pie',
  title: '${description}',
  series: [{ data: /* process data */ }]
})`;
    }

    // Default table
    return `
// Table visualization
createTable({
  title: '${description}',
  columns: [/* define columns */],
  data: /* process data */
})`;
  }
}

// @ts-strict-ignore
import React from 'react';

import { theme } from '@actual-app/components/theme';
import type { Visualization } from 'loot-core/types/models';

import { View } from '@actual-app/components/view';
import { Text } from '@actual-app/components/text';
import { Button } from '@actual-app/components/button';

type VisualizationDisplayProps = {
  visualization: Visualization;
};

export function VisualizationDisplay({
  visualization,
}: VisualizationDisplayProps) {
  const downloadVisualization = () => {
    // TODO: Implement download functionality
    const dataStr = JSON.stringify(visualization, null, 2);
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `visualization_${visualization.id}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <View
      style={{
        padding: 15,
        border: `1px solid ${theme.pillBorder}`,
        borderRadius: 8,
        backgroundColor: theme.tableBackground,
        marginBottom: 10,
      }}
    >
      <View
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <Text style={{ fontWeight: 600 }}>{visualization.title}</Text>
        <View style={{ display: 'flex', gap: 5 }}>
          <Button variant="bare" onClick={downloadVisualization}>
            💾 Save
          </Button>
        </View>
      </View>

      {/* Render based on type */}
      {visualization.type === 'chart' && (
        <View>
          <View
            style={{
              padding: 10,
              backgroundColor: theme.pillBackground,
              borderRadius: 4,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 12, color: theme.pageTextSubdued }}>
              Chart Configuration
            </Text>
            <pre
              style={{
                margin: 0,
                marginTop: 5,
                fontSize: 11,
                overflow: 'auto',
                maxHeight: 200,
              }}
            >
              {JSON.stringify(visualization.config, null, 2)}
            </pre>
          </View>
          <Text style={{ fontSize: 12, color: theme.pageTextSubdued }}>
            Note: Chart rendering will be implemented using existing Actual
            chart libraries
          </Text>
        </View>
      )}

      {visualization.type === 'table' && (
        <View>
          <Text style={{ fontSize: 12, color: theme.pageTextSubdued }}>
            Table visualization (to be implemented)
          </Text>
        </View>
      )}

      {visualization.savedAt && (
        <Text
          style={{
            fontSize: 11,
            color: theme.pageTextSubdued,
            marginTop: 10,
          }}
        >
          Saved: {new Date(visualization.savedAt).toLocaleString()}
        </Text>
      )}
    </View>
  );
}

import { useEffect } from 'react';
import type { InfrastructureNode } from '../types';

export function useNodeStatusStream(
  onStatusChange: (nodeId: string, newStatus: string, type: string) => void,
  onNodeAdded?: (node: Partial<InfrastructureNode>) => void,
) {
  useEffect(() => {
    const es = new EventSource('/api/events');

    const statusListener = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        onStatusChange(data.nodeId, data.newStatus, data.type);
      } catch {
        // Ignore malformed events.
      }
    };

    es.addEventListener('node-status-change', statusListener as EventListener);

    let addListener: ((event: MessageEvent) => void) | undefined;
    if (onNodeAdded) {
      addListener = (event: MessageEvent) => {
        try {
          onNodeAdded(JSON.parse(event.data));
        } catch {
          // Ignore malformed events.
        }
      };
      es.addEventListener('node-added', addListener as EventListener);
    }

    return () => {
      es.removeEventListener('node-status-change', statusListener as EventListener);
      if (addListener) {
        es.removeEventListener('node-added', addListener as EventListener);
      }
      es.close();
    };
  }, [onStatusChange, onNodeAdded]);
}

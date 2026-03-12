import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useNodesInitialized,
  ReactFlowProvider,
  type Node,
  type Edge,
} from '@xyflow/react';
import CustomNode from './CustomNode';
import NodeDetailPanel from './NodeDetailPanel';
import type { GraphData, CascadeResult } from '../../types';
import { SECTOR_COLORS } from '../../types';

interface InfrastructureGraphProps {
  graphData: GraphData | null;
  cascadeResult?: CascadeResult | null;
  onNodeClick?: (nodeId: string) => void;
  onAnalyzeCascade?: (nodeId: string) => void;
  currentStep?: number;
}

const nodeTypes = { infrastructureNode: CustomNode };

function InfrastructureGraphInner({
  graphData,
  cascadeResult,
  onNodeClick,
  onAnalyzeCascade,
  currentStep,
}: InfrastructureGraphProps) {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const { fitView } = useReactFlow();
  const nodesInitialized = useNodesInitialized();
  const hasFitted = useRef(false);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Compute and sync nodes whenever data or cascade state changes
  useEffect(() => {
    if (!graphData) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const newNodes: Node[] = graphData.nodes.map((node) => {
      const impact = cascadeResult?.impactedNodes.find((n) => n.nodeId === node.id);
      const isVisible = currentStep == null || !impact || impact.propagationStep <= currentStep;
      return {
        ...node,
        data: {
          ...node.data,
          cascadeStatus: isVisible && impact ? impact.newStatus : null,
          impactScore: isVisible && impact ? impact.impactScore : null,
        },
      } as Node;
    });

    const newEdges: Edge[] = graphData.edges.map((edge) => {
      const path = cascadeResult?.propagationPaths.find(
        (p) => p.from === edge.source && p.to === edge.target
      );
      const isActive = currentStep == null || !path || path.step <= (currentStep ?? Infinity);
      return {
        ...edge,
        animated: isActive && path ? true : edge.animated,
        style: isActive && path
          ? { ...edge.style, stroke: '#EF4444', strokeWidth: 3 }
          : edge.style,
      } as Edge;
    });

    setNodes(newNodes);
    setEdges(newEdges);
    hasFitted.current = false;
  }, [graphData, cascadeResult, currentStep, setNodes, setEdges]);

  // Fit view only after nodes are measured by React Flow
  useEffect(() => {
    if (nodesInitialized && !hasFitted.current) {
      hasFitted.current = true;
      fitView({ padding: 0.15, duration: 300 });
    }
  }, [nodesInitialized, fitView]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNode(node.data);
      onNodeClick?.(node.id);
    },
    [onNodeClick]
  );

  const handlePaneClick = useCallback(() => setSelectedNode(null), []);

  if (!graphData) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-500 border-t-blue-400 rounded-full animate-spin" />
          <span>Loading graph data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full" style={{ background: '#050810' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={3}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgba(40,80,160,0.15)" gap={40} size={1} />
        <Controls className="!bg-[#0a1226] !border-[rgba(40,80,160,0.35)] !shadow-lg [&>button]:!bg-[#0a1226] [&>button]:!border-[rgba(40,80,160,0.35)] [&>button]:!text-slate-400 [&>button:hover]:!bg-[#0d1525]" />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as any;
            if (data?.cascadeStatus === 'failed') return '#EF4444';
            if (data?.cascadeStatus === 'degraded') return '#F59E0B';
            return SECTOR_COLORS[data?.type] || '#6B7280';
          }}
          className="!bg-[#0a1226] !border-[rgba(40,80,160,0.35)]"
          maskColor="rgba(5, 8, 16, 0.75)"
        />
      </ReactFlow>

      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onAnalyzeCascade={onAnalyzeCascade}
        />
      )}
    </div>
  );
}

export default function InfrastructureGraph(props: InfrastructureGraphProps) {
  return (
    <ReactFlowProvider>
      <InfrastructureGraphInner {...props} />
    </ReactFlowProvider>
  );
}

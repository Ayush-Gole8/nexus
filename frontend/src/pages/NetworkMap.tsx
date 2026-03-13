import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, RotateCcw, Box, GitBranch } from 'lucide-react';
import InfrastructureGraph from '../components/graph/InfrastructureGraph';
import MumbaiMap3D from '../components/map3d/MumbaiMap3D';
import NodeDetailPanel from '../components/graph/NodeDetailPanel';
import { getGraphData, getNodes, getDependencies } from '../api/infrastructure';
import { runBFSSimulate } from '../api/simulation';
import { useMonsoonData } from '../hooks/useMonsoonData';
import type { GraphData, InfrastructureNode, Dependency } from '../types';
import { SECTOR_COLORS, SECTOR_LABELS } from '../types';

type ViewMode = '3d' | 'graph';

export default function NetworkMap() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [filteredData, setFilteredData] = useState<GraphData | null>(null);
  const [allNodes, setAllNodes] = useState<InfrastructureNode[]>([]);
  const [allDependencies, setAllDependencies] = useState<Dependency[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [selectedNode, setSelectedNode] = useState<InfrastructureNode | null>(null);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(new Set());
  const [visibleSectors, setVisibleSectors] = useState<Set<string>>(
    () => new Set(['power', 'water', 'transport', 'telecom', 'emergency']),
  );
  const { floodZoneIds, monsoonActive, setMonsoonActive, zones } = useMonsoonData();
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [graphRes, nodesRes, depsRes] = await Promise.all([
        getGraphData(),
        getNodes(),
        getDependencies(),
      ]);
      setGraphData(graphRes);
      setFilteredData(graphRes);
      setAllNodes(nodesRes);
      setAllDependencies(depsRes);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!graphData) return;

    let nodes = graphData.nodes;
    if (sectorFilter !== 'all') {
      nodes = nodes.filter((n) => n.data.type === sectorFilter);
    }
    if (statusFilter !== 'all') {
      nodes = nodes.filter((n) => n.data.status === statusFilter);
    }

    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = graphData.edges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
    );

    setFilteredData({ nodes, edges });
  }, [graphData, sectorFilter, statusFilter]);

  const toggleLayer = useCallback((sector: string) => {
    setVisibleSectors((prev) => {
      const next = new Set(prev);
      if (next.has(sector)) next.delete(sector);
      else next.add(sector);
      return next;
    });
  }, []);

  const handleAnalyzeCascade = useCallback(
    (nodeId: string) => {
      navigate('/cascade', { state: { nodeId } });
    },
    [navigate]
  );

  const handleNodeSimulate = useCallback(async (nodeId: string) => {
    try {
      const result = await runBFSSimulate({
        originNodeId: nodeId,
        magnitude: 0.7,
        resilience: 0.3,
        monsoonActive,
        rainfall_mm: 150,
      });
      const highlighted = new Set<string>(result.affectedNodes || []);
      setHighlightedNodeIds(highlighted);
      window.setTimeout(() => setHighlightedNodeIds(new Set()), 8000);
    } catch (err) {
      console.error('Failed to simulate cascade', err);
    }
  }, [monsoonActive]);

  return (
    <div className="space-y-4 h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {viewMode === '3d' ? '3D Infrastructure Map' : 'Network Graph'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {viewMode === '3d'
              ? 'Mumbai infrastructure plotted at real coordinates — orbit, zoom & click'
              : 'Interactive infrastructure dependency graph'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden border border-slate-600">
            <button
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                viewMode === '3d'
                  ? 'bg-cyan-600/30 text-cyan-300 border-r border-slate-600'
                  : 'bg-slate-800 text-slate-400 hover:text-white border-r border-slate-600'
              }`}
            >
              <Box className="w-3.5 h-3.5" /> 3D Map
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                viewMode === 'graph'
                  ? 'bg-cyan-600/30 text-cyan-300'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" /> Graph
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white"
            >
              <option value="all">All Sectors</option>
              {Object.entries(SECTOR_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white"
            >
              <option value="all">All Status</option>
              <option value="operational">Operational</option>
              <option value="degraded">Degraded</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <button
            onClick={() => setMonsoonActive((v) => !v)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              monsoonActive
                ? 'bg-blue-600/25 border-blue-400/40 text-blue-200'
                : 'bg-slate-800 border-slate-600 text-slate-300 hover:text-white'
            }`}
          >
            Monsoon {monsoonActive ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={loadData}
            className="p-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sector Legend / Layer Toggles */}
      <div
        className="flex items-center gap-3 px-4 py-2 rounded-lg flex-wrap"
        style={{ background: 'rgba(10,18,38,0.85)', border: '1px solid rgba(40,80,160,0.35)' }}
      >
        <span
          className="text-[10px] uppercase font-semibold tracking-[2px]"
          style={{ color: '#4a6080', fontFamily: "'Share Tech Mono', monospace" }}
        >
          {viewMode === '3d' ? 'Layers:' : 'Sectors:'}
        </span>
        {Object.entries(SECTOR_LABELS).map(([sector, label]) => {
          const sColor = SECTOR_COLORS[sector];
          const isActive = viewMode !== '3d' || visibleSectors.has(sector);
          return viewMode === '3d' ? (
            <button
              key={sector}
              onClick={() => toggleLayer(sector)}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all"
              style={{
                backgroundColor: isActive ? `${sColor}18` : 'transparent',
                borderColor: isActive ? `${sColor}55` : '#1e3a5f',
                color: isActive ? sColor : '#475569',
              }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: isActive ? sColor : '#334155' }} />
              {label}
            </button>
          ) : (
            <div key={sector} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sColor }} />
              <span className="text-xs text-slate-400 capitalize">{sector}</span>
            </div>
          );
        })}
        {viewMode === '3d' ? (
          <>
            <button
              onClick={() => setVisibleSectors(new Set(Object.keys(SECTOR_LABELS)))}
              className="ml-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              All
            </button>
            <span className="text-slate-600 mx-1">|</span>
            <span className="text-[10px] text-slate-500">Drag to orbit · Scroll to zoom · Click node for details</span>
            {monsoonActive ? <span className="text-[10px] text-amber-400">· Monsoon risk overlay active</span> : null}
          </>
        ) : null}
      </div>

      {/* Main view */}
      <div
        className="flex-1 border border-[rgba(40,80,160,0.35)] rounded-xl overflow-hidden relative"
        style={{ height: 'calc(100% - 120px)', background: '#050810' }}
      >
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading Mumbai infrastructure...
            </div>
          </div>
        ) : viewMode === '3d' ? (
          <MumbaiMap3D
            nodes={allNodes}
            dependencies={allDependencies}
            sectorFilter={sectorFilter}
            statusFilter={statusFilter}
            visibleLayers={visibleSectors}
            highlightedNodeIds={highlightedNodeIds}
            monsoonActive={monsoonActive}
            monsoonZones={zones}
            onNodeSelect={setSelectedNode}
          />
        ) : (
          <InfrastructureGraph
            graphData={filteredData}
            onAnalyzeCascade={handleAnalyzeCascade}
          />
        )}

        {/* Detail panel overlay */}
        {selectedNode && viewMode === '3d' && (
          <NodeDetailPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onAnalyzeCascade={handleAnalyzeCascade}
            allNodes={allNodes}
            allEdges={allDependencies}
            monsoonActive={monsoonActive}
            floodZoneIds={floodZoneIds}
            onSimulate={handleNodeSimulate}
          />
        )}
      </div>
    </div>
  );
}

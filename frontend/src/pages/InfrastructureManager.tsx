import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2, X, Save, Link, Unlink,
  Zap, Droplets, Train, Wifi, Siren,
} from 'lucide-react';
import { getNodes, createNode, updateNode, deleteNode, getDependencies, createDependency, deleteDependency } from '../api/infrastructure';
import type { InfrastructureNode, Dependency } from '../types';
import { SECTOR_COLORS, SECTOR_LABELS, STATUS_COLORS } from '../types';

const SECTOR_ICONS: Record<string, typeof Zap> = {
  power: Zap,
  water: Droplets,
  transport: Train,
  telecom: Wifi,
  emergency: Siren,
};

const SECTORS = ['power', 'water', 'transport', 'telecom', 'emergency'] as const;
const STATUSES = ['operational', 'degraded', 'failed', 'maintenance', 'unknown'] as const;
const DEP_TYPES = ['power_supply', 'water_supply', 'data_connection', 'physical_connection', 'communication', 'backup', 'cooling'] as const;

interface NodeFormData {
  name: string;
  type: string;
  subtype: string;
  status: string;
  location: { lat: number; lng: number };
  capacity: number;
  currentLoad: number;
  criticalityScore: number;
}

const emptyNodeForm: NodeFormData = {
  name: '', type: 'power', subtype: '', status: 'operational',
  location: { lat: 19.0760, lng: 72.8777 },
  capacity: 100, currentLoad: 0, criticalityScore: 50,
};

export default function InfrastructureManager() {
  const [nodes, setNodes] = useState<InfrastructureNode[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [search, setSearch] = useState('');
  const [filterSector, setFilterSector] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [tab, setTab] = useState<'nodes' | 'dependencies'>('nodes');

  // Node modal
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [editingNode, setEditingNode] = useState<InfrastructureNode | null>(null);
  const [nodeForm, setNodeForm] = useState<NodeFormData>(emptyNodeForm);

  // Dependency modal
  const [showDepModal, setShowDepModal] = useState(false);
  const [depSource, setDepSource] = useState('');
  const [depTarget, setDepTarget] = useState('');
  const [depType, setDepType] = useState<string>(DEP_TYPES[0]);
  const [depStrength, setDepStrength] = useState(0.8);
  const [depBidirectional, setDepBidirectional] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [nodeList, depList] = await Promise.all([getNodes(), getDependencies()]);
    setNodes(nodeList);
    setDependencies(depList);
  };

  // Filtered nodes
  const filtered = nodes.filter((n) => {
    const matchSearch = n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.subtype.toLowerCase().includes(search.toLowerCase());
    const matchSector = filterSector === 'all' || n.type === filterSector;
    const matchStatus = filterStatus === 'all' || n.status === filterStatus;
    return matchSearch && matchSector && matchStatus;
  });

  // Node CRUD
  const openCreateNode = () => {
    setEditingNode(null);
    setNodeForm(emptyNodeForm);
    setShowNodeModal(true);
  };

  const openEditNode = (node: InfrastructureNode) => {
    setEditingNode(node);
    setNodeForm({
      name: node.name,
      type: node.type,
      subtype: node.subtype,
      status: node.status,
      location: node.location,
      capacity: node.capacity,
      currentLoad: node.currentLoad,
      criticalityScore: node.criticalityScore,
    });
    setShowNodeModal(true);
  };

  const handleSaveNode = useCallback(async () => {
    if (!nodeForm.name.trim()) return;
    if (editingNode) {
      await updateNode(editingNode._id, nodeForm as any);
    } else {
      await createNode(nodeForm as any);
    }
    setShowNodeModal(false);
    loadData();
  }, [nodeForm, editingNode]);

  const handleDeleteNode = async (id: string) => {
    await deleteNode(id);
    loadData();
  };

  // Dependency CRUD
  const handleCreateDep = useCallback(async () => {
    if (!depSource || !depTarget || depSource === depTarget) return;
    await createDependency({
      sourceNodeId: depSource,
      targetNodeId: depTarget,
      dependencyType: depType as any,
      strength: depStrength,
      bidirectional: depBidirectional,
    } as any);
    setShowDepModal(false);
    setDepSource('');
    setDepTarget('');
    loadData();
  }, [depSource, depTarget, depType, depStrength, depBidirectional]);

  const handleDeleteDep = async (id: string) => {
    await deleteDependency(id);
    loadData();
  };

  const getNodeName = (id: string) => nodes.find((n) => n._id === id)?.name || id;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Infrastructure Manager</h1>
          <p className="text-sm text-slate-400 mt-1">Add, edit, and manage infrastructure nodes and dependencies</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-700 pb-0">
        <button
          onClick={() => setTab('nodes')}
          className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'nodes' ? 'text-blue-400 border-blue-400' : 'text-slate-400 border-transparent hover:text-slate-300'
          }`}
        >
          Nodes ({nodes.length})
        </button>
        <button
          onClick={() => setTab('dependencies')}
          className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'dependencies' ? 'text-blue-400 border-blue-400' : 'text-slate-400 border-transparent hover:text-slate-300'
          }`}
        >
          Dependencies ({dependencies.length})
        </button>
      </div>

      {tab === 'nodes' && (
        <>
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search nodes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
            >
              <option value="all">All Sectors</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>{SECTOR_LABELS[s]}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
            >
              <option value="all">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <button
              onClick={openCreateNode}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Node
            </button>
          </div>

          {/* Nodes Table */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-xs font-medium text-slate-400 uppercase px-4 py-3">Name</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase px-4 py-3">Sector</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase px-4 py-3">Subtype</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase px-4 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase px-4 py-3">Load</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase px-4 py-3">Criticality</th>
                    <th className="text-right text-xs font-medium text-slate-400 uppercase px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((node) => {
                    const Icon = SECTOR_ICONS[node.type] || Zap;
                    const loadPct = node.capacity > 0 ? Math.round((node.currentLoad / node.capacity) * 100) : 0;
                    return (
                      <tr key={node._id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" style={{ color: SECTOR_COLORS[node.type] }} />
                            <span className="text-sm text-white font-medium">{node.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor: SECTOR_COLORS[node.type] + '20',
                              color: SECTOR_COLORS[node.type],
                            }}
                          >
                            {SECTOR_LABELS[node.type]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">{node.subtype}</td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor: STATUS_COLORS[node.status] + '20',
                              color: STATUS_COLORS[node.status],
                            }}
                          >
                            {node.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-700 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${loadPct}%`,
                                  backgroundColor: loadPct > 90 ? '#EF4444' : loadPct > 70 ? '#F59E0B' : '#10B981',
                                }}
                              />
                            </div>
                            <span className="text-xs text-slate-400">{loadPct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-mono ${
                            node.criticalityScore >= 80 ? 'text-red-400' :
                            node.criticalityScore >= 60 ? 'text-yellow-400' : 'text-slate-400'
                          }`}>
                            {node.criticalityScore}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditNode(node)}
                              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteNode(node._id)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'dependencies' && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => setShowDepModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Link className="w-4 h-4" />
              Add Dependency
            </button>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-xs font-medium text-slate-400 uppercase px-4 py-3">Source</th>
                    <th className="text-center text-xs font-medium text-slate-400 uppercase px-4 py-3">Type</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase px-4 py-3">Target</th>
                    <th className="text-center text-xs font-medium text-slate-400 uppercase px-4 py-3">Strength</th>
                    <th className="text-center text-xs font-medium text-slate-400 uppercase px-4 py-3">Bi-dir</th>
                    <th className="text-right text-xs font-medium text-slate-400 uppercase px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dependencies.map((dep) => (
                    <tr key={dep._id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3 text-sm text-white">{getNodeName(typeof dep.sourceNodeId === 'string' ? dep.sourceNodeId : dep.sourceNodeId._id)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">
                          {dep.dependencyType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white">{getNodeName(typeof dep.targetNodeId === 'string' ? dep.targetNodeId : dep.targetNodeId._id)}</td>
                      <td className="px-4 py-3 text-center text-sm font-mono text-slate-400">
                        {dep.strength.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-slate-400">
                        {dep.bidirectional ? '↔' : '→'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteDep(dep._id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Node Modal */}
      {showNodeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowNodeModal(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">{editingNode ? 'Edit Node' : 'Add Node'}</h3>
              <button onClick={() => setShowNodeModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  value={nodeForm.name}
                  onChange={(e) => setNodeForm({ ...nodeForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Sector</label>
                  <select
                    value={nodeForm.type}
                    onChange={(e) => setNodeForm({ ...nodeForm, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white"
                  >
                    {SECTORS.map((s) => (
                      <option key={s} value={s}>{SECTOR_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Subtype</label>
                  <input
                    type="text"
                    value={nodeForm.subtype}
                    onChange={(e) => setNodeForm({ ...nodeForm, subtype: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Status</label>
                <select
                  value={nodeForm.status}
                  onChange={(e) => setNodeForm({ ...nodeForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={nodeForm.capacity}
                    onChange={(e) => setNodeForm({ ...nodeForm, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Current Load</label>
                  <input
                    type="number"
                    value={nodeForm.currentLoad}
                    onChange={(e) => setNodeForm({ ...nodeForm, currentLoad: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Criticality Score: {nodeForm.criticalityScore}</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={nodeForm.criticalityScore}
                  onChange={(e) => setNodeForm({ ...nodeForm, criticalityScore: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-700">
              <button
                onClick={() => setShowNodeModal(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNode}
                disabled={!nodeForm.name.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingNode ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dependency Modal */}
      {showDepModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowDepModal(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Add Dependency</h3>
              <button onClick={() => setShowDepModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Source Node</label>
                <select
                  value={depSource}
                  onChange={(e) => setDepSource(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white"
                >
                  <option value="">Select source...</option>
                  {nodes.map((n) => (
                    <option key={n._id} value={n._id}>{n.name} ({SECTOR_LABELS[n.type]})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Target Node</label>
                <select
                  value={depTarget}
                  onChange={(e) => setDepTarget(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white"
                >
                  <option value="">Select target...</option>
                  {nodes.map((n) => (
                    <option key={n._id} value={n._id}>{n.name} ({SECTOR_LABELS[n.type]})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Type</label>
                <select
                  value={depType}
                  onChange={(e) => setDepType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white"
                >
                  {DEP_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Strength: {depStrength.toFixed(2)}</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={depStrength}
                  onChange={(e) => setDepStrength(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={depBidirectional}
                  onChange={(e) => setDepBidirectional(e.target.checked)}
                  className="rounded border-slate-600"
                />
                Bidirectional
              </label>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-700">
              <button
                onClick={() => setShowDepModal(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDep}
                disabled={!depSource || !depTarget || depSource === depTarget}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Link className="w-4 h-4" />
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

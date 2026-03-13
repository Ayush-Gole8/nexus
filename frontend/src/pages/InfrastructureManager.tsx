import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Save, Link2 } from 'lucide-react';
import {
  getNodes,
  createNode,
  updateNode,
  deleteNode,
  getDependencies,
  createDependency,
} from '../api/infrastructure';
import type { InfrastructureNode, Dependency } from '../types';
import { SECTOR_COLORS, SECTOR_LABELS, STATUS_COLORS } from '../types';

const SECTORS = ['power', 'water', 'transport', 'telecom', 'emergency'] as const;
const DEP_TYPES = ['power_supply', 'water_supply', 'data_link', 'physical_access', 'operational'] as const;

interface NodeFormData {
  name: string;
  type: string;
  zone: string;
  lat: number;
  lng: number;
  criticalityScore: number;
  capacity: number;
  operator: string;
}

const emptyForm: NodeFormData = {
  name: '',
  type: 'power',
  zone: 'Mumbai',
  lat: 19.076,
  lng: 72.877,
  criticalityScore: 50,
  capacity: 100,
  operator: '',
};

export default function InfrastructureManager() {
  const [nodes, setNodes] = useState<InfrastructureNode[]>([]);
  const [deps, setDeps] = useState<Dependency[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InfrastructureNode | null>(null);
  const [form, setForm] = useState<NodeFormData>(emptyForm);
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);
  const [connectionType, setConnectionType] = useState<string>('operational');
  const [connectionWeight, setConnectionWeight] = useState(0.8);

  const loadData = async () => {
    const [n, d] = await Promise.all([getNodes(), getDependencies()]);
    setNodes(n);
    setDeps(d);
  };

  useEffect(() => {
    loadData().catch(console.error);
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setSelectedConnections([]);
    setConnectionType('operational');
    setConnectionWeight(0.8);
    setModalOpen(true);
  };

  const openEdit = (node: InfrastructureNode) => {
    setEditing(node);
    setForm({
      name: node.name,
      type: node.type,
      zone: node.zone || (node.properties?.zone as string) || 'Mumbai',
      lat: node.location.lat,
      lng: node.location.lng,
      criticalityScore: node.criticalityScore,
      capacity: node.capacity,
      operator: (node.properties?.operator as string) || '',
    });
    setSelectedConnections([]);
    setModalOpen(true);
  };

  const sectorBonus =
    form.type === 'emergency' ? 20 :
    form.type === 'power' ? 14 :
    form.type === 'water' ? 12 :
    form.type === 'transport' ? 10 : 8;

  const immunityScore = Math.round((form.criticalityScore * 4.5) + (selectedConnections.length * 8) + sectorBonus);

  const saveNode = async () => {
    const payload: any = {
      name: form.name,
      type: form.type,
      subtype: form.type === 'emergency' ? 'eoc' : `${form.type}_node`,
      zone: form.zone,
      status: 'operational',
      capacity: form.capacity,
      currentLoad: 0,
      criticalityScore: form.criticalityScore,
      location: { lat: form.lat, lng: form.lng },
      properties: {
        zone: form.zone,
        operator: form.operator,
      },
    };

    if (editing) {
      await updateNode(editing._id, payload);
    } else {
      const tempId = `temp-${Date.now()}`;
      const optimistic: InfrastructureNode = {
        _id: tempId,
        name: payload.name,
        type: payload.type,
        subtype: payload.subtype,
        zone: payload.zone,
        status: payload.status,
        capacity: payload.capacity,
        currentLoad: payload.currentLoad,
        criticalityScore: payload.criticalityScore,
        location: payload.location,
        properties: payload.properties,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setNodes((prev) => [optimistic, ...prev]);

      const created = await createNode(payload);
      if (selectedConnections.length) {
        await Promise.all(selectedConnections.map((targetNodeId) =>
          createDependency({
            sourceNodeId: created._id,
            targetNodeId,
            dependencyType: connectionType as any,
            strength: connectionWeight,
            bidirectional: false,
          } as any),
        ));
      }
    }

    setModalOpen(false);
    await loadData();
  };

  const removeNode = async (id: string) => {
    await deleteNode(id);
    await loadData();
  };

  const connectedCounts = useMemo(() => {
    const m: Record<string, number> = {};
    deps.forEach((d) => {
      const source = typeof d.sourceNodeId === 'string' ? d.sourceNodeId : d.sourceNodeId._id;
      m[source] = (m[source] || 0) + 1;
    });
    return m;
  }, [deps]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Infrastructure Manager</h1>
          <p className="text-sm text-slate-400 mt-1">Official console for node create/update/delete and dependency authoring</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Node
        </button>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700 text-xs text-slate-400 uppercase">
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Zone</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Criticality</th>
              <th className="text-left px-4 py-3">Connections</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((n) => (
              <tr key={n._id} className="border-b border-slate-700/50 text-sm hover:bg-slate-700/20">
                <td className="px-4 py-3 text-white">{n.name}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-xs" style={{ background: `${SECTOR_COLORS[n.type]}25`, color: SECTOR_COLORS[n.type] }}>
                    {SECTOR_LABELS[n.type]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-300">{n.zone || (n.properties?.zone as string) || '-'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-xs" style={{ background: `${STATUS_COLORS[n.status]}25`, color: STATUS_COLORS[n.status] }}>
                    {n.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-300 font-mono">{n.criticalityScore}</td>
                <td className="px-4 py-3 text-slate-400">{connectedCounts[n._id] || 0}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(n)} className="p-1.5 rounded hover:bg-slate-700 text-slate-300"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => removeNode(n._id)} className="p-1.5 rounded hover:bg-slate-700 text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-2xl bg-slate-800 border border-slate-700 rounded-xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{editing ? 'Edit Node' : 'Create Node'}</h3>
              <div className="text-xs text-slate-500">Official Only</div>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Name">
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white" />
              </Field>
              <Field label="Type">
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white">
                  {SECTORS.map((s) => <option key={s} value={s}>{SECTOR_LABELS[s]}</option>)}
                </select>
              </Field>
              <Field label="Zone">
                <input value={form.zone} onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value }))} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white" />
              </Field>
              <Field label="Operator">
                <input value={form.operator} onChange={(e) => setForm((f) => ({ ...f, operator: e.target.value }))} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white" />
              </Field>
              <Field label="Latitude">
                <input type="number" step="0.0001" value={form.lat} onChange={(e) => setForm((f) => ({ ...f, lat: Number(e.target.value) }))} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white" />
              </Field>
              <Field label="Longitude">
                <input type="number" step="0.0001" value={form.lng} onChange={(e) => setForm((f) => ({ ...f, lng: Number(e.target.value) }))} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white" />
              </Field>
              <Field label={`Criticality: ${form.criticalityScore}`}>
                <input type="range" min={0} max={100} value={form.criticalityScore} onChange={(e) => setForm((f) => ({ ...f, criticalityScore: Number(e.target.value) }))} className="w-full" />
              </Field>
              <Field label="Capacity">
                <input type="number" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white" />
              </Field>
            </div>

            {!editing && (
              <div className="px-5 pb-5 space-y-3">
                <div className="bg-slate-900/40 border border-slate-700 rounded-lg p-3">
                  <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" /> Connections</h4>
                  <div className="grid md:grid-cols-[1fr_160px_120px] gap-2 mb-2">
                    <select
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white"
                      value=""
                      onChange={(e) => {
                        const id = e.target.value;
                        if (!id || selectedConnections.includes(id)) return;
                        setSelectedConnections((prev) => [...prev, id]);
                      }}
                    >
                      <option value="">Add connection target...</option>
                      {nodes.filter((n) => !selectedConnections.includes(n._id)).map((n) => (
                        <option key={n._id} value={n._id}>{n.name}</option>
                      ))}
                    </select>
                    <select className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white" value={connectionType} onChange={(e) => setConnectionType(e.target.value)}>
                      {DEP_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                    </select>
                    <input type="number" min={0} max={1} step={0.05} value={connectionWeight} onChange={(e) => setConnectionWeight(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedConnections.map((id) => (
                      <button
                        key={id}
                        onClick={() => setSelectedConnections((prev) => prev.filter((x) => x !== id))}
                        className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-200 hover:bg-slate-600"
                      >
                        {(nodes.find((n) => n._id === id)?.name || id)} ✕
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3">
                  <h4 className="text-xs uppercase tracking-wider text-emerald-300 mb-1">Immunity Score</h4>
                  <p className="text-sm text-emerald-200">
                    <span className="font-mono text-lg font-bold">{immunityScore}</span>
                    <span className="text-xs text-emerald-300/80 ml-2">= (criticality × 4.5) + (connections × 8) + sectorBonus</span>
                  </p>
                </div>
              </div>
            )}

            <div className="px-5 py-4 border-t border-slate-700 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="px-3 py-2 text-sm text-slate-300 hover:text-white">Cancel</button>
              <button onClick={saveNode} className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5">
                <Save className="w-4 h-4" /> {editing ? 'Update Node' : 'Create Node'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      {children}
    </label>
  );
}

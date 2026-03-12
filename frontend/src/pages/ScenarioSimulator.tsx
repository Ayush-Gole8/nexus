import { useEffect, useState, useCallback } from 'react';
import { Plus, Play, Eye, Trash2, FlaskConical, ChevronDown, ChevronUp } from 'lucide-react';
import InfrastructureGraph from '../components/graph/InfrastructureGraph';
import { getGraphData, getNodes } from '../api/infrastructure';
import { getScenarios, createScenario, deleteScenario, runSimulation, getSimulationResults } from '../api/simulation';
import type { GraphData, Scenario, SimulationResult, InfrastructureNode, CascadeResult } from '../types';
import { SECTOR_COLORS, SECTOR_LABELS } from '../types';

const SCENARIO_TYPES = [
  'power_outage',
  'road_disruption',
  'telecom_failure',
  'water_disruption',
  'extreme_weather',
  'natural_disaster',
  'equipment_failure',
  'cyber_attack',
  'cascading_failure',
] as const;

const TYPE_LABELS: Record<string, string> = {
  power_outage: 'Power Outage',
  road_disruption: 'Road Disruption',
  telecom_failure: 'Telecom Failure',
  water_disruption: 'Water Disruption',
  extreme_weather: 'Extreme Weather',
  natural_disaster: 'Natural Disaster',
  equipment_failure: 'Equipment Failure',
  cyber_attack: 'Cyber Attack',
  cascading_failure: 'Cascading Failure',
};

export default function ScenarioSimulator() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [nodes, setNodes] = useState<InfrastructureNode[]>([]);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [activeResult, setActiveResult] = useState<SimulationResult | null>(null);
  const [cascadeOverlay, setCascadeOverlay] = useState<CascadeResult | null>(null);
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number | undefined>(undefined);

  // Create form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formType, setFormType] = useState<string>(SCENARIO_TYPES[0]);
  const [formNodes, setFormNodes] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [scenarioList, nodeList, graph] = await Promise.all([
      getScenarios(),
      getNodes(),
      getGraphData(),
    ]);
    setScenarios(scenarioList);
    setNodes(nodeList);
    setGraphData(graph);
  };

  const handleCreate = useCallback(async () => {
    if (!formName.trim() || formNodes.length === 0) return;
    await createScenario({
      name: formName,
      description: formDesc,
      type: formType,
      initialFailures: formNodes.map((id) => ({ nodeId: id, failureType: 'complete' })),
      parameters: {},
    } as any);
    setFormName('');
    setFormDesc('');
    setFormType(SCENARIO_TYPES[0]);
    setFormNodes([]);
    setShowCreateForm(false);
    const updated = await getScenarios();
    setScenarios(updated);
  }, [formName, formDesc, formType, formNodes]);

  const handleRun = useCallback(async (id: string) => {
    setRunning(id);
    setCascadeOverlay(null);
    setActiveResult(null);
    try {
      await runSimulation(id);
      const results = await getSimulationResults(id);
      if (results.length > 0) {
        const latest = results[results.length - 1];
        setActiveResult(latest);
        // Convert to cascade overlay format
        setCascadeOverlay({
          impactedNodes: latest.impactedNodes.map((n: any) => ({
            nodeId: n.nodeId,
            name: n.name || n.nodeId,
            type: n.type || 'unknown',
            subtype: n.subtype || '',
            impactLevel: n.impactLevel || 'cascading',
            newStatus: n.newStatus || 'failed',
            impactScore: n.impactScore || 1,
            propagationStep: n.propagationStep || 0,
          })),
          propagationPaths: latest.propagationPaths || [],
          summary: latest.summary,
        });
        setCurrentStep(latest.summary.maxPropagationDepth);
      }
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setRunning(null);
    }
  }, []);

  const handleDelete = async (id: string) => {
    await deleteScenario(id);
    setScenarios((prev) => prev.filter((s) => s._id !== id));
    if (expandedScenario === id) setExpandedScenario(null);
  };

  const handleViewResult = async (id: string) => {
    const results = await getSimulationResults(id);
    if (results.length > 0) {
      const latest = results[results.length - 1];
      setActiveResult(latest);
      setCascadeOverlay({
        impactedNodes: latest.impactedNodes.map((n: any) => ({
          nodeId: n.nodeId,
          name: n.name || n.nodeId,
          type: n.type || 'unknown',
          subtype: n.subtype || '',
          impactLevel: n.impactLevel || 'cascading',
          newStatus: n.newStatus || 'failed',
          impactScore: n.impactScore || 1,
          propagationStep: n.propagationStep || 0,
        })),
        propagationPaths: latest.propagationPaths || [],
        summary: latest.summary,
      });
      setCurrentStep(latest.summary.maxPropagationDepth);
    }
  };

  return (
    <div className="space-y-4 h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Scenario Simulator</h1>
          <p className="text-sm text-slate-400 mt-1">Create and run failure scenarios to test infrastructure resilience</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Scenario
        </button>
      </div>

      <div className="flex gap-4" style={{ height: 'calc(100% - 60px)' }}>
        {/* Left Panel */}
        <div className="w-96 flex-shrink-0 space-y-4 overflow-y-auto">
          {/* Create Form */}
          {showCreateForm && (
            <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-blue-400">Create Scenario</h3>
              <input
                type="text"
                placeholder="Scenario name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              <textarea
                placeholder="Description (optional)"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                rows={2}
              />
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {SCENARIO_TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>

              <div>
                <p className="text-xs text-slate-400 mb-2">Initial Failure Nodes</p>
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {nodes.map((node) => (
                    <label
                      key={node._id}
                      className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs ${
                        formNodes.includes(node._id) ? 'bg-red-600/20 text-red-300' : 'text-slate-400 hover:bg-slate-700/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formNodes.includes(node._id)}
                        onChange={() =>
                          setFormNodes((prev) =>
                            prev.includes(node._id)
                              ? prev.filter((id) => id !== node._id)
                              : [...prev, node._id]
                          )
                        }
                        className="rounded border-slate-600"
                      />
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SECTOR_COLORS[node.type] }} />
                      {node.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={!formName.trim() || formNodes.length === 0}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Scenario List */}
          <div className="space-y-2">
            {scenarios.length === 0 && !showCreateForm && (
              <p className="text-slate-500 text-sm text-center py-8">No scenarios yet. Create one to get started.</p>
            )}
            {scenarios.map((scenario) => (
              <div key={scenario._id} className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                <div
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-700/30 transition-colors"
                  onClick={() => setExpandedScenario(expandedScenario === scenario._id ? null : scenario._id)}
                >
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-purple-400" />
                    <div>
                      <p className="text-sm font-medium text-white">{scenario.name}</p>
                      <p className="text-xs text-slate-500">{TYPE_LABELS[scenario.type] || scenario.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      scenario.status === 'completed'
                        ? 'bg-green-600/20 text-green-400'
                        : scenario.status === 'running'
                        ? 'bg-yellow-600/20 text-yellow-400'
                        : 'bg-slate-600/40 text-slate-400'
                    }`}>
                      {scenario.status || 'draft'}
                    </span>
                    {expandedScenario === scenario._id ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {expandedScenario === scenario._id && (
                  <div className="px-3 pb-3 border-t border-slate-700 pt-3 space-y-2">
                    {scenario.description && (
                      <p className="text-xs text-slate-400">{scenario.description}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      Initial failures: {scenario.initialFailures.length} node(s)
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRun(scenario._id)}
                        disabled={running === scenario._id}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg text-xs hover:bg-green-600/30 disabled:opacity-50 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                        {running === scenario._id ? 'Running...' : 'Run'}
                      </button>
                      <button
                        onClick={() => handleViewResult(scenario._id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs hover:bg-blue-600/30 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(scenario._id)}
                        className="px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-xs hover:bg-red-600/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Active Result Summary */}
          {activeResult && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-300">Simulation Result</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-400">{activeResult.summary.totalAffected}</p>
                  <p className="text-xs text-slate-400">Affected</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-orange-400">{activeResult.summary.maxPropagationDepth}</p>
                  <p className="text-xs text-slate-400">Max Depth</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase mb-2">By Sector</p>
                {Object.entries(activeResult.summary.bySector).map(([sector, count]) => (
                  <div key={sector} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SECTOR_COLORS[sector] }} />
                      <span className="text-xs text-slate-400">{SECTOR_LABELS[sector] || sector}</span>
                    </div>
                    <span className="text-xs font-mono text-white">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right - Graph */}
        <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          <InfrastructureGraph
            graphData={graphData}
            cascadeResult={cascadeOverlay}
            currentStep={currentStep}
          />
        </div>
      </div>
    </div>
  );
}

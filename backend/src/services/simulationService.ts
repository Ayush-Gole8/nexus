import Scenario from '../models/Scenario';
import SimulationResult from '../models/SimulationResult';
import { runCascadeAnalysis, CascadeOptions, CascadeResult } from './cascadeEngine';
import mongoose from 'mongoose';

export async function runSimulation(
  scenarioId: string,
  options?: CascadeOptions
): Promise<CascadeResult & { simulationResultId: string }> {
  const scenario = await Scenario.findById(scenarioId);
  if (!scenario) {
    throw new Error('Scenario not found');
  }

  scenario.status = 'running';
  await scenario.save();

  const failedNodeIds = scenario.initialFailures.map((f) => f.nodeId.toString());
  const cascadeResult = await runCascadeAnalysis(failedNodeIds, {
    ...options,
    ...(scenario.parameters || {}),
  });

  const simulationResult = await SimulationResult.create({
    scenarioId: new mongoose.Types.ObjectId(scenarioId),
    impactedNodes: cascadeResult.impactedNodes.map((n) => ({
      nodeId: new mongoose.Types.ObjectId(n.nodeId),
      impactLevel: n.impactLevel,
      newStatus: n.newStatus,
      propagationStep: n.propagationStep,
      impactScore: n.impactScore,
    })),
    propagationPaths: cascadeResult.propagationPaths.map((p) => ({
      from: new mongoose.Types.ObjectId(p.from),
      to: new mongoose.Types.ObjectId(p.to),
      step: p.step,
    })),
    summary: {
      ...cascadeResult.summary,
      criticalNodesHit: cascadeResult.summary.criticalNodesHit.map(
        (id) => new mongoose.Types.ObjectId(id)
      ),
    },
  });

  scenario.status = 'completed';
  await scenario.save();

  return {
    ...cascadeResult,
    simulationResultId: simulationResult._id.toString(),
  };
}

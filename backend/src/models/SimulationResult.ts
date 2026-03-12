import mongoose, { Schema, Document } from 'mongoose';

export interface ISimulationResult extends Document {
  scenarioId: mongoose.Types.ObjectId;
  impactedNodes: Array<{
    nodeId: mongoose.Types.ObjectId;
    impactLevel: 'direct' | 'cascading';
    newStatus: 'degraded' | 'failed';
    propagationStep: number;
    impactScore: number;
  }>;
  propagationPaths: Array<{
    from: mongoose.Types.ObjectId;
    to: mongoose.Types.ObjectId;
    step: number;
  }>;
  summary: {
    totalAffected: number;
    bySector: Record<string, number>;
    criticalNodesHit: mongoose.Types.ObjectId[];
    maxPropagationDepth: number;
  };
  createdAt: Date;
}

const SimulationResultSchema = new Schema<ISimulationResult>(
  {
    scenarioId: { type: Schema.Types.ObjectId, ref: 'Scenario', required: true },
    impactedNodes: [
      {
        nodeId: { type: Schema.Types.ObjectId, ref: 'InfrastructureNode' },
        impactLevel: { type: String, enum: ['direct', 'cascading'] },
        newStatus: { type: String, enum: ['degraded', 'failed'] },
        propagationStep: Number,
        impactScore: Number,
      },
    ],
    propagationPaths: [
      {
        from: { type: Schema.Types.ObjectId, ref: 'InfrastructureNode' },
        to: { type: Schema.Types.ObjectId, ref: 'InfrastructureNode' },
        step: Number,
      },
    ],
    summary: {
      totalAffected: Number,
      bySector: { type: Schema.Types.Mixed, default: {} },
      criticalNodesHit: [{ type: Schema.Types.ObjectId, ref: 'InfrastructureNode' }],
      maxPropagationDepth: Number,
    },
  },
  { timestamps: true }
);

SimulationResultSchema.index({ scenarioId: 1 });

export default mongoose.model<ISimulationResult>('SimulationResult', SimulationResultSchema);

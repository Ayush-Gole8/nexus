import mongoose, { Schema, Document } from 'mongoose';

export interface IScenario extends Document {
  name: string;
  description: string;
  type: string;
  status: 'draft' | 'running' | 'completed';
  initialFailures: Array<{ nodeId: mongoose.Types.ObjectId; failureType: string }>;
  parameters: Record<string, any>;
  createdAt: Date;
}

const ScenarioSchema = new Schema<IScenario>(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    type: {
      type: String,
      required: true,
      enum: [
        'power_outage', 'road_disruption', 'telecom_failure', 'water_disruption', 'extreme_weather',
        'natural_disaster', 'equipment_failure', 'cyber_attack', 'demand_surge', 'cascading_failure', 'planned_maintenance',
      ],
    },
    status: {
      type: String,
      enum: ['draft', 'running', 'completed'],
      default: 'draft',
    },
    initialFailures: [
      {
        nodeId: { type: Schema.Types.ObjectId, ref: 'InfrastructureNode', required: true },
        failureType: { type: String, default: 'complete' },
      },
    ],
    parameters: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model<IScenario>('Scenario', ScenarioSchema);

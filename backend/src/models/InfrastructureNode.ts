import mongoose, { Schema, Document } from 'mongoose';

export interface IInfrastructureNode extends Document {
  name: string;
  type: 'power' | 'water' | 'transport' | 'telecom' | 'emergency';
  subtype: string;
  location: { lat: number; lng: number };
  status: 'operational' | 'degraded' | 'failed';
  capacity: number;
  currentLoad: number;
  criticalityScore: number;
  properties: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const InfrastructureNodeSchema = new Schema<IInfrastructureNode>(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['power', 'water', 'transport', 'telecom', 'emergency'],
    },
    subtype: { type: String, required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    status: {
      type: String,
      default: 'operational',
      enum: ['operational', 'degraded', 'failed'],
    },
    capacity: { type: Number, default: 100 },
    currentLoad: { type: Number, default: 0 },
    criticalityScore: { type: Number, default: 50, min: 0, max: 100 },
    properties: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

InfrastructureNodeSchema.index({ type: 1 });
InfrastructureNodeSchema.index({ status: 1 });

export default mongoose.model<IInfrastructureNode>('InfrastructureNode', InfrastructureNodeSchema);

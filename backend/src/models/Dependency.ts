import mongoose, { Schema, Document } from 'mongoose';

export interface IDependency extends Document {
  sourceNodeId: mongoose.Types.ObjectId;
  targetNodeId: mongoose.Types.ObjectId;
  dependencyType: 'power_supply' | 'water_supply' | 'data_link' | 'physical_access' | 'operational';
  strength: number;
  bidirectional: boolean;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const DependencySchema = new Schema<IDependency>(
  {
    sourceNodeId: { type: Schema.Types.ObjectId, ref: 'InfrastructureNode', required: true },
    targetNodeId: { type: Schema.Types.ObjectId, ref: 'InfrastructureNode', required: true },
    dependencyType: {
      type: String,
      required: true,
      enum: ['power_supply', 'water_supply', 'data_link', 'physical_access', 'operational'],
    },
    strength: { type: Number, required: true, min: 0, max: 1, default: 0.5 },
    bidirectional: { type: Boolean, default: false },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

DependencySchema.index({ sourceNodeId: 1 });
DependencySchema.index({ targetNodeId: 1 });

export default mongoose.model<IDependency>('Dependency', DependencySchema);

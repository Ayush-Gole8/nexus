import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
  nodeId: mongoose.Types.ObjectId;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  wardId: string;
  createdAt: Date;
  acknowledged: boolean;
}

const AlertSchema = new Schema<IAlert>({
  nodeId: { type: Schema.Types.ObjectId, ref: 'InfrastructureNode', required: true },
  severity: { type: String, enum: ['critical', 'warning', 'info'], required: true },
  title: { type: String, required: true, maxlength: 80 },
  description: { type: String, required: true, maxlength: 300 },
  wardId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
  acknowledged: { type: Boolean, default: false },
});

AlertSchema.index({ wardId: 1, createdAt: -1 });

export default mongoose.model<IAlert>('Alert', AlertSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IWeatherEvent extends Document {
  nodeId: mongoose.Types.ObjectId;
  season: 'monsoon' | 'summer' | 'winter';
  riskMultiplier: number;
  floodZone: boolean;
  historicalFailures: number;
  zoneName: string;
}

const WeatherEventSchema = new Schema<IWeatherEvent>(
  {
    nodeId: { type: Schema.Types.ObjectId, ref: 'InfrastructureNode', required: true },
    season: { type: String, enum: ['monsoon', 'summer', 'winter'], required: true },
    riskMultiplier: { type: Number, required: true, min: 0 },
    floodZone: { type: Boolean, default: false },
    historicalFailures: { type: Number, default: 0 },
    zoneName: { type: String, required: true },
  },
  { timestamps: true },
);

WeatherEventSchema.index({ nodeId: 1, season: 1 });
WeatherEventSchema.index({ floodZone: 1 });

export default mongoose.model<IWeatherEvent>('WeatherEvent', WeatherEventSchema);

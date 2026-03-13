import mongoose, { Schema, Document } from 'mongoose';

export interface IWeatherEvent extends Document {
  affectedNodeIds: mongoose.Types.ObjectId[];
  season: 'monsoon' | 'summer' | 'winter';
  riskMultiplier: number;
  floodZone: boolean;
  historicalFailures: number;
  zoneName: string;
}

const WeatherEventSchema = new Schema<IWeatherEvent>(
  {
    affectedNodeIds: [{ type: Schema.Types.ObjectId, ref: 'InfrastructureNode', required: true }],
    season: { type: String, enum: ['monsoon', 'summer', 'winter'], required: true },
    riskMultiplier: { type: Number, required: true, min: 0 },
    floodZone: { type: Boolean, default: false },
    historicalFailures: { type: Number, default: 0 },
    zoneName: { type: String, required: true },
  },
  { timestamps: true },
);

WeatherEventSchema.index({ affectedNodeIds: 1, season: 1 });
WeatherEventSchema.index({ floodZone: 1 });

export default mongoose.model<IWeatherEvent>('WeatherEvent', WeatherEventSchema);

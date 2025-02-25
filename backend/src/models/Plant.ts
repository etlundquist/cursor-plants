import mongoose, { Document, Schema } from 'mongoose';

export interface IPlant extends Document {
  name: string;
  species: string;
  dateAcquired: Date;
  location: string;
  wateringFrequency: number; // in days
  fertilizingFrequency: number; // in days
  lastWatered?: Date;
  lastFertilized?: Date;
  notes?: string;
  userId: mongoose.Types.ObjectId;
}

const plantSchema = new Schema<IPlant>({
  name: { type: String, required: true },
  species: { type: String, required: true },
  dateAcquired: { type: Date, required: true },
  location: { type: String, required: true },
  wateringFrequency: { type: Number, required: true },
  fertilizingFrequency: { type: Number, required: true },
  lastWatered: { type: Date },
  lastFertilized: { type: Date },
  notes: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export default mongoose.model<IPlant>('Plant', plantSchema);
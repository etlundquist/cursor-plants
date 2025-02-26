import mongoose, { Document, Schema } from 'mongoose';

interface IPlantInfoCache extends Document {
  searchTerm: string;
  info: {
    summary: string;
    imageUrl?: string;
    scientificName?: string;
    family?: string;
    care: {
      light: string;
      water: string;
      soil: string;
      temperature: string;
      humidity: string;
      fertilizer: string;
      propagation: string;
    };
  };
  lastUpdated: Date;
}

const plantInfoCacheSchema = new Schema<IPlantInfoCache>({
  searchTerm: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  info: {
    summary: { type: String, required: true },
    imageUrl: String,
    scientificName: String,
    family: String,
    care: {
      light: { type: String, required: true },
      water: { type: String, required: true },
      soil: { type: String, required: true },
      temperature: { type: String, required: true },
      humidity: { type: String, required: true },
      fertilizer: { type: String, required: true },
      propagation: { type: String, required: true }
    }
  },
  lastUpdated: {
    type: Date,
    required: true,
    expires: 604800 // Cache expires after 7 days (in seconds)
  }
});

export default mongoose.model<IPlantInfoCache>('PlantInfoCache', plantInfoCacheSchema);
import axios from 'axios';

interface PlantInfo {
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
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Basic care instructions based on common plant types
const defaultCareInstructions: Record<string, PlantInfo['care']> = {
  'default': {
    light: 'Moderate to bright indirect light',
    water: 'Water when top 1-2 inches of soil feels dry',
    soil: 'Well-draining potting mix',
    temperature: '65-80°F (18-27°C)',
    humidity: 'Average household humidity (40-60%)',
    fertilizer: 'Balanced fertilizer every 4-6 weeks during growing season',
    propagation: 'Depends on plant type'
  },
  'succulent': {
    light: 'Bright direct to indirect light',
    water: 'Allow soil to dry completely between waterings',
    soil: 'Fast-draining cactus/succulent mix',
    temperature: '70-80°F (21-27°C)',
    humidity: 'Low humidity tolerant',
    fertilizer: 'Diluted cactus fertilizer during growing season',
    propagation: 'Leaf cuttings or offsets'
  },
  'tropical': {
    light: 'Bright indirect light',
    water: 'Keep soil consistently moist but not wet',
    soil: 'Rich, well-draining potting mix',
    temperature: '70-85°F (21-29°C)',
    humidity: 'High humidity (60% or higher)',
    fertilizer: 'Balanced fertilizer monthly during growing season',
    propagation: 'Stem cuttings or division'
  },
  'herb': {
    light: 'Full sun to partial shade',
    water: 'Regular watering, keep soil moist',
    soil: 'Well-draining herb potting mix',
    temperature: '65-70°F (18-21°C)',
    humidity: 'Moderate humidity',
    fertilizer: 'Light feeding with balanced fertilizer',
    propagation: 'Seeds or stem cuttings'
  }
};

function getCareInstructionsForPlantType(species: string): PlantInfo['care'] {
  const speciesLower = species.toLowerCase();
  if (speciesLower.includes('succulent') || speciesLower.includes('cactus')) {
    return defaultCareInstructions.succulent;
  } else if (speciesLower.includes('herb') || speciesLower.includes('mint') || speciesLower.includes('basil')) {
    return defaultCareInstructions.herb;
  } else if (speciesLower.includes('monstera') || speciesLower.includes('philodendron') || speciesLower.includes('pothos')) {
    return defaultCareInstructions.tropical;
  }
  return defaultCareInstructions.default;
}

export const getPlantInfo = async (species: string): Promise<PlantInfo> => {
  try {
    const response = await axios.get(`${API_URL}/plants/species/${encodeURIComponent(species)}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching plant information:', error);
    throw error;
  }
};
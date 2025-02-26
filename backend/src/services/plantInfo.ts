import axios from 'axios';
import PlantInfoCache from '../models/PlantInfoCache';

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

const WIKIPEDIA_API_BASE = 'https://en.wikipedia.org/w/api.php';
const PERENUAL_API_URL = 'https://perenual.com/api/species-list';
const PERENUAL_API_KEY = process.env.PERENUAL_API_KEY;
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

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

async function findWikipediaArticle(searchTerm: string): Promise<{ title: string; extract: string; thumbnail?: string }> {
  try {
    // First, search for the most relevant plant article
    const searchResponse = await axios.get(WIKIPEDIA_API_BASE, {
      params: {
        action: 'query',
        list: 'search',
        srsearch: `${searchTerm} plant`,
        format: 'json',
        utf8: 1,
        origin: '*'
      }
    });

    if (!searchResponse.data.query.search.length) {
      throw new Error('No Wikipedia article found');
    }

    // Get the first (most relevant) result's title
    const pageTitle = searchResponse.data.query.search[0].title;

    // Now get the page content and image
    const contentResponse = await axios.get(WIKIPEDIA_API_BASE, {
      params: {
        action: 'query',
        prop: 'extracts|pageimages',
        exintro: true,
        explaintext: true,
        piprop: 'thumbnail',
        pithumbsize: 500,
        titles: pageTitle,
        format: 'json',
        utf8: 1,
        origin: '*'
      }
    });

    const pages = contentResponse.data.query.pages;
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];

    return {
      title: page.title,
      extract: page.extract || 'No description available.',
      thumbnail: page.thumbnail?.source
    };
  } catch (error) {
    console.error('Error searching Wikipedia:', error);
    throw error;
  }
}

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

async function getPlantInfoFromAPIs(searchTerm: string): Promise<PlantInfo> {
  // Try to find the most relevant Wikipedia article
  const wikiInfo = await findWikipediaArticle(searchTerm);

  // Try to get specific care instructions from Perenual API if key is available
  let careInstructions = getCareInstructionsForPlantType(searchTerm);
  if (PERENUAL_API_KEY) {
    try {
      const perenualResponse = await axios.get(`${PERENUAL_API_URL}?key=${PERENUAL_API_KEY}&q=${searchTerm}`);
      if (perenualResponse.data.data && perenualResponse.data.data[0]) {
        const plantData = perenualResponse.data.data[0];
        careInstructions = {
          ...careInstructions,
          light: plantData.sunlight?.join(', ') || careInstructions.light,
          water: plantData.watering || careInstructions.water,
        };
      }
    } catch (error) {
      console.error('Error fetching from Perenual API:', error);
    }
  }

  return {
    summary: wikiInfo.extract,
    imageUrl: wikiInfo.thumbnail,
    scientificName: wikiInfo.title,
    care: careInstructions
  };
}

export const getPlantInfo = async (species: string): Promise<PlantInfo> => {
  try {
    // Clean up species name for cache lookup
    const searchTerm = species.trim().toLowerCase();

    // Check cache first
    const cachedInfo = await PlantInfoCache.findOne({ searchTerm });

    if (cachedInfo &&
        cachedInfo.lastUpdated &&
        (new Date().getTime() - cachedInfo.lastUpdated.getTime()) < CACHE_DURATION) {
      console.log('Returning cached plant information for:', searchTerm);
      return cachedInfo.info;
    }

    // If not in cache or cache expired, fetch from APIs
    console.log('Fetching fresh plant information for:', searchTerm);
    const plantInfo = await getPlantInfoFromAPIs(searchTerm);

    // Update cache
    await PlantInfoCache.findOneAndUpdate(
      { searchTerm },
      {
        searchTerm,
        info: plantInfo,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    return plantInfo;
  } catch (error) {
    console.error('Error fetching plant information:', error);
    // If all fails, return default information
    const defaultInfo = {
      summary: `Information about ${species} is currently unavailable.`,
      scientificName: species,
      care: getCareInstructionsForPlantType(species)
    };

    // Cache the default info too to prevent repeated failed API calls
    try {
      await PlantInfoCache.findOneAndUpdate(
        { searchTerm: species.trim().toLowerCase() },
        {
          searchTerm: species.trim().toLowerCase(),
          info: defaultInfo,
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );
    } catch (cacheError) {
      console.error('Error caching default plant information:', cacheError);
    }

    return defaultInfo;
  }
};
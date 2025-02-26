import express, { Request, Response } from 'express';
import Plant, { IPlant } from '../models/Plant';
import auth from '../middleware/auth';
import { getPlantInfo } from '../services/plantInfo';

const router = express.Router();

interface AuthRequest extends Request {
  user?: {
    _id: string;
  };
}

// Get all plants for the authenticated user
router.get('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const plants = await Plant.find({ userId: req.user?._id });
    res.json(plants);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching plants' });
  }
});

// Get a specific plant
router.get('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, userId: req.user?._id });
    if (!plant) {
      res.status(404).json({ error: 'Plant not found' });
      return;
    }
    res.json(plant);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching plant' });
  }
});

// Create a new plant
router.post('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const plant = new Plant({
      ...req.body,
      userId: req.user?._id
    });
    await plant.save();
    res.status(201).json(plant);
  } catch (error) {
    res.status(400).json({ error: 'Error creating plant' });
  }
});

// Update a plant
router.patch('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const plant = await Plant.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!plant) {
      res.status(404).json({ error: 'Plant not found' });
      return;
    }
    res.json(plant);
  } catch (error) {
    res.status(400).json({ error: 'Error updating plant' });
  }
});

// Delete a plant
router.delete('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const plant = await Plant.findOneAndDelete({ _id: req.params.id, userId: req.user?._id });
    if (!plant) {
      res.status(404).json({ error: 'Plant not found' });
      return;
    }
    res.json({ message: 'Plant deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting plant' });
  }
});

// Get plant species information
router.get('/species/:name', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const plantInfo = await getPlantInfo(req.params.name);
    res.json(plantInfo);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching plant information' });
  }
});

export default router;
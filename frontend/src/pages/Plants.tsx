import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import axios from 'axios';
import Layout from '../components/Layout';
import PlantDetails from '../components/PlantDetails';

interface Plant {
  _id: string;
  name: string;
  species: string;
  dateAcquired: string;
  location: string;
  wateringFrequency: number;
  fertilizingFrequency: number;
  lastWatered?: string;
  lastFertilized?: string;
  notes?: string;
}

interface FormData {
  name: string;
  species: string;
  dateAcquired: Date;
  location: string;
  wateringFrequency: number;
  fertilizingFrequency: number;
  notes: string;
}

const Plants: React.FC = () => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [open, setOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    dateAcquired: new Date(),
    location: '',
    wateringFrequency: 7,
    fertilizingFrequency: 30,
    notes: '',
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    try {
      const response = await axios.get(`${API_URL}/plants`);
      setPlants(response.data);
    } catch (error) {
      console.error('Error fetching plants:', error);
    }
  };

  const handleOpen = (plant?: Plant) => {
    if (plant) {
      setEditingPlant(plant);
      setFormData({
        name: plant.name,
        species: plant.species,
        dateAcquired: new Date(plant.dateAcquired),
        location: plant.location,
        wateringFrequency: plant.wateringFrequency,
        fertilizingFrequency: plant.fertilizingFrequency,
        notes: plant.notes || '',
      });
    } else {
      setEditingPlant(null);
      setFormData({
        name: '',
        species: '',
        dateAcquired: new Date(),
        location: '',
        wateringFrequency: 7,
        fertilizingFrequency: 30,
        notes: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingPlant(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlant) {
        await axios.patch(`${API_URL}/plants/${editingPlant._id}`, formData);
      } else {
        await axios.post(`${API_URL}/plants`, formData);
      }
      fetchPlants();
      handleClose();
    } catch (error) {
      console.error('Error saving plant:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this plant?')) {
      try {
        await axios.delete(`${API_URL}/plants/${id}`);
        fetchPlants();
      } catch (error) {
        console.error('Error deleting plant:', error);
      }
    }
  };

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4">My Plants</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpen()}
            >
              Add Plant
            </Button>
          </Grid>
          {plants.map((plant) => (
            <Grid item xs={12} sm={6} md={4} key={plant._id}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Typography variant="h6">{plant.name}</Typography>
                    <Typography color="textSecondary">{plant.species}</Typography>
                  </div>
                  <div>
                    <IconButton size="small" onClick={() => handleOpen(plant)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(plant._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </div>
                </div>
                <Typography variant="body2">
                  Location: {plant.location}
                </Typography>
                <Typography variant="body2">
                  Water every {plant.wateringFrequency} days
                </Typography>
                <Typography variant="body2">
                  Fertilize every {plant.fertilizingFrequency} days
                </Typography>
                {plant.notes && (
                  <Typography variant="body2">
                    Notes: {plant.notes}
                  </Typography>
                )}
                <PlantDetails species={plant.species} />
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>{editingPlant ? 'Edit Plant' : 'Add New Plant'}</DialogTitle>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Plant Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Species"
                value={formData.species}
                onChange={(e) => setFormData({ ...formData, species: e.target.value })}
              />
              <TextField
                type="date"
                margin="normal"
                fullWidth
                label="Date Acquired"
                value={formData.dateAcquired.toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, dateAcquired: new Date(e.target.value) })}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                type="number"
                label="Watering Frequency (days)"
                value={formData.wateringFrequency}
                onChange={(e) => setFormData({ ...formData, wateringFrequency: parseInt(e.target.value) })}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                type="number"
                label="Fertilizing Frequency (days)"
                value={formData.fertilizingFrequency}
                onChange={(e) => setFormData({ ...formData, fertilizingFrequency: parseInt(e.target.value) })}
              />
              <TextField
                margin="normal"
                fullWidth
                multiline
                rows={4}
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </form>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingPlant ? 'Save Changes' : 'Add Plant'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default Plants;
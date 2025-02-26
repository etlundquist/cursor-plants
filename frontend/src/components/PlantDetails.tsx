import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Divider,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { getPlantInfo } from '../services/plantInfo';

interface PlantDetailsProps {
  species: string;
}

const PlantDetails: React.FC<PlantDetailsProps> = ({ species }) => {
  const [loading, setLoading] = useState(true);
  const [plantInfo, setPlantInfo] = useState<any>(null);
  const [expanded, setExpanded] = useState<boolean>(false);

  useEffect(() => {
    const fetchPlantInfo = async () => {
      setLoading(true);
      try {
        const info = await getPlantInfo(species);
        setPlantInfo(info);
      } catch (error) {
        console.error('Error fetching plant info:', error);
      } finally {
        setLoading(false);
      }
    };

    if (species) {
      fetchPlantInfo();
    }
  }, [species]);

  if (loading) {
    return (
      <Card>
        <Skeleton variant="rectangular" height={200} />
        <CardContent>
          <Skeleton variant="text" height={30} />
          <Skeleton variant="text" height={100} />
        </CardContent>
      </Card>
    );
  }

  if (!plantInfo) {
    return null;
  }

  const CareDetail = ({ label, value }: { label: string; value: string }) => (
    <Box sx={{ mb: 1 }}>
      <Typography variant="subtitle2" color="primary" gutterBottom>
        {label}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {value}
      </Typography>
    </Box>
  );

  return (
    <Card>
      {plantInfo.imageUrl && (
        <CardMedia
          component="img"
          height="200"
          image={plantInfo.imageUrl}
          alt={species}
          sx={{ objectFit: 'cover' }}
        />
      )}
      <CardContent>
        <Typography variant="h6" gutterBottom>
          About {species}
        </Typography>
        {plantInfo.scientificName && (
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Scientific Name: {plantInfo.scientificName}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
          {plantInfo.summary}
        </Typography>

        <Accordion
          expanded={expanded}
          onChange={() => setExpanded(!expanded)}
          sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ px: 0 }}
          >
            <Typography variant="h6" color="primary">
              Care Instructions
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <CareDetail label="Light" value={plantInfo.care.light} />
                <CareDetail label="Water" value={plantInfo.care.water} />
                <CareDetail label="Soil" value={plantInfo.care.soil} />
                <CareDetail label="Temperature" value={plantInfo.care.temperature} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CareDetail label="Humidity" value={plantInfo.care.humidity} />
                <CareDetail label="Fertilizer" value={plantInfo.care.fertilizer} />
                <CareDetail label="Propagation" value={plantInfo.care.propagation} />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default PlantDetails;
import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, Box } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

interface Task {
  _id: string;
  type: string;
  dueDate: string;
  plantId: {
    name: string;
    species: string;
  };
}

const Dashboard: React.FC = () => {
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    const fetchUpcomingTasks = async () => {
      try {
        const response = await axios.get(`${API_URL}/tasks/upcoming`);
        setUpcomingTasks(response.data);
      } catch (error) {
        console.error('Error fetching upcoming tasks:', error);
      }
    };

    fetchUpcomingTasks();
  }, [API_URL]);

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom>
                Welcome, {user?.name}!
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Upcoming Tasks
              </Typography>
              {upcomingTasks.length === 0 ? (
                <Typography>No upcoming tasks</Typography>
              ) : (
                <Box>
                  {upcomingTasks.map((task) => (
                    <Paper
                      key={task._id}
                      sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}
                    >
                      <Typography variant="subtitle1">
                        {task.type} - {task.plantId.name} ({task.plantId.species})
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default Dashboard;
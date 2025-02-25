import React, { useState, useEffect, ChangeEvent } from 'react';
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
  MenuItem,
  IconButton,
  Chip,
  FormControlLabel,
  Switch,
  Box,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Event as EventIcon,
  List as ListIcon,
} from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import { EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import Layout from '../components/Layout';

interface Plant {
  _id: string;
  name: string;
  species: string;
}

interface Task {
  _id: string;
  plantId: Plant;
  type: 'watering' | 'fertilizing' | 'pruning' | 'other';
  dueDate: string;
  completed: boolean;
  completedDate?: string;
  notes?: string;
  isRecurring?: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceInterval?: number;
  isRecurringInstance?: boolean;
}

interface FormData {
  plantId: string;
  type: 'watering' | 'fertilizing' | 'pruning' | 'other';
  dueDate: Date;
  notes: string;
  isRecurring: boolean;
  recurrencePattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceInterval: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  backgroundColor: string;
  borderColor: string;
  classNames: string[];
  extendedProps: {
    isRecurring: boolean;
    isRecurringInstance: boolean;
    recurrencePattern?: string;
    recurrenceInterval?: number;
  };
}

const taskTypes = ['watering', 'fertilizing', 'pruning', 'other'];
const recurrencePatterns = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [formData, setFormData] = useState<FormData>({
    plantId: '',
    type: 'watering',
    dueDate: new Date(),
    notes: '',
    isRecurring: false,
    recurrencePattern: 'weekly',
    recurrenceInterval: 1,
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    fetchTasks();
    fetchPlants();
  }, []);

  const fetchTasks = async () => {
    try {
      let url = `${API_URL}/tasks`;
      if (viewMode === 'calendar') {
        // For calendar view, get tasks for a 3-month range centered on current month
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); // Previous month
        const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);   // End of next month
        url += `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&includeRecurring=true`;
      }
      const response = await axios.get(url);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchPlants = async () => {
    try {
      const response = await axios.get(`${API_URL}/plants`);
      setPlants(response.data);
    } catch (error) {
      console.error('Error fetching plants:', error);
    }
  };

  const handleOpen = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        plantId: task.plantId._id,
        type: task.type,
        dueDate: new Date(task.dueDate),
        notes: task.notes || '',
        isRecurring: task.isRecurring || false,
        recurrencePattern: task.recurrencePattern || 'weekly',
        recurrenceInterval: task.recurrenceInterval || 1,
      });
    } else {
      setEditingTask(null);
      setFormData({
        plantId: plants[0]?._id || '',
        type: 'watering',
        dueDate: new Date(),
        notes: '',
        isRecurring: false,
        recurrencePattern: 'weekly',
        recurrenceInterval: 1,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingTask(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await axios.patch(`${API_URL}/tasks/${editingTask._id}`, formData);
      } else {
        await axios.post(`${API_URL}/tasks`, formData);
      }
      fetchTasks();
      handleClose();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await axios.patch(`${API_URL}/tasks/${id}/complete`);
      fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await axios.delete(`${API_URL}/tasks/${id}`);
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const getStatusColor = (task: Task) => {
    if (task.completed) return 'success';
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    return dueDate < today ? 'error' : 'primary';
  };

  const getCalendarEvents = (): CalendarEvent[] => {
    return tasks.map((task: Task) => ({
      id: task._id,
      title: `${task.type} - ${task.plantId.name}${task.isRecurring ? ' (Recurring)' : ''}`,
      date: task.dueDate,
      backgroundColor: task.completed ? '#2e7d32' : new Date(task.dueDate) < new Date() ? '#d32f2f' : '#1976d2',
      borderColor: task.completed ? '#1b5e20' : new Date(task.dueDate) < new Date() ? '#b71c1c' : '#1565c0',
      classNames: task.isRecurring ? ['recurring-task'] : [],
      extendedProps: {
        isRecurring: task.isRecurring || false,
        isRecurringInstance: task.isRecurringInstance || false,
        recurrencePattern: task.recurrencePattern,
        recurrenceInterval: task.recurrenceInterval
      }
    }));
  };

  // Update tasks when view mode changes
  useEffect(() => {
    fetchTasks();
  }, [viewMode]);

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4">Tasks</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpen()}
                disabled={plants.length === 0}
              >
                Add Task
              </Button>
              <Tabs
                value={viewMode}
                onChange={(_: React.SyntheticEvent, newValue: 'list' | 'calendar') => setViewMode(newValue)}
                aria-label="view mode"
              >
                <Tab
                  icon={<ListIcon />}
                  label="List"
                  value="list"
                />
                <Tab
                  icon={<EventIcon />}
                  label="Calendar"
                  value="calendar"
                />
              </Tabs>
            </Box>
          </Grid>

          {viewMode === 'calendar' ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  events={getCalendarEvents()}
                  eventClick={(info: EventClickArg) => {
                    const task = tasks.find((t: Task) => t._id === info.event.id);
                    if (task) handleOpen(task);
                  }}
                  height="auto"
                />
              </Paper>
            </Grid>
          ) : (
            tasks.map((task: Task) => (
              <Grid item xs={12} sm={6} md={4} key={task._id}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <Typography variant="h6">{task.type}</Typography>
                      <Typography color="textSecondary">
                        {task.plantId.name} ({task.plantId.species})
                      </Typography>
                    </div>
                    <div>
                      {!task.completed && (
                        <>
                          <IconButton size="small" onClick={() => handleComplete(task._id)}>
                            <CheckCircleIcon />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleOpen(task)}>
                            <EditIcon />
                          </IconButton>
                        </>
                      )}
                      <IconButton size="small" onClick={() => handleDelete(task._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </div>
                  </div>
                  <Chip
                    label={task.completed ? 'Completed' : `Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                    color={getStatusColor(task)}
                    size="small"
                    sx={{ mt: 1, alignSelf: 'flex-start' }}
                  />
                  {task.isRecurring && task.recurrenceInterval && task.recurrencePattern && (
                    <Chip
                      label={`Repeats: ${task.recurrenceInterval} ${task.recurrencePattern}${task.recurrenceInterval > 1 ? 's' : ''}`}
                      color="secondary"
                      size="small"
                      sx={{ mt: 1, alignSelf: 'flex-start' }}
                    />
                  )}
                  {task.notes && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Notes: {task.notes}
                    </Typography>
                  )}
                </Paper>
              </Grid>
            ))
          )}
        </Grid>

        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <TextField
                select
                margin="normal"
                required
                fullWidth
                label="Plant"
                value={formData.plantId}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, plantId: e.target.value })}
              >
                {plants.map((plant: Plant) => (
                  <MenuItem key={plant._id} value={plant._id}>
                    {plant.name} ({plant.species})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                margin="normal"
                required
                fullWidth
                label="Task Type"
                value={formData.type}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, type: e.target.value as Task['type'] })}
              >
                {taskTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                type="date"
                margin="normal"
                fullWidth
                label="Due Date"
                value={formData.dueDate.toISOString().split('T')[0]}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, dueDate: new Date(e.target.value) })}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isRecurring}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  />
                }
                label="Recurring Task"
                sx={{ mt: 2 }}
              />
              {formData.isRecurring && (
                <>
                  <TextField
                    select
                    margin="normal"
                    required
                    fullWidth
                    label="Recurrence Pattern"
                    value={formData.recurrencePattern}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, recurrencePattern: e.target.value as FormData['recurrencePattern'] })}
                  >
                    {recurrencePatterns.map((pattern) => (
                      <MenuItem key={pattern.value} value={pattern.value}>
                        {pattern.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    type="number"
                    label="Repeat Every"
                    value={formData.recurrenceInterval}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, recurrenceInterval: parseInt(e.target.value) })}
                    inputProps={{ min: 1 }}
                  />
                </>
              )}
              <TextField
                margin="normal"
                fullWidth
                multiline
                rows={4}
                label="Notes"
                value={formData.notes}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, notes: e.target.value })}
              />
            </form>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingTask ? 'Save Changes' : 'Add Task'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default Tasks;
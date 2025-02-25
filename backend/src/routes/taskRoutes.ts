import express, { Request, Response } from 'express';
import Task, { ITask } from '../models/Task';
import auth from '../middleware/auth';
import { addDays, addWeeks, addMonths, addYears, startOfMonth, endOfMonth } from 'date-fns';

const router = express.Router();

interface AuthRequest extends Request {
  user?: {
    _id: string;
  };
}

interface DateRange {
  $gte: Date;
  $lte: Date;
}

// Calculate future instances of recurring tasks
const calculateFutureInstances = (task: ITask, endDate: Date): Array<any> => {
  if (!task.isRecurring || !task.recurrencePattern || !task.recurrenceInterval || task.completed) {
    return [];
  }

  const instances = [];
  let currentDate = new Date(task.dueDate);

  while (currentDate <= endDate) {
    // Skip the original task's date as it's already included in the main query
    if (currentDate.getTime() !== new Date(task.dueDate).getTime()) {
      instances.push({
        ...task.toObject(),
        _id: `${task._id}_${currentDate.getTime()}`,
        dueDate: new Date(currentDate),
        isRecurringInstance: true,
        completed: false,
        completedDate: undefined
      });
    }

    // Calculate next occurrence
    switch (task.recurrencePattern) {
      case 'daily':
        currentDate = addDays(currentDate, task.recurrenceInterval);
        break;
      case 'weekly':
        currentDate = addWeeks(currentDate, task.recurrenceInterval);
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, task.recurrenceInterval);
        break;
      case 'yearly':
        currentDate = addYears(currentDate, task.recurrenceInterval);
        break;
      default:
        return instances;
    }
  }

  return instances;
};

// Get all tasks for the authenticated user
router.get('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { completed, startDate, endDate, includeRecurring } = req.query;
    const query: any = { userId: req.user?._id };

    if (completed !== undefined) {
      query.completed = completed === 'true';
    }

    // Determine date range
    let dateRange: DateRange;
    if (startDate && endDate) {
      dateRange = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    } else {
      const now = new Date();
      dateRange = {
        $gte: startOfMonth(now),
        $lte: endOfMonth(now)
      };
    }
    query.dueDate = dateRange;

    // Get base tasks
    const tasks = await Task.find(query)
      .populate('plantId', 'name species')
      .sort({ dueDate: 1 });

    if (includeRecurring === 'true') {
      // Get recurring tasks that started before the end date
      const recurringTasks = await Task.find({
        userId: req.user?._id,
        isRecurring: true,
        dueDate: { $lte: dateRange.$lte }
      }).populate('plantId', 'name species');

      // Generate future instances for each recurring task
      const futureInstances = recurringTasks.flatMap(task =>
        calculateFutureInstances(task, dateRange.$lte)
      );

      // Filter instances to only include those within the date range
      const filteredInstances = futureInstances.filter(instance =>
        instance.dueDate >= dateRange.$gte &&
        instance.dueDate <= dateRange.$lte
      );

      // Combine and sort all tasks
      const allTasks = [...tasks, ...filteredInstances].sort((a, b) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );

      res.json(allTasks);
    } else {
      res.json(tasks);
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Error fetching tasks' });
  }
});

// Get upcoming tasks
router.get('/upcoming', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get base tasks
    const tasks = await Task.find({
      userId: req.user?._id,
      completed: false,
      dueDate: { $gte: new Date() }
    })
    .populate('plantId', 'name species')
    .sort({ dueDate: 1 });

    // Get recurring tasks
    const recurringTasks = await Task.find({
      userId: req.user?._id,
      isRecurring: true,
      completed: false
    }).populate('plantId', 'name species');

    // Calculate end date (30 days from now for upcoming tasks)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    // Generate future instances for recurring tasks
    const futureInstances = recurringTasks.flatMap(task =>
      calculateFutureInstances(task, endDate)
    );

    // Combine all tasks, sort by due date, and limit to 10
    const allTasks = [...tasks, ...futureInstances]
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 10);

    res.json(allTasks);
  } catch (error) {
    console.error('Error fetching upcoming tasks:', error);
    res.status(500).json({ error: 'Error fetching upcoming tasks' });
  }
});

// Create a new task
router.post('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = new Task({
      ...req.body,
      userId: req.user?._id
    });
    await task.save();
    const populatedTask = await task.populate('plantId', 'name species');
    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(400).json({ error: 'Error creating task' });
  }
});

// Update a task
router.patch('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('plantId', 'name species');

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: 'Error updating task' });
  }
});

// Calculate next recurrence date
const calculateNextRecurrence = (currentDate: Date, pattern: string, interval: number): Date => {
  const date = new Date(currentDate);
  switch (pattern) {
    case 'daily':
      return addDays(date, interval);
    case 'weekly':
      return addWeeks(date, interval);
    case 'monthly':
      return addMonths(date, interval);
    case 'yearly':
      return addYears(date, interval);
    default:
      return date;
  }
};

// Mark task as completed
router.patch('/:id/complete', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user?._id });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Mark current task as completed
    task.completed = true;
    task.completedDate = new Date();

    // If task is recurring, create next instance
    if (task.isRecurring) {
      const nextDate = calculateNextRecurrence(
        task.dueDate,
        task.recurrencePattern!,
        task.recurrenceInterval!
      );

      const newTask = new Task({
        plantId: task.plantId,
        userId: task.userId,
        type: task.type,
        dueDate: nextDate,
        notes: task.notes,
        isRecurring: true,
        recurrencePattern: task.recurrencePattern,
        recurrenceInterval: task.recurrenceInterval
      });

      await newTask.save();
      task.nextRecurrence = nextDate;
    }

    await task.save();
    const populatedTask = await task.populate('plantId', 'name species');
    res.json(populatedTask);
  } catch (error) {
    res.status(400).json({ error: 'Error completing task' });
  }
});

// Delete a task
router.delete('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user?._id });
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting task' });
  }
});

export default router;
import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  plantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'watering' | 'fertilizing' | 'pruning' | 'other';
  dueDate: Date;
  completed: boolean;
  completedDate?: Date;
  notes?: string;
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceInterval?: number; // e.g., every 2 weeks
  lastRecurrence?: Date;
  nextRecurrence?: Date;
}

const taskSchema = new Schema<ITask>({
  plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    required: true,
    enum: ['watering', 'fertilizing', 'pruning', 'other']
  },
  dueDate: { type: Date, required: true },
  completed: { type: Boolean, default: false },
  completedDate: { type: Date },
  notes: { type: String },
  isRecurring: { type: Boolean, default: false },
  recurrencePattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: function(this: ITask) { return this.isRecurring; }
  },
  recurrenceInterval: {
    type: Number,
    min: 1,
    required: function(this: ITask) { return this.isRecurring; }
  },
  lastRecurrence: { type: Date },
  nextRecurrence: { type: Date }
}, {
  timestamps: true
});

// Index for querying tasks by due date and completion status
taskSchema.index({ userId: 1, dueDate: 1, completed: 1 });
taskSchema.index({ userId: 1, nextRecurrence: 1 });

// Pre-save middleware to set nextRecurrence date
taskSchema.pre('save', function(next) {
  if (this.isRecurring && (!this.nextRecurrence || this.isModified('dueDate'))) {
    this.nextRecurrence = new Date(this.dueDate);
  }
  next();
});

export default mongoose.model<ITask>('Task', taskSchema);
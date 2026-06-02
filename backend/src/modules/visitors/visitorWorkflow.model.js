import mongoose from 'mongoose';
import { workflowActionTypes } from './visitor.model.js';

const { Schema } = mongoose;

const workflowActionSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: workflowActionTypes,
      required: true,
    },
    channel: { type: String, trim: true },
    template: { type: String, trim: true },
    preview: { type: String, trim: true },
    method: { type: String, trim: true },
    noteTemplate: { type: String, trim: true },
    message: { type: String, trim: true },
    urgency: { type: String, trim: true },
    role: { type: String, trim: true },
  },
  { _id: false },
);

const workflowStepSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    day: { type: Number, required: true, min: 0, default: 0 },
    actions: {
      type: [workflowActionSchema],
      default: () => [],
    },
  },
  { _id: false },
);

const visitorWorkflowSchema = new Schema(
  {
    tenantId: { type: String, required: true, unique: true, trim: true, lowercase: true },
    isActive: { type: Boolean, default: true },
    steps: {
      type: [workflowStepSchema],
      default: () => [],
    },
    updatedBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
);

visitorWorkflowSchema.pre('save', function visitorWorkflowPreSave(next) {
  this.updatedAt = new Date();
  next();
});

const VisitorWorkflow = mongoose.model('VisitorWorkflow', visitorWorkflowSchema);

export default VisitorWorkflow;

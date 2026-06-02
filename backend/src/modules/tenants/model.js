import mongoose from 'mongoose';
import { supportedCapabilities } from '../access/capabilities.js';

const tenantBrandingSchema = new mongoose.Schema(
  {
    appName: {
      type: String,
      trim: true,
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    tagline: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

const groupingNodeSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    parentId: {
      type: String,
      trim: true,
      default: null,
    },
    kind: {
      type: String,
      trim: true,
      default: 'group',
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

const tenantContentSchema = new mongoose.Schema(
  {
    branches: {
      type: [String],
      default: () => [],
    },
    departments: {
      type: [String],
      default: () => [],
    },
    ministries: {
      type: [String],
      default: () => [],
    },
    groupings: {
      type: [groupingNodeSchema],
      default: () => [],
    },
  },
  { _id: false },
);

const tenantSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
    },
    churchName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    subscriptionPlan: {
      type: String,
      enum: ['small', 'medium', 'mega'],
      default: 'small',
    },
    capabilities: {
      type: [String],
      enum: supportedCapabilities,
      default: undefined,
    },
    branding: {
      type: tenantBrandingSchema,
      default: () => ({}),
    },
    content: {
      type: tenantContentSchema,
      default: () => ({}),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspendedReason: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  },
);

const Tenant = mongoose.model('Tenant', tenantSchema);

export default Tenant;

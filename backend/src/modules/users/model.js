import mongoose from 'mongoose';
import { supportedCapabilities } from '../access/capabilities.js';

const roles = [
  'super_admin',
  'head_pastor',
  'associate_pastor',
  'treasurer',
  'finance_officer',
  'media_team',
  'branch_pastor',
  'care_leader',
  'volunteer_leader',
  'member',
];

const userSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    pinHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: roles,
      required: true,
      default: 'member',
    },
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    allBranches: {
      type: Boolean,
      default: true,
    },
    assignedBranches: {
      type: [String],
      default: () => [],
    },
    memberId: {
      type: String,
      trim: true,
    },
    photoUrl: {
      type: String,
      trim: true,
    },
    fcmToken: {
      type: String,
      trim: true,
    },
    capabilities: {
      type: [String],
      enum: supportedCapabilities,
      default: undefined,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
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

userSchema.index({ tenantId: 1, username: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

export { roles };
export default User;

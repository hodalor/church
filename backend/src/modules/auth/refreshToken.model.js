import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tenantId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    token: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
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

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;

import asyncHandler from '../../utils/asyncHandler.js';
import * as authService from './service.js';
import { success } from '../../utils/apiResponse.js';

export const login = asyncHandler(async (req, res) => {
  const data = await authService.loginService(req.body);
  return success(res, data, 'Login successful.');
});

export const refreshSession = asyncHandler(async (req, res) => {
  const data = await authService.refreshTokenService(req.body);
  return success(res, data, 'Session refreshed.');
});

export const logout = asyncHandler(async (req, res) => {
  const data = await authService.logoutService(req.user);
  return success(res, data, 'Logged out successfully.');
});

export const getMe = asyncHandler(async (req, res) => {
  const data = await authService.getMeService(req.user);
  return success(res, data, 'Authenticated user fetched successfully.');
});

export const updateFcmToken = asyncHandler(async (req, res) => {
  const data = await authService.updateFcmTokenService(req.user, req.body?.fcmToken ?? null);
  return success(res, data, 'FCM token updated successfully.');
});

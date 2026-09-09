import { Router } from 'express';
import * as setupController from './setup.controller.js';

const setupRouter = Router();

setupRouter.get(
  '/biometric-bridge/windows-installer',
  setupController.downloadBiometricBridgeWindowsInstaller,
);
setupRouter.get(
  '/biometric-bridge/files/*assetName',
  setupController.getBiometricBridgeFile,
);

export default setupRouter;

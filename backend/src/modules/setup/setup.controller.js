import asyncHandler from '../../utils/asyncHandler.js';
import { getBiometricBridgeAsset, renderWindowsInstallerScript, resolvePublicBaseUrl } from './setup.service.js';

export const downloadBiometricBridgeWindowsInstaller = asyncHandler(async (req, res) => {
  const script = renderWindowsInstallerScript({
    baseUrl: resolvePublicBaseUrl(req),
  });

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="install-prynova-biometric-bridge.cmd"',
  );

  return res.status(200).send(script);
});

export const getBiometricBridgeFile = asyncHandler(async (req, res) => {
  const asset = await getBiometricBridgeAsset(req.params.assetName);

  res.setHeader('Content-Type', asset.contentType);
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${asset.downloadName}"`,
  );

  return res.status(200).send(asset.content);
});

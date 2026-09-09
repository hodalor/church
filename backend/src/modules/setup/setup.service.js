import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../../');
const biometricBridgeRoot = path.join(projectRoot, 'biometric-bridge');

const bridgeAssets = {
  'server.js': {
    filePath: path.join(biometricBridgeRoot, 'server.js'),
    contentType: 'application/javascript; charset=utf-8',
    downloadName: 'server.js',
  },
  'package.json': {
    filePath: path.join(biometricBridgeRoot, 'package.json'),
    contentType: 'application/json; charset=utf-8',
    downloadName: 'package.json',
  },
  '.env.example': {
    filePath: path.join(biometricBridgeRoot, '.env.example'),
    contentType: 'text/plain; charset=utf-8',
    downloadName: '.env.example',
  },
  'README.md': {
    filePath: path.join(biometricBridgeRoot, 'README.md'),
    contentType: 'text/markdown; charset=utf-8',
    downloadName: 'README.md',
  },
  'adapters/zkteco_adapter.example.py': {
    filePath: path.join(biometricBridgeRoot, 'adapters', 'zkteco_adapter.example.py'),
    contentType: 'text/x-python; charset=utf-8',
    downloadName: 'zkteco_adapter.example.py',
  },
};

export const getBiometricBridgeAsset = async (assetName) => {
  const normalizedAssetName = Array.isArray(assetName)
    ? assetName.join('/')
    : String(assetName || '').replace(/\\/g, '/').trim();
  const asset = bridgeAssets[normalizedAssetName];

  if (!asset) {
    const error = new Error('Biometric bridge asset not found.');
    error.statusCode = 404;
    throw error;
  }

  const content = await readFile(asset.filePath, 'utf8');

  return {
    ...asset,
    content,
  };
};

export const resolvePublicBaseUrl = (req) => {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const protocol = forwardedProto || req.protocol || 'https';
  const host = forwardedHost || req.get('host') || 'localhost:5000';

  return `${protocol}://${host}`.replace(/\/+$/, '');
};

export const renderWindowsInstallerScript = ({ baseUrl }) => {
  const installerBaseUrl = `${String(baseUrl || '').replace(/\/+$/, '')}/api/v1/setup/biometric-bridge`;

  return `@echo off
setlocal
title Prynova Fingerprint Bridge Installer
color 0A

set "INSTALL_DIR=%LOCALAPPDATA%\\Prynova\\biometric-bridge"
set "DESKTOP_DIR=%USERPROFILE%\\Desktop"
set "INSTALLER_BASE_URL=${installerBaseUrl}"

echo.
echo Prynova Fingerprint Bridge Installer
echo ===================================
echo This computer only needs the local bridge.
echo Your main backend can stay hosted on Cloud Run or Render.
echo.

where node >nul 2>nul
if errorlevel 1 (
  where winget >nul 2>nul
  if errorlevel 1 (
    echo Node.js LTS is required.
    echo Install Node.js LTS, then run this installer again.
    pause
    exit /b 1
  )

  echo Installing Node.js LTS...
  winget install --id OpenJS.NodeJS.LTS -e --silent --accept-package-agreements --accept-source-agreements
  if errorlevel 1 (
    echo Node.js installation did not complete successfully.
    echo Install Node.js LTS manually, then run this installer again.
    pause
    exit /b 1
  )
)

echo Downloading bridge files...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$installDir = Join-Path $env:LOCALAPPDATA 'Prynova\\biometric-bridge';" ^
  "$adaptersDir = Join-Path $installDir 'adapters';" ^
  "$desktopLauncher = Join-Path $env:USERPROFILE 'Desktop\\Start Prynova Fingerprint Bridge.cmd';" ^
  "$startScript = Join-Path $installDir 'Start Prynova Fingerprint Bridge.cmd';" ^
  "$baseUrl = '${installerBaseUrl}';" ^
  "New-Item -ItemType Directory -Force -Path $installDir, $adaptersDir | Out-Null;" ^
  "Invoke-WebRequest -UseBasicParsing -Uri ($baseUrl + '/files/server.js') -OutFile (Join-Path $installDir 'server.js');" ^
  "Invoke-WebRequest -UseBasicParsing -Uri ($baseUrl + '/files/package.json') -OutFile (Join-Path $installDir 'package.json');" ^
  "Invoke-WebRequest -UseBasicParsing -Uri ($baseUrl + '/files/.env.example') -OutFile (Join-Path $installDir '.env.example');" ^
  "Invoke-WebRequest -UseBasicParsing -Uri ($baseUrl + '/files/README.md') -OutFile (Join-Path $installDir 'README.md');" ^
  "Invoke-WebRequest -UseBasicParsing -Uri ($baseUrl + '/files/adapters/zkteco_adapter.example.py') -OutFile (Join-Path $adaptersDir 'zkteco_adapter.example.py');" ^
  "@('BIOMETRIC_BRIDGE_PORT=4113','BIOMETRIC_BRIDGE_HOST=127.0.0.1','BIOMETRIC_BRIDGE_MODE=shell','BIOMETRIC_BRIDGE_ALLOWED_ORIGIN=*','BIOMETRIC_BRIDGE_PROVIDER=ZKTeco','BIOMETRIC_BRIDGE_DEVICE_MODEL=SLK20R','# Set these commands after wiring your ZKTeco SDK wrapper.','# BIOMETRIC_BRIDGE_ENROLL_COMMAND=python adapters\\zkteco_adapter.py enroll','# BIOMETRIC_BRIDGE_IDENTIFY_COMMAND=python adapters\\zkteco_adapter.py identify','# BIOMETRIC_BRIDGE_HEALTH_COMMAND=python adapters\\zkteco_adapter.py health') | Set-Content -Path (Join-Path $installDir '.env') -Encoding UTF8;" ^
  "$launcherLines = @('@echo off','setlocal','set ""INSTALL_DIR=%LOCALAPPDATA%\\Prynova\\biometric-bridge""','title Prynova Fingerprint Bridge','echo Starting Prynova Fingerprint Bridge...','if not exist ""%INSTALL_DIR%\\server.js"" (','  echo Bridge files are missing from %INSTALL_DIR%.','  echo Run the installer again from Prynova.','  pause >nul','  exit /b 1',')','cd /d ""%INSTALL_DIR%""','node ""%INSTALL_DIR%\\server.js""','echo.','echo Bridge stopped. Press any key to close.','pause >nul');" ^
  "$launcherLines | Set-Content -Path $startScript -Encoding ASCII;" ^
  "$launcherLines | Set-Content -Path $desktopLauncher -Encoding ASCII;"

if errorlevel 1 (
  echo Failed to prepare the bridge files on this machine.
  pause
  exit /b 1
)

echo.
echo Installer finished.
echo A desktop shortcut named "Start Prynova Fingerprint Bridge" has been created.
echo The bridge folder is: %INSTALL_DIR%
echo.
echo Starting the bridge now...
start "" "%INSTALL_DIR%\\Start Prynova Fingerprint Bridge.cmd"
echo.
echo You can now return to Prynova and use Refresh Bridge.
pause
`;
};

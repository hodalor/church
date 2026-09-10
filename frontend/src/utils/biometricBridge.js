const DEFAULT_BRIDGE_URL = 'http://127.0.0.1:4113';
const LEGACY_BRIDGE_URL = 'http://127.0.0.1:4007';
const DEFAULT_API_BASE_URL = 'http://localhost:5000/api/v1';
const BRIDGE_URL_STORAGE_KEY = 'prynova.biometricBridgeUrl';

const asObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const pickText = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
};

const normalizeUrl = (value) => String(value || '').trim().replace(/\/+$/, '');

const resolveBridgeUrl = () => {
  const configuredUrl =
    process.env.REACT_APP_BIOMETRIC_BRIDGE_URL ||
    process.env.REACT_APP_FINGERPRINT_BRIDGE_URL ||
    DEFAULT_BRIDGE_URL;

  return normalizeUrl(configuredUrl);
};

const getStoredBridgeUrl = () => {
  try {
    return normalizeUrl(window.localStorage.getItem(BRIDGE_URL_STORAGE_KEY));
  } catch {
    return '';
  }
};

const persistBridgeUrl = (value) => {
  try {
    if (!value) {
      window.localStorage.removeItem(BRIDGE_URL_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(BRIDGE_URL_STORAGE_KEY, normalizeUrl(value));
  } catch {
    // Ignore storage errors; bridge discovery still works without persistence.
  }
};

const buildBridgeUrlCandidates = () => {
  const configuredUrl = resolveBridgeUrl();
  const storedUrl = getStoredBridgeUrl();
  const candidates = new Set(
    [storedUrl, configuredUrl, DEFAULT_BRIDGE_URL, LEGACY_BRIDGE_URL].filter(Boolean),
  );

  const urls = Array.from(candidates);

  for (const url of urls) {
    try {
      const parsed = new URL(url);
      const alternateHost =
        parsed.hostname === '127.0.0.1'
          ? 'localhost'
          : parsed.hostname === 'localhost'
            ? '127.0.0.1'
            : '';

      if (alternateHost) {
        candidates.add(`${parsed.protocol}//${alternateHost}:${parsed.port}`);
      }

      if (parsed.port === '4007') {
        candidates.add(`${parsed.protocol}//${parsed.hostname}:4113`);
      }

      if (parsed.port === '4113') {
        candidates.add(`${parsed.protocol}//${parsed.hostname}:4007`);
      }
    } catch {
      // Skip malformed URLs and keep the valid candidates.
    }
  }

  return Array.from(candidates).map(normalizeUrl).filter(Boolean);
};

const resolveApiBaseUrl = () => {
  const configuredUrl =
    process.env.REACT_APP_API_BASE_URL ||
    process.env.REACT_APP_API_URL ||
    DEFAULT_API_BASE_URL;

  return String(configuredUrl).replace(/\/+$/, '');
};

const resolveBackendBaseUrl = () => {
  const apiBaseUrl = resolveApiBaseUrl();
  return apiBaseUrl.replace(/\/api\/v1$/i, '');
};

const readJsonResponse = async (response) => {
  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (!response.ok) {
        throw new Error(`Biometric bridge request failed (${response.status}).`);
      }

      throw new Error(
        'Fingerprint bridge returned an unexpected response. Confirm the local bridge URL points to the fingerprint service.',
      );
    }
  }

  if (!response.ok) {
    throw new Error(data?.message || `Biometric bridge request failed (${response.status}).`);
  }

  return data;
};

const unwrapBridgePayload = (payload = {}) => {
  const root = asObject(payload);
  const nestedData = asObject(root.data);
  const nestedResult = asObject(root.result);

  if (Object.keys(nestedData).length) {
    return {
      ...nestedData,
      message: pickText(root.message, nestedData.message),
    };
  }

  if (Object.keys(nestedResult).length) {
    return {
      ...nestedResult,
      message: pickText(root.message, nestedResult.message),
    };
  }

  return root;
};

const createBridgeConnectionError = (baseUrls = []) =>
  new Error(
    `Fingerprint bridge is not reachable on this computer. Start Prynova Fingerprint Bridge and confirm one of these local addresses is running: ${baseUrls.join(', ')}.`,
  );

const callBridgeAtBaseUrl = async (baseUrl, path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await readJsonResponse(response);
  persistBridgeUrl(baseUrl);
  return data;
};

const callBridge = async (paths = [], options = {}) => {
  const candidatePaths = Array.isArray(paths) ? paths : [paths];
  const baseUrls = buildBridgeUrlCandidates();
  let lastError;
  let sawConnectionFailure = false;

  for (const baseUrl of baseUrls) {
    for (const path of candidatePaths) {
      try {
        return await callBridgeAtBaseUrl(baseUrl, path, options);
      } catch (error) {
        lastError = error;
        const isNotFoundError =
          typeof error?.message === 'string' &&
          error.message.includes('Biometric bridge request failed (404)');
        const isConnectionError =
          error?.name === 'TypeError' ||
          /Failed to fetch|NetworkError|ERR_CONNECTION_REFUSED|Load failed/i.test(
            String(error?.message || ''),
          );

        if (isConnectionError) {
          sawConnectionFailure = true;
          break;
        }

        if (!isNotFoundError) {
          throw error;
        }
      }
    }
  }

  if (sawConnectionFailure) {
    throw createBridgeConnectionError(baseUrls);
  }

  throw lastError || new Error('Biometric bridge request failed.');
};

export const getBiometricBridgeStatus = async () => {
  try {
    const data = await callBridge(['/health'], { method: 'GET' });
    const provider = asObject(data.provider);
    const isReady = data.ready !== false && provider.ready !== false && data.ok !== false;

    if (!isReady) {
      throw new Error(
        pickText(data?.message, provider?.message) ||
          'Fingerprint bridge is running, but no supported ZKT scanner is ready yet. Connect the ZKT fingerprint device, then refresh bridge status.',
      );
    }

    return data;
  } catch (error) {
    throw new Error(
      error.message ||
        'Fingerprint bridge is not reachable. Ensure the local ZKT bridge service is running.',
    );
  }
};

export const enrollFingerprint = async (payload = {}) => {
  try {
    return await callBridge(
      ['/fingerprint/enroll', '/fingerprints/enroll', '/enroll'],
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
  } catch (error) {
    throw new Error(
      error.message ||
        'Unable to capture fingerprint enrollment. Confirm the ZKT scanner bridge is running.',
    );
  }
};

export const identifyFingerprint = async (payload = {}) => {
  try {
    return await callBridge(
      ['/fingerprint/identify', '/fingerprints/identify', '/identify'],
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
  } catch (error) {
    throw new Error(
      error.message ||
        'Unable to identify fingerprint. Confirm the ZKT scanner bridge is running.',
    );
  }
};

export const extractFingerprintTemplateId = (payload = {}) => {
  const data = unwrapBridgePayload(payload);
  const match = asObject(data.match);
  const fingerprint = asObject(data.fingerprint);

  return pickText(
    data.templateId,
    data.template_id,
    data.templateRef,
    data.template_ref,
    data.fingerprintTemplateId,
    data.fingerprint_template_id,
    match.templateId,
    match.template_id,
    match.templateRef,
    match.template_ref,
    match.fingerprintTemplateId,
    match.fingerprint_template_id,
    fingerprint.templateId,
    fingerprint.template_id,
    fingerprint.templateRef,
    fingerprint.template_ref,
    fingerprint.fingerprintTemplateId,
    fingerprint.fingerprint_template_id,
  );
};

export const extractFingerprintMemberId = (payload = {}) => {
  const data = unwrapBridgePayload(payload);
  const match = asObject(data.match);
  const member = asObject(data.member);

  return pickText(
    data.memberId,
    data.subjectId,
    data.subject_id,
    match.memberId,
    match.subjectId,
    match.subject_id,
    member.memberId,
    member.subjectId,
    member.subject_id,
  );
};

export const extractFingerprintDeviceMeta = (payload = {}) => {
  const data = unwrapBridgePayload(payload);
  const device = asObject(data.device);
  const scanner = asObject(data.scanner);
  const match = asObject(data.match);

  return {
    provider: pickText(
      data.provider,
      device.provider,
      scanner.provider,
      match.provider,
    ),
    deviceModel: pickText(
      data.deviceModel,
      data.device_model,
      device.model,
      device.deviceModel,
      scanner.model,
      scanner.deviceModel,
      match.deviceModel,
    ),
    fingerLabel: pickText(
      data.fingerLabel,
      data.finger_label,
      match.fingerLabel,
      match.finger_label,
    ),
  };
};

export const extractFingerprintMessage = (payload = {}) => {
  const data = unwrapBridgePayload(payload);
  return pickText(data.message, data.statusMessage, data.detail, data.description);
};

export const extractFingerprintPreviewImage = (payload = {}) => {
  const data = unwrapBridgePayload(payload);
  const fingerprint = asObject(data.fingerprint);
  const match = asObject(data.match);

  return pickText(
    data.previewImage,
    data.preview_image,
    fingerprint.previewImage,
    fingerprint.preview_image,
    match.previewImage,
    match.preview_image,
  );
};

export const extractFingerprintCaptureStats = (payload = {}) => {
  const data = unwrapBridgePayload(payload);

  return {
    captureCount: Number(data.captureCount || data.capture_count || 0) || null,
    qualityScore: Number(data.qualityScore || data.quality_score || data.score || 0) || null,
  };
};

export const downloadBiometricBridgeWindowsInstaller = () => {
  const href = `${resolveBackendBaseUrl()}/api/v1/setup/biometric-bridge/windows-installer`;
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = 'install-prynova-biometric-bridge.cmd';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};

export { resolveBridgeUrl };

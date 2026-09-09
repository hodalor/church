const DEFAULT_BRIDGE_URL = 'http://127.0.0.1:4113';
const DEFAULT_API_BASE_URL = 'http://localhost:5000/api/v1';

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

const resolveBridgeUrl = () => {
  const configuredUrl =
    process.env.REACT_APP_BIOMETRIC_BRIDGE_URL ||
    process.env.REACT_APP_FINGERPRINT_BRIDGE_URL ||
    DEFAULT_BRIDGE_URL;

  return String(configuredUrl).replace(/\/+$/, '');
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

const callBridge = async (path, options = {}) => {
  const response = await fetch(`${resolveBridgeUrl()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  return readJsonResponse(response);
};

const callBridgeWithFallback = async (paths = [], options = {}) => {
  let lastError;

  for (const path of paths) {
    try {
      return await callBridge(path, options);
    } catch (error) {
      lastError = error;
      const isNotFoundError =
        typeof error?.message === 'string' &&
        error.message.includes('Biometric bridge request failed (404)');

      if (!isNotFoundError) {
        throw error;
      }
    }
  }

  throw lastError || new Error('Biometric bridge request failed.');
};

export const getBiometricBridgeStatus = async () => {
  try {
    const data = await callBridge('/health', { method: 'GET' });

    if (data?.ready === false) {
      throw new Error(
        data?.message ||
          'Fingerprint bridge is installed but not configured yet. Finish the scanner setup, then refresh bridge status.',
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
    return await callBridgeWithFallback(
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
    return await callBridgeWithFallback(
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

  return pickText(data.memberId, match.memberId, member.memberId);
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

const DEFAULT_BRIDGE_URL = 'http://127.0.0.1:4113';

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

const readJsonResponse = async (response) => {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

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
    return await callBridge('/health', { method: 'GET' });
  } catch (error) {
    throw new Error(
      error.message ||
        'Fingerprint bridge is not reachable. Ensure the local ZKT bridge service is running.',
    );
  }
};

export const enrollFingerprint = async (payload = {}) => {
  try {
    return await callBridgeWithFallback(['/fingerprint/enroll', '/enroll'], {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new Error(
      error.message ||
        'Unable to capture fingerprint enrollment. Confirm the ZKT scanner bridge is running.',
    );
  }
};

export const identifyFingerprint = async (payload = {}) => {
  try {
    return await callBridgeWithFallback(['/fingerprint/identify', '/identify'], {
      method: 'POST',
      body: JSON.stringify(payload),
    });
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
    data.fingerprintTemplateId,
    data.fingerprint_template_id,
    match.templateId,
    match.template_id,
    match.fingerprintTemplateId,
    match.fingerprint_template_id,
    fingerprint.templateId,
    fingerprint.template_id,
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

export { resolveBridgeUrl };

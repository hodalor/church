import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadDotEnv = () => {
  const envPath = path.join(__dirname, '.env');
  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue;

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
};

loadDotEnv();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const pickText = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
};

const parseJsonBody = async (request) =>
  new Promise((resolve, reject) => {
    const chunks = [];

    request.on('data', (chunk) => {
      chunks.push(chunk);
    });

    request.on('end', () => {
      if (!chunks.length) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (error) {
        reject(new Error('Request body must be valid JSON.'));
      }
    });

    request.on('error', reject);
  });

const resolveAllowedOrigin = (request) => {
  const configuredOrigin = pickText(process.env.BIOMETRIC_BRIDGE_ALLOWED_ORIGIN);
  const requestOrigin = pickText(request.headers.origin);

  if (configuredOrigin && configuredOrigin !== '*') {
    return configuredOrigin;
  }

  return requestOrigin || configuredOrigin || '*';
};

const resolveAllowedHeaders = (request) => {
  const requestedHeaders = pickText(request.headers['access-control-request-headers']);
  const allowedHeaders = new Set([
    'Content-Type',
    'Access-Control-Request-Method',
    'Access-Control-Request-Private-Network',
    'Origin',
    'Accept',
  ]);

  if (requestedHeaders) {
    requestedHeaders
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .forEach((value) => allowedHeaders.add(value));
  }

  return Array.from(allowedHeaders).join(', ');
};

const buildCorsHeaders = (request) => {
  const requestedPrivateNetwork = String(
    request.headers['access-control-request-private-network'] || '',
  )
    .trim()
    .toLowerCase();

  return {
    'Access-Control-Allow-Origin': resolveAllowedOrigin(request),
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': resolveAllowedHeaders(request),
    'Access-Control-Allow-Private-Network':
      requestedPrivateNetwork === 'true' ? 'true' : 'false',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin, Access-Control-Request-Headers, Access-Control-Request-Private-Network',
  };
};

const createJsonResponse = (request, response, statusCode, payload) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    ...buildCorsHeaders(request),
  });
  response.end(JSON.stringify(payload));
};

const createEmptyResponse = (request, response, statusCode = 204) => {
  response.writeHead(statusCode, buildCorsHeaders(request));
  response.end();
};

const buildDeviceMeta = () => ({
  provider: process.env.BIOMETRIC_BRIDGE_PROVIDER || 'ZKTeco',
  deviceModel: process.env.BIOMETRIC_BRIDGE_DEVICE_MODEL || 'SLK20R',
});

const buildMockTemplateId = (payload = {}) => {
  const memberId = pickText(payload.memberId, payload.userId, 'member');
  const timestamp = Date.now().toString(36).toUpperCase();
  return `TMP-${memberId.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase()}-${timestamp}`;
};

const runShellJson = (command, payload = {}) =>
  new Promise((resolve, reject) => {
    if (!command) {
      reject(new Error('Shell command is not configured for this operation.'));
      return;
    }

    const child = spawn(command, {
      cwd: __dirname,
      shell: true,
      env: process.env,
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `SDK adapter exited with code ${code}.`));
        return;
      }

      const trimmed = stdout.trim();
      if (!trimmed) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(trimmed));
      } catch (error) {
        reject(
          new Error(
            `SDK adapter must print JSON to stdout. Received: ${trimmed.slice(0, 200)}`,
          ),
        );
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });

const providers = {
  mock: {
    async health() {
      return {
        ready: true,
        mode: 'mock',
        message: 'Mock fingerprint bridge is online.',
        device: buildDeviceMeta(),
      };
    },
    async enroll(payload = {}) {
      return {
        templateId: buildMockTemplateId(payload),
        memberId: pickText(payload.memberId),
        fingerLabel: pickText(payload.fingerLabel, 'right-thumb'),
        message: 'Mock fingerprint enrollment completed.',
        device: buildDeviceMeta(),
      };
    },
    async identify(payload = {}) {
      const configuredMemberId = pickText(process.env.MOCK_IDENTIFY_MEMBER_ID, payload.memberId);
      const configuredTemplateId = pickText(
        process.env.MOCK_IDENTIFY_TEMPLATE_ID,
        payload.templateId,
        configuredMemberId ? `TMP-${configuredMemberId.toUpperCase()}` : '',
      );

      if (!configuredMemberId && !configuredTemplateId) {
        throw new Error(
          'Mock identify requires MOCK_IDENTIFY_MEMBER_ID or MOCK_IDENTIFY_TEMPLATE_ID.',
        );
      }

      return {
        memberId: configuredMemberId,
        templateId: configuredTemplateId,
        fingerLabel: pickText(payload.fingerLabel, 'right-thumb'),
        message: 'Mock fingerprint identified successfully.',
        match: {
          memberId: configuredMemberId,
          templateId: configuredTemplateId,
        },
        device: buildDeviceMeta(),
      };
    },
  },
  shell: {
    async health() {
      if (!process.env.BIOMETRIC_BRIDGE_HEALTH_COMMAND) {
        return {
          ready: Boolean(
            process.env.BIOMETRIC_BRIDGE_ENROLL_COMMAND &&
              process.env.BIOMETRIC_BRIDGE_IDENTIFY_COMMAND,
          ),
          mode: 'shell',
          message: 'Shell bridge configured.',
          device: buildDeviceMeta(),
        };
      }

      const result = await runShellJson(process.env.BIOMETRIC_BRIDGE_HEALTH_COMMAND, {});
      return {
        ready: result.ready !== false,
        mode: 'shell',
        ...result,
      };
    },
    async enroll(payload = {}) {
      return runShellJson(process.env.BIOMETRIC_BRIDGE_ENROLL_COMMAND, payload);
    },
    async identify(payload = {}) {
      return runShellJson(process.env.BIOMETRIC_BRIDGE_IDENTIFY_COMMAND, payload);
    },
  },
};

const resolveProvider = () => {
  const mode = (process.env.BIOMETRIC_BRIDGE_MODE || 'mock').trim().toLowerCase();
  const provider = providers[mode];

  if (!provider) {
    throw new Error(
      `Unsupported BIOMETRIC_BRIDGE_MODE "${mode}". Use "mock" or "shell".`,
    );
  }

  return { mode, provider };
};

const server = createServer(async (request, response) => {
  if (!request.url) {
    createJsonResponse(request, response, 404, { message: 'Route not found.' });
    return;
  }

  if (request.method === 'OPTIONS') {
    createEmptyResponse(request, response, 204);
    return;
  }

  try {
    const { pathname } = new URL(request.url, 'http://127.0.0.1');
    const { mode, provider } = resolveProvider();

    if (request.method === 'GET' && pathname === '/') {
      createJsonResponse(request, response, 200, {
        service: 'prynova-biometric-bridge',
        mode,
        endpoints: ['/health', '/fingerprint/enroll', '/fingerprint/identify'],
      });
      return;
    }

    if (request.method === 'GET' && pathname === '/health') {
      const result = await provider.health();
      createJsonResponse(request, response, 200, result);
      return;
    }

    if (request.method === 'POST' && pathname === '/fingerprint/enroll') {
      const payload = await parseJsonBody(request);
      const result = await provider.enroll(payload);
      createJsonResponse(request, response, 200, result);
      return;
    }

    if (request.method === 'POST' && pathname === '/fingerprint/identify') {
      const payload = await parseJsonBody(request);
      const result = await provider.identify(payload);
      createJsonResponse(request, response, 200, result);
      return;
    }

    createJsonResponse(request, response, 404, {
      message: 'Route not found.',
    });
  } catch (error) {
    createJsonResponse(request, response, 500, {
      message: error.message || 'Biometric bridge request failed.',
    });
  }
});

const host = process.env.BIOMETRIC_BRIDGE_HOST || '127.0.0.1';
const port = toNumber(process.env.BIOMETRIC_BRIDGE_PORT, 4113);

server.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      service: 'prynova-biometric-bridge',
      host,
      port,
      mode: process.env.BIOMETRIC_BRIDGE_MODE || 'mock',
    }),
  );
});

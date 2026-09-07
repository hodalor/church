import request from 'supertest';
import { describe, expect, it } from '@jest/globals';
import app from '../app.js';

describe('GET /api/v1/health', () => {
  it('returns 200 with status ok', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body).toHaveProperty('timestamp');
  });
});

import { describe, expect, it } from '@jest/globals';
import { createTenant } from './service.js';

describe('Tenant Service - createTenant', () => {
  it('creates a tenant with a head_pastor user', async () => {
    const result = await createTenant({
      tenantId: 'newchurch',
      churchName: 'New Life Church',
      email: 'info@newlife.com',
      country: 'Zambia',
      initialUsername: 'pastor',
      initialPin: '123456',
    });

    expect(result.tenant.tenantId).toBe('newchurch');
    expect(result.initialUser.role).toBe('head_pastor');
    expect(result.initialUser).not.toHaveProperty('pinHash');
  });

  it('rejects duplicate tenantId', async () => {
    await createTenant({
      tenantId: 'duplicate',
      churchName: 'Church A',
      email: 'a@church.com',
      country: 'Zambia',
      initialUsername: 'pastor',
      initialPin: '123456',
    });

    await expect(
      createTenant({
        tenantId: 'duplicate',
        churchName: 'Church B',
        email: 'b@church.com',
        country: 'Zambia',
        initialUsername: 'pastor2',
        initialPin: '654321',
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects tenantId with special characters', async () => {
    await expect(
      createTenant({
        tenantId: 'invalid church!',
        churchName: 'Bad Church',
        email: 'bad@church.com',
        country: 'Zambia',
        initialUsername: 'pastor',
        initialPin: '123456',
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

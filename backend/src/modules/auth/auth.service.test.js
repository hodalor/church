import bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import Tenant from '../tenants/model.js';
import User from '../users/model.js';

jest.unstable_mockModule('../../utils/auditLogger.js', () => ({
  logAudit: jest.fn(),
  default: jest.fn(),
}));

const { loginService } = await import('./service.js');

describe('Auth Service - loginService', () => {
  beforeEach(async () => {
    const pinHash = await bcrypt.hash('1234', 10);

    await Tenant.create({
      tenantId: 'testchurch',
      churchName: 'Test Church',
      email: 'test@church.com',
      isActive: true,
      isSuspended: false,
    });

    await User.create({
      tenantId: 'testchurch',
      username: 'testuser',
      pinHash,
      role: 'head_pastor',
      isActive: true,
    });
  });

  it('returns tokens on valid credentials', async () => {
    const result = await loginService({
      tenantId: 'testchurch',
      username: 'testuser',
      pin: '1234',
    });

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.user.role).toBe('head_pastor');
  });

  it('throws 404 when tenant does not exist', async () => {
    await expect(
      loginService({
        tenantId: 'nonexistent',
        username: 'testuser',
        pin: '1234',
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 401 on wrong PIN', async () => {
    await expect(
      loginService({
        tenantId: 'testchurch',
        username: 'testuser',
        pin: '9999',
      }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 401 on wrong username', async () => {
    await expect(
      loginService({
        tenantId: 'testchurch',
        username: 'wronguser',
        pin: '1234',
      }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 403 when tenant is suspended', async () => {
    await Tenant.findOneAndUpdate(
      { tenantId: 'testchurch' },
      { isSuspended: true },
    );

    await expect(
      loginService({
        tenantId: 'testchurch',
        username: 'testuser',
        pin: '1234',
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

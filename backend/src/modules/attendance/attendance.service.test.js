import { beforeEach, describe, expect, it } from '@jest/globals';
import Member from '../members/member.model.js';
import { createService, qrCheckIn, toggleServiceCheckIn } from './attendance.service.js';

describe('Attendance Service - qrCheckIn', () => {
  let service;

  beforeEach(async () => {
    service = await createService(
      'testchurch',
      {
        title: 'Sunday Service',
        type: 'sunday_service',
        date: new Date(),
      },
      { userId: 'user123', role: 'head_pastor' },
    );

    service = await toggleServiceCheckIn(
      'testchurch',
      service.serviceId,
      true,
      { userId: 'user123', role: 'head_pastor' },
    );

    await Member.create({
      tenantId: 'testchurch',
      memberId: 'testchurch-000001',
      firstName: 'John',
      lastName: 'Test',
      membershipStatus: 'member',
    });
  });

  it('successfully checks in a valid member', async () => {
    const qrData = JSON.stringify({
      memberId: 'testchurch-000001',
      tenantId: 'testchurch',
      type: 'prynova_member',
    });

    const result = await qrCheckIn(
      'testchurch',
      service.serviceId,
      qrData,
      { userId: 'user123', role: 'head_pastor' },
    );

    expect(result.name).toContain('John');
    expect(result.checkInMethod).toBe('qr');
  });

  it('returns already checked in state for duplicate check-in to same service', async () => {
    const qrData = JSON.stringify({
      memberId: 'testchurch-000001',
      tenantId: 'testchurch',
      type: 'prynova_member',
    });

    await qrCheckIn(
      'testchurch',
      service.serviceId,
      qrData,
      { userId: 'user123', role: 'head_pastor' },
    );

    const result = await qrCheckIn(
      'testchurch',
      service.serviceId,
      qrData,
      { userId: 'user123', role: 'head_pastor' },
    );

    expect(result.alreadyCheckedIn).toBe(true);
    expect(result.message).toMatch(/already checked in/i);
  });

  it('rejects QR from wrong tenant', async () => {
    const qrData = JSON.stringify({
      memberId: 'testchurch-000001',
      tenantId: 'wrongchurch',
      type: 'prynova_member',
    });

    await expect(
      qrCheckIn(
        'testchurch',
        service.serviceId,
        qrData,
        { userId: 'user123', role: 'head_pastor' },
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

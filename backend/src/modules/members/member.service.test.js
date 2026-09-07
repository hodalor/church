import mongoose from 'mongoose';
import { describe, expect, it } from '@jest/globals';
import { createMember, recalculateHealthScore } from './member.service.js';

const createActorId = () => new mongoose.Types.ObjectId().toString();

describe('Member Service - createMember', () => {
  it('creates a member with auto-generated memberId', async () => {
    const member = await createMember(
      'testchurch',
      {
        firstName: 'John',
        lastName: 'Banda',
        membershipStatus: 'member',
      },
      createActorId(),
    );

    expect(member.memberId).toMatch(/^testchurch-\d{6}$/);
    expect(member.firstName).toBe('John');
  });

  it('generates a qrCode on creation', async () => {
    const member = await createMember(
      'testchurch',
      {
        firstName: 'Mary',
        lastName: 'Phiri',
        membershipStatus: 'member',
      },
      createActorId(),
    );

    expect(member.qrCode).toBeTruthy();
    expect(member.qrCode).toContain('data:image/png;base64,');
  });

  it('rejects duplicate phone within same tenant', async () => {
    await createMember(
      'testchurch',
      {
        firstName: 'A',
        lastName: 'B',
        phone: '+260971000001',
        membershipStatus: 'member',
      },
      createActorId(),
    );

    await expect(
      createMember(
        'testchurch',
        {
          firstName: 'C',
          lastName: 'D',
          phone: '+260971000001',
          membershipStatus: 'member',
        },
        createActorId(),
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('allows same phone across different tenants', async () => {
    await createMember(
      'church1',
      {
        firstName: 'A',
        lastName: 'B',
        phone: '+260971000002',
        membershipStatus: 'member',
      },
      createActorId(),
    );

    const member = await createMember(
      'church2',
      {
        firstName: 'C',
        lastName: 'D',
        phone: '+260971000002',
        membershipStatus: 'member',
      },
      createActorId(),
    );

    expect(member).toBeDefined();
  });
});

describe('Member Service - recalculateHealthScore', () => {
  it('returns new member status for members under 30 days old', async () => {
    const member = await createMember(
      'testchurch',
      {
        firstName: 'New',
        lastName: 'Member',
        membershipStatus: 'member',
      },
      createActorId(),
    );

    const result = await recalculateHealthScore('testchurch', member.memberId);

    expect(result.status).toBe('new');
  });
});

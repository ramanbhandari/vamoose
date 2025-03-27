import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { getAuthHeaders } from '../auth.ts';
import { k6Config, getUrl } from '../config.ts';
// import prisma from '../../../config/prismaClient.ts';

export default async function () {
  const headers = getAuthHeaders(k6Config.testUserId);

  // Create a dummy test user
  const dummyUserId = 'dummy-invitee-id';
  const dummyEmail = 'dummy-invitee@example.com';
  const dummyHeader = getAuthHeaders(dummyUserId);

  group('Trip Invitation API', () => {
    // 1. Create a trip
    const tripRes = http.post(
      getUrl('/api/trips'),
      JSON.stringify({
        name: 'Invite Trip',
        destination: 'Invite City',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
      }),
      { headers, tags: { name: 'trips' } },
    );

    const tripId = tripRes.json('trip.id');

    check(tripRes, {
      '✅ Trip created for invites': (res) => res.status === 201,
    });

    if (!tripId) return;

    // 2. Send invite
    const inviteRes = http.post(
      getUrl(`/api/trips/${tripId}/invites/create`),
      JSON.stringify({ email: dummyEmail }),
      { headers, tags: { name: 'invites' } },
    );

    check(inviteRes, {
      '✅ Invite sent': (res) => res.status === 201,
    });

    const inviteUrl = inviteRes.json('inviteUrl');
    const token =
      typeof inviteUrl === 'string' ? inviteUrl.split('/').pop() : undefined;

    if (!token) return;

    // 3. Validate invite
    const validateRes = http.get(
      getUrl(`/api/trips/${tripId}/invites/validate/${token}`),
      { headers: dummyHeader, tags: { name: 'invites' } },
    );

    check(validateRes, {
      '✅ Invite validated': (res) => res.status === 200,
    });

    // 4. Accept invite
    const acceptRes = http.post(
      getUrl(`/api/trips/${tripId}/invites/accept/${token}`),
      null,
      { headers: dummyHeader, tags: { name: 'invites' } },
    );

    check(acceptRes, {
      '✅ Invite accepted': (res) => res.status === 200,
    });
  });

  sleep(1);
}

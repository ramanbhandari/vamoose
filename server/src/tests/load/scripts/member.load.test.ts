import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { getAuthHeaders } from '../auth.ts';
import { k6Config, getUrl } from '../config.ts';

export default function () {
  const headers = getAuthHeaders(k6Config.testUserId);

  group('Trip Members API', () => {
    const createTripRes = http.post(
      getUrl('/api/trips'),
      JSON.stringify({
        name: 'Test Trip for Members',
        destination: 'Team Town',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      }),
      { headers, tags: { name: 'trips' } },
    );

    check(createTripRes, {
      'trip created': (r) => r.status === 201,
    });

    const tripId = createTripRes.json('trip.id');
    const memberId = k6Config.testUserId;

    if (tripId) {
      // Get all members
      const allRes = http.get(getUrl(`/api/trips/${tripId}/members`), {
        headers,
        tags: { name: 'members' },
      });
      check(allRes, {
        'fetched all members': (r) => r.status === 200,
      });

      // Get a specific member
      const oneRes = http.get(
        getUrl(`/api/trips/${tripId}/members/${memberId}`),
        { headers, tags: { name: 'members' } },
      );
      check(oneRes, {
        'fetched single member': (r) => r.status === 200,
      });

      // Try to update role (just for test)
      const patchRes = http.patch(
        getUrl(`/api/trips/${tripId}/members/${memberId}`),
        JSON.stringify({ role: 'admin' }),
        { headers, tags: { name: 'members' } },
      );
      check(patchRes, {
        'updated member role (possibly)': (r) => [200, 403].includes(r.status),
      });

      // Attempt to leave trip
      const leaveRes = http.del(
        getUrl(`/api/trips/${tripId}/members/leave`),
        null,
        { headers, tags: { name: 'members' } },
      );
      check(leaveRes, {
        'left the trip or denied': (r) => [200, 403].includes(r.status),
      });
    }
  });

  sleep(1);
}

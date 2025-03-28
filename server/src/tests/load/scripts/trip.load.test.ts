import http from 'k6/http';
import { check, group } from 'k6';
import { sleep } from 'k6';
import { getAuthHeaders } from '../auth.ts';
import { k6Config, getUrl } from '../config.ts';

export default function () {
  const headers = getAuthHeaders(k6Config.testUserId);

  group('Trip API', () => {
    // Create a trip
    const createRes = http.post(
      getUrl('/api/trips'),
      JSON.stringify({
        name: 'Load Test Trip',
        destination: 'Test City',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      }),
      { headers, tags: { name: 'trips' } },
    );

    check(createRes, {
      'Trip created': (res) => res.status === 201,
    });

    const trip = createRes.json('trip');
    const tripId = trip?.id;

    if (tripId) {
      // Fetch single trip
      const getRes = http.get(getUrl(`/api/trips/${tripId}`), {
        headers,
        tags: { name: 'trips' },
      });
      check(getRes, {
        'Trip fetched': (res) => res.status === 200,
      });

      // Update trip
      const updateRes = http.patch(
        getUrl(`/api/trips/${tripId}`),
        JSON.stringify({ name: 'Updated Load Test Trip' }),
        { headers, tags: { name: 'trips' } },
      );
      check(updateRes, {
        'Trip updated': (res) => res.status === 200,
      });

      // Delete trip
      const deleteRes = http.del(getUrl(`/api/trips/${tripId}`), null, {
        headers,
        tags: { name: 'trips' },
      });
      check(deleteRes, {
        'Trip deleted': (res) => res.status === 200,
      });
    }
  });

  sleep(1);
}

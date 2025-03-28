import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { getUrl, k6Config } from '../config.ts';
import { getAuthHeaders } from '../auth.ts';

export default function () {
  const headers = getAuthHeaders(k6Config.testUserId);

  group('Marked Locations API', () => {
    // Create Trip
    const tripRes = http.post(
      getUrl('/api/trips'),
      JSON.stringify({
        name: 'Location Trip',
        destination: 'Mapville',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      }),
      { headers, tags: { name: 'trips' } },
    );

    check(tripRes, { '✅ Trip created': (r) => r.status === 201 });

    const tripId = tripRes.json('trip.id');
    if (!tripId) return;

    // Create Marked Location
    const locationRes = http.post(
      getUrl(`/api/trips/${tripId}/marked-locations`),
      JSON.stringify({
        name: 'Cafe Pin',
        type: 'CAFE',
        coordinates: {
          latitude: 40.7128,
          longitude: -74.006,
        },
        address: '123 Bean Blvd, Mapville',
        notes: 'Coffee meetup spot',
        website: 'https://cafepin.test',
        phoneNumber: '123-456-7890',
      }),
      { headers, tags: { name: 'markedLocations' } },
    );

    check(locationRes, { '✅ Location created': (r) => r.status === 201 });

    const locationId = locationRes.json('markedLocation.id');
    if (!locationId) return;

    // Update Notes
    const update = http.put(
      getUrl(`/api/trips/${tripId}/marked-locations/${locationId}/notes`),
      JSON.stringify({ notes: 'Updated note' }),
      { headers, tags: { name: 'markedLocations' } },
    );

    check(update, {
      '✅ Location note updated': (r) => r.status === 200,
    });

    // Delete Location
    const del = http.del(
      getUrl(`/api/trips/${tripId}/marked-locations/${locationId}`),
      null,
      { headers, tags: { name: 'markedLocations' } },
    );

    check(del, {
      '✅ Location deleted': (r) => r.status === 200,
    });
  });

  sleep(1);
}

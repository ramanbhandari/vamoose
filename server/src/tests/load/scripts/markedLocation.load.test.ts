import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { getUrl, k6Config } from '../config.ts';
import { getAuthHeaders } from '../auth.ts';

function prettyJson(body: string): string {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

export default function () {
  const headers = getAuthHeaders(k6Config.testUserId);

  group('Marked Locations API', () => {
    // console.log(
    //   '🔁 Starting Marked Locations test for user:',
    //   k6Config.testUserId,
    // );

    // 1. Create Trip
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

    // console.log(
    //   `📨 Trip create response: ${tripRes.status}\n${prettyJson(tripRes.body)}`,
    // );
    check(tripRes, { '✅ Trip created': (r) => r.status === 201 });

    const tripId = tripRes.json('trip.id');
    // console.log('📦 Trip ID:', tripId);
    if (!tripId) return;

    // 2. Create Marked Location
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

    // console.log(
    //   `📨 Location create response: ${locationRes.status}\n${prettyJson(locationRes.body)}`,
    // );
    check(locationRes, { '✅ Location created': (r) => r.status === 201 });

    const locationId = locationRes.json('markedLocation.id');
    // console.log('📦 Location ID:', locationId);
    if (!locationId) return;

    // 3. Update Notes
    const update = http.put(
      getUrl(`/api/trips/${tripId}/marked-locations/${locationId}/notes`),
      JSON.stringify({ notes: 'Updated note' }),
      { headers, tags: { name: 'markedLocations' } },
    );

    // console.log(
    //   `📨 Note update response: ${update.status}\n${prettyJson(update.body)}`,
    // );
    check(update, {
      '✅ Location note updated': (r) => r.status === 200,
    });

    // 4. Delete Location
    const del = http.del(
      getUrl(`/api/trips/${tripId}/marked-locations/${locationId}`),
      null,
      { headers, tags: { name: 'markedLocations' } },
    );

    // console.log(
    //   `📨 Delete location response: ${del.status}\n${prettyJson(del.body)}`,
    // );
    check(del, {
      '✅ Location deleted': (r) => r.status === 200,
    });
  });

  sleep(1);
}

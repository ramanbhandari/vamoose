import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { getAuthHeaders } from '../auth.ts';
import { k6Config, getUrl } from '../config.ts';

function prettyJson(body: string): string {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

export default function () {
  const headers = getAuthHeaders(k6Config.testUserId);

  group('Itinerary Events API', () => {
    // console.log(
    //   '🔁 Starting Itinerary Events test with user:',
    //   k6Config.testUserId,
    // );

    const tripRes = http.post(
      getUrl('/api/trips'),
      JSON.stringify({
        name: 'Itinerary Trip',
        destination: 'Planner City',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 3 * 86400000).toISOString(),
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

    const startTime = new Date(Date.now() + 3600000).toISOString(); // +1 hour
    const endTime = new Date(Date.now() + 7200000).toISOString(); // +2 hours

    const createRes = http.post(
      getUrl(`/api/trips/${tripId}/itinerary-events`),
      JSON.stringify({
        title: 'Museum Visit',
        description: 'Check out the art gallery',
        location: 'Art Museum',
        category: 'ACTIVITY',
        startTime,
        endTime,
        notes: [{ content: 'Bring ID' }],
      }),
      { headers, tags: { name: 'itinerary' } },
    );

    // console.log(
    //   `📨 Event create response: ${createRes.status}\n${prettyJson(createRes.body)}`,
    // );

    check(createRes, {
      '✅ Event created': (r) => r.status === 201,
    });

    const eventId = createRes.json('itineraryEvent.id');
    // console.log('📦 Event ID:', eventId);
    if (!eventId) return;

    // Fetch single event
    const fetchRes = http.get(
      getUrl(`/api/trips/${tripId}/itinerary-events/${eventId}`),
      { headers, tags: { name: 'itinerary' } },
    );
    // console.log(
    //   `📨 Event fetch response: ${fetchRes.status}\n${prettyJson(fetchRes.body)}`,
    // );
    check(fetchRes, { '✅ Event fetched': (r) => r.status === 200 });

    // Update the event
    const updateRes = http.patch(
      getUrl(`/api/trips/${tripId}/itinerary-events/${eventId}`),
      JSON.stringify({ title: 'Museum Visit (Updated)', category: 'OTHER' }),
      { headers, tags: { name: 'itinerary' } },
    );
    // console.log(
    //   `📨 Event update response: ${updateRes.status}\n${prettyJson(updateRes.body)}`,
    // );
    check(updateRes, {
      '✅ Event updated': (r) => [200, 201].includes(r.status),
    });

    // Assign more users (re-assign same user for test)
    const assignRes = http.post(
      getUrl(`/api/trips/${tripId}/itinerary-events/${eventId}/assign`),
      JSON.stringify({ userIds: [k6Config.testUserId] }),
      { headers, tags: { name: 'itinerary' } },
    );
    // console.log(
    //   `📨 Assign user response: ${assignRes.status}\n${prettyJson(assignRes.body)}`,
    // );

    // Unassign the user
    const unassignRes = http.del(
      getUrl(`/api/trips/${tripId}/itinerary-events/${eventId}/unassign`),
      JSON.stringify({ userIds: [k6Config.testUserId] }),
      { headers, tags: { name: 'itinerary' } },
    );
    // console.log(
    //   `📨 Unassign user response: ${unassignRes.status}\n${prettyJson(unassignRes.body)}`,
    // );

    // Add another note
    const noteRes = http.post(
      getUrl(`/api/trips/${tripId}/itinerary-events/${eventId}/notes`),
      JSON.stringify({ content: 'Wear comfy shoes' }),
      { headers, tags: { name: 'itinerary' } },
    );
    // console.log(
    //   `📨 Add note response: ${noteRes.status}\n${prettyJson(noteRes.body)}`,
    // );
  });

  sleep(1);
}

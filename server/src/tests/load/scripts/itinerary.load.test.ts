import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { getAuthHeaders } from '../auth.ts';
import { k6Config, getUrl } from '../config.ts';

export default function () {
  const headers = getAuthHeaders(k6Config.testUserId);

  group('Itinerary Events API', () => {
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

    check(tripRes, { '✅ Trip created': (r) => r.status === 201 });

    const tripId = tripRes.json('trip.id');
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

    check(createRes, {
      '✅ Event created': (r) => r.status === 201,
    });

    const eventId = createRes.json('itineraryEvent.id');
    if (!eventId) return;

    // Fetch single event
    const fetchRes = http.get(
      getUrl(`/api/trips/${tripId}/itinerary-events/${eventId}`),
      { headers, tags: { name: 'itinerary' } },
    );
    check(fetchRes, { '✅ Event fetched': (r) => r.status === 200 });

    // Update the event
    const updateRes = http.patch(
      getUrl(`/api/trips/${tripId}/itinerary-events/${eventId}`),
      JSON.stringify({ title: 'Museum Visit (Updated)', category: 'OTHER' }),
      { headers, tags: { name: 'itinerary' } },
    );
    check(updateRes, {
      '✅ Event updated': (r) => [200, 201].includes(r.status),
    });

    // Assign more users (re-assign same user for test)
    const assignRes = http.post(
      getUrl(`/api/trips/${tripId}/itinerary-events/${eventId}/assign`),
      JSON.stringify({ userIds: [k6Config.testUserId] }),
      { headers, tags: { name: 'itinerary' } },
    );

    check(assignRes, {
      '✅ Event updated': (r) => [200, 201].includes(r.status),
    });

    // Unassign the user
    const unassignRes = http.del(
      getUrl(`/api/trips/${tripId}/itinerary-events/${eventId}/unassign`),
      JSON.stringify({ userIds: [k6Config.testUserId] }),
      { headers, tags: { name: 'itinerary' } },
    );
    check(unassignRes, {
      '✅ Event updated': (r) => r.status === 200,
    });

    // Add another note
    const noteRes = http.post(
      getUrl(`/api/trips/${tripId}/itinerary-events/${eventId}/notes`),
      JSON.stringify({ content: 'Wear comfy shoes' }),
      { headers, tags: { name: 'itinerary' } },
    );
    check(noteRes, {
      '✅ Event updated': (r) => [200, 201].includes(r.status),
    });
  });

  sleep(1);
}

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { getAuthHeaders } from '../auth.ts';
import { k6Config, getUrl } from '../config.ts';

export default function () {
  const headers = getAuthHeaders(k6Config.testUserId);

  group('Chat Messages API', () => {
    const tripRes = http.post(
      getUrl('/api/trips'),
      JSON.stringify({
        name: 'Chat Trip',
        destination: 'Message Island',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      }),
      { headers, tags: { name: 'trips' } },
    );

    check(tripRes, { 'trip created': (r) => r.status === 201 });

    const tripId = tripRes.json('trip.id');

    if (tripId) {
      // Send a message
      const sendRes = http.post(
        getUrl(`/api/trips/${tripId}/messages/sendMessage`),
        JSON.stringify({ text: 'Hello from load test!' }),
        { headers, tags: { name: 'messages' } },
      );

      check(sendRes, {
        'message sent': (r) => r.status === 201,
      });

      const messageId = sendRes.json('savedMessage.messageId');

      // Fetch all messages
      const fetchRes = http.get(getUrl(`/api/trips/${tripId}/messages`), {
        headers,
        tags: { name: 'messages' },
      });

      check(fetchRes, {
        'fetched messages': (r) => r.status === 200,
      });

      // Add a reaction
      const reactRes = http.patch(
        getUrl(`/api/trips/${tripId}/messages/${messageId}`),
        JSON.stringify({ emoji: '👍' }),
        { headers, tags: { name: 'messages' } },
      );
      check(reactRes, {
        'reacted to message': (r) => [200, 404].includes(r.status),
      });

      // Remove reaction
      const unreactRes = http.patch(
        getUrl(`/api/trips/${tripId}/messages/${messageId}/removeReaction`),
        JSON.stringify({ emoji: '👍' }),
        { headers, tags: { name: 'messages' } },
      );
      check(unreactRes, {
        'removed reaction': (r) => [200, 404].includes(r.status),
      });
    }
  });

  sleep(k6Config.chatMessageIntervalMs / 1000); // sleep between messages
}

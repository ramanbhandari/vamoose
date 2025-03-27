import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { getAuthHeaders } from '../auth.ts';
import { k6Config, getUrl } from '../config.ts';

export default function () {
  const headers = getAuthHeaders(k6Config.testUserId);

  group('Polls API', () => {
    // console.log('🔁 Starting Poll API test with user:', k6Config.testUserId);

    // 1. Create Trip
    const tripRes = http.post(
      getUrl('/api/trips'),
      JSON.stringify({
        name: 'Voting Trip',
        destination: 'Poll City',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      }),
      { headers, tags: { name: 'trips' } },
    );

    check(tripRes, { '✅ Trip created': (r) => r.status === 201 });

    const tripId = tripRes.json('trip.id');
    // console.log('📦 Trip ID:', tripId);
    if (!tripId) return;

    // 2. Create Poll
    const expiresAt = new Date(Date.now() + 600000).toISOString(); // +10 mins

    const createRes = http.post(
      getUrl(`/api/trips/${tripId}/polls`),
      JSON.stringify({
        question: 'Where should we go?',
        expiresAt,
        options: ['Beach', 'Mountains'],
      }),
      { headers, tags: { name: 'polls' } },
    );

    check(createRes, {
      '✅ Poll created': (r) => r.status === 201,
    });

    const poll = createRes.json('poll');
    const pollId = poll?.id;
    const optionId = poll?.options?.[0]?.id;

    // console.log('📦 Poll ID:', pollId);
    // console.log('📦 Option ID:', optionId);

    if (!pollId || !optionId) return;

    // 3. Cast Vote
    const voteRes = http.post(
      getUrl(`/api/trips/${tripId}/polls/${pollId}/vote`),
      JSON.stringify({ pollOptionId: optionId }),
      { headers, tags: { name: 'polls' } },
    );

    check(voteRes, {
      '✅ Vote casted': (r) => r.status === 201,
    });

    // 4. Delete Vote
    const delVote = http.del(
      getUrl(`/api/trips/${tripId}/polls/${pollId}/vote`),
      null,
      { headers, tags: { name: 'polls' } },
    );

    check(delVote, {
      '✅ Vote deleted or not found': (r) => [200, 404].includes(r.status),
    });

    // 5. Complete Poll
    const completeRes = http.patch(
      getUrl(`/api/trips/${tripId}/polls/${pollId}/complete`),
      null,
      { headers, tags: { name: 'polls' } },
    );

    check(completeRes, {
      '✅ Poll completed or rejected': (r) => [200, 403].includes(r.status),
    });
  });
  sleep(1);
}

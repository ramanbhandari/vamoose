import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { getAuthHeaders } from '../auth.ts';
import { k6Config, getUrl } from '../config.ts';

export default function () {
  const headers = getAuthHeaders(k6Config.testUserId);

  group('Expense API', () => {
    const tripRes = http.post(
      getUrl('/api/trips'),
      JSON.stringify({
        name: 'Expense Trip',
        destination: 'Moneyland',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 2 * 86400000).toISOString(),
      }),
      { headers, tags: { name: 'trips' } },
    );

    check(tripRes, {
      '✅ Trip created': (r) => r.status === 201,
    });

    const tripId = tripRes.json('trip.id');

    if (!tripId) return;

    const addRes = http.post(
      getUrl(`/api/trips/${tripId}/expenses`),
      JSON.stringify({
        amount: 250,
        category: 'transportation',
        description: 'Cab from airport',
      }),
      { headers, tags: { name: 'expenses' } },
    );

    check(addRes, {
      '✅ Expense created': (r) => r.status === 201,
    });

    const expenseId = addRes.json('expense.id');

    if (!expenseId) return;

    const fetchRes = http.get(
      getUrl(`/api/trips/${tripId}/expenses/${expenseId}`),
      { headers, tags: { name: 'expenses' } },
    );

    check(fetchRes, {
      '✅ Fetched expense': (r) => [200, 404].includes(r.status),
    });

    const deleteRes = http.del(
      getUrl(`/api/trips/${tripId}/expenses/${expenseId}`),
      null,
      { headers, tags: { name: 'expenses' } },
    );

    check(deleteRes, {
      '✅ Deleted expense': (r) => [200, 404].includes(r.status),
    });
  });

  sleep(1);
}

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { getAuthHeaders } from '../auth.ts';
import { k6Config, getUrl } from '../config.ts';

export default function () {
  const headers = getAuthHeaders(k6Config.testUserId);

  group('Expense API', () => {
    // console.log('🔁 Starting Expense API test with user:', k6Config.testUserId);

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

    // console.log(`📨 Trip create response: ${tripRes.status}`);

    check(tripRes, {
      '✅ Trip created': (r) => r.status === 201,
    });

    const tripId = tripRes.json('trip.id');
    // console.log('📦 Trip ID:', tripId);

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

    // console.log(`📨 Expense create response: ${addRes.status}`);

    check(addRes, {
      '✅ Expense created': (r) => r.status === 201,
    });

    const expenseId = addRes.json('expense.id');
    // console.log('📦 Expense ID:', expenseId);

    if (!expenseId) return;

    const fetchRes = http.get(
      getUrl(`/api/trips/${tripId}/expenses/${expenseId}`),
      { headers, tags: { name: 'expenses' } },
    );

    // console.log(`📨 Fetch expense response: ${fetchRes.status}`);

    check(fetchRes, {
      '✅ Fetched expense': (r) => [200, 404].includes(r.status),
    });

    const deleteRes = http.del(
      getUrl(`/api/trips/${tripId}/expenses/${expenseId}`),
      null,
      { headers, tags: { name: 'expenses' } },
    );

    // console.log(`📨 Delete expense response: ${deleteRes.status}}`);

    check(deleteRes, {
      '✅ Deleted expense': (r) => [200, 404].includes(r.status),
    });
  });

  sleep(1);
}

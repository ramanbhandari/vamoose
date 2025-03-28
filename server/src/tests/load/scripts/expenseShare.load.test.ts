import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { getAuthHeaders } from '../auth.ts';
import { k6Config, getUrl } from '../config.ts';

export default function () {
  const headers = getAuthHeaders(k6Config.testUserId);

  group('Expense Shares API', () => {
    const tripRes = http.post(
      getUrl('/api/trips'),
      JSON.stringify({
        name: 'Debt Trip',
        destination: 'Owe City',
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

    const expenseRes = http.post(
      getUrl(`/api/trips/${tripId}/expenses`),
      JSON.stringify({
        description: 'Test Expense',
        category: 'food',
        amount: 100,
      }),
      { headers, tags: { name: 'expenses' } },
    );

    check(expenseRes, {
      '✅ Expense created': (r) => r.status === 201,
    });

    const expenseId = expenseRes.json('expense.id');

    if (!expenseId) return;

    const summaryRes = http.get(
      getUrl(`/api/trips/${tripId}/expenseShares/debt-summary`),
      { headers, tags: { name: 'expenseShares' } },
    );

    check(summaryRes, {
      '✅ Debt summary fetched': (r) => r.status === 200,
    });

    const detailRes = http.get(
      getUrl(
        `/api/trips/${tripId}/expenseShares/debt-summary/${k6Config.testUserId}`,
      ),
      { headers, tags: { name: 'expenseShares' } },
    );

    check(detailRes, {
      '✅ Debt detail fetched': (r) => [200, 404].includes(r.status),
    });

    const settleRes = http.patch(
      getUrl(`/api/trips/${tripId}/expenseShares/settle`),
      JSON.stringify({
        expenseSharesToSettle: [
          {
            expenseId,
            debtorUserId: k6Config.testUserId,
          },
        ],
      }),
      { headers, tags: { name: 'expenseShares' } },
    );

    check(settleRes, {
      '✅ Settled or not found': (r) => [200, 404].includes(r.status),
    });
  });

  sleep(1);
}

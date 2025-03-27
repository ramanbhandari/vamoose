import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { getUrl } from '../config.ts';
import { getAuthHeaders } from '../auth.ts';

export default function () {
  const vuId = __VU; // Unique Virtual User ID assigned by k6
  const userId = `test-user-${vuId}`;
  const headers = getAuthHeaders(userId);

  group(`Notifications API - VU ${vuId}`, () => {
    // console.log(`🔁 Starting Notifications test for ${userId}`);

    // 1. Fetch notifications
    const fetch = http.get(getUrl(`/api/notifications`), {
      headers,
      tags: { name: 'notifications' },
    });
    // console.log(`📨 Fetch notifications response: ${fetch.status}`);

    check(fetch, { '✅ Fetched notifications': (r) => r.status === 200 });

    const notifications = fetch.json('notifications') || [];

    const notificationIds: number[] = Array.isArray(notifications)
      ? notifications.map((n) => n?.id).filter((id) => typeof id === 'number')
      : [];

    if (notificationIds.length === 0) {
      // console.warn(`⚠️ No valid notification IDs found for ${userId}`);
      return;
    }

    const firstId = notificationIds[0];

    // 2. Mark as read
    const markRead = http.patch(
      getUrl(`/api/notifications/${firstId}/mark-as-read`),
      null,
      { headers, tags: { name: 'notifications' } },
    );
    check(markRead, { '✅ Marked single as read': (r) => r.status === 200 });

    // 3. Mark as unread
    const markUnread = http.patch(
      getUrl(`/api/notifications/${firstId}/mark-as-unread`),
      null,
      { headers, tags: { name: 'notifications' } },
    );
    check(markUnread, {
      '✅ Marked single as unread': (r) => r.status === 200,
    });

    // 4. Batch mark read
    const batchRead = http.patch(
      getUrl(`/api/notifications/mark-as-read`),
      JSON.stringify({ notificationIds }),
      { headers, tags: { name: 'notifications' } },
    );
    check(batchRead, { '✅ Batch mark read': (r) => r.status === 200 });

    // 5. Delete a single notification
    const delOne = http.del(
      getUrl(`/api/notifications/${firstId}/clear`),
      null,
      { headers, tags: { name: 'notifications' } },
    );
    check(delOne, { '✅ Deleted single': (r) => r.status === 200 });

    // 6. Batch delete notifications
    const delBatch = http.del(
      getUrl(`/api/notifications/clear`),
      JSON.stringify({ notificationIds }),
      { headers, tags: { name: 'notifications' } },
    );
    check(delBatch, { '✅ Batch deleted': (r) => r.status === 200 });
  });

  sleep(1);
}

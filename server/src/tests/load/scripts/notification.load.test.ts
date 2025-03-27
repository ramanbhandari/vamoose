import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { getUrl } from '../config.ts';
import { getAuthHeaders } from '../auth.ts';

function prettyJson(body: string): string {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

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
    // console.log(
    //   `📨 Mark as read response: ${markRead.status}\n${prettyJson(markRead.body)}`,
    // );
    check(markRead, { '✅ Marked single as read': (r) => r.status === 200 });

    // 3. Mark as unread
    const markUnread = http.patch(
      getUrl(`/api/notifications/${firstId}/mark-as-unread`),
      null,
      { headers, tags: { name: 'notifications' } },
    );
    // console.log(
    //   `📨 Mark as unread response: ${markUnread.status}\n${prettyJson(markUnread.body)}`,
    // );
    check(markUnread, {
      '✅ Marked single as unread': (r) => r.status === 200,
    });

    // 4. Batch mark read
    const batchRead = http.patch(
      getUrl(`/api/notifications/mark-as-read`),
      JSON.stringify({ notificationIds }),
      { headers, tags: { name: 'notifications' } },
    );
    // console.log(
    //   `📨 Batch mark read response: ${batchRead.status}\n${prettyJson(batchRead.body)}`,
    // );
    check(batchRead, { '✅ Batch mark read': (r) => r.status === 200 });

    // 5. Delete a single notification
    const delOne = http.del(
      getUrl(`/api/notifications/${firstId}/clear`),
      null,
      { headers, tags: { name: 'notifications' } },
    );
    // console.log(
    //   `📨 Delete single response: ${delOne.status}\n${prettyJson(delOne.body)}`,
    // );
    check(delOne, { '✅ Deleted single': (r) => r.status === 200 });

    // 6. Batch delete notifications
    const delBatch = http.del(
      getUrl(`/api/notifications/clear`),
      JSON.stringify({ notificationIds }),
      { headers, tags: { name: 'notifications' } },
    );
    // console.log(
    //   `📨 Batch delete response: ${delBatch.status}\n${prettyJson(delBatch.body)}`,
    // );
    check(delBatch, { '✅ Batch deleted': (r) => r.status === 200 });
  });

  sleep(1);
}

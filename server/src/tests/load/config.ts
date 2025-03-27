export const k6Config = {
  baseURL: __ENV.BASE_URL || 'http://localhost:8000', // or GCP URL
  jwtSecret: __ENV.JWT_SECRET || 'testsecret',
  testUserId: __ENV.TEST_USER_ID || 'test-user-id',
  vus: Number(__ENV.VUS) || 100,
  chatMessageIntervalMs: Number(__ENV.CHAT_INTERVAL_MS) || 1000,
};

export function getUrl(path: string): string {
  return `${k6Config.baseURL}${path}`;
}

import { k6Config } from './config.js';

export function getAuthHeaders(userId?: string) {
  const token = generateTestJWT(userId || k6Config.testUserId);
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export function generateTestJWT(userId: string): string {
  // Replace this with a pre-signed JWT if needed
  return `FAKE.JWT.TOKEN.${userId}`;
}

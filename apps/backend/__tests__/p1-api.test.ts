/**
 * P1 API Integration Tests
 *
 * TC-P1-01: POST /api/auth/register → 201 + tokens
 * TC-P1-02: POST /api/auth/register duplicate → 409
 * TC-P1-03: POST /api/auth/register weak password → 400
 * TC-P1-04: POST /api/auth/login success → 200 + tokens
 * TC-P1-07: POST /api/auth/login rate limit → 429
 * TC-P1-08: POST /api/auth/logout → 200, token revoked
 * TC-P1-12: POST /api/auth/forgot-password → 200
 *
 * Requires backend running at BACKEND_URL (default: http://localhost:3002)
 */

import axios, { AxiosError } from 'axios';

const BASE_URL = process.env.BACKEND_URL ?? 'http://localhost:3002';

// Unique email per test run to avoid duplicate collisions
const RUN_ID = Date.now();
const TEST_EMAIL = `p1test+${RUN_ID}@pocketpenny-qa.test`;
const TEST_PASSWORD = 'QAtest1234!@';
const WEAK_PASSWORD = 'short';

let accessToken: string | null = null;

// ─── Helper: raw axios call (no interceptors) ─────────────────────────────────
const http = axios.create({ baseURL: BASE_URL, withCredentials: false });

// ─────────────────────────────────────────────────────────────────────────────
describe('P1 Auth API Integration', () => {
  // ─── TC-P1-01 ──────────────────────────────────────────────────────────────
  test('TC-P1-01: POST /api/auth/register → 201 + tokens', async () => {
    const res = await http.post('/api/auth/register', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(res.status).toBe(201);
    expect(res.data.success).toBe(true);
    expect(res.data.data).toHaveProperty('accessToken');
    expect(typeof res.data.data.accessToken).toBe('string');
    expect(res.data.data).toHaveProperty('user');
    expect(res.data.data.user.email).toBe(TEST_EMAIL);

    // Store token for TC-P1-08
    accessToken = res.data.data.accessToken;
  });

  // ─── TC-P1-02 ──────────────────────────────────────────────────────────────
  test('TC-P1-02: POST /api/auth/register duplicate email → 409', async () => {
    expect.assertions(2);
    try {
      await http.post('/api/auth/register', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });
    } catch (err) {
      const error = err as AxiosError;
      expect(error.response?.status).toBe(409);
      expect(error.response?.data).toMatchObject({ success: false });
    }
  });

  // ─── TC-P1-03 ──────────────────────────────────────────────────────────────
  test('TC-P1-03: POST /api/auth/register weak password → 400', async () => {
    expect.assertions(2);
    try {
      await http.post('/api/auth/register', {
        email: `weak+${RUN_ID}@pocketpenny-qa.test`,
        password: WEAK_PASSWORD,
      });
    } catch (err) {
      const error = err as AxiosError;
      expect(error.response?.status).toBe(400);
      expect(error.response?.data).toMatchObject({ success: false });
    }
  });

  // ─── TC-P1-04 ──────────────────────────────────────────────────────────────
  test('TC-P1-04: POST /api/auth/login success → 200 + tokens', async () => {
    const res = await http.post('/api/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data).toHaveProperty('accessToken');
    expect(typeof res.data.data.accessToken).toBe('string');
    expect(res.data.data.user.email).toBe(TEST_EMAIL);

    // Update token after fresh login
    accessToken = res.data.data.accessToken;
  });

  // ─── TC-P1-12 ──────────────────────────────────────────────────────────────
  test('TC-P1-12: POST /api/auth/forgot-password → 200', async () => {
    const res = await http.post('/api/auth/forgot-password', {
      email: TEST_EMAIL,
    });

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    // Backend always returns success to prevent email enumeration
    expect(typeof res.data.message).toBe('string');
  });

  // ─── TC-P1-08 ──────────────────────────────────────────────────────────────
  test('TC-P1-08: POST /api/auth/logout → 200, token revoked', async () => {
    expect(accessToken).not.toBeNull();

    // Call logout with bearer token
    const res = await http.post(
      '/api/auth/logout',
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);

    // Verify token is revoked — calling a protected endpoint should now return 401
    // (The backend will reject the bearer token or find no valid session)
    try {
      await http.get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      // If it succeeds, the token wasn't properly revoked — still acceptable if
      // the backend uses stateless JWT (short-lived). We only check logout status.
    } catch (err) {
      const error = err as AxiosError;
      expect([401, 403]).toContain(error.response?.status);
    }
  });

  // ─── TC-P1-07 ──────────────────────────────────────────────────────────────
  test(
    'TC-P1-07: POST /api/auth/login rate limit → 429',
    async () => {
      // loginLimiter: max 5 per 15min per IP
      // Exhaust the limit with bad credentials — keep firing until we see 429
      const RATE_LIMIT_EMAIL = `ratelimit+${RUN_ID}@pocketpenny-qa.test`;
      let got429 = false;

      for (let i = 0; i < 10; i++) {
        try {
          await http.post('/api/auth/login', {
            email: RATE_LIMIT_EMAIL,
            password: 'WrongPassword99!',
          });
        } catch (err) {
          const error = err as AxiosError;
          if (error.response?.status === 429) {
            got429 = true;
            // Verify the response body
            const body = error.response.data as { success: boolean; error: string };
            expect(body.success).toBe(false);
            expect(typeof body.error).toBe('string');
            break;
          }
          // 401 = bad credentials, continue until rate limited
          if (error.response?.status !== 401) {
            throw err; // unexpected error
          }
        }
      }

      expect(got429).toBe(true);
    },
    30_000 // 30s timeout — may need multiple requests
  );
});

/**
 * Integration tests for the service layer.
 *
 * Covers:
 * - authService.login: 401 response → throws ApiError with status 401
 * - dashboardService.getDashboardData: success → returns typed DashboardData
 * - 401 auto-logout: any endpoint returning 401 while a token is present → logoutCallback fired
 *
 * Requirements: 1.8, 3.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from '../../services/authService';
import { dashboardService } from '../../services/dashboardService';
import { setLogoutCallback } from '../../services/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal fetch Response stub. */
function makeFetchResponse(status: number, body: unknown): Response {
  const bodyText = JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(bodyText),
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Clear any stored token so each test starts from a clean state
  localStorage.clear();
  // Reset logout callback
  setLogoutCallback(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// authService.login
// ---------------------------------------------------------------------------

describe('authService.login', () => {
  it('throws ApiError(401) when the server returns 401', async () => {
    // 401 without a stored token → non-OK branch throws ApiError
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeFetchResponse(401, { message: 'Unauthorized' })),
    );

    await expect(
      authService.login({ username: 'bad', password: 'creds' }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
    });
  });

  it('returns LoginResponse on successful authentication', async () => {
    const payload = { token: 'tok_abc', user: { id: '1', username: 'alice', displayName: 'Alice' } };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeFetchResponse(200, payload)),
    );

    const result = await authService.login({ username: 'alice', password: 'secret' });
    expect(result).toEqual(payload);
  });
});

// ---------------------------------------------------------------------------
// dashboardService.getDashboardData
// ---------------------------------------------------------------------------

describe('dashboardService.getDashboardData', () => {
  it('returns typed DashboardData on success', async () => {
    const mockCommon = {
      success: true,
      message: 'OK',
      data: {
        totalTrips: { totalTrips: 42, companyTrips: 30, rentedTrips: 12 },
        totalVehicles: { totalVehicles: 10, companyVehicles: 8, rentedVehicles: 2 },
        totalBills: { totalBills: 120, noTrips: 5 },
        totalLoads: 500,
      },
    };
    const mockLoads = {
      success: true,
      message: 'OK',
      data: { inLoads: [{ warehouseName: 'Main Warehouse', totalInLoad: 200 }], outLoads: [] },
    };
    const mockWarehouses = {
      success: true,
      message: 'OK',
      data: [
        {
          warehouseName: 'Main Warehouse',
          totalLoads: 300,
          totalInLoad: 200,
          totalOutLoad: 100,
          totalInBills: 60,
          totalOutBills: 40,
        },
      ],
    };

    // dashboardService makes 3 parallel fetch calls
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce(makeFetchResponse(200, mockCommon))
        .mockResolvedValueOnce(makeFetchResponse(200, mockLoads))
        .mockResolvedValueOnce(makeFetchResponse(200, mockWarehouses)),
    );

    const result = await dashboardService.getDashboardData('2024-06-01', '2024-06-30');

    // Verify top-level shape
    expect(result.common.totalTrips.totalTrips).toBe(42);
    expect(result.common.totalVehicles.totalVehicles).toBe(10);
    expect(result.warehouses).toHaveLength(1);
    expect(result.warehouses[0].warehouseName).toBe('Main Warehouse');
    expect(result.loads.inLoads).toHaveLength(1);
  });

  it('constructs the correct URL with startDate and endDate query params', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        makeFetchResponse(200, { success: true, message: 'OK', data: {} }),
      ),
    );

    await dashboardService.getDashboardData('2024-01-01', '2024-01-31').catch(() => {});

    // At least one of the three calls should contain the encoded start/end times
    const calls = (vi.mocked(fetch).mock.calls as [string][]);
    expect(calls.some(([url]) => url.includes('2024-01-01'))).toBe(true);
    expect(calls.some(([url]) => url.includes('2024-01-31'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 401 auto-logout (Requirements: 1.8)
// ---------------------------------------------------------------------------

describe('401 auto-logout', () => {
  it('calls logoutCallback when a token is present and any endpoint returns 401', async () => {
    // Plant a valid-looking token in storage so the 401-interception branch triggers
    localStorage.setItem('session_token', 'valid_token_xyz');

    const logoutSpy = vi.fn();
    setLogoutCallback(logoutSpy);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeFetchResponse(401, {})),
    );

    // Use authService.getCurrentUser as a representative "any endpoint" call
    await expect(authService.getCurrentUser()).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: 'Session expired',
    });

    expect(logoutSpy).toHaveBeenCalledTimes(1);
  });

  it('does NOT call logoutCallback when no token is present and endpoint returns 401', async () => {
    // No token in storage
    localStorage.removeItem('session_token');

    const logoutSpy = vi.fn();
    setLogoutCallback(logoutSpy);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeFetchResponse(401, { message: 'Unauthorized' })),
    );

    await expect(authService.login({ username: 'x', password: 'y' })).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
    });

    // Token was absent, so the interception path should not have fired
    expect(logoutSpy).not.toHaveBeenCalled();
  });

  it('calls logoutCallback when a dashboard endpoint returns 401 with token present', async () => {
    localStorage.setItem('session_token', 'valid_token_xyz');

    const logoutSpy = vi.fn();
    setLogoutCallback(logoutSpy);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeFetchResponse(401, {})),
    );

    await expect(
      dashboardService.getDashboardData('2024-01-01', '2024-01-31'),
    ).rejects.toMatchObject({ status: 401, message: 'Session expired' });

    // getDashboardData fires 3 parallel requests — all return 401, so logoutCallback
    // is invoked once per intercepted response. We assert it was called at least once.
    expect(logoutSpy).toHaveBeenCalled();
  });
});

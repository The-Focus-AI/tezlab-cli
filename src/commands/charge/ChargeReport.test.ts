import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ChargeReport } from './ChargeReport.js';
import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

jest.mock('node-fetch', () => ({
  __esModule: true,
  default: jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    })
  ),
}));

describe('ChargeReport', () => {
  let client: ChargeReport;
  let tokenFile: string;

  beforeEach(() => {
    tokenFile = join(tmpdir(), 'test-token.json');
    client = new ChargeReport(tokenFile);
    jest.resetAllMocks();
  });

  afterEach(async () => {
    await fs.unlink(tokenFile).catch(() => {});
  });

  describe('displayChargeReport', () => {
    it('should display charge report when authenticated', async () => {
      // Mock successful token save
      await fs.writeFile(
        tokenFile,
        JSON.stringify({
          access_token: 'test-token',
          created_at: Math.floor(Date.now() / 1000),
          expires_in: 3600,
        })
      );

      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

      mockFetch
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                vehicle: {
                  available_vehicles: [
                    {
                      id: 1,
                      uuid: 'test-uuid',
                      vin: 'test-vin',
                      display_name: 'Test Tesla',
                      car_type: 'Model 3',
                      battery_level: 80,
                      charging: true,
                      locked: true,
                      sentry: false,
                      polling_enabled: true,
                    },
                  ],
                  selected_vehicle: 'test-uuid',
                },
              }),
          } as any)
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                charge_report: {
                  total_cost: 10.5,
                  total_kwh: 25.5,
                  total_sessions: 3,
                  average_cost_per_kwh: 0.41,
                  sessions: [
                    {
                      start_date: '2024-03-20T10:00:00Z',
                      end_date: '2024-03-20T12:00:00Z',
                      cost: 4.5,
                      kwh: 10.5,
                      location: 'Home Charger',
                    },
                    {
                      start_date: '2024-03-21T15:00:00Z',
                      end_date: '2024-03-21T16:30:00Z',
                      cost: 6.0,
                      kwh: 15.0,
                      location: 'Supercharger',
                    },
                  ],
                },
              }),
          } as any)
        );

      const consoleSpy = jest.spyOn(console, 'log');
      await client.displayChargeReport();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test Tesla'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total Cost: $10.50'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total kWh: 25.5'));
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Average Cost per kWh: $0.41')
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Home Charger'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Supercharger'));
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle authentication failure', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Unauthorized',
        } as any)
      );

      const consoleSpy = jest.spyOn(console, 'error');
      await client.displayChargeReport();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error:',
        expect.stringContaining('Request failed: Unauthorized')
      );
    });

    it('should handle no active vehicles', async () => {
      await fs.writeFile(
        tokenFile,
        JSON.stringify({
          access_token: 'test-token',
          created_at: Math.floor(Date.now() / 1000),
          expires_in: 3600,
        })
      );

      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              vehicle: {
                available_vehicles: [],
                selected_vehicle: null,
              },
            }),
        } as any)
      );

      const consoleSpy = jest.spyOn(console, 'log');
      await client.displayChargeReport();

      expect(consoleSpy).toHaveBeenCalledWith('No active vehicles found');
    });

    it('should handle missing charge report data', async () => {
      await fs.writeFile(
        tokenFile,
        JSON.stringify({
          access_token: 'test-token',
          created_at: Math.floor(Date.now() / 1000),
          expires_in: 3600,
        })
      );

      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                vehicle: {
                  available_vehicles: [
                    {
                      id: 1,
                      uuid: 'test-uuid',
                      vin: 'test-vin',
                      display_name: 'Test Tesla',
                      car_type: 'Model 3',
                      battery_level: 80,
                      charging: true,
                      locked: true,
                      sentry: false,
                      polling_enabled: true,
                    },
                  ],
                  selected_vehicle: 'test-uuid',
                },
              }),
          } as any)
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ charge_report: null }),
          } as any)
        );

      const consoleSpy = jest.spyOn(console, 'log');
      await client.displayChargeReport();

      expect(consoleSpy).toHaveBeenCalledWith('No charge report data available');
    });
  });
});

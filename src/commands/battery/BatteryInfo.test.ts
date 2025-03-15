import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BatteryInfo } from './BatteryInfo.js';
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

describe('BatteryInfo', () => {
  let client: BatteryInfo;
  let tokenFile: string;

  beforeEach(() => {
    tokenFile = join(tmpdir(), 'test-token.json');
    client = new BatteryInfo(tokenFile);
    jest.resetAllMocks();
  });

  afterEach(async () => {
    await fs.unlink(tokenFile).catch(() => {});
  });

  describe('displayVehicleInfo', () => {
    it('should display vehicle information when authenticated', async () => {
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
                  data: {
                    last_latitude: 37.7749,
                    last_longitude: -122.4194,
                    model_name: 'Model 3',
                  },
                },
              }),
          } as any)
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                address: {
                  road: 'Market St',
                  city: 'San Francisco',
                  state: 'California',
                },
              }),
          } as any)
        );

      const consoleSpy = jest.spyOn(console, 'log');
      await client.displayVehicleInfo();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test Tesla'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Battery: 80%'));
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Market St, San Francisco, California')
      );
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
      await client.displayVehicleInfo();

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
      await client.displayVehicleInfo();

      expect(consoleSpy).toHaveBeenCalledWith('No active vehicles found');
    });

    it('should handle location lookup failure', async () => {
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
                  data: {
                    last_latitude: 37.7749,
                    last_longitude: -122.4194,
                    model_name: 'Model 3',
                  },
                },
              }),
          } as any)
        )
        .mockImplementationOnce(() => Promise.reject(new Error('Network error')));

      const consoleSpy = jest.spyOn(console, 'log');
      await client.displayVehicleInfo();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test Tesla'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Location lookup failed'));
    });
  });
});

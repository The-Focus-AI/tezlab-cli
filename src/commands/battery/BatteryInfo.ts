import { promises as fs } from 'fs';
import { TezlabClient } from '../../client/TezlabClient.js';
import type { TezlabResponse, LocationInfo, Vehicle } from '../../types.js';
import fetch from 'node-fetch';
import { saveJsonToFile, logError } from '../../utils/fileUtils.js';

export class BatteryInfo extends TezlabClient {
  private shouldRecord: boolean;

  constructor(tokenFile?: string, shouldRecord = false) {
    super(tokenFile);
    this.shouldRecord = shouldRecord;
  }

  private formatBoolean(value: boolean | null): string {
    if (value === null) return '-';
    return value ? '✓' : '✗';
  }

  private formatRange(range: number | null, units: string): string {
    if (range === null) return '-';
    return `${range.toFixed(1)}${units}`;
  }

  private async getLocationInfo(lat: number, lon: number): Promise<string> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
        {
          headers: {
            'User-Agent': 'TezlabStatusScript/1.0',
          },
        }
      );

      const responseText = await response.text();

      if (!response.ok) {
        const error = new Error(`Location lookup failed: ${response.statusText}`);
        await logError(
          {
            error,
            response: {
              status: response.status,
              statusText: response.statusText,
              body: responseText,
            },
          },
          'BatteryInfo.getLocationInfo'
        );
        return 'Location lookup failed';
      }

      try {
        const data = JSON.parse(responseText) as LocationInfo;

        if (this.shouldRecord) {
          await saveJsonToFile(data, 'location_info');
        }

        const parts: string[] = [];

        if (data.address.road) parts.push(data.address.road);
        if (data.address.city) parts.push(data.address.city);
        if (data.address.state) parts.push(data.address.state);

        return parts.join(', ');
      } catch (parseError) {
        await logError(
          {
            error: parseError,
            response: {
              status: response.status,
              statusText: response.statusText,
              body: responseText,
            },
          },
          'BatteryInfo.getLocationInfo.parse'
        );
        return 'Location lookup failed';
      }
    } catch (error) {
      await logError(error, 'BatteryInfo.getLocationInfo');
      return 'Location lookup failed';
    }
  }

  async displayVehicleInfo(email?: string, password?: string): Promise<void> {
    try {
      await this.ensureAuthenticated(email, password);

      const response = await this.makeAuthenticatedRequestRaw('/v2/app/init');
      const responseText = await response.text();

      try {
        const data = JSON.parse(responseText) as TezlabResponse;

        if (this.shouldRecord) {
          await saveJsonToFile(data, 'vehicle_info');
        }

        const activeVehicles = data.vehicle.available_vehicles.filter(
          (v: Vehicle) => v.polling_enabled === true
        );

        if (activeVehicles.length === 0) {
          console.log('No active vehicles found');
          return;
        }

        console.log('\nActive Vehicles:');
        console.log('='.repeat(80));

        for (const vehicle of activeVehicles) {
          console.log(`${vehicle.display_name} (${vehicle.car_type_full || vehicle.car_type})`);
          console.log(`VIN: ${vehicle.vin}`);
          console.log(`Make: ${vehicle.make.charAt(0).toUpperCase() + vehicle.make.slice(1)}`);
          console.log(
            `Battery: ${vehicle.battery_level}% | ` +
              `Charging: ${this.formatBoolean(vehicle.charging || null)} | ` +
              `Locked: ${this.formatBoolean(vehicle.locked || null)} | ` +
              `Sentry: ${this.formatBoolean(vehicle.sentry || null)}`
          );

          // Get vehicle-specific data if this is the selected vehicle
          if (vehicle.vin === data.vehicle.selected_vehicle && data.vehicle.data) {
            const vData = data.vehicle.data;
            console.log(`Software Version: ${vData.software_version || '-'}`);
            console.log(
              `Estimated Range: ${this.formatRange(vData.last_battery_range, vData.last_battery_range_units)}`
            );
            console.log(`Estimated Efficiency: ${(vData.est_eff * 100).toFixed(1)}%`);
            if (vData.deepsleep_supported) {
              console.log(`Deep Sleep: ${this.formatBoolean(vData.deepsleep)}`);
            }
          }
          console.log('-'.repeat(80));
        }

        // Display selected vehicle location
        if (data.vehicle.data && data.vehicle.selected_vehicle) {
          const { last_latitude, last_longitude, model_name } = data.vehicle.data;
          const location = await this.getLocationInfo(last_latitude, last_longitude);
          const heading = this.getCompassDirection(data.vehicle.data.last_heading);

          console.log('\nSelected Vehicle Location:');
          console.log('-'.repeat(80));
          console.log(`${model_name} is at:`);
          console.log(`${location}`);
          console.log(`Coordinates: (${last_latitude.toFixed(6)}, ${last_longitude.toFixed(6)})`);
          if (heading) {
            console.log(`Heading: ${heading}`);
          }
          console.log(
            `Last Updated: ${new Date(data.vehicle.data.last_log_time * 1000).toLocaleString()}`
          );
        }
      } catch (parseError) {
        await logError(
          {
            error: parseError,
            response: {
              status: response.status,
              statusText: response.statusText,
              body: responseText,
            },
          },
          'BatteryInfo.displayVehicleInfo.parse'
        );
        throw parseError;
      }
    } catch (error: unknown) {
      await logError(error, 'BatteryInfo.displayVehicleInfo');

      if (error instanceof Error) {
        console.error('Error:', error.message);
        if (error.message.includes('Login failed') || error.message.includes('Not authenticated')) {
          await fs.unlink(this.tokenFile).catch(async (unlinkError) => {
            await logError(unlinkError, 'BatteryInfo.displayVehicleInfo.unlink');
          });
          console.log('Removed invalid token file. Please try again with credentials.');
        }
      } else {
        console.error('An unknown error occurred:', error);
      }
    }
  }

  private getCompassDirection(heading: number | null): string | null {
    if (heading === null) return null;
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round((heading % 360) / 45) % 8;
    return directions[index];
  }
}

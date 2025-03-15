import { promises as fs } from 'fs';
import { TezlabClient } from '../../client/TezlabClient.js';
import type { ChargeSession } from '../../types.js';
import { saveJsonToFile, logError } from '../../utils/fileUtils.js';

export class ChargeReport extends TezlabClient {
  private shouldRecord: boolean;

  constructor(tokenFile?: string, shouldRecord = false) {
    super(tokenFile);
    this.shouldRecord = shouldRecord;
  }

  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  private formatPower(kw: number): string {
    return `${kw.toFixed(1)} kW`;
  }

  private formatEnergy(kwh: number): string {
    return `${kwh.toFixed(1)} kWh`;
  }

  private formatTemperature(celsius: number): string {
    const fahrenheit = (celsius * 9) / 5 + 32;
    return `${celsius.toFixed(1)}°C (${fahrenheit.toFixed(1)}°F)`;
  }

  async getChargeReport(email?: string, password?: string): Promise<ChargeSession | null> {
    try {
      await this.ensureAuthenticated(email, password);

      const response = await this.makeAuthenticatedRequestRaw('/v2/charge_reports/last');
      const responseText = await response.text();

      try {
        const data = JSON.parse(responseText) as ChargeSession;

        if (this.shouldRecord) {
          await saveJsonToFile(data, 'charge_report');
        }

        return data;
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
          'ChargeReport.getChargeReport.parse'
        );
        throw parseError;
      }
    } catch (error: unknown) {
      await logError(error, 'ChargeReport.getChargeReport');

      if (error instanceof Error) {
        console.error('Error:', error.message);
        if (error.message.includes('Login failed') || error.message.includes('Not authenticated')) {
          await fs.unlink(this.tokenFile).catch(async (unlinkError) => {
            await logError(unlinkError, 'ChargeReport.getChargeReport.unlink');
          });
          console.log('Removed invalid token file. Please try again with credentials.');
        }
      } else {
        console.error('An unknown error occurred:', error);
      }
      return null;
    }
  }

  async displayChargeReport(email?: string, password?: string): Promise<void> {
    const data = await this.getChargeReport(email, password);
    if (!data) return;

    console.log('\nLast Charge Session Report:');
    console.log('='.repeat(80));

    console.log(`Vehicle: ${data.vehicle.display_name} (${data.vehicle.car_type})`);
    console.log(`Location: Unknown Location`); // Location not available in current API response
    console.log(`Charger Type: Unknown`); // Charger type not available in current API response

    console.log('\nCharge Details:');
    console.log('-'.repeat(80));
    console.log(`Start Time: ${new Date(data.start_time_ms).toLocaleString()}`);
    console.log(`End Time: ${new Date(data.stop_time_ms).toLocaleString()}`);
    console.log(`Duration: ${data.unplugged}`);
    console.log(`Battery: ${data.start_percent}% → ${data.end_percent}%`);
    console.log(`Estimated Max Range: ${data.est_max_range_string}`);
    console.log(`Remaining Range: ${data.remaining_range.toFixed(1)} ${data.est_max_range_units}`);
    console.log(`Distance Traveled: ${data.distance_traveled_string}`);

    if (data.efficiency !== null) {
      console.log('\nEfficiency:');
      console.log('-'.repeat(80));
      console.log(`Current Efficiency: ${data.efficiency_string}`);
      console.log(`Overall Efficiency: ${data.overall_efficiency_string}`);
    }

    console.log('\nEnvironment & Vehicle State:');
    console.log('-'.repeat(80));
    console.log(`Average Temperature: ${data.average_temp_string}`);

    if (data.climate_mins_idle > 0) {
      console.log(`Climate Idle Time: ${data.climate_mins_idle_duration_string}`);
    }

    if (data.sentry_mins_idle > 0) {
      console.log(`${data.sentry_string} Time: ${data.sentry_mins_idle_duration_string}`);
    }

    if (data.battery_heater_show && data.battery_heater_mins_idle > 0) {
      console.log(`Battery Heater Time: ${data.battery_heater_idle_duration_string}`);
    }

    if (data.cabin_overheat_show && data.cabin_overheat_mins_idle > 0) {
      console.log(`Cabin Overheat Protection Time: ${data.cabin_overheat_idle_duration_string}`);
    }

    console.log('\nCost & Energy:');
    console.log('-'.repeat(80));
    console.log(`Electric Cost: ${data.elec_cost_string}`);
    console.log(`Estimated Fuel Savings: ${data.est_fuel_savings_string}`);
    console.log(`Energy Used: ${data.energy_used_string}`);

    if (data.range_lost_by_drive_efficiency.phantom > 0) {
      console.log('\nRange Loss:');
      console.log('-'.repeat(80));
      console.log(`Phantom Drain: ${data.range_lost_by_drive_efficiency.phantom_string}`);
    }
  }
}

import { promises as fs } from 'fs';
import { TezlabClient } from '../../client/TezlabClient.js';
import { saveJsonToFile, logError } from '../../utils/fileUtils.js';
import { StatsResponse } from '../../types.js';
import path from 'path';

export class Stats extends TezlabClient {
  private shouldRecord: boolean;

  constructor(tokenFile?: string, shouldRecord = false) {
    super(tokenFile);
    this.shouldRecord = shouldRecord;
  }

  async getStats(email?: string, password?: string): Promise<StatsResponse | null> {
    try {
      await this.ensureAuthenticated(email, password);

      const response = await this.makeAuthenticatedRequestRaw('/v2/dashboard_cards/stats');
      const responseText = await response.text();

      // Always save the raw response for debugging
      const debugDir = path.join(process.cwd(), 'debug');
      await fs.mkdir(debugDir, { recursive: true });
      await fs.writeFile(path.join(debugDir, 'stats_raw.json'), responseText);

      try {
        const data = JSON.parse(responseText) as StatsResponse;

        if (this.shouldRecord) {
          await saveJsonToFile(data, 'stats');
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
          'Stats.getStats.parse'
        );
        throw parseError;
      }
    } catch (error: unknown) {
      await logError(error, 'Stats.getStats');

      if (error instanceof Error) {
        console.error('Error:', error.message);
        if (error.message.includes('Login failed') || error.message.includes('Not authenticated')) {
          await fs.unlink(this.tokenFile).catch(async (unlinkError) => {
            await logError(unlinkError, 'Stats.getStats.unlink');
          });
          console.log('Removed invalid token file. Please try again with credentials.');
        }
      } else {
        console.error('An unknown error occurred:', error);
      }
      return null;
    }
  }

  async displayStats(email?: string, password?: string): Promise<void> {
    const stats = await this.getStats(email, password);
    if (!stats) {
      console.log('No stats found');
      return;
    }

    console.log('\nVehicle Stats:');
    console.log('='.repeat(80));

    console.log(`Vehicle: ${stats.model_name} (VIN: ${stats.vehicle_vin})`);
    console.log(`Efficiency: ${stats.efficiency_string}`);
    console.log(`Average Speed: ${stats.avg_speed_string}`);
    console.log(`Stats since: ${new Date(stats.from_date * 1000).toLocaleDateString()}`);

    console.log('\nSummary Stats:');
    console.log('-'.repeat(80));

    // Display summary stats first
    const summaryStats = stats.stats.filter((stat) => stat.summary);
    for (const stat of summaryStats) {
      console.log(`${stat.title}: ${stat.stat}`);
    }

    // Group the remaining stats by display_type
    const driveStats = stats.stats.filter((stat) => !stat.summary && stat.display_type === 'drive');
    const chargeStats = stats.stats.filter(
      (stat) => !stat.summary && stat.display_type === 'charge'
    );
    const mainStats = stats.stats.filter((stat) => !stat.summary && stat.display_type === 'main');

    if (driveStats.length > 0) {
      console.log('\nDriving Stats:');
      console.log('-'.repeat(80));
      for (const stat of driveStats) {
        console.log(`${stat.title}: ${stat.stat}`);
      }
    }

    if (chargeStats.length > 0) {
      console.log('\nCharging Stats:');
      console.log('-'.repeat(80));
      for (const stat of chargeStats) {
        console.log(`${stat.title}: ${stat.stat}`);
      }
    }

    if (mainStats.length > 0) {
      console.log('\nOther Stats:');
      console.log('-'.repeat(80));
      for (const stat of mainStats) {
        console.log(`${stat.title}: ${stat.stat}`);
      }
    }
  }
}

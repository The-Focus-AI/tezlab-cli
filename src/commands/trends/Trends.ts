import { promises as fs } from 'fs';
import { TezlabClient } from '../../client/TezlabClient.js';
import { saveJsonToFile, logError } from '../../utils/fileUtils.js';
import { TrendsResponse } from '../../types.js';
import path from 'path';

export class Trends extends TezlabClient {
  private shouldRecord: boolean;

  constructor(tokenFile?: string, shouldRecord = false) {
    super(tokenFile);
    this.shouldRecord = shouldRecord;
  }

  async getTrends(email?: string, password?: string): Promise<TrendsResponse | null> {
    try {
      await this.ensureAuthenticated(email, password);

      const response = await this.makeAuthenticatedRequestRaw('/v2/dashboard_cards/trends_status');
      const responseText = await response.text();

      // Always save the raw response for debugging
      const debugDir = path.join(process.cwd(), 'debug');
      await fs.mkdir(debugDir, { recursive: true });
      await fs.writeFile(path.join(debugDir, 'trends_raw.json'), responseText);

      try {
        const data = JSON.parse(responseText) as TrendsResponse;

        if (this.shouldRecord) {
          await saveJsonToFile(data, 'trends');
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
          'Trends.getTrends.parse'
        );
        throw parseError;
      }
    } catch (error: unknown) {
      await logError(error, 'Trends.getTrends');

      if (error instanceof Error) {
        console.error('Error:', error.message);
        if (error.message.includes('Login failed') || error.message.includes('Not authenticated')) {
          await fs.unlink(this.tokenFile).catch(async (unlinkError) => {
            await logError(unlinkError, 'Trends.getTrends.unlink');
          });
          console.log('Removed invalid token file. Please try again with credentials.');
        }
      } else {
        console.error('An unknown error occurred:', error);
      }
      return null;
    }
  }

  async displayTrends(email?: string, password?: string): Promise<void> {
    const trends = await this.getTrends(email, password);
    if (!trends) {
      console.log('No trends found');
      return;
    }

    console.log('\nWeekly Driving Trends:');
    console.log('='.repeat(80));

    // Sort trends by day for consistent display (0 = Sunday, 1 = Monday, etc.)
    const sortedTrends = [...trends.trends].sort((a, b) => a.day - b.day);

    // Calculate total distance for the week
    const totalDistance = sortedTrends.reduce((sum, trend) => sum + trend.dist_mi, 0);
    console.log(`Total Distance This Week: ${totalDistance.toFixed(2)} miles\n`);

    // Display a simple ASCII bar chart
    console.log('Daily Driving Distance:');
    console.log('-'.repeat(80));

    const maxBarLength = 50; // Maximum length of the bar in characters
    const maxDist = Math.max(...sortedTrends.map((t) => t.dist_mi));

    // Map of day numbers to full day names
    const dayNames = {
      0: 'Sunday   ',
      1: 'Monday   ',
      2: 'Tuesday  ',
      3: 'Wednesday',
      4: 'Thursday ',
      5: 'Friday   ',
      6: 'Saturday ',
    };

    for (const trend of sortedTrends) {
      // Calculate bar length proportional to the maximum distance
      const barLength = maxDist > 0 ? Math.round((trend.dist_mi / maxDist) * maxBarLength) : 0;

      const bar = '█'.repeat(barLength);
      const dayName = dayNames[trend.day as keyof typeof dayNames];

      console.log(`${dayName}: ${bar} ${trend.dist_mi.toFixed(2)} miles`);
    }
  }
}

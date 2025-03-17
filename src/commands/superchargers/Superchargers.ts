import { promises as fs } from 'fs';
import { TezlabClient } from '../../client/TezlabClient.js';
import { saveJsonToFile, logError } from '../../utils/fileUtils.js';
import { SuperchargersResponse, SuperchargerDetail } from '../../types.js';
import path from 'path';

export class Superchargers extends TezlabClient {
  private shouldRecord: boolean;

  constructor(tokenFile?: string, shouldRecord = false) {
    super(tokenFile);
    this.shouldRecord = shouldRecord;
  }

  async getSuperchargers(email?: string, password?: string): Promise<SuperchargersResponse | null> {
    try {
      await this.ensureAuthenticated(email, password);

      const response = await this.makeAuthenticatedRequestRaw('/v2/superchargers');
      const responseText = await response.text();

      // Always save the raw response for debugging
      const debugDir = path.join(process.cwd(), 'debug');
      await fs.mkdir(debugDir, { recursive: true });
      await fs.writeFile(path.join(debugDir, 'superchargers_raw.json'), responseText);

      try {
        const data = JSON.parse(responseText) as SuperchargersResponse;

        if (this.shouldRecord) {
          await saveJsonToFile(data, 'superchargers');
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
          'Superchargers.getSuperchargers.parse'
        );
        throw parseError;
      }
    } catch (error: unknown) {
      await logError(error, 'Superchargers.getSuperchargers');

      if (error instanceof Error) {
        console.error('Error:', error.message);
        if (error.message.includes('Login failed') || error.message.includes('Not authenticated')) {
          await fs.unlink(this.tokenFile).catch(async (unlinkError) => {
            await logError(unlinkError, 'Superchargers.getSuperchargers.unlink');
          });
          console.log('Removed invalid token file. Please try again with credentials.');
        }
      } else {
        console.error('An unknown error occurred:', error);
      }
      return null;
    }
  }

  async getSuperchargerDetail(
    id: string,
    email?: string,
    password?: string
  ): Promise<SuperchargerDetail | null> {
    try {
      await this.ensureAuthenticated(email, password);

      const response = await this.makeAuthenticatedRequestRaw(`/v2/superchargers/${id}/detail`);
      const responseText = await response.text();

      // Always save the raw response for debugging
      const debugDir = path.join(process.cwd(), 'debug');
      await fs.mkdir(debugDir, { recursive: true });
      await fs.writeFile(path.join(debugDir, `supercharger_${id}_raw.json`), responseText);

      try {
        const data = JSON.parse(responseText) as SuperchargerDetail;

        if (this.shouldRecord) {
          await saveJsonToFile(data, `supercharger_${id}`);
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
          'Superchargers.getSuperchargerDetail.parse'
        );
        throw parseError;
      }
    } catch (error: unknown) {
      await logError(error, 'Superchargers.getSuperchargerDetail');

      if (error instanceof Error) {
        console.error('Error:', error.message);
        if (error.message.includes('Login failed') || error.message.includes('Not authenticated')) {
          await fs.unlink(this.tokenFile).catch(async (unlinkError) => {
            await logError(unlinkError, 'Superchargers.getSuperchargerDetail.unlink');
          });
          console.log('Removed invalid token file. Please try again with credentials.');
        }
      } else {
        console.error('An unknown error occurred:', error);
      }
      return null;
    }
  }

  async displaySuperchargers(email?: string, password?: string): Promise<void> {
    const superchargers = await this.getSuperchargers(email, password);
    if (!superchargers) {
      console.log('No superchargers found');
      return;
    }

    console.log('\nSuperchargers:');
    console.log('='.repeat(80));
    console.log(`Total Superchargers: ${superchargers.superchargers.length}`);
    console.log('-'.repeat(80));

    // Sort superchargers by name for easier reading
    const sortedSuperchargers = [...superchargers.superchargers].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    for (const supercharger of sortedSuperchargers) {
      console.log(`ID: ${supercharger.id || 'N/A'} - ${supercharger.name}`);
      if (supercharger.address) {
        console.log(`Location: ${supercharger.address}`);
      }

      const stalls = supercharger.stalls ? `${supercharger.stalls} stalls` : 'Unknown stalls';
      const power = supercharger.power ? `${supercharger.power}kW` : 'Unknown power';
      console.log(`${stalls} | ${power}`);

      if (supercharger.visited) {
        console.log('✓ You have visited this supercharger');
      }

      if (supercharger.rating && supercharger.rating.SC_TOTAL) {
        const totalRating = supercharger.rating.SC_TOTAL;
        console.log(
          `Rating: ${totalRating.rating.toFixed(1)}/5 (${totalRating.responses} responses)`
        );
      }

      console.log(`Coordinates: ${supercharger.latitude}, ${supercharger.longitude}`);
      console.log('-'.repeat(80));
    }
  }

  async displaySuperchargerDetail(id: string, email?: string, password?: string): Promise<void> {
    const detail = await this.getSuperchargerDetail(id, email, password);
    if (!detail) {
      console.log(`No details found for supercharger with ID: ${id}`);
      return;
    }

    console.log('\nSupercharger Details:');
    console.log('='.repeat(80));
    console.log(`Name: ${detail.name}`);
    if (detail.address) {
      console.log(`Address: ${detail.address}`);
    }

    if (detail.power) {
      console.log(`Power: ${detail.power}kW`);
    }

    if (detail.stalls) {
      console.log(`Stalls: ${detail.stalls}`);
    }

    if (detail.hours) {
      console.log(`Hours: ${detail.hours}`);
    }

    console.log(`Coordinates: ${detail.latitude}, ${detail.longitude}`);

    if (detail.cost_string) {
      console.log(`Cost: ${detail.cost_string}`);
    } else if (detail.cost && detail.cost.local.kwh_string) {
      console.log(`Cost: ${detail.cost.local.kwh_string}`);
    }

    if (detail.visited) {
      console.log('✓ You have visited this supercharger');
    }

    if (detail.rating && detail.rating.SC_TOTAL) {
      console.log(
        `\nRating: ${detail.rating.SC_TOTAL.rating.toFixed(1)}/5 (${detail.rating.SC_TOTAL.responses} responses)`
      );

      // Display individual rating categories
      for (const [category, rating] of Object.entries(detail.rating)) {
        if (category !== 'SC_TOTAL') {
          console.log(
            `- ${category}: ${rating.rating.toFixed(1)}/5 (${rating.responses} responses)`
          );
        }
      }
    }

    if (detail.amenities && detail.amenities.length > 0) {
      console.log('\nAmenities:');
      for (const amenity of detail.amenities) {
        console.log(`- ${amenity}`);
      }
    }

    if (detail.stall_count) {
      console.log('\nStall Information:');
      console.log(`Total: ${detail.stall_count.total || 'Unknown'}`);
      console.log(`Available: ${detail.stall_count.available || 'Unknown'}`);
      console.log(`In Use: ${detail.stall_count.in_use || 'Unknown'}`);
    }

    if (detail.awards && detail.awards.length > 0) {
      console.log('\nAwards:');
      for (const award of detail.awards) {
        console.log(`- ${award.award}: ${award.name} (${award.award_string})`);
      }
    }

    if (detail.num_comments && detail.num_comments > 0) {
      console.log(`\nThis supercharger has ${detail.num_comments} comments.`);
    }

    if (detail.reviews && detail.reviews.length > 0) {
      console.log('\nRecent Reviews:');
      for (const review of detail.reviews.slice(0, 3)) {
        // Show only the 3 most recent reviews
        console.log(
          `- "${review.comment}" - ${review.user_name} (${new Date(review.created_at).toLocaleDateString()})`
        );
      }
    }
  }
}

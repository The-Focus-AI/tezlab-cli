import { promises as fs } from 'fs';
import { TezlabClient } from '../../client/TezlabClient.js';
import { saveJsonToFile, logError } from '../../utils/fileUtils.js';
import { RoadTrip, RoadTripsResponse } from '../../types.js';
import path from 'path';

export class RoadTrips extends TezlabClient {
  private shouldRecord: boolean;

  constructor(tokenFile?: string, shouldRecord = false) {
    super(tokenFile);
    this.shouldRecord = shouldRecord;
  }

  async getRoadTrips(email?: string, password?: string): Promise<RoadTrip[] | null> {
    try {
      await this.ensureAuthenticated(email, password);

      const response = await this.makeAuthenticatedRequestRaw('/v2/road_trips');
      const responseText = await response.text();

      // Always save the raw response for debugging
      const debugDir = path.join(process.cwd(), 'debug');
      await fs.mkdir(debugDir, { recursive: true });
      await fs.writeFile(path.join(debugDir, 'road_trips_raw.json'), responseText);

      try {
        const data = JSON.parse(responseText) as RoadTripsResponse;

        if (this.shouldRecord) {
          await saveJsonToFile(data, 'road_trips');
        }

        return data.road_trips;
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
          'RoadTrips.getRoadTrips.parse'
        );
        throw parseError;
      }
    } catch (error: unknown) {
      await logError(error, 'RoadTrips.getRoadTrips');

      if (error instanceof Error) {
        console.error('Error:', error.message);
        if (error.message.includes('Login failed') || error.message.includes('Not authenticated')) {
          await fs.unlink(this.tokenFile).catch(async (unlinkError) => {
            await logError(unlinkError, 'RoadTrips.getRoadTrips.unlink');
          });
          console.log('Removed invalid token file. Please try again with credentials.');
        }
      } else {
        console.error('An unknown error occurred:', error);
      }
      return null;
    }
  }

  async getRoadTripById(id: string, email?: string, password?: string): Promise<RoadTrip | null> {
    try {
      await this.ensureAuthenticated(email, password);

      const response = await this.makeAuthenticatedRequestRaw(`/v2/road_trips/${id}`);
      const responseText = await response.text();

      // Always save the raw response for debugging
      const debugDir = path.join(process.cwd(), 'debug');
      await fs.mkdir(debugDir, { recursive: true });
      await fs.writeFile(path.join(debugDir, `road_trip_${id}_raw.json`), responseText);

      try {
        const data = JSON.parse(responseText) as RoadTrip;

        if (this.shouldRecord) {
          await saveJsonToFile(data, `road_trip_${id}`);
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
          'RoadTrips.getRoadTripById.parse'
        );
        throw parseError;
      }
    } catch (error: unknown) {
      await logError(error, 'RoadTrips.getRoadTripById');

      if (error instanceof Error) {
        console.error('Error:', error.message);
        if (error.message.includes('Login failed') || error.message.includes('Not authenticated')) {
          await fs.unlink(this.tokenFile).catch(async (unlinkError) => {
            await logError(unlinkError, 'RoadTrips.getRoadTripById.unlink');
          });
          console.log('Removed invalid token file. Please try again with credentials.');
        }
      } else {
        console.error('An unknown error occurred:', error);
      }
      return null;
    }
  }

  async displayRoadTrips(email?: string, password?: string): Promise<void> {
    const roadTrips = await this.getRoadTrips(email, password);
    if (!roadTrips) {
      console.log('No road trips found');
      return;
    }

    console.log('\nRoad Trips:');
    console.log('='.repeat(80));

    if (roadTrips.length === 0) {
      console.log('No road trips found');
      return;
    }

    for (const trip of roadTrips) {
      console.log(`Trip: ${trip.title || 'Unnamed Trip'}`);
      console.log(`ID: ${trip.id}`);
      console.log(`Start: ${new Date(trip.start_time_ms).toLocaleString()}`);
      console.log(`End: ${new Date(trip.stop_time_ms).toLocaleString()}`);
      console.log(`Distance: ${trip.distance_traveled_string}`);

      // Count the number of charging stops
      const chargingStops = trip.route.charger_markers.filter(
        (marker) => marker.latitude !== 0 && marker.longitude !== 0
      ).length;

      console.log(`Charging Stops: ${chargingStops}`);

      // Count the number of driving segments
      const drivingSegments =
        trip.route.drive_markers.filter(
          (marker) =>
            marker.latitude !== 0 && marker.longitude !== 0 && marker.type === 'drive_start_stop'
        ).length / 2; // Each segment has a start and stop marker

      console.log(`Driving Segments: ${Math.floor(drivingSegments)}`);
      console.log('-'.repeat(80));
    }
  }

  async displayRoadTripDetails(id: string, email?: string, password?: string): Promise<void> {
    const trip = await this.getRoadTripById(id, email, password);
    if (!trip) {
      console.log(`Road trip with ID ${id} not found`);
      return;
    }

    console.log('\nRoad Trip Details:');
    console.log('='.repeat(80));
    console.log(`Trip: ${trip.title || 'Unnamed Trip'}`);
    console.log(`ID: ${trip.id}`);
    console.log(`Start: ${new Date(trip.start_time_ms).toLocaleString()}`);
    console.log(`End: ${new Date(trip.stop_time_ms).toLocaleString()}`);
    console.log(
      `Duration: ${this.formatDuration(Math.floor((trip.stop_time_ms - trip.start_time_ms) / 60000))}`
    );
    console.log(`Distance: ${trip.distance_traveled_string}`);

    // Count the number of charging stops
    const chargingStops = trip.route.charger_markers.filter(
      (marker) => marker.latitude !== 0 && marker.longitude !== 0
    );

    console.log(`Charging Stops: ${chargingStops.length}`);

    // List charging stops
    if (chargingStops.length > 0) {
      console.log('\nCharging Locations:');
      for (const stop of chargingStops) {
        console.log(
          `- ${stop.latitude.toFixed(6)}, ${stop.longitude.toFixed(6)} (${stop.fast ? 'Supercharger' : 'Destination Charger'})`
        );
      }
    }

    // Count the number of driving segments
    const drivingMarkers = trip.route.drive_markers.filter(
      (marker) =>
        marker.latitude !== 0 && marker.longitude !== 0 && marker.type === 'drive_start_stop'
    );

    const drivingSegments = Math.floor(drivingMarkers.length / 2); // Each segment has a start and stop marker
    console.log(`\nDriving Segments: ${drivingSegments}`);

    // List driving segments
    if (drivingSegments > 0) {
      console.log('\nDriving Segments:');
      for (let i = 0; i < drivingMarkers.length; i += 2) {
        if (i + 1 < drivingMarkers.length) {
          const start = drivingMarkers[i];
          const end = drivingMarkers[i + 1];
          console.log(
            `- From (${start.latitude.toFixed(6)}, ${start.longitude.toFixed(6)}) to (${end.latitude.toFixed(6)}, ${end.longitude.toFixed(6)})`
          );
        }
      }
    }
  }

  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
  }
}

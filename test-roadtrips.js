#!/usr/bin/env node
import { RoadTrips } from './dist/commands/roadtrips/RoadTrips.js';

async function main() {
  const client = new RoadTrips(undefined, true);

  console.log('Getting road trips...');
  const roadTrips = await client.getRoadTrips();

  if (roadTrips && roadTrips.length > 0) {
    console.log(`Found ${roadTrips.length} road trips`);

    // Get the first road trip ID
    const firstTripId = roadTrips[0].id;
    console.log(`Getting details for road trip ${firstTripId}...`);

    const roadTrip = await client.getRoadTripById(firstTripId);
    if (roadTrip) {
      console.log('Road trip details:');
      console.log(`Title: ${roadTrip.title}`);
      console.log(`Distance: ${roadTrip.distance_traveled_string}`);
      console.log(`Start: ${new Date(roadTrip.start_time_ms).toLocaleString()}`);
      console.log(`End: ${new Date(roadTrip.stop_time_ms).toLocaleString()}`);
    } else {
      console.log('Failed to get road trip details');
    }
  } else {
    console.log('No road trips found or error occurred');
  }
}

main().catch(console.error);

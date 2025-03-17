#!/usr/bin/env node
import { Stats } from './dist/commands/stats/Stats.js';

async function main() {
  const client = new Stats(undefined, true);

  console.log('Getting vehicle stats...');
  const stats = await client.getStats();

  if (stats) {
    console.log('Stats retrieved successfully:');
    console.log(`Vehicle: ${stats.model_name}`);
    console.log(`Efficiency: ${stats.efficiency_string}`);
    console.log(`Total Distance: ${stats.stats.find((s) => s.title === 'Distance Tracked')?.stat}`);

    // Count stats by type
    const summaryStats = stats.stats.filter((stat) => stat.summary).length;
    const driveStats = stats.stats.filter((stat) => stat.display_type === 'drive').length;
    const chargeStats = stats.stats.filter((stat) => stat.display_type === 'charge').length;

    console.log(`Summary Stats: ${summaryStats}`);
    console.log(`Drive Stats: ${driveStats}`);
    console.log(`Charge Stats: ${chargeStats}`);
  } else {
    console.log('Failed to get vehicle stats');
  }
}

main().catch(console.error);

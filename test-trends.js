#!/usr/bin/env node
import { Trends } from './dist/commands/trends/Trends.js';

async function main() {
  const client = new Trends(undefined, true);

  console.log('Getting vehicle trends...');
  const trends = await client.getTrends();

  if (trends) {
    console.log('Trends retrieved successfully:');
    console.log(JSON.stringify(trends, null, 2));
  } else {
    console.log('Failed to get vehicle trends');
  }
}

main().catch(console.error);

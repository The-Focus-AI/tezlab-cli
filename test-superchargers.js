#!/usr/bin/env node
import { Superchargers } from './dist/commands/superchargers/Superchargers.js';

async function main() {
  const client = new Superchargers(undefined, true);

  console.log('Getting superchargers list...');
  const superchargers = await client.getSuperchargers();

  if (superchargers) {
    console.log('Superchargers retrieved successfully:');
    console.log(`Total superchargers: ${superchargers.superchargers.length}`);

    // Get the first supercharger ID for detail test
    if (superchargers.superchargers.length > 0) {
      const firstId = superchargers.superchargers[0].id.toString();
      console.log(`\nGetting details for supercharger ID: ${firstId}`);

      const detail = await client.getSuperchargerDetail(firstId);
      if (detail) {
        console.log('Supercharger detail retrieved successfully:');
        console.log(JSON.stringify(detail, null, 2));
      } else {
        console.log('Failed to get supercharger detail');
      }
    }
  } else {
    console.log('Failed to get superchargers list');
  }
}

main().catch(console.error);

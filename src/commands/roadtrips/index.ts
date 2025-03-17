import { command, flag, boolean, option, string, subcommands } from 'cmd-ts';
import { RoadTrips } from './RoadTrips.js';

const listCommand = command({
  name: 'list',
  description: 'List all road trips',
  args: {
    record: flag({
      type: boolean,
      long: 'record',
      description: 'Save API responses to JSON files',
    }),
  },
  handler: async ({ record = false }) => {
    const client = new RoadTrips(undefined, record);
    await client.displayRoadTrips();
  },
});

const getCommand = command({
  name: 'get',
  description: 'Get details of a specific road trip',
  args: {
    id: option({
      type: string,
      long: 'id',
      short: 'i',
      description: 'The ID of the road trip to retrieve',
    }),
    record: flag({
      type: boolean,
      long: 'record',
      description: 'Save API responses to JSON files',
    }),
  },
  handler: async ({ id, record = false }) => {
    const client = new RoadTrips(undefined, record);
    await client.displayRoadTripDetails(id);
  },
});

export const roadTripsCommand = subcommands({
  name: 'roadtrips',
  description: 'Commands for working with road trips',
  cmds: {
    list: listCommand,
    get: getCommand,
  },
});

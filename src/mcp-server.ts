import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ChargeReport } from './commands/charge/ChargeReport.js';
import { BatteryInfo } from './commands/battery/BatteryInfo.js';
import { RoadTrips } from './commands/roadtrips/RoadTrips.js';
import { Stats } from './commands/stats/Stats.js';
import { Trends } from './commands/trends/Trends.js';
import { z } from 'zod';

// Create server instance
const server = new McpServer({
  name: 'tezlab',
  version: '1.0.0',
});

server.tool('chargeReport', 'Get the latest charge report for your vehicle', {}, async ({}) => {
  const client = new ChargeReport(undefined, false);
  const report = await client.getChargeReport();
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(report, null, 2),
      },
    ],
  };
});

server.tool(
  'batteryInfo',
  'Get information about your vehicle, its location, type, and battery level',
  {},
  async ({}) => {
    const client = new BatteryInfo(undefined, false);
    const info = await client.getVehicleInfo();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(info, null, 2),
        },
      ],
    };
  }
);

server.tool('roadTrips', 'Get a list of all your road trips', {}, async ({}) => {
  const client = new RoadTrips(undefined, false);
  const trips = await client.getRoadTrips();
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(trips, null, 2),
      },
    ],
  };
});

server.tool(
  'roadTripById',
  'Get details of a specific road trip by ID',
  {
    id: z.string().describe('The ID of the road trip to retrieve'),
  },
  async ({ id }) => {
    const client = new RoadTrips(undefined, false);
    const trip = await client.getRoadTripById(id);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(trip, null, 2),
        },
      ],
    };
  }
);

server.tool('vehicleStats', 'Get statistics about your vehicle', {}, async ({}) => {
  const client = new Stats(undefined, false);
  const stats = await client.getStats();
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(stats, null, 2),
      },
    ],
  };
});

server.tool('vehicleTrends', 'Get trends data about your vehicle', {}, async ({}) => {
  const client = new Trends(undefined, false);
  const trends = await client.getTrends();
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(trends, null, 2),
      },
    ],
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Tezlab MCP Server running on stdio');
}

main()
  .then(() => {
    // console.error('Tezlab MCP Server running on stdio');
  })
  .catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
  });

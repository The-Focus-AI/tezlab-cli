import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ChargeReport } from './commands/charge/ChargeReport.js';
import { BatteryInfo } from './commands/battery/BatteryInfo.js';

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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Tezlab MCP Server running on stdio');
}

main()
  .then(() => {
    console.error('Tezlab MCP Server running on stdio');
  })
  .catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
  });

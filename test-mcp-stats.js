#!/usr/bin/env node
import { McpClient } from '@modelcontextprotocol/sdk/client/mcp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  // Start the MCP server
  const serverProcess = spawn('pnpm', ['mcp'], {
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Create a transport that connects to the server
  const transport = new StdioClientTransport(serverProcess.stdin, serverProcess.stdout);

  // Create a client that uses the transport
  const client = new McpClient();
  await client.connect(transport);

  try {
    console.log('Testing vehicleStats tool...');
    const statsResult = await client.callTool('vehicleStats', {});

    // Parse the JSON response
    const stats = JSON.parse(statsResult.content[0].text);

    console.log('Vehicle Stats Result:');
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
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Disconnect and clean up
    await client.disconnect();
    serverProcess.kill();
  }
}

main().catch(console.error);

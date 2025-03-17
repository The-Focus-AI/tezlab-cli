#!/usr/bin/env node
import { McpClient } from '@modelcontextprotocol/sdk/client/mcp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
    console.log('Testing roadTrips tool...');
    const roadTripsResult = await client.callTool('roadTrips', {});
    console.log('Road Trips Result:');
    console.log(roadTripsResult.content[0].text.substring(0, 500) + '...');

    console.log('\nTesting roadTripById tool...');
    const roadTripByIdResult = await client.callTool('roadTripById', {
      id: 'f7198d3f-a539-4b2b-b323-3b642e9d9b60',
    });
    console.log('Road Trip By ID Result:');
    console.log(roadTripByIdResult.content[0].text.substring(0, 500) + '...');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Disconnect and clean up
    await client.disconnect();
    serverProcess.kill();
  }
}

main().catch(console.error);

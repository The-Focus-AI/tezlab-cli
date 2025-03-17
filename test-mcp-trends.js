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
    console.log('Testing vehicleTrends tool...');
    const trendsResult = await client.callTool('vehicleTrends', {});

    // Parse the JSON response
    const trends = JSON.parse(trendsResult.content[0].text);

    console.log('Vehicle Trends Result:');
    console.log(JSON.stringify(trends, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Disconnect and clean up
    await client.disconnect();
    serverProcess.kill();
  }
}

main().catch(console.error);

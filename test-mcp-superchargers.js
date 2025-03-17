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
    console.log('Testing superchargers tool...');
    const superchargersResult = await client.callTool('superchargers', {});

    // Parse the JSON response
    const superchargers = JSON.parse(superchargersResult.content[0].text);

    console.log('Superchargers Result:');
    console.log(`Total superchargers: ${superchargers.superchargers.length}`);

    // Test superchargerById tool with the first supercharger ID
    if (superchargers.superchargers.length > 0) {
      const firstId = superchargers.superchargers[0].id.toString();
      console.log(`\nTesting superchargerById tool with ID: ${firstId}`);

      const detailResult = await client.callTool('superchargerById', { id: firstId });
      const detail = JSON.parse(detailResult.content[0].text);

      console.log('Supercharger Detail Result:');
      console.log(JSON.stringify(detail, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Disconnect and clean up
    await client.disconnect();
    serverProcess.kill();
  }
}

main().catch(console.error);

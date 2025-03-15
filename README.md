# TezLab MCP Server

A Model Context Protocol (MCP) server implementation for TezLab, providing access to Tesla vehicle data and charging information through a standardized interface.

## Features

- **Charge Report**: Get detailed information about your latest charging session, including:

  - Duration and timing
  - Battery levels and range
  - Energy usage and efficiency
  - Cost and savings
  - Environmental conditions
  - Vehicle state during charging

- **Battery Info**: Access real-time vehicle information, including:
  - Battery level and charging status
  - Vehicle location with reverse geocoding
  - Software version and vehicle details
  - Range and efficiency metrics
  - Vehicle state (locked, sentry mode, etc.)

## Installation

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build
```

## Usage

The server can be used in two ways:

### 1. As an MCP Server

The MCP server provides two main commands:

- `chargeReport`: Retrieves the latest charging session data in JSON format
- `batteryInfo`: Gets current vehicle status and information in JSON format

To setup in claude desktop.

```
pnpm build
```

Then edit `~/Library/Application Support/claude_desktop_config.json` and add something like:

```json
  {
  "mcpServers": {
    "tezlab": {
      "command": "/Users/wschenk/.local/share/mise/installs/node/23.9.0/bin/node",
      "args": ["/Users/wschenk/The-Focus-AI/tezlab-mcp/dist/mcp-server.js"]
    }
  }
```

### 2. As a CLI Tool

The CLI provides direct access to the same functionality:

```bash
# Login to TezLab
pnpm tezlab login

# Get charge report
pnpm tezlab charge

# Get battery info
pnpm tezlab battery

# Save API responses to JSON files
pnpm tezlab charge --record
pnpm tezlab battery --record
```

## Development

```bash
# Run tests
pnpm test

# Build in watch mode
pnpm dev

# Lint code
pnpm lint
```

## Environment Variables

The following environment variables can be used to configure the application:

- `TEZLAB_TOKEN_FILE`: Path to the token file (default: `~/.tezlab/token.json`)

## API Response Types

The server returns data in the following formats:

### Charge Report Response

```typescript
interface ChargeSession {
  id: number;
  start_time_ms: number;
  stop_time_ms: number;
  start_percent: number;
  end_percent: number;
  vehicle: {
    id: number;
    display_name: string;
    car_type: string;
  };
  est_max_range: number;
  est_max_range_units: string;
  // ... and more fields
}
```

### Battery Info Response

```typescript
interface TezlabResponse {
  vehicle: {
    available_vehicles: Vehicle[];
    selected_vehicle: string;
    data?: VehicleData;
  };
}
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

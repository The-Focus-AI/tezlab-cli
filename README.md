# TezLab Charge Report CLI

A command-line tool to fetch and display your Tesla charging reports from TezLab.

## Installation

1. Make sure you have Node.js 18+ and pnpm installed
2. Clone this repository
3. Install dependencies:
```bash
pnpm install
```
4. Build the project:
```bash
pnpm build
```

## Usage

Run the CLI with your TezLab credentials:

```bash
pnpm start -- -e your@email.com -p yourpassword
```

The tool will:
1. Authenticate with TezLab
2. Store the authentication token locally
3. Fetch your latest charging report
4. Display the report details including:
   - Vehicle information
   - Charging duration
   - Energy used
   - Battery percentage change
   - Distance traveled
   - Efficiency
   - Costs and savings

## Development

### Running Tests

```bash
pnpm test
```

### Building

```bash
pnpm build
```

### Format Code

```bash
pnpm format
```

### Lint Code

```bash
pnpm lint
```

## License

MIT 
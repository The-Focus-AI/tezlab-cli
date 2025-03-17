#!/usr/bin/env node
import { run, subcommands } from 'cmd-ts';
import { loginCommand } from './commands/login/index.js';
import { chargeCommand } from './commands/charge/index.js';
import { batteryCommand } from './commands/battery/index.js';
import { roadTripsCommand } from './commands/roadtrips/index.js';

const cli = subcommands({
  name: 'tezlab',
  description: 'TezLab CLI for accessing Tesla charging reports and vehicle status',
  cmds: {
    login: loginCommand,
    charge: chargeCommand,
    battery: batteryCommand,
    roadtrips: roadTripsCommand,
  },
});

run(cli, process.argv.slice(2));

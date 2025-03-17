import { command, subcommands, flag, boolean, positional, string } from 'cmd-ts';
import { Superchargers } from './Superchargers.js';

const listCommand = command({
  name: 'list',
  description: 'List all superchargers',
  args: {
    record: flag({
      type: boolean,
      long: 'record',
      description: 'Save API responses to JSON files',
    }),
  },
  handler: async ({ record = false }) => {
    const client = new Superchargers(undefined, record);
    await client.displaySuperchargers();
  },
});

const detailCommand = command({
  name: 'detail',
  description: 'Get details for a specific supercharger',
  args: {
    id: positional({
      type: string,
      displayName: 'id',
      description: 'Supercharger ID',
    }),
    record: flag({
      type: boolean,
      long: 'record',
      description: 'Save API responses to JSON files',
    }),
  },
  handler: async ({ id, record = false }) => {
    const client = new Superchargers(undefined, record);
    await client.displaySuperchargerDetail(id);
  },
});

export const superchargersCommand = subcommands({
  name: 'superchargers',
  description: 'Manage supercharger information',
  cmds: {
    list: listCommand,
    detail: detailCommand,
  },
});

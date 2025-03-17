import { command, flag, boolean } from 'cmd-ts';
import { Stats } from './Stats.js';

export const statsCommand = command({
  name: 'stats',
  description: 'Display vehicle statistics',
  args: {
    record: flag({
      type: boolean,
      long: 'record',
      description: 'Save API responses to JSON files',
    }),
  },
  handler: async ({ record = false }) => {
    const client = new Stats(undefined, record);
    await client.displayStats();
  },
});

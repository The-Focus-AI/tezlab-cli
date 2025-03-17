import { command, flag, boolean } from 'cmd-ts';
import { Trends } from './Trends.js';

export const trendsCommand = command({
  name: 'trends',
  description: 'Display vehicle trends data',
  args: {
    record: flag({
      type: boolean,
      long: 'record',
      description: 'Save API responses to JSON files',
    }),
  },
  handler: async ({ record = false }) => {
    const client = new Trends(undefined, record);
    await client.displayTrends();
  },
});

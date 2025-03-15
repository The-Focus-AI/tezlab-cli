import { command } from 'cmd-ts';
import { TezlabChargeClient } from '../TezlabChargeClient.js';

export const reportCommand = command({
  name: 'report',
  description: 'Display the latest charge report',
  args: {},
  handler: async () => {
    const client = new TezlabChargeClient();
    await client.displayChargeReport();
  },
});

import { command, flag, boolean } from 'cmd-ts';
import { ChargeReport } from './ChargeReport.js';

export const chargeCommand = command({
  name: 'charge',
  description: 'Display the latest charge report',
  args: {
    record: flag({
      type: boolean,
      long: 'record',
      description: 'Save API responses to JSON files',
    }),
  },
  handler: async ({ record = false }) => {
    const client = new ChargeReport(undefined, record);
    await client.displayChargeReport();
  },
});

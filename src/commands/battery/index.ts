import { command, flag, boolean } from 'cmd-ts';
import { BatteryInfo } from './BatteryInfo.js';

export const batteryCommand = command({
  name: 'battery',
  description: 'Display battery and vehicle status information',
  args: {
    record: flag({
      type: boolean,
      long: 'record',
      description: 'Save API responses to JSON files',
    }),
  },
  handler: async ({ record = false }) => {
    const client = new BatteryInfo(undefined, record);
    await client.displayVehicleInfo();
  },
});

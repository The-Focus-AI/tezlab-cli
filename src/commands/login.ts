import { command } from 'cmd-ts';
import prompts from 'prompts';
import { TezlabChargeClient } from '../TezlabChargeClient.js';

export const loginCommand = command({
  name: 'login',
  description: 'Login to TezLab and store credentials',
  args: {},
  handler: async () => {
    const response = await prompts(
      [
        {
          type: 'text',
          name: 'email',
          message: 'Enter your TezLab email:',
          validate: (value) => value.length > 0 || 'Email is required',
        },
        {
          type: 'password',
          name: 'password',
          message: 'Enter your password:',
          validate: (value) => value.length > 0 || 'Password is required',
        },
      ],
      {
        onCancel: () => {
          console.log('Login cancelled');
          process.exit(1);
        },
      }
    );

    const client = new TezlabChargeClient();
    try {
      await client.login(response.email, response.password);
      console.log('Successfully logged in and stored credentials');
    } catch (error) {
      if (error instanceof Error) {
        console.error('Login failed:', error.message);
      } else {
        console.error('Login failed with unknown error');
      }
      process.exit(1);
    }
  },
});

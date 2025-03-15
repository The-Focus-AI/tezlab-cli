import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import fetch, { RequestInit, Response } from 'node-fetch';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  created_at: number;
}

export interface TokenData {
  access_token: string;
  created_at: number;
  expires_in: number;
}

export const CONFIG = {
  BASE_URL: 'https://tezlabapp.com',
  CLIENT_ID: 'EgaE_fxzvo26TXROOh368bzuoISA332_U7B7aVz0Sew',
  CLIENT_SECRET: 'fFnIlj3nSWZrdvRoaaxXu7R87JBczq4zVohGBgLcnOg',
  TOKEN_FILE: join(homedir(), '.tezlab_token.json'),
};

export class TezlabClient {
  protected tokenData: TokenData | null = null;

  constructor(protected tokenFile: string = CONFIG.TOKEN_FILE) {}

  protected async loadTokenFromFile(): Promise<boolean> {
    try {
      try {
        await fs.access(this.tokenFile);
      } catch {
        return false;
      }

      const fileContent = await fs.readFile(this.tokenFile, 'utf-8');
      this.tokenData = JSON.parse(fileContent);

      const now = Math.floor(Date.now() / 1000);
      const expiresAt = this.tokenData!.created_at + this.tokenData!.expires_in - 300;

      if (now > expiresAt) {
        console.log('Stored token is expired');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error loading token:', error);
      return false;
    }
  }

  protected async saveTokenToFile(): Promise<void> {
    try {
      await fs.writeFile(this.tokenFile, JSON.stringify(this.tokenData));
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  async login(email: string, password: string): Promise<void> {
    const response = await fetch(`${CONFIG.BASE_URL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: email,
        password: password,
        client_id: CONFIG.CLIENT_ID,
        client_secret: CONFIG.CLIENT_SECRET,
        scope: 'mobile',
        grant_type: 'password',
      }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = (await response.json()) as LoginResponse;
    this.tokenData = {
      access_token: data.access_token,
      created_at: data.created_at,
      expires_in: data.expires_in,
    };

    await this.saveTokenToFile();
  }

  protected async ensureAuthenticated(email?: string, password?: string): Promise<void> {
    const hasValidToken = await this.loadTokenFromFile();
    if (!hasValidToken) {
      if (!email || !password) {
        throw new Error('Token is invalid or expired. Please provide email and password.');
      }
      await this.login(email, password);
    }
  }

  protected async makeAuthenticatedRequestRaw(
    path: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${this.tokenData!.access_token}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${CONFIG.BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`);
    }

    return response;
  }

  protected async makeAuthenticatedRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await this.makeAuthenticatedRequestRaw(path, options);
    return response.json() as Promise<T>;
  }
}

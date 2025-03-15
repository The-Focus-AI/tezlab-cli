import { promises as fs } from 'fs';
import { join } from 'path';

export async function saveJsonToFile(data: unknown, filename: string): Promise<void> {
  const recordsDir = join(process.cwd(), 'records');
  await fs.mkdir(recordsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fullPath = join(recordsDir, `${filename}_${timestamp}.json`);

  await fs.writeFile(fullPath, JSON.stringify(data, null, 2));
  console.log(`Response saved to: ${fullPath}`);
}

export async function logError(error: unknown, context: string): Promise<void> {
  const logsDir = join(process.cwd(), 'logs');
  await fs.mkdir(logsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fullPath = join(logsDir, `error_${timestamp}.log`);

  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error,
  };

  await fs.writeFile(fullPath, JSON.stringify(errorLog, null, 2));
  console.error(`Error logged to: ${fullPath}`);
}

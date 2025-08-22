import fs from 'fs-extra';
import path from 'path';
import { promisify } from 'util';
import { writeFile, readFile } from 'fs/promises';

// Data directory
const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
fs.ensureDirSync(DATA_DIR);

// File paths
const FILES = {
  messages: path.join(DATA_DIR, 'messages.json'),
  users: path.join(DATA_DIR, 'users.json'),
  channels: path.join(DATA_DIR, 'channels.json'),
  tags: path.join(DATA_DIR, 'tags.json'),
  summaries: path.join(DATA_DIR, 'summaries.json'),
  associations: path.join(DATA_DIR, 'associations.json'),
  cache: path.join(DATA_DIR, 'cache.json'),
} as const;

// Default data structures
const DEFAULT_DATA = {
  messages: { messages: [] as any[], lastUpdated: new Date().toISOString() },
  users: { users: [] as any[], lastUpdated: new Date().toISOString() },
  channels: { channels: [] as any[], lastUpdated: new Date().toISOString() },
  tags: { tags: [] as any[], lastUpdated: new Date().toISOString() },
  summaries: { summaries: [] as any[], lastUpdated: new Date().toISOString() },
  associations: { associations: [] as any[], learningStats: { totalPredictions: 0, accuratePredictions: 0, accuracy: 0 }, lastUpdated: new Date().toISOString() },
  cache: { cache: {} as any, lastUpdated: new Date().toISOString() },
};

// Initialize files if they don't exist
Object.entries(FILES).forEach(([key, filePath]) => {
  if (!fs.existsSync(filePath)) {
    fs.writeJsonSync(filePath, DEFAULT_DATA[key as keyof typeof DEFAULT_DATA], { spaces: 2 });
  }
});

/**
 * Atomic file write operation
 */
async function atomicWrite(filePath: string, data: any): Promise<void> {
  const tempPath = `${filePath}.tmp`;
  await writeFile(tempPath, JSON.stringify(data, null, 2));
  await promisify(fs.rename)(tempPath, filePath);
}

/**
 * Read JSON file with error handling
 */
export async function readJsonFile<T>(filePath: string): Promise<T> {
  try {
    const data = await readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw new Error(`Failed to read file: ${filePath}`);
  }
}

/**
 * Write JSON file with atomic operation
 */
export async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  try {
    await atomicWrite(filePath, data);
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    throw new Error(`Failed to write file: ${filePath}`);
  }
}

/**
 * Generic storage operations
 */
export class JsonStorage<T> {
  private filePath: string;
  private defaultData: T;

  constructor(fileKey: keyof typeof FILES, defaultData: T) {
    this.filePath = FILES[fileKey];
    this.defaultData = defaultData;
  }

  async read(): Promise<T> {
    try {
      return await readJsonFile<T>(this.filePath);
    } catch (error) {
      console.warn(`Failed to read ${this.filePath}, using default data`);
      return this.defaultData;
    }
  }

  async write(data: T): Promise<void> {
    await writeJsonFile(this.filePath, data);
  }

  async update(updater: (data: T) => T): Promise<T> {
    const currentData = await this.read();
    const updatedData = updater(currentData);
    await this.write(updatedData);
    return updatedData;
  }
}

// Export specific storage instances with proper typing
export const messageStorage = new JsonStorage<typeof DEFAULT_DATA.messages>('messages', DEFAULT_DATA.messages);
export const userStorage = new JsonStorage<typeof DEFAULT_DATA.users>('users', DEFAULT_DATA.users);
export const channelStorage = new JsonStorage<typeof DEFAULT_DATA.channels>('channels', DEFAULT_DATA.channels);
export const tagStorage = new JsonStorage<typeof DEFAULT_DATA.tags>('tags', DEFAULT_DATA.tags);
export const summaryStorage = new JsonStorage<typeof DEFAULT_DATA.summaries>('summaries', DEFAULT_DATA.summaries);
export const associationStorage = new JsonStorage<typeof DEFAULT_DATA.associations>('associations', DEFAULT_DATA.associations);
export const cacheStorage = new JsonStorage<typeof DEFAULT_DATA.cache>('cache', DEFAULT_DATA.cache);

// Export file paths for backup operations
export { FILES, DATA_DIR };

// Utility functions for data operations
export async function backupData(): Promise<void> {
  const backupDir = path.join(DATA_DIR, 'backups', new Date().toISOString().split('T')[0]);
  await fs.ensureDir(backupDir);
  
  for (const [key, filePath] of Object.entries(FILES)) {
    if (await fs.pathExists(filePath)) {
      await fs.copy(filePath, path.join(backupDir, `${key}.json`));
    }
  }
}

export async function getDataStats(): Promise<Record<string, any>> {
  const stats: Record<string, any> = {};
  
  for (const [key, filePath] of Object.entries(FILES)) {
    try {
      const fileStats = await fs.stat(filePath);
      const data = await readJsonFile(filePath);
      stats[key] = {
        size: fileStats.size,
        lastModified: fileStats.mtime,
        recordCount: Array.isArray(data[key as keyof typeof data]) 
          ? (data[key as keyof typeof data] as any[]).length 
          : 0,
      };
    } catch (error) {
      stats[key] = { error: 'Failed to read file' };
    }
  }
  
  return stats;
}

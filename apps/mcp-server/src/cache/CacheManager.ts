import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export class CacheManager {
  private cacheDir: string;
  private ttlMs: number;
  private memoryCache: Map<string, CacheEntry<any>> = new Map();

  constructor(ttlMs: number = 60 * 60 * 1000) { // Default 1 hour TTL
    this.ttlMs = ttlMs;
    this.cacheDir = path.join(os.homedir(), '.architect-guardian', 'cache');
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create cache directory:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // 1. Check memory cache first
    const memEntry = this.memoryCache.get(key);
    if (memEntry && this.isValid(memEntry.timestamp)) {
      return memEntry.value as T;
    }

    // 2. Check disk cache
    try {
      const sanitizedKey = key.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filePath = path.join(this.cacheDir, `${sanitizedKey}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      const entry: CacheEntry<T> = JSON.parse(data);

      if (this.isValid(entry.timestamp)) {
        // Populate memory cache for faster subsequent reads
        this.memoryCache.set(key, entry);
        return entry.value;
      } else {
        // Clean up expired cache
        await fs.unlink(filePath).catch(() => { });
        this.memoryCache.delete(key);
      }
    } catch (error) {
      // Ignore file not found or parse errors
    }

    return null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now()
    };

    // 1. Set memory cache
    this.memoryCache.set(key, entry);

    // 2. Set disk cache
    try {
      const sanitizedKey = key.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filePath = path.join(this.cacheDir, `${sanitizedKey}.json`);
      await fs.writeFile(filePath, JSON.stringify(entry), 'utf-8');
    } catch (error) {
      console.error(`Failed to write cache for key ${key}:`, error);
    }
  }

  async clear(key?: string): Promise<void> {
    if (key) {
      this.memoryCache.delete(key);
      try {
        const sanitizedKey = key.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        await fs.unlink(path.join(this.cacheDir, `${sanitizedKey}.json`));
      } catch (e) { }
    } else {
      this.memoryCache.clear();
      try {
        const files = await fs.readdir(this.cacheDir);
        await Promise.all(
          files
            .filter(file => file.endsWith('.json'))
            .map(file => fs.unlink(path.join(this.cacheDir, file)))
        );
      } catch (e) { }
    }
  }

  private isValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.ttlMs;
  }
}

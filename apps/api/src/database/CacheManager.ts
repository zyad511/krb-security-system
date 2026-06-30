import Redis from 'ioredis';

export class CacheManager {
  private redis: Redis;
  private static instance: CacheManager;

  private constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  async getGuildConfig(guildId: string): Promise<any | null> {
    const data = await this.redis.get(`config:${guildId}`);
    return data ? JSON.parse(data) : null;
  }

  async setGuildConfig(guildId: string, config: any): Promise<void> {
    await this.redis.set(`config:${guildId}`, JSON.stringify(config), 'EX', 3600);
  }

  async invalidateGuildConfig(guildId: string): Promise<void> {
    await this.redis.del(`config:${guildId}`);
  }
}

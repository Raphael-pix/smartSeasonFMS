import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

const NS = 'ss';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  fieldStatusKey(fieldId: string) {
    return `${NS}:field:status:${fieldId}`;
  }

  fieldListKey(scope: string) {
    return `${NS}:field:list:${scope}`;
  }

  dashboardKey(scope: 'admin' | `agent:${string}`) {
    return `${NS}:dashboard:${scope}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (err) {
      this.logger.warn(`Cache GET failed for key ${key}: ${err}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      this.logger.warn(`Cache SET failed for key ${key}: ${err}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      this.logger.warn(`Cache DEL failed for key ${key}: ${err}`);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(
          `Invalidated ${keys.length} keys matching ${pattern}`,
        );
      }
    } catch (err) {
      this.logger.warn(`Cache DEL pattern failed for ${pattern}: ${err}`);
    }
  }

  async invalidateFieldStatus(fieldId: string) {
    await this.del(this.fieldStatusKey(fieldId));
  }

  async invalidateFieldLists() {
    await this.delPattern(`${NS}:field:list:*`);
  }

  async invalidateDashboards() {
    await this.delPattern(`${NS}:dashboard:*`);
  }

  async invalidateOnFieldUpdate(fieldId: string) {
    await Promise.all([
      this.invalidateFieldStatus(fieldId),
      this.invalidateFieldLists(),
      this.invalidateDashboards(),
    ]);
  }
}

// Key schema:
//   ss:field:status:{fieldId}      → computed FieldStatus
//   ss:field:list:{agentId|all}    → paginated field list
//   ss:dashboard:admin             → admin dashboard aggregate
//   ss:dashboard:agent:{agentId}   → agent dashboard aggregate

import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';

type LoginStatus = {
  failures: number;
  requireCaptcha: boolean;
};

// Minimal Redis interface — only the methods we need.
// Satisfied by ioredis.Redis without importing the full type.
interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, exFlag: 'EX', ttlSeconds: number): Promise<unknown>;
  del(key: string): Promise<unknown>;
  quit(): Promise<unknown>;
}

function tryCreateRedisClient(): RedisLike | null {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Redis } = require('ioredis') as { Redis: new (url: string) => RedisLike };
    const client = new Redis(redisUrl);
    return client;
  } catch {
    // ioredis not installed — graceful fallback to in-memory
    return null;
  }
}

@Injectable()
export class LoginAttemptService implements OnModuleDestroy {
  private readonly logger = new Logger(LoginAttemptService.name);
  private readonly captchaThreshold = 3;
  private readonly expirySeconds = 15 * 60; // 15 minutes

  // In-memory fallback (used when Redis is unavailable)
  private readonly memAttempts = new Map<string, { failures: number; lastFailureAt: number }>();

  // Redis client — null if REDIS_URL is not set or ioredis is not installed
  private readonly redis: RedisLike | null = tryCreateRedisClient();

  constructor() {
    if (this.redis) {
      this.logger.log('LoginAttemptService: using Redis backend.');
    } else {
      this.logger.warn(
        'LoginAttemptService: Redis unavailable — falling back to in-memory store. ' +
          'Login attempt counters will reset on server restart.',
      );
    }
  }

  async onModuleDestroy() {
    await this.redis?.quit().catch(() => {});
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async recordFailure(key: string): Promise<LoginStatus> {
    if (this.redis) {
      return this.recordFailureRedis(key);
    }
    return this.recordFailureMem(key);
  }

  async reset(key: string): Promise<void> {
    if (this.redis) {
      await this.redis.del(`login:${key}`).catch(() => {});
      return;
    }
    this.memAttempts.delete(key);
  }

  async needsCaptcha(key: string): Promise<boolean> {
    if (this.redis) {
      return this.needsCaptchaRedis(key);
    }
    return this.needsCaptchaMem(key);
  }

  // ---------------------------------------------------------------------------
  // Redis implementation
  // ---------------------------------------------------------------------------

  private async recordFailureRedis(key: string): Promise<LoginStatus> {
    const redisKey = `login:${key}`;
    const raw = await this.redis!.get(redisKey).catch(() => null);
    const failures = (raw ? parseInt(raw, 10) : 0) + 1;
    await this.redis!.set(redisKey, String(failures), 'EX', this.expirySeconds).catch(() => {});
    return { failures, requireCaptcha: failures >= this.captchaThreshold };
  }

  private async needsCaptchaRedis(key: string): Promise<boolean> {
    const raw = await this.redis!.get(`login:${key}`).catch(() => null);
    const failures = raw ? parseInt(raw, 10) : 0;
    return failures >= this.captchaThreshold;
  }

  // ---------------------------------------------------------------------------
  // In-memory implementation (unchanged behaviour from original)
  // ---------------------------------------------------------------------------

  private recordFailureMem(key: string): LoginStatus {
    this.pruneExpiry(key);
    const existing = this.memAttempts.get(key);
    const next = {
      failures: (existing?.failures ?? 0) + 1,
      lastFailureAt: Date.now(),
    };
    this.memAttempts.set(key, next);
    return {
      failures: next.failures,
      requireCaptcha: next.failures >= this.captchaThreshold,
    };
  }

  private needsCaptchaMem(key: string): boolean {
    this.pruneExpiry(key);
    return (this.memAttempts.get(key)?.failures ?? 0) >= this.captchaThreshold;
  }

  private pruneExpiry(key: string) {
    const entry = this.memAttempts.get(key);
    if (!entry) return;
    if (Date.now() - entry.lastFailureAt > this.expirySeconds * 1000) {
      this.memAttempts.delete(key);
    }
  }
}

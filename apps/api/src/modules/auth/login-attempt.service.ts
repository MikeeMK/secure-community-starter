import { Injectable } from '@nestjs/common';

type LoginStatus = {
  failures: number;
  requireCaptcha: boolean;
};

@Injectable()
export class LoginAttemptService {
  private readonly attempts = new Map<string, { failures: number; lastFailureAt: number }>();
  private readonly captchaThreshold = 3;
  private readonly expiryMs = 15 * 60 * 1000; // 15 minutes

  recordFailure(key: string): LoginStatus {
    this.pruneExpiry(key);
    const existing = this.attempts.get(key);
    const next = {
      failures: (existing?.failures ?? 0) + 1,
      lastFailureAt: Date.now(),
    };
    this.attempts.set(key, next);
    return {
      failures: next.failures,
      requireCaptcha: next.failures >= this.captchaThreshold,
    };
  }

  reset(key: string) {
    this.attempts.delete(key);
  }

  needsCaptcha(key: string): boolean {
    this.pruneExpiry(key);
    const current = this.attempts.get(key);
    return (current?.failures ?? 0) >= this.captchaThreshold;
  }

  private pruneExpiry(key: string) {
    const entry = this.attempts.get(key);
    if (!entry) return;
    if (Date.now() - entry.lastFailureAt > this.expiryMs) {
      this.attempts.delete(key);
    }
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';

type TurnstileResponse = {
  success: boolean;
  'error-codes'?: string[];
};

@Injectable()
export class CaptchaService {
  private readonly secret = process.env.CLOUDFLARE_TURNSTILE_SECRET;

  /**
   * Verify a Turnstile token.
   * - If CLOUDFLARE_TURNSTILE_SECRET is not configured, verification is skipped
   *   (useful in local development where the Turnstile widget is not shown).
   * - In production, always configure the secret; captcha will be strictly enforced.
   */
  async verify(token: string | undefined, remoteIp?: string): Promise<void> {
    if (!this.secret) {
      // No secret → dev mode, skip captcha verification.
      return;
    }

    if (!token) {
      throw new BadRequestException('Captcha token is required');
    }

    const payload = new URLSearchParams({ secret: this.secret, response: token });
    if (remoteIp) payload.set('remoteip', remoteIp);

    let data: TurnstileResponse;
    try {
      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload.toString(),
      });
      data = (await res.json()) as TurnstileResponse;
    } catch {
      // Fail closed: network error → reject
      throw new BadRequestException('Captcha verification failed');
    }

    if (!data.success) {
      throw new BadRequestException('Captcha verification failed');
    }
  }
}

import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';

type TurnstileResponse = {
  success: boolean;
  'error-codes'?: string[];
};

@Injectable()
export class CaptchaService {
  private readonly secret = process.env.CLOUDFLARE_TURNSTILE_SECRET;

  async verify(token: string, remoteIp?: string) {
    if (!this.secret) {
      throw new InternalServerErrorException('Turnstile secret is not configured');
    }

    const payload = new URLSearchParams({
      secret: this.secret,
      response: token,
    });
    if (remoteIp) payload.set('remoteip', remoteIp);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString(),
    });

    if (!res.ok) {
      throw new BadRequestException('Captcha verification failed');
    }

    const data = (await res.json()) as TurnstileResponse;
    if (!data.success) {
      throw new BadRequestException('Captcha verification failed');
    }

    return data;
  }
}

import './load-env';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AppModule } from './modules/app.module';

function validateDatabaseConfiguration() {
  const rawDatabaseUrl = process.env.DATABASE_URL?.trim();

  if (!rawDatabaseUrl) {
    throw new Error('DATABASE_URL est requis pour démarrer l API.');
  }

  if (
    (rawDatabaseUrl.startsWith('"') && rawDatabaseUrl.endsWith('"'))
    || (rawDatabaseUrl.startsWith('\'') && rawDatabaseUrl.endsWith('\''))
  ) {
    throw new Error('DATABASE_URL ne doit pas être entouré de guillemets dans Render.');
  }

  let parsed: URL;
  try {
    parsed = new URL(rawDatabaseUrl);
  } catch {
    throw new Error(
      'DATABASE_URL est invalide. Format attendu: postgresql://USER:PASSWORD@HOST:5432/DB?schema=public',
    );
  }

  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error('DATABASE_URL doit utiliser postgres:// ou postgresql://');
  }

  if (!parsed.hostname) {
    throw new Error('DATABASE_URL doit contenir un host valide.');
  }

  if (parsed.port && !/^\d+$/.test(parsed.port)) {
    throw new Error('DATABASE_URL contient un port invalide. Le port doit être uniquement numérique.');
  }
}

function logEmailConfiguration() {
  const emailEnabled = process.env.EMAIL_ENABLED !== 'false';
  const smtpHost = process.env.SMTP_HOST?.trim();
  const appUrl = process.env.APP_URL?.trim();

  if (!emailEnabled) {
    // eslint-disable-next-line no-console
    console.warn('Email disabled via EMAIL_ENABLED=false.');
    return;
  }

  if (!smtpHost) {
    // eslint-disable-next-line no-console
    console.warn('Email disabled: SMTP_HOST absent. Les e-mails sont désactivés tant que le SMTP n’est pas configuré.');
    return;
  }

  if (process.env.NODE_ENV === 'production' && smtpHost === 'localhost') {
    throw new Error('SMTP_HOST=localhost est interdit en production. Utilisez un vrai serveur SMTP.');
  }

  if (!appUrl) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('APP_URL est requis en production pour générer les liens d’e-mail.');
    }
    // eslint-disable-next-line no-console
    console.warn('APP_URL absent: fallback sur http://localhost:3000 pour les liens d’e-mail.');
  }

  // eslint-disable-next-line no-console
  console.log(`Email configured via SMTP host "${smtpHost}".`);
}

async function bootstrap() {
  validateDatabaseConfiguration();
  logEmailConfiguration();
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  const windowSec = Number(process.env.RATE_LIMIT_WINDOW_SEC ?? 60);
  const max = Number(process.env.RATE_LIMIT_MAX ?? 120);

  app.use(
    rateLimit({
      windowMs: windowSec * 1000,
      max,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`API listening on port ${port}`);
}

bootstrap();

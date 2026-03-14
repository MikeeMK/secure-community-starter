import './load-env';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AppModule } from './modules/app.module';

function logEmailConfiguration() {
  const smtpHost = process.env.SMTP_HOST?.trim();
  const appUrl = process.env.APP_URL?.trim();

  if (!smtpHost) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP_HOST est requis en production pour envoyer les e-mails.');
    }
    // eslint-disable-next-line no-console
    console.warn('Email disabled: SMTP_HOST absent. Les e-mails seront journalisés uniquement.');
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

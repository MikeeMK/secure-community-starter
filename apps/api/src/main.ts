import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AppModule } from './modules/app.module';

async function bootstrap() {
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

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
}

bootstrap();

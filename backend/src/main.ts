import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { SanitizeInterceptor } from './common/interceptors/sanitize.interceptor';
import { SecurityLoggerMiddleware } from './common/middleware/security-logger.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Limite de taille des requêtes (photos/audio en base64) - 10MB max
  app.use(require('express').json({ limit: '10mb' }));
  app.use(require('express').urlencoded({ limit: '10mb', extended: true }));

  // Sécurité HTTP headers renforcée
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Permet le chargement d'images cross-origin
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Intercepteurs globaux : timeout (SLA < 4s) + sanitization XSS
  app.useGlobalInterceptors(
    new TimeoutInterceptor(),
    new SanitizeInterceptor(),
  );

  // Middleware de logging sécurité
  const securityLogger = new SecurityLoggerMiddleware();
  app.use(securityLogger.use.bind(securityLogger));

  // CORS strict — supporte plusieurs origines via FRONTEND_URL (séparées par virgule)
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS non autorisé'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id'],
    maxAge: 3600,
  });

  // Swagger Documentation - désactivé en production
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('SAMA GARAGE API')
      .setDescription('API de gestion de garage électromécanique')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentification et autorisation')
      .addTag('users', 'Gestion des utilisateurs')
      .addTag('vehicles', 'Gestion des véhicules')
      .addTag('interventions', 'Gestion des interventions')
      .addTag('finance', 'Gestion financière')
      .addTag('stock', 'Gestion du stock')
      .addTag('settings', 'Paramètres du garage')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`
    🚀 SAMA GARAGE API démarrée sur le port ${port}
    📚 Documentation Swagger: http://localhost:${port}/api/docs
    🌍 Environment: ${process.env.NODE_ENV || 'development'}
  `);
}

bootstrap();

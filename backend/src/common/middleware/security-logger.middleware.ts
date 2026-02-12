import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Security');

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '-';

    // Log les tentatives suspectes
    const suspiciousPatterns = [
      /(\.\.|\/\/)/,           // Path traversal
      /<script/i,              // XSS basique
      /union\s+select/i,      // SQL injection
      /javascript:/i,          // JavaScript injection
      /on\w+\s*=/i,           // Event handler injection
    ];

    const fullUrl = originalUrl;
    const body = JSON.stringify(req.body || {});
    const isSuspicious = suspiciousPatterns.some(
      (p) => p.test(fullUrl) || p.test(body),
    );

    if (isSuspicious) {
      this.logger.warn(
        `⚠️ REQUÊTE SUSPECTE: ${method} ${fullUrl} - IP: ${ip} - UA: ${userAgent}`,
      );
    }

    // Log des échecs d'authentification
    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;

      if (statusCode === 401 || statusCode === 403) {
        this.logger.warn(
          `🔒 ACCÈS REFUSÉ [${statusCode}]: ${method} ${fullUrl} - IP: ${ip} - ${duration}ms`,
        );
      }

      if (statusCode === 429) {
        this.logger.warn(
          `🚫 RATE LIMIT: ${method} ${fullUrl} - IP: ${ip}`,
        );
      }

      // Log les requêtes lentes (> 4s = SLA dépassé)
      if (duration > 4000) {
        this.logger.warn(
          `🐢 REQUÊTE LENTE [${duration}ms]: ${method} ${fullUrl}`,
        );
      }
    });

    next();
  }
}

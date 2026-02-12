import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Décorateur pour récupérer le tenant_id depuis la requête
 * Utilisé pour isoler les données par garage
 */
export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    // Le tenant_id peut venir du JWT ou des headers
    return request.user?.tenant_id || request.headers['x-tenant-id'];
  },
);

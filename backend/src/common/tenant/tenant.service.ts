import { Injectable, Scope } from '@nestjs/common';

/**
 * Service pour gérer le contexte multi-tenant
 * En V1, un seul garage par instance
 * En V2, ce service sera étendu pour gérer plusieurs garages
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantService {
  private tenantId: string;

  setTenantId(tenantId: string) {
    this.tenantId = tenantId;
  }

  getTenantId(): string {
    return this.tenantId;
  }

  hasTenantId(): boolean {
    return !!this.tenantId;
  }
}

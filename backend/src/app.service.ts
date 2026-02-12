import { Injectable } from '@nestjs/common';
import { SupabaseService } from './common/supabase/supabase.service';

@Injectable()
export class AppService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getHealth() {
    const start = Date.now();
    let dbStatus = 'ok';
    let dbLatency = 0;

    try {
      const dbStart = Date.now();
      const { error } = await this.supabaseService
        .getAdminClient()
        .from('tenants')
        .select('id')
        .limit(1);
      dbLatency = Date.now() - dbStart;
      if (error) dbStatus = 'degraded';
    } catch {
      dbStatus = 'down';
    }

    const totalLatency = Date.now() - start;
    const overallStatus = dbStatus === 'ok' ? 'ok' : dbStatus === 'degraded' ? 'degraded' : 'error';

    return {
      status: overallStatus,
      message: overallStatus === 'ok'
        ? 'SAMA GARAGE API est opérationnelle'
        : 'SAMA GARAGE API fonctionne en mode dégradé',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: { status: dbStatus, latency_ms: dbLatency },
        api: { status: 'ok', latency_ms: totalLatency },
      },
    };
  }

  getVersion() {
    return {
      version: '1.0.0',
      name: 'SAMA GARAGE API',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}

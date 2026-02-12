import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

    // Client pour les opérations utilisateur
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Client admin pour les opérations privilégiées
    this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  getAdminClient(): SupabaseClient {
    return this.supabaseAdmin;
  }

  // Helper pour les requêtes avec tenant
  async query(table: string, tenantId?: string) {
    const client = this.getAdminClient();
    let query = client.from(table).select('*');

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    return query;
  }

  // Helper pour l'insertion avec tenant
  async insert(table: string, data: any, tenantId?: string) {
    const client = this.getAdminClient();
    const insertData = tenantId ? { ...data, tenant_id: tenantId } : data;

    return client.from(table).insert(insertData).select();
  }

  // Helper pour la mise à jour
  async update(table: string, id: string, data: any, tenantId?: string) {
    const client = this.getAdminClient();
    let query = client.from(table).update(data).eq('id', id);

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    return query.select();
  }

  // Helper pour la suppression
  async delete(table: string, id: string, tenantId?: string) {
    const client = this.getAdminClient();
    let query = client.from(table).delete().eq('id', id);

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    return query;
  }
}

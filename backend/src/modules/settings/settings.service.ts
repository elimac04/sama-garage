import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { UpdateSettingsDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(private supabaseService: SupabaseService) {}

  async getSettings(tenantId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('garage_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      // Si pas de paramètres, créer des paramètres par défaut
      return this.createDefaultSettings(tenantId);
    }

    return data;
  }

  async updateSettings(updateSettingsDto: UpdateSettingsDto, tenantId: string) {
    // Vérifier si les paramètres existent
    const existing = await this.getSettings(tenantId);

    if (existing && existing.id) {
      // Mettre à jour
      const { data, error } = await this.supabaseService.update(
        'garage_settings',
        existing.id,
        updateSettingsDto,
        tenantId,
      );

      if (error) {
        throw new Error(error.message);
      }

      return data[0];
    } else {
      // Créer
      const { data, error } = await this.supabaseService.insert(
        'garage_settings',
        updateSettingsDto,
        tenantId,
      );

      if (error) {
        throw new Error(error.message);
      }

      return data[0];
    }
  }

  private async createDefaultSettings(tenantId: string) {
    const defaultSettings = {
      garage_name: 'SAMA GARAGE',
      address: '',
      phone: '',
      email: '',
      website: '',
      logo_url: '',
    };

    const { data, error } = await this.supabaseService.insert(
      'garage_settings',
      defaultSettings,
      tenantId,
    );

    if (error) {
      throw new Error(error.message);
    }

    return data[0];
  }
}

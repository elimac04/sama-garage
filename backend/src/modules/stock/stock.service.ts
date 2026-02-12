import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateStockItemDto, UpdateStockItemDto } from './dto/stock.dto';

@Injectable()
export class StockService {
  constructor(private supabaseService: SupabaseService) {}

  async create(createStockItemDto: CreateStockItemDto, tenantId: string) {
    const { data, error } = await this.supabaseService.insert(
      'stock_items',
      createStockItemDto,
      tenantId,
    );

    if (error) {
      throw new Error(error.message);
    }

    return data[0];
  }

  async findAll(tenantId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('stock_items')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async findOne(id: string, tenantId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('stock_items')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Article introuvable');
    }

    return data;
  }

  async update(id: string, updateStockItemDto: UpdateStockItemDto, tenantId: string) {
    const { data, error } = await this.supabaseService.update(
      'stock_items',
      id,
      updateStockItemDto,
      tenantId,
    );

    if (error || !data) {
      throw new NotFoundException('Erreur lors de la mise à jour');
    }

    return data[0];
  }

  async remove(id: string, tenantId: string) {
    const { error } = await this.supabaseService.delete('stock_items', id, tenantId);

    if (error) {
      throw new NotFoundException('Erreur lors de la suppression');
    }

    return { message: 'Article supprimé avec succès' };
  }

  async getLowStockAlerts(tenantId: string) {
    // Supabase PostgREST ne supporte pas la comparaison colonne vs colonne
    // On récupère tout et on filtre côté serveur
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('stock_items')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).filter((item: any) => item.quantity <= item.alert_threshold);
  }
}

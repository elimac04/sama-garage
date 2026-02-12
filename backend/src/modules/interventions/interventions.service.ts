import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateInterventionDto, UpdateInterventionDto } from './dto/intervention.dto';

@Injectable()
export class InterventionsService {
  constructor(private supabaseService: SupabaseService) {}

  private readonly selectQuery = `
    *,
    vehicle:vehicles(*, owner:owners(*)),
    mechanic:users(id, full_name, email, phone, role),
    stock_items:intervention_stock_items(*, stock_item:stock_items(id, name, category, photos))
  `;

  async create(createInterventionDto: CreateInterventionDto, tenantId: string) {
    const { stock_items, ...interventionData } = createInterventionDto;

    const { data, error } = await this.supabaseService.insert(
      'interventions',
      {
        ...interventionData,
        status: 'pending',
      },
      tenantId,
    );

    if (error) {
      throw new Error(error.message);
    }

    const intervention = data[0];

    // Insérer les articles du stock utilisés
    if (stock_items && stock_items.length > 0) {
      await this.insertStockItems(intervention.id, stock_items, tenantId);
    }

    return this.findOne(intervention.id, tenantId);
  }

  async findAll(tenantId: string, status?: string) {
    let query = this.supabaseService
      .getAdminClient()
      .from('interventions')
      .select(this.selectQuery)
      .eq('tenant_id', tenantId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async findOne(id: string, tenantId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('interventions')
      .select(this.selectQuery)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Intervention introuvable');
    }

    return data;
  }

  async update(id: string, updateInterventionDto: UpdateInterventionDto, tenantId: string) {
    const { stock_items, ...updateData } = updateInterventionDto;

    // Auto-set timestamps en fonction du statut
    if (updateData.status === 'in_progress' && !updateData['started_at']) {
      (updateData as any).started_at = new Date().toISOString();
    }
    if (updateData.status === 'completed' && !updateData['completed_at']) {
      (updateData as any).completed_at = new Date().toISOString();
    }

    const { data, error } = await this.supabaseService.update(
      'interventions',
      id,
      updateData,
      tenantId,
    );

    if (error || !data) {
      throw new NotFoundException('Erreur lors de la mise à jour');
    }

    // Mettre à jour les articles du stock si fournis
    if (stock_items !== undefined) {
      // Supprimer les anciens
      await this.supabaseService
        .getAdminClient()
        .from('intervention_stock_items')
        .delete()
        .eq('intervention_id', id)
        .eq('tenant_id', tenantId);

      // Insérer les nouveaux
      if (stock_items.length > 0) {
        await this.insertStockItems(id, stock_items, tenantId);
      }
    }

    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string) {
    const { error } = await this.supabaseService.delete('interventions', id, tenantId);

    if (error) {
      throw new NotFoundException('Erreur lors de la suppression');
    }

    return { message: 'Intervention supprimée avec succès' };
  }

  private async insertStockItems(
    interventionId: string,
    stockItems: { stock_item_id: string; quantity_used: number; unit_price_at_time: number }[],
    tenantId: string,
  ) {
    const rows = stockItems.map((item) => ({
      intervention_id: interventionId,
      stock_item_id: item.stock_item_id,
      quantity_used: item.quantity_used,
      unit_price_at_time: item.unit_price_at_time,
      tenant_id: tenantId,
    }));

    const { error } = await this.supabaseService
      .getAdminClient()
      .from('intervention_stock_items')
      .insert(rows);

    if (error) {
      console.error('Erreur insertion stock items:', error);
    }
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Trouver ou créer un propriétaire par téléphone
   */
  private async findOrCreateOwner(
    ownerName: string,
    ownerPhone: string,
    tenantId: string,
  ): Promise<string> {
    // Chercher un propriétaire existant par téléphone
    const { data: existing } = await this.supabaseService
      .getAdminClient()
      .from('owners')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('phone', ownerPhone)
      .single();

    if (existing) {
      // Mettre à jour le nom si différent
      await this.supabaseService
        .getAdminClient()
        .from('owners')
        .update({ full_name: ownerName })
        .eq('id', existing.id);
      return existing.id;
    }

    // Créer un nouveau propriétaire
    const { data: newOwner, error } = await this.supabaseService
      .getAdminClient()
      .from('owners')
      .insert({
        full_name: ownerName,
        phone: ownerPhone,
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (error || !newOwner) {
      throw new BadRequestException(`Erreur création propriétaire: ${error?.message}`);
    }

    return newOwner.id;
  }

  async create(createVehicleDto: CreateVehicleDto, tenantId: string) {
    const {
      owner_name, owner_phone, owner_id,
      photos, audio_url, intervention_type, description,
      ...vehicleFields
    } = createVehicleDto;

    // Résoudre l'owner_id
    let resolvedOwnerId = owner_id;
    if (!resolvedOwnerId) {
      if (!owner_name || !owner_phone) {
        throw new BadRequestException('owner_id ou (owner_name + owner_phone) est requis');
      }
      resolvedOwnerId = await this.findOrCreateOwner(owner_name, owner_phone, tenantId);
    }

    // Insérer le véhicule
    const insertData: any = {
      ...vehicleFields,
      owner_id: resolvedOwnerId,
      tenant_id: tenantId,
    };
    if (photos) insertData.photos = photos;
    if (audio_url) insertData.audio_url = audio_url;
    if (intervention_type) insertData.intervention_type = intervention_type;
    if (description) insertData.description = description;

    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('vehicles')
      .insert(insertData)
      .select('*, owner:owners(*)')
      .single();

    if (error) {
      console.error('❌ Vehicle insert error:', JSON.stringify(error));
      throw new BadRequestException(`Erreur création véhicule: ${error.message}`);
    }

    return data;
  }

  async findAll(tenantId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('vehicles')
      .select('*, owner:owners(*)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async findOne(id: string, tenantId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('vehicles')
      .select('*, owner:owners(*), interventions(*)')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Véhicule introuvable');
    }

    return data;
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto, tenantId: string) {
    const { owner_name, owner_phone, photos, audio_url, intervention_type, description, ...vehicleFields } = updateVehicleDto;

    // Si le propriétaire change
    if (owner_name && owner_phone) {
      const ownerId = await this.findOrCreateOwner(owner_name, owner_phone, tenantId);
      (vehicleFields as any).owner_id = ownerId;
    }

    const updateData: any = { ...vehicleFields };
    if (photos !== undefined) updateData.photos = photos;
    if (audio_url !== undefined) updateData.audio_url = audio_url;
    if (intervention_type !== undefined) updateData.intervention_type = intervention_type;
    if (description !== undefined) updateData.description = description;

    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('vehicles')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*, owner:owners(*)')
      .single();

    if (error || !data) {
      throw new NotFoundException('Erreur lors de la mise à jour');
    }

    return data;
  }

  async remove(id: string, tenantId: string) {
    const { error } = await this.supabaseService.delete('vehicles', id, tenantId);

    if (error) {
      throw new NotFoundException('Erreur lors de la suppression');
    }

    return { message: 'Véhicule supprimé avec succès' };
  }
}

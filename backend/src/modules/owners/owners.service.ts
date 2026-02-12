import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateOwnerDto, UpdateOwnerDto } from './dto/owner.dto';

@Injectable()
export class OwnersService {
  constructor(private supabaseService: SupabaseService) {}

  async create(createOwnerDto: CreateOwnerDto, tenantId: string) {
    const { data, error } = await this.supabaseService.insert(
      'owners',
      createOwnerDto,
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
      .from('owners')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('full_name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async findOne(id: string, tenantId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('owners')
      .select('*, vehicles(*)')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Propriétaire introuvable');
    }

    return data;
  }

  async update(id: string, updateOwnerDto: UpdateOwnerDto, tenantId: string) {
    const { data, error } = await this.supabaseService.update(
      'owners',
      id,
      updateOwnerDto,
      tenantId,
    );

    if (error || !data) {
      throw new NotFoundException('Erreur lors de la mise à jour');
    }

    return data[0];
  }

  async remove(id: string, tenantId: string) {
    const { error } = await this.supabaseService.delete('owners', id, tenantId);

    if (error) {
      throw new NotFoundException('Erreur lors de la suppression');
    }

    return { message: 'Propriétaire supprimé avec succès' };
  }

  async search(query: string, tenantId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('owners')
      .select('*')
      .eq('tenant_id', tenantId)
      .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('full_name', { ascending: true })
      .limit(20);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

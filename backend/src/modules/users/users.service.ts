import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(tenantId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('users')
      .select('*')
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
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return data;
  }

  async update(id: string, updateUserDto: UpdateUserDto, tenantId: string) {
    const { data, error } = await this.supabaseService.update(
      'users',
      id,
      updateUserDto,
      tenantId,
    );

    if (error || !data) {
      throw new NotFoundException('Erreur lors de la mise à jour');
    }

    return data[0];
  }

  async remove(id: string, tenantId: string) {
    // Désactiver l'utilisateur plutôt que de le supprimer
    return this.update(id, { is_active: false }, tenantId);
  }
}

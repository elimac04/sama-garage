import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import {
  OpenCashRegisterDto,
  CloseCashRegisterDto,
  CreateCashTransactionDto,
  UpdateCashTransactionDto,
} from './dto/cash.dto';

@Injectable()
export class CashService {
  constructor(private supabaseService: SupabaseService) {}

  // ==================== CASH REGISTERS ====================

  async openRegister(dto: OpenCashRegisterDto, userId: string, tenantId: string) {
    // Vérifier s'il y a déjà une caisse ouverte
    const { data: openRegister } = await this.supabaseService
      .getAdminClient()
      .from('cash_registers')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'open')
      .single();

    if (openRegister) {
      throw new BadRequestException('Une caisse est déjà ouverte. Fermez-la avant d\'en ouvrir une nouvelle.');
    }

    const { data, error } = await this.supabaseService.insert(
      'cash_registers',
      {
        opened_by: userId,
        opening_amount: dto.opening_amount,
        status: 'open',
        notes: dto.notes,
        opened_at: new Date().toISOString(),
      },
      tenantId,
    );

    if (error) {
      throw new Error(error.message);
    }

    return data[0];
  }

  async closeRegister(registerId: string, dto: CloseCashRegisterDto, userId: string, tenantId: string) {
    const register = await this.findOneRegister(registerId, tenantId);

    if (register.status === 'closed') {
      throw new BadRequestException('Cette caisse est déjà fermée');
    }

    const { data, error } = await this.supabaseService.update(
      'cash_registers',
      registerId,
      {
        closed_by: userId,
        closing_amount: dto.closing_amount,
        status: 'closed',
        closed_at: new Date().toISOString(),
        notes: dto.notes || register.notes,
      },
      tenantId,
    );

    if (error) {
      throw new Error(error.message);
    }

    return data[0];
  }

  async getCurrentRegister(tenantId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('cash_registers')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'open')
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  async findAllRegisters(tenantId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('cash_registers')
      .select('*, opened_by_user:users!cash_registers_opened_by_fkey(full_name), closed_by_user:users!cash_registers_closed_by_fkey(full_name)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async findOneRegister(id: string, tenantId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('cash_registers')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Caisse introuvable');
    }

    return data;
  }

  // ==================== CASH TRANSACTIONS ====================

  async createTransaction(dto: CreateCashTransactionDto, userId: string, tenantId: string) {
    // Vérifier que la caisse est ouverte
    const register = await this.findOneRegister(dto.cash_register_id, tenantId);
    if (register.status !== 'open') {
      throw new BadRequestException('La caisse doit être ouverte pour ajouter une transaction');
    }

    const { data, error } = await this.supabaseService.insert(
      'cash_transactions',
      {
        ...dto,
        created_by: userId,
      },
      tenantId,
    );

    if (error) {
      throw new Error(error.message);
    }

    return data[0];
  }

  async findTransactionsByRegister(registerId: string, tenantId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('cash_transactions')
      .select('*, created_by_user:users!cash_transactions_created_by_fkey(full_name)')
      .eq('cash_register_id', registerId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async updateTransaction(id: string, dto: UpdateCashTransactionDto, tenantId: string) {
    const { data, error } = await this.supabaseService.update(
      'cash_transactions',
      id,
      dto,
      tenantId,
    );

    if (error || !data) {
      throw new NotFoundException('Transaction introuvable');
    }

    return data[0];
  }

  async deleteTransaction(id: string, tenantId: string) {
    const { error } = await this.supabaseService.delete('cash_transactions', id, tenantId);

    if (error) {
      throw new NotFoundException('Erreur lors de la suppression');
    }

    return { message: 'Transaction supprimée avec succès' };
  }

  async getRegisterBalance(registerId: string, tenantId: string) {
    const register = await this.findOneRegister(registerId, tenantId);
    const transactions = await this.findTransactionsByRegister(registerId, tenantId);

    const totalIncome = transactions
      .filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    const totalExpense = transactions
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    return {
      register,
      transactions,
      summary: {
        opening_amount: Number(register.opening_amount),
        total_income: totalIncome,
        total_expense: totalExpense,
        balance: Number(register.opening_amount) + totalIncome - totalExpense,
        transaction_count: transactions.length,
      },
    };
  }
}

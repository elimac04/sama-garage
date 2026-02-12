import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateInvoiceDto, CreatePaymentDto } from './dto/finance.dto';

@Injectable()
export class FinanceService {
  constructor(private supabaseService: SupabaseService) {}

  async createInvoice(createInvoiceDto: CreateInvoiceDto, tenantId: string) {
    // Générer un numéro de facture unique
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);

    const { data, error } = await this.supabaseService.insert(
      'invoices',
      {
        ...createInvoiceDto,
        invoice_number: invoiceNumber,
        status: 'pending',
        issued_date: new Date().toISOString(),
      },
      tenantId,
    );

    if (error) {
      throw new Error(error.message);
    }

    return data[0];
  }

  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');

    // Compter les factures du jour pour incrémenter
    const { count } = await this.supabaseService
      .getAdminClient()
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', now.toISOString().slice(0, 10));

    const sequence = String((count || 0) + 1).padStart(4, '0');
    return `FAC-${dateStr}-${sequence}`;
  }

  async getInvoices(tenantId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('invoices')
      .select('*, intervention:interventions(*, vehicle:vehicles(*))')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async recordPayment(createPaymentDto: CreatePaymentDto, tenantId: string) {
    const { invoice_id, payment_method, amount_paid } = createPaymentDto;

    // Enregistrer le paiement
    const { data: payment, error: paymentError } = await this.supabaseService.insert(
      'payments',
      {
        invoice_id,
        payment_method,
        amount_paid,
        payment_date: new Date().toISOString(),
      },
      tenantId,
    );

    if (paymentError) {
      throw new Error(paymentError.message);
    }

    // Mettre à jour le statut de la facture
    await this.supabaseService.update(
      'invoices',
      invoice_id,
      { status: 'paid' },
      tenantId,
    );

    return payment[0];
  }

  async getReports(tenantId: string, startDate?: string, endDate?: string) {
    let query = this.supabaseService
      .getAdminClient()
      .from('invoices')
      .select('*, payments(*)')
      .eq('tenant_id', tenantId);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Calculer les statistiques
    const totalRevenue = data.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const paidInvoices = data.filter(inv => inv.status === 'paid').length;
    const pendingInvoices = data.filter(inv => inv.status === 'pending').length;

    return {
      totalRevenue,
      paidInvoices,
      pendingInvoices,
      invoices: data,
    };
  }
}

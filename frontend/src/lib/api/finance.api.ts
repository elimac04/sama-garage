import api from '../api';
import { Invoice, Payment } from '@/types';

export interface CreateInvoicePayload {
  intervention_id: string;
  total_amount: number;
  description?: string;
}

export interface CreatePaymentPayload {
  invoice_id: string;
  payment_method: 'cash' | 'wave' | 'orange_money';
  amount_paid: number;
}

export interface FinanceReport {
  totalRevenue: number;
  paidInvoices: number;
  pendingInvoices: number;
  invoices: Invoice[];
}

export const financeApi = {
  getInvoices: () =>
    api.get<Invoice[]>('/finance/invoices').then((r) => r.data),

  createInvoice: (data: CreateInvoicePayload) =>
    api.post<Invoice>('/finance/invoices', data).then((r) => r.data),

  recordPayment: (data: CreatePaymentPayload) =>
    api.post<Payment>('/finance/payments', data).then((r) => r.data),

  getReports: (startDate?: string, endDate?: string) =>
    api.get<FinanceReport>('/finance/reports', {
      params: { startDate, endDate },
    }).then((r) => r.data),
};

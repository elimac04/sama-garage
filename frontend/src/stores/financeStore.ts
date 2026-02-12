import { create } from 'zustand';
import { financeApi, CreateInvoicePayload, CreatePaymentPayload, FinanceReport } from '@/lib/api/finance.api';

export interface InvoiceItem {
  id: string;
  intervention_id: string;
  invoice_number: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  description?: string;
  issued_date: string;
  paid_date?: string;
  intervention?: {
    id: string;
    type: string;
    description: string;
    estimated_cost: number;
    vehicle?: {
      id: string;
      brand: string;
      model: string;
      registration_number: string;
      owner_name: string;
      owner_phone: string;
    };
  };
  created_at: string;
}

export interface PaymentItem {
  id: string;
  invoice_id: string;
  payment_method: 'cash' | 'wave' | 'orange_money';
  amount_paid: number;
  payment_date: string;
  notes?: string;
}

interface FinanceStore {
  invoices: InvoiceItem[];
  loading: boolean;
  report: FinanceReport | null;

  fetchInvoices: () => Promise<void>;
  createInvoice: (data: CreateInvoicePayload) => Promise<InvoiceItem>;
  recordPayment: (data: CreatePaymentPayload) => Promise<void>;
  fetchReports: (startDate?: string, endDate?: string) => Promise<FinanceReport>;
  getInvoiceByIntervention: (interventionId: string) => InvoiceItem | undefined;
}

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  invoices: [],
  loading: false,
  report: null,

  fetchInvoices: async () => {
    set({ loading: true });
    try {
      const data = await financeApi.getInvoices();
      set({ invoices: (data || []) as InvoiceItem[], loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createInvoice: async (data: CreateInvoicePayload) => {
    const result = await financeApi.createInvoice(data);
    await get().fetchInvoices();
    return result as InvoiceItem;
  },

  recordPayment: async (data: CreatePaymentPayload) => {
    await financeApi.recordPayment(data);
    await get().fetchInvoices();
  },

  fetchReports: async (startDate?: string, endDate?: string) => {
    const data = await financeApi.getReports(startDate, endDate);
    set({ report: data });
    return data;
  },

  getInvoiceByIntervention: (interventionId: string) => {
    return get().invoices.find((inv) => inv.intervention_id === interventionId);
  },
}));

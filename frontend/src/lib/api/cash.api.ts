import api from '../api';

export interface OpenCashRegisterPayload {
  opening_amount: number;
  notes?: string;
}

export interface CloseCashRegisterPayload {
  closing_amount: number;
  notes?: string;
}

export interface CreateCashTransactionPayload {
  cash_register_id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description?: string;
  payment_method: 'cash' | 'wave' | 'orange_money';
  reference_id?: string;
  reference_type?: string;
}

export interface UpdateCashTransactionPayload {
  type?: 'income' | 'expense';
  category?: string;
  amount?: number;
  description?: string;
  payment_method?: 'cash' | 'wave' | 'orange_money';
}

export const cashApi = {
  // Registers
  openRegister: (data: OpenCashRegisterPayload) =>
    api.post('/cash/registers/open', data).then((r) => r.data),

  closeRegister: (id: string, data: CloseCashRegisterPayload) =>
    api.post(`/cash/registers/${id}/close`, data).then((r) => r.data),

  getCurrentRegister: () =>
    api.get('/cash/registers/current').then((r) => r.data),

  getAllRegisters: () =>
    api.get('/cash/registers').then((r) => r.data),

  getRegisterBalance: (id: string) =>
    api.get(`/cash/registers/${id}`).then((r) => r.data),

  // Transactions
  createTransaction: (data: CreateCashTransactionPayload) =>
    api.post('/cash/transactions', data).then((r) => r.data),

  getTransactionsByRegister: (registerId: string) =>
    api.get(`/cash/transactions/register/${registerId}`).then((r) => r.data),

  updateTransaction: (id: string, data: UpdateCashTransactionPayload) =>
    api.patch(`/cash/transactions/${id}`, data).then((r) => r.data),

  deleteTransaction: (id: string) =>
    api.delete(`/cash/transactions/${id}`).then((r) => r.data),
};

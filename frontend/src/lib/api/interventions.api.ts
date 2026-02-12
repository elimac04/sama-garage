import api from '../api';

export interface StockItemPayload {
  stock_item_id: string;
  quantity_used: number;
  unit_price_at_time: number;
}

export interface CreateInterventionPayload {
  type: 'diagnostic' | 'repair' | 'maintenance' | 'other';
  vehicle_id: string;
  mechanic_id?: string;
  description: string;
  diagnostic_notes?: string;
  estimated_cost?: number;
  advance_payment?: number;
  remaining_amount?: number;
  stock_items?: StockItemPayload[];
}

export interface UpdateInterventionPayload {
  status?: 'pending' | 'in_progress' | 'completed';
  type?: 'diagnostic' | 'repair' | 'maintenance' | 'other';
  vehicle_id?: string;
  mechanic_id?: string;
  description?: string;
  diagnostic_notes?: string;
  work_done?: string;
  estimated_cost?: number;
  final_cost?: number;
  advance_payment?: number;
  remaining_amount?: number;
  diagnostic_result?: string;
  diagnostic_result_name?: string;
  stock_items?: StockItemPayload[];
}

export const interventionsApi = {
  getAll: (status?: string) =>
    api.get('/interventions', { params: status ? { status } : {} }).then((r) => r.data),

  getOne: (id: string) =>
    api.get(`/interventions/${id}`).then((r) => r.data),

  create: (data: CreateInterventionPayload) =>
    api.post('/interventions', data).then((r) => r.data),

  update: (id: string, data: UpdateInterventionPayload) =>
    api.patch(`/interventions/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/interventions/${id}`).then((r) => r.data),
};

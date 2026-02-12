import api from '../api';
import { StockItem } from '@/types';

export interface CreateStockItemPayload {
  name: string;
  reference?: string;
  category?: string;
  description?: string;
  quantity: number;
  unit_price: number;
  alert_threshold: number;
  photos?: string[];
  audio?: string;
}

export interface UpdateStockItemPayload {
  name?: string;
  reference?: string;
  category?: string;
  description?: string;
  quantity?: number;
  unit_price?: number;
  alert_threshold?: number;
  photos?: string[];
  audio?: string;
}

export const stockApi = {
  getAll: () =>
    api.get<StockItem[]>('/stock').then((r) => r.data),

  getOne: (id: string) =>
    api.get<StockItem>(`/stock/${id}`).then((r) => r.data),

  create: (data: CreateStockItemPayload) =>
    api.post<StockItem>('/stock', data).then((r) => r.data),

  update: (id: string, data: UpdateStockItemPayload) =>
    api.patch<StockItem>(`/stock/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/stock/${id}`).then((r) => r.data),

  getLowStockAlerts: () =>
    api.get<StockItem[]>('/stock/alerts').then((r) => r.data),
};

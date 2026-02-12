import api from '../api';
import { Owner } from '@/types';

export interface CreateOwnerPayload {
  full_name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface UpdateOwnerPayload {
  full_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export const ownersApi = {
  getAll: () =>
    api.get<Owner[]>('/owners').then((r) => r.data),

  getOne: (id: string) =>
    api.get<Owner>(`/owners/${id}`).then((r) => r.data),

  create: (data: CreateOwnerPayload) =>
    api.post<Owner>('/owners', data).then((r) => r.data),

  update: (id: string, data: UpdateOwnerPayload) =>
    api.patch<Owner>(`/owners/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/owners/${id}`).then((r) => r.data),

  search: (query: string) =>
    api.get<Owner[]>(`/owners/search?q=${encodeURIComponent(query)}`).then((r) => r.data),
};

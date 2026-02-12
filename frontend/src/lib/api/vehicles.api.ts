import api from '../api';

export interface CreateVehiclePayload {
  registration_number: string;
  brand: string;
  model: string;
  year?: string;
  color?: string;
  notes?: string;
  owner_name?: string;
  owner_phone?: string;
  owner_id?: string;
  photos?: string[];
  audio_url?: string;
  intervention_type?: string;
  description?: string;
}

export interface UpdateVehiclePayload {
  registration_number?: string;
  brand?: string;
  model?: string;
  year?: string;
  color?: string;
  notes?: string;
  owner_name?: string;
  owner_phone?: string;
  photos?: string[];
  audio_url?: string;
  intervention_type?: string;
  description?: string;
}

export const vehiclesApi = {
  getAll: () =>
    api.get('/vehicles').then((r) => r.data),

  getOne: (id: string) =>
    api.get(`/vehicles/${id}`).then((r) => r.data),

  create: (data: CreateVehiclePayload) =>
    api.post('/vehicles', data).then((r) => r.data),

  update: (id: string, data: UpdateVehiclePayload) =>
    api.patch(`/vehicles/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/vehicles/${id}`).then((r) => r.data),
};

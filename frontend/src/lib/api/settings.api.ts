import api from '../api';
import { GarageSettings } from '@/types';

export interface UpdateSettingsPayload {
  garage_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
}

export const settingsApi = {
  get: () =>
    api.get<GarageSettings>('/settings').then((r) => r.data),

  update: (data: UpdateSettingsPayload) =>
    api.patch<GarageSettings>('/settings', data).then((r) => r.data),
};

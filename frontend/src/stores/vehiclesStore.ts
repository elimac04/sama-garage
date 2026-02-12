import { create } from 'zustand';
import { vehiclesApi } from '@/lib/api/vehicles.api';
import type { CreateVehiclePayload, UpdateVehiclePayload } from '@/lib/api/vehicles.api';

export interface Vehicle {
  id: string;
  registration_number: string;
  color: string;
  brand: string;
  model: string;
  year: number;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  owner_id?: string;
  intervention_type: string;
  description: string;
  photos: string[];
  audioUrl?: string;
  createdAt: string;
}

interface VehiclesStore {
  vehicles: Vehicle[];
  loading: boolean;
  fetchVehicles: () => Promise<void>;
  createVehicle: (data: CreateVehiclePayload) => Promise<Vehicle>;
  updateVehicle: (id: string, data: UpdateVehiclePayload) => Promise<Vehicle>;
  deleteVehicle: (id: string) => Promise<void>;
  getVehicle: (id: string) => Vehicle | undefined;
}

const mapApiVehicle = (v: any): Vehicle => ({
  id: v.id,
  registration_number: v.registration_number,
  color: v.color || '',
  brand: v.brand,
  model: v.model,
  year: v.year ? parseInt(v.year) : 0,
  owner_name: v.owner?.full_name || '',
  owner_phone: v.owner?.phone || '',
  owner_email: v.owner?.email || '',
  owner_id: v.owner_id,
  intervention_type: v.intervention_type || '',
  description: v.description || v.notes || '',
  photos: v.photos || [],
  audioUrl: v.audio_url || '',
  createdAt: v.created_at,
});

export const useVehiclesStore = create<VehiclesStore>((set, get) => ({
  vehicles: [],
  loading: false,

  fetchVehicles: async () => {
    set({ loading: true });
    try {
      const data = await vehiclesApi.getAll();
      set({ vehicles: (data || []).map(mapApiVehicle), loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  createVehicle: async (data) => {
    const result = await vehiclesApi.create(data);
    const vehicle = mapApiVehicle(result);
    set((state) => ({ vehicles: [vehicle, ...state.vehicles] }));
    return vehicle;
  },

  updateVehicle: async (id, data) => {
    const result = await vehiclesApi.update(id, data);
    const vehicle = mapApiVehicle(result);
    set((state) => ({
      vehicles: state.vehicles.map((v) => (v.id === id ? vehicle : v)),
    }));
    return vehicle;
  },

  deleteVehicle: async (id) => {
    await vehiclesApi.delete(id);
    set((state) => ({
      vehicles: state.vehicles.filter((v) => v.id !== id),
    }));
  },

  getVehicle: (id) => {
    return get().vehicles.find((v) => v.id === id);
  },
}));

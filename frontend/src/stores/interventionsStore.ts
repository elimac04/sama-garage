import { create } from 'zustand';
import { interventionsApi, CreateInterventionPayload, UpdateInterventionPayload } from '@/lib/api/interventions.api';

export interface InterventionStockItem {
  id: string;
  articleId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  photo?: string;
}

export interface Intervention {
  id: string;
  vehicleId: string;
  vehicle: string;
  registration: string;
  owner_name: string;
  owner_phone: string;
  description: string;
  type?: 'diagnostic' | 'reparation' | 'entretien' | 'other';
  mechanicId: string;
  mechanicName: string;
  totalAmount: number;
  advancePayment: number;
  remainingAmount: number;
  stockItems?: InterventionStockItem[];
  status: 'pending' | 'in_progress' | 'completed';
  diagnosticResult?: string;
  diagnosticResultName?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface InterventionsStore {
  interventions: Intervention[];
  loading: boolean;
  fetchInterventions: (status?: string) => Promise<void>;
  createIntervention: (data: CreateInterventionPayload) => Promise<void>;
  updateIntervention: (id: string, data: UpdateInterventionPayload) => Promise<void>;
  deleteIntervention: (id: string) => Promise<void>;
  startIntervention: (id: string) => Promise<void>;
  completeIntervention: (id: string, diagnosticResult?: string, diagnosticResultName?: string) => Promise<void>;
  getIntervention: (id: string) => Intervention | undefined;
}

const mapTypeFromApi = (type: string): Intervention['type'] => {
  switch (type) {
    case 'repair': return 'reparation';
    case 'maintenance': return 'entretien';
    case 'diagnostic': return 'diagnostic';
    default: return 'other';
  }
};

const mapApiIntervention = (i: any): Intervention => ({
  id: i.id,
  vehicleId: i.vehicle_id,
  vehicle: i.vehicle ? `${i.vehicle.brand} ${i.vehicle.model}` : '',
  registration: i.vehicle?.registration_number || '',
  owner_name: i.vehicle?.owner?.full_name || '',
  owner_phone: i.vehicle?.owner?.phone || '',
  description: i.description || '',
  type: mapTypeFromApi(i.type),
  mechanicId: i.mechanic_id || '',
  mechanicName: i.mechanic?.full_name || '',
  totalAmount: i.estimated_cost || i.final_cost || 0,
  advancePayment: i.advance_payment || 0,
  remainingAmount: i.remaining_amount || 0,
  stockItems: (i.stock_items || []).map((si: any) => ({
    id: si.id,
    articleId: si.stock_item_id,
    name: si.stock_item?.name || '',
    quantity: si.quantity_used,
    unitPrice: si.unit_price_at_time,
    photo: si.stock_item?.photos?.[0] || undefined,
  })),
  status: i.status,
  diagnosticResult: i.diagnostic_result || undefined,
  diagnosticResultName: i.diagnostic_result_name || undefined,
  createdAt: i.created_at,
  startedAt: i.started_at || undefined,
  completedAt: i.completed_at || undefined,
});

export const useInterventionsStore = create<InterventionsStore>()(
  (set, get) => ({
    interventions: [],
    loading: false,

    fetchInterventions: async (status?: string) => {
      set({ loading: true });
      try {
        const data = await interventionsApi.getAll(status);
        set({ interventions: (data || []).map(mapApiIntervention), loading: false });
      } catch (error) {
        set({ loading: false });
        throw error;
      }
    },

    createIntervention: async (data: CreateInterventionPayload) => {
      await interventionsApi.create(data);
      await get().fetchInterventions();
      window.dispatchEvent(new Event('interventionsUpdated'));
    },

    updateIntervention: async (id: string, data: UpdateInterventionPayload) => {
      await interventionsApi.update(id, data);
      await get().fetchInterventions();
      window.dispatchEvent(new Event('interventionsUpdated'));
    },

    deleteIntervention: async (id: string) => {
      await interventionsApi.delete(id);
      set((state) => ({
        interventions: state.interventions.filter((i) => i.id !== id)
      }));
      window.dispatchEvent(new Event('interventionsUpdated'));
    },

    startIntervention: async (id: string) => {
      await interventionsApi.update(id, { status: 'in_progress' });
      await get().fetchInterventions();
      window.dispatchEvent(new Event('interventionsUpdated'));
    },

    completeIntervention: async (id: string, diagnosticResult?: string, diagnosticResultName?: string) => {
      const updateData: UpdateInterventionPayload = { status: 'completed' };
      if (diagnosticResult) {
        updateData.diagnostic_result = diagnosticResult;
        updateData.diagnostic_result_name = diagnosticResultName;
      }
      await interventionsApi.update(id, updateData);
      await get().fetchInterventions();
      window.dispatchEvent(new Event('interventionsUpdated'));
    },

    getIntervention: (id) => {
      return get().interventions.find((i) => i.id === id);
    },
  })
);

import { create } from 'zustand';
import { authApi } from '@/lib/api/auth.api';

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'mechanic' | 'cashier';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

interface AgentsStore {
  agents: Agent[];
  loading: boolean;
  fetchAgents: () => Promise<void>;
  addAgent: (agent: Agent) => void;
  createAgent: (data: { email: string; full_name: string; role: 'mechanic' | 'cashier'; phone?: string }) => Promise<Agent>;
  updateAgent: (id: string, data: { full_name?: string; email?: string; phone?: string; role?: 'mechanic' | 'cashier' }) => Promise<Agent>;
  deleteAgent: (id: string) => Promise<void>;
  getAgent: (id: string) => Agent | undefined;
  changeAgentStatus: (id: string, status: 'active' | 'inactive') => Promise<void>;
}

const mapUserToAgent = (user: any): Agent => ({
  id: user.id,
  name: user.full_name,
  email: user.email,
  phone: user.phone || '',
  role: user.role,
  status: user.is_active ? 'active' : 'inactive',
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

export const useAgentsStore = create<AgentsStore>()(
  (set, get) => ({
    agents: [],
    loading: false,

    fetchAgents: async () => {
      set({ loading: true });
      try {
        const response = await authApi.getAgents();
        const agents = (response.agents || []).map(mapUserToAgent);
        set({ agents, loading: false });
      } catch (error) {
        set({ loading: false });
        throw error;
      }
    },

    addAgent: (agent) => {
      set((state) => ({
        agents: [agent, ...state.agents]
      }));
      window.dispatchEvent(new Event('agentsUpdated'));
    },

    createAgent: async (data) => {
      const response = await authApi.createAgent(data);
      const agent = mapUserToAgent(response.user);
      set((state) => ({
        agents: [agent, ...state.agents]
      }));
      window.dispatchEvent(new Event('agentsUpdated'));
      return agent;
    },
    
    updateAgent: async (id, data) => {
      const response = await authApi.updateAgent(id, data);
      const agent = mapUserToAgent(response.user);
      set((state) => ({
        agents: state.agents.map((a) => (a.id === id ? agent : a))
      }));
      window.dispatchEvent(new Event('agentsUpdated'));
      return agent;
    },

    deleteAgent: async (id) => {
      await authApi.deleteAgent(id);
      set((state) => ({
        agents: state.agents.filter((a) => a.id !== id)
      }));
      window.dispatchEvent(new Event('agentsUpdated'));
    },
    
    getAgent: (id) => {
      return get().agents.find((a) => a.id === id);
    },
    
    changeAgentStatus: async (id, status) => {
      const response = await authApi.updateAgent(id, { is_active: status === 'active' });
      const agent = mapUserToAgent(response.user);
      set((state) => ({
        agents: state.agents.map((a) => (a.id === id ? agent : a))
      }));
      window.dispatchEvent(new Event('agentsUpdated'));
    },
  })
);

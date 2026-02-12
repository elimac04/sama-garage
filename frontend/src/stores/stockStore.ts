import { create } from 'zustand';
import { stockApi, CreateStockItemPayload, UpdateStockItemPayload } from '@/lib/api/stock.api';

export interface StockArticle {
  id: string;
  name: string;
  reference?: string;
  category: string;
  description?: string;
  quantity: number;
  unit_price: number;
  alert_threshold: number;
  photos: string[];
  audio?: string;
  createdAt: string;
  updatedAt?: string;
}

interface StockStore {
  articles: StockArticle[];
  loading: boolean;
  fetchArticles: () => Promise<void>;
  createArticle: (data: CreateStockItemPayload) => Promise<void>;
  updateArticle: (id: string, data: UpdateStockItemPayload) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  getArticle: (id: string) => StockArticle | undefined;
}

const mapApiStock = (s: any): StockArticle => ({
  id: s.id,
  name: s.name,
  reference: s.reference || undefined,
  category: s.category || '',
  description: s.description || undefined,
  quantity: s.quantity,
  unit_price: Number(s.unit_price),
  alert_threshold: s.alert_threshold,
  photos: s.photos || [],
  audio: s.audio || undefined,
  createdAt: s.created_at,
  updatedAt: s.updated_at,
});

export const useStockStore = create<StockStore>((set, get) => ({
  articles: [],
  loading: false,

  fetchArticles: async () => {
    set({ loading: true });
    try {
      const data = await stockApi.getAll();
      set({ articles: (data || []).map(mapApiStock), loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  createArticle: async (data: CreateStockItemPayload) => {
    await stockApi.create(data);
    await get().fetchArticles();
  },

  updateArticle: async (id: string, data: UpdateStockItemPayload) => {
    await stockApi.update(id, data);
    await get().fetchArticles();
  },

  deleteArticle: async (id: string) => {
    await stockApi.delete(id);
    set((state) => ({
      articles: state.articles.filter((a) => a.id !== id)
    }));
  },

  getArticle: (id) => {
    return get().articles.find((a) => a.id === id);
  },
}));

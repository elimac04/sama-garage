import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cashApi } from '@/lib/api/cash.api';

export interface CashTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  paymentMethod?: 'cash' | 'wave' | 'orange_money' | 'bank_transfer' | 'other';
  reference?: string; // Référence à une facture ou autre
  date: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CashRegister {
  id: string;
  openingBalance: number;
  currentBalance: number;
  openingDate: string;
  closingDate?: string;
  status: 'open' | 'closed';
  transactions: CashTransaction[];
  createdAt: string;
  updatedAt?: string;
}

interface CashStore {
  cashRegisters: CashRegister[];
  currentRegister: CashRegister | null;
  transactions: CashTransaction[];
  loading: boolean;
  
  // API methods
  initCash: () => Promise<void>;
  fetchCurrentRegister: () => Promise<void>;
  fetchAllRegisters: () => Promise<void>;
  openRegisterApi: (openingAmount: number, notes?: string) => Promise<any>;
  closeRegisterApi: (registerId: string, closingAmount: number, notes?: string) => Promise<any>;
  createTransactionApi: (data: any) => Promise<any>;
  updateTransactionApi: (id: string, data: any) => Promise<any>;
  deleteTransactionApi: (id: string) => Promise<void>;
  fetchRegisterBalance: (registerId: string) => Promise<any>;
  
  // Gestion des caisses (local)
  openCashRegister: (openingBalance: number) => void;
  closeCashRegister: (closingBalance: number) => void;
  getCurrentRegister: () => CashRegister | null;
  
  // Gestion des transactions (local)
  addTransaction: (transaction: Omit<CashTransaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, transaction: Partial<CashTransaction>) => void;
  deleteTransaction: (id: string) => void;
  getTransactions: (registerId?: string) => CashTransaction[];
  
  // Calculs
  calculateBalance: (registerId?: string) => number;
  getTodayTransactions: () => CashTransaction[];
  getTotalIncome: (period?: 'today' | 'week' | 'month') => number;
  getTotalExpense: (period?: 'today' | 'week' | 'month') => number;
}

export const useCashStore = create<CashStore>()(
  persist(
    (set, get) => ({
      cashRegisters: [],
      currentRegister: null,
      transactions: [],
      loading: false,

      // ==================== API METHODS ====================
      initCash: async () => {
        set({ loading: true });
        try {
          const regData = await cashApi.getCurrentRegister();
          if (regData) {
            const register: CashRegister = {
              id: regData.id,
              openingBalance: Number(regData.opening_amount),
              currentBalance: Number(regData.opening_amount),
              openingDate: regData.opened_at,
              status: regData.status,
              transactions: [],
              createdAt: regData.created_at,
            };
            set({ currentRegister: register });
            // Charger les transactions de ce registre
            const balanceData = await cashApi.getRegisterBalance(regData.id);
            const txs: CashTransaction[] = (balanceData.transactions || []).map((t: any) => ({
              id: t.id,
              type: t.type,
              amount: Number(t.amount),
              description: t.description || '',
              category: t.category,
              paymentMethod: t.payment_method,
              date: t.created_at,
              createdAt: t.created_at,
            }));
            const balance = balanceData.summary?.balance ?? register.openingBalance;
            set({
              transactions: txs,
              currentRegister: { ...register, currentBalance: balance, transactions: txs },
            });
          } else {
            set({ currentRegister: null, transactions: [] });
          }
        } catch {
          // silencieux
        } finally {
          set({ loading: false });
        }
      },

      fetchCurrentRegister: async () => {
        set({ loading: true });
        try {
          const data = await cashApi.getCurrentRegister();
          if (data) {
            const register: CashRegister = {
              id: data.id,
              openingBalance: Number(data.opening_amount),
              currentBalance: Number(data.opening_amount),
              openingDate: data.opened_at,
              status: data.status,
              transactions: [],
              createdAt: data.created_at,
            };
            set({ currentRegister: register, loading: false });
          } else {
            set({ currentRegister: null, loading: false });
          }
        } catch {
          set({ loading: false });
        }
      },

      fetchAllRegisters: async () => {
        set({ loading: true });
        try {
          const data = await cashApi.getAllRegisters();
          const registers: CashRegister[] = (data || []).map((r: any) => ({
            id: r.id,
            openingBalance: Number(r.opening_amount),
            currentBalance: Number(r.closing_amount || r.opening_amount),
            openingDate: r.opened_at,
            closingDate: r.closed_at,
            status: r.status,
            transactions: [],
            createdAt: r.created_at,
          }));
          set({ cashRegisters: registers, loading: false });
        } catch {
          set({ loading: false });
        }
      },

      openRegisterApi: async (openingAmount, notes) => {
        const data = await cashApi.openRegister({ opening_amount: openingAmount, notes });
        const register: CashRegister = {
          id: data.id,
          openingBalance: Number(data.opening_amount),
          currentBalance: Number(data.opening_amount),
          openingDate: data.opened_at,
          status: 'open',
          transactions: [],
          createdAt: data.created_at,
        };
        set((state) => ({
          currentRegister: register,
          cashRegisters: [...state.cashRegisters, register],
        }));
        return data;
      },

      closeRegisterApi: async (registerId, closingAmount, notes) => {
        const data = await cashApi.closeRegister(registerId, { closing_amount: closingAmount, notes });
        set((state) => ({
          currentRegister: null,
          cashRegisters: state.cashRegisters.map((r) =>
            r.id === registerId ? { ...r, status: 'closed' as const, closingDate: new Date().toISOString(), currentBalance: closingAmount } : r
          ),
        }));
        return data;
      },

      createTransactionApi: async (data) => {
        const result = await cashApi.createTransaction(data);
        const tx: CashTransaction = {
          id: result.id,
          type: result.type,
          amount: Number(result.amount),
          description: result.description || '',
          category: result.category,
          paymentMethod: result.payment_method,
          date: result.created_at,
          createdAt: result.created_at,
        };
        set((state) => ({
          transactions: [...state.transactions, tx],
          currentRegister: state.currentRegister ? {
            ...state.currentRegister,
            currentBalance: state.currentRegister.currentBalance + (tx.type === 'income' ? tx.amount : -tx.amount),
            transactions: [...state.currentRegister.transactions, tx],
          } : null,
        }));
        return result;
      },

      updateTransactionApi: async (id, data) => {
        const result = await cashApi.updateTransaction(id, data);
        const updated: CashTransaction = {
          id: result.id,
          type: result.type,
          amount: Number(result.amount),
          description: result.description || '',
          category: result.category,
          paymentMethod: result.payment_method,
          date: result.created_at,
          createdAt: result.created_at,
          updatedAt: result.updated_at,
        };
        set((state) => ({
          transactions: state.transactions.map((t) => (t.id === id ? updated : t)),
        }));
        return result;
      },

      deleteTransactionApi: async (id) => {
        await cashApi.deleteTransaction(id);
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
      },

      fetchRegisterBalance: async (registerId) => {
        const data = await cashApi.getRegisterBalance(registerId);
        const txs: CashTransaction[] = (data.transactions || []).map((t: any) => ({
          id: t.id,
          type: t.type,
          amount: Number(t.amount),
          description: t.description || '',
          category: t.category,
          paymentMethod: t.payment_method,
          date: t.created_at,
          createdAt: t.created_at,
        }));
        set({ transactions: txs });
        return data.summary;
      },

      // ==================== LOCAL METHODS ====================
      openCashRegister: (openingBalance) => {
        const newRegister: CashRegister = {
          id: Date.now().toString(),
          openingBalance,
          currentBalance: openingBalance,
          openingDate: new Date().toISOString(),
          status: 'open',
          transactions: [],
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          cashRegisters: [...state.cashRegisters, newRegister],
          currentRegister: newRegister,
        }));
      },
      
      closeCashRegister: (closingBalance) => {
        const { currentRegister } = get();
        if (!currentRegister) return;
        
        const updatedRegister: CashRegister = {
          ...currentRegister,
          currentBalance: closingBalance,
          closingDate: new Date().toISOString(),
          status: 'closed',
          updatedAt: new Date().toISOString(),
        };
        
        set((state) => ({
          cashRegisters: state.cashRegisters.map(reg => 
            reg.id === currentRegister.id ? updatedRegister : reg
          ),
          currentRegister: null,
        }));
      },
      
      getCurrentRegister: () => {
        return get().currentRegister;
      },
      
      addTransaction: (transaction) => {
        const newTransaction: CashTransaction = {
          ...transaction,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        
        set((state) => {
          const updatedTransactions = [...state.transactions, newTransaction];
          const currentRegister = state.currentRegister;
          
          // Mettre à jour le solde de la caisse actuelle
          if (currentRegister && currentRegister.status === 'open') {
            const updatedRegister = {
              ...currentRegister,
              currentBalance: currentRegister.currentBalance + 
                (transaction.type === 'income' ? transaction.amount : -transaction.amount),
              transactions: [...currentRegister.transactions, newTransaction],
              updatedAt: new Date().toISOString(),
            };
            
            return {
              transactions: updatedTransactions,
              currentRegister: updatedRegister,
              cashRegisters: state.cashRegisters.map(reg => 
                reg.id === currentRegister.id ? updatedRegister : reg
              ),
            };
          }
          
          return { transactions: updatedTransactions };
        });
      },
      
      updateTransaction: (id, transaction) => {
        set((state) => ({
          transactions: state.transactions.map(t => 
            t.id === id ? { ...t, ...transaction, updatedAt: new Date().toISOString() } : t
          ),
        }));
      },
      
      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter(t => t.id !== id),
        }));
      },
      
      getTransactions: (registerId) => {
        const { transactions } = get();
        if (registerId) {
          return transactions.filter(t => t.reference === registerId);
        }
        return transactions;
      },
      
      calculateBalance: (registerId) => {
        const { transactions } = get();
        const filteredTransactions = registerId 
          ? transactions.filter(t => t.reference === registerId)
          : transactions;
        
        return filteredTransactions.reduce((balance, transaction) => {
          return balance + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
        }, 0);
      },
      
      getTodayTransactions: () => {
        const { transactions } = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return transactions.filter(t => {
          const transactionDate = new Date(t.date);
          const transactionDay = new Date(transactionDate);
          transactionDay.setHours(0, 0, 0, 0);
          return transactionDay.getTime() === today.getTime();
        });
      },
      
      getTotalIncome: (period = 'today') => {
        const { transactions } = get();
        const now = new Date();
        
        return transactions
          .filter(t => t.type === 'income')
          .filter(t => {
            if (period === 'today') {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const transactionDate = new Date(t.date);
              const transactionDay = new Date(transactionDate);
              transactionDay.setHours(0, 0, 0, 0);
              return transactionDay.getTime() === today.getTime();
            } else if (period === 'week') {
              const weekAgo = new Date(now);
              weekAgo.setDate(now.getDate() - 7);
              return new Date(t.date) >= weekAgo;
            } else if (period === 'month') {
              const monthAgo = new Date(now);
              monthAgo.setMonth(now.getMonth() - 1);
              return new Date(t.date) >= monthAgo;
            }
            return true;
          })
          .reduce((sum, t) => sum + t.amount, 0);
      },
      
      getTotalExpense: (period = 'today') => {
        const { transactions } = get();
        const now = new Date();
        
        return transactions
          .filter(t => t.type === 'expense')
          .filter(t => {
            if (period === 'today') {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const transactionDate = new Date(t.date);
              const transactionDay = new Date(transactionDate);
              transactionDay.setHours(0, 0, 0, 0);
              return transactionDay.getTime() === today.getTime();
            } else if (period === 'week') {
              const weekAgo = new Date(now);
              weekAgo.setDate(now.getDate() - 7);
              return new Date(t.date) >= weekAgo;
            } else if (period === 'month') {
              const monthAgo = new Date(now);
              monthAgo.setMonth(now.getMonth() - 1);
              return new Date(t.date) >= monthAgo;
            }
            return true;
          })
          .reduce((sum, t) => sum + t.amount, 0);
      },
    }),
    {
      name: 'cash-storage',
    }
  )
);

import { useState, useMemo, useEffect } from 'react';
import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Eye, 
  Calendar,
  Smartphone,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal, Input, Select } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useCashStore, CashTransaction } from '@/stores/cashStore';
import { useToast } from '@/stores/toastStore';

const CashPage = () => {
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCloseRegisterModal, setShowCloseRegisterModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<CashTransaction | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Form state pour les transactions
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    amount: '',
    description: '',
    category: '',
    paymentMethod: 'cash' as 'cash' | 'wave' | 'orange_money',
    reference: '',
  });
  
  const { 
    currentRegister, 
    transactions,
    loading,
    initCash,
    openRegisterApi,
    closeRegisterApi,
    createTransactionApi,
    deleteTransactionApi,
    getTotalIncome,
    getTotalExpense,
    getTodayTransactions
  } = useCashStore();
  
  const toast = useToast();

  // Fetch initial data
  useEffect(() => {
    initCash().catch(() => {});
  }, [initCash]);

  // Catégories de transactions
  const incomeCategories = [
    'Vente de pièces',
    'Service de réparation',
    'Main d\'œuvre',
    'Autres revenus',
  ];
  
  const expenseCategories = [
    'Achat de pièces',
    'Salaires',
    'Loyer',
    'Électricité',
    'Eau',
    'Téléphone',
    'Carburant',
    'Fournitures',
    'Maintenance',
    'Autres dépenses',
  ];

  // Méthodes de paiement
  const paymentMethods = [
    { value: 'cash', label: '💵 Espèces', icon: TrendingUp },
    { value: 'wave', label: '📱 Wave', icon: Smartphone },
    { value: 'orange_money', label: '🍊 Orange Money', icon: Smartphone },
  ];

  // Filtrer les transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    
    // Filtrer par période
    const now = new Date();
    if (filterPeriod === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        const transactionDay = new Date(transactionDate);
        transactionDay.setHours(0, 0, 0, 0);
        return transactionDay.getTime() === today.getTime();
      });
    } else if (filterPeriod === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      filtered = filtered.filter(t => new Date(t.date) >= weekAgo);
    } else if (filterPeriod === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      filtered = filtered.filter(t => new Date(t.date) >= monthAgo);
    }
    
    // Filtrer par type
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }
    
    // Filtrer par recherche
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.reference?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, filterPeriod, searchQuery]);

  // Calculer les statistiques
  const stats = useMemo(() => {
    const totalIncome = getTotalIncome(filterPeriod);
    const totalExpense = getTotalExpense(filterPeriod);
    const netBalance = totalIncome - totalExpense;
    const todayTransactions = getTodayTransactions();
    
    return {
      totalIncome,
      totalExpense,
      netBalance,
      transactionCount: filteredTransactions.length,
      todayTransactionCount: todayTransactions.length,
    };
  }, [getTotalIncome, getTotalExpense, filteredTransactions, getTodayTransactions, filterPeriod]);

  // Ouvrir la caisse
  const handleOpenRegister = async () => {
    if (!openingBalance || parseFloat(openingBalance) < 0) {
      toast.error('Veuillez entrer un montant de caisse valide');
      return;
    }
    setSubmitting(true);
    try {
      await openRegisterApi(parseFloat(openingBalance));
      setShowRegisterModal(false);
      setOpeningBalance('');
      toast.success('Caisse ouverte avec succès !');
    } catch (error: any) {
      const msg = error.response?.data?.message;
      toast.error(typeof msg === 'string' ? msg : 'Erreur lors de l\'ouverture de la caisse');
    } finally {
      setSubmitting(false);
    }
  };

  // Fermer la caisse
  const handleCloseRegister = async () => {
    if (!closingBalance || parseFloat(closingBalance) < 0) {
      toast.error('Veuillez entrer un montant de fermeture valide');
      return;
    }
    if (!currentRegister) return;
    setSubmitting(true);
    try {
      await closeRegisterApi(currentRegister.id, parseFloat(closingBalance));
      setShowCloseRegisterModal(false);
      setClosingBalance('');
      toast.success('Caisse fermée avec succès !');
    } catch (error: any) {
      const msg = error.response?.data?.message;
      toast.error(typeof msg === 'string' ? msg : 'Erreur lors de la fermeture de la caisse');
    } finally {
      setSubmitting(false);
    }
  };

  // Ajouter une transaction
  const handleAddTransaction = async () => {
    if (!formData.amount || !formData.description || !formData.category) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (!currentRegister) {
      toast.error('La caisse doit être ouverte pour ajouter une transaction');
      return;
    }
    
    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      toast.error('Le montant doit être supérieur à 0');
      return;
    }
    
    setSubmitting(true);
    try {
      await createTransactionApi({
        cash_register_id: currentRegister.id,
        type: formData.type,
        category: formData.category,
        amount,
        description: formData.description,
        payment_method: formData.paymentMethod,
        reference_id: undefined,
        reference_type: undefined,
      });
      
      setShowTransactionModal(false);
      setFormData({
        type: 'income',
        amount: '',
        description: '',
        category: '',
        paymentMethod: 'cash',
        reference: '',
      });
      
      toast.success(`${formData.type === 'income' ? 'Entrée' : 'Sortie'} de ${formatCurrency(amount)} enregistrée !`);
    } catch (error: any) {
      const msg = error.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Erreur lors de l\'ajout de la transaction');
    } finally {
      setSubmitting(false);
    }
  };

  // Supprimer une transaction
  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      try {
        await deleteTransactionApi(id);
        toast.success('Transaction supprimée avec succès !');
      } catch {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  // Voir les détails
  const handleViewDetails = (transaction: CashTransaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  if (loading && transactions.length === 0 && !currentRegister) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion de Caisse</h1>
          <p className="text-gray-600 mt-1">Suivi des entrées et sorties d'argent</p>
        </div>
        <div className="flex gap-2">
          {!currentRegister && (
            <Button onClick={() => setShowRegisterModal(true)} className="bg-green-600 hover:bg-green-700">
              <TrendingUp className="h-5 w-5 mr-2" />
              Ouvrir la caisse
            </Button>
          )}
          {currentRegister && (
            <Button onClick={() => setShowCloseRegisterModal(true)} variant="secondary">
              <TrendingDown className="h-5 w-5 mr-2" />
              Fermer la caisse
            </Button>
          )}
          <Button onClick={() => setShowTransactionModal(true)}>
            <Plus className="h-5 w-5 mr-2" />
              Nouvelle transaction
          </Button>
        </div>
      </div>

      {/* État de la caisse */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                État de la caisse {currentRegister ? '(Ouverte)' : '(Fermée)'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Solde actuel</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(currentRegister?.currentBalance || 0)}
                  </p>
                </div>
                {currentRegister && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Ouverture</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(currentRegister.openingBalance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date d'ouverture</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(currentRegister.openingDate)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              currentRegister ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <TrendingUp className={`h-8 w-8 ${
                currentRegister ? 'text-green-600' : 'text-gray-400'
              }`} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total entrées</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalIncome)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {filterPeriod === 'today' ? "Aujourd'hui" : filterPeriod === 'week' ? 'Cette semaine' : 'Ce mois'}
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total sorties</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalExpense)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {filterPeriod === 'today' ? "Aujourd'hui" : filterPeriod === 'week' ? 'Cette semaine' : 'Ce mois'}
                </p>
              </div>
              <div className="bg-red-500 p-3 rounded-xl">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Solde net</p>
                <p className={`text-2xl font-bold ${
                  stats.netBalance >= 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {formatCurrency(stats.netBalance)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.netBalance >= 0 ? 'Positif' : 'Négatif'}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${
                stats.netBalance >= 0 ? 'bg-blue-500' : 'bg-red-500'
              }`}>
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.transactionCount}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.todayTransactionCount} aujourd'hui
                </p>
              </div>
              <div className="bg-purple-500 p-3 rounded-xl">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recherche
              </label>
              <Input
                type="text"
                placeholder="Rechercher par description, catégorie ou référence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                options={[
                  { value: 'all', label: 'Toutes les transactions' },
                  { value: 'income', label: 'Entrées uniquement' },
                  { value: 'expense', label: 'Sorties uniquement' },
                ]}
              />
            </div>
            <div className="lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Période
              </label>
              <Select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value as any)}
                options={[
                  { value: 'today', label: "Aujourd'hui" },
                  { value: 'week', label: 'Cette semaine' },
                  { value: 'month', label: 'Ce mois' },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucune transaction trouvée</p>
              <Button onClick={() => setShowTransactionModal(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une transaction
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => {
                const paymentMethod = paymentMethods.find(pm => pm.value === transaction.paymentMethod);
                const Icon = paymentMethod?.icon || MoreHorizontal;
                
                return (
                  <div 
                    key={transaction.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <Icon className={`h-6 w-6 ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {transaction.description}
                            </h3>
                            <Badge 
                              variant={transaction.type === 'income' ? 'success' : 'danger'}
                              className="text-xs"
                            >
                              {transaction.type === 'income' ? 'Entrée' : 'Sortie'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{transaction.category}</span>
                            {transaction.reference && (
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                Réf: {transaction.reference}
                              </span>
                            )}
                            <span>{formatDate(transaction.date)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        <div className="flex gap-1 mt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(transaction)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Ouvrir caisse */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => {
          setShowRegisterModal(false);
          setOpeningBalance('');
        }}
        title="Ouvrir la caisse"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowRegisterModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleOpenRegister} disabled={submitting} className="bg-green-600 hover:bg-green-700">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <TrendingUp className="h-4 w-4 mr-1" />}
              {submitting ? 'Ouverture...' : 'Ouvrir la caisse'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Montant d'ouverture (FCFA)"
            type="number"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            placeholder="Entrez le montant initial"
            required
            min="0"
            step="100"
          />
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Important:</strong> Ce montant représente le cash disponible dans la caisse au moment de l'ouverture.
            </p>
          </div>
        </div>
      </Modal>

      {/* Modal Fermer caisse */}
      <Modal
        isOpen={showCloseRegisterModal}
        onClose={() => {
          setShowCloseRegisterModal(false);
          setClosingBalance('');
        }}
        title="Fermer la caisse"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCloseRegisterModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleCloseRegister} disabled={submitting} className="bg-red-600 hover:bg-red-700">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              {submitting ? 'Fermeture...' : 'Fermer la caisse'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Résumé de la journée</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Solde d'ouverture:</span>
                <span className="font-bold">{formatCurrency(currentRegister?.openingBalance || 0)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Total entrées:</span>
                <span className="font-bold">{formatCurrency(stats.totalIncome)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Total sorties:</span>
                <span className="font-bold">{formatCurrency(stats.totalExpense)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Solde théorique:</span>
                <span>{formatCurrency((currentRegister?.openingBalance || 0) + stats.totalIncome - stats.totalExpense)}</span>
              </div>
            </div>
          </div>
          
          <Input
            label="Montant réel en caisse (FCFA)"
            type="number"
            value={closingBalance}
            onChange={(e) => setClosingBalance(e.target.value)}
            placeholder="Entrez le montant réel"
            required
            min="0"
            step="100"
          />
          
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-900">
              <strong>Attention:</strong> Vérifiez bien le montant réel en caisse avant de valider.
            </p>
          </div>
        </div>
      </Modal>

      {/* Modal Transaction */}
      <Modal
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setFormData({
            type: 'income',
            amount: '',
            description: '',
            category: '',
            paymentMethod: 'cash',
            reference: '',
          });
        }}
        title="Nouvelle transaction"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowTransactionModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddTransaction} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type de transaction"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
              options={[
                { value: 'income', label: '💰 Entrée d\'argent' },
                { value: 'expense', label: '💸 Sortie d\'argent' },
              ]}
              required
            />
            <Input
              label="Montant (FCFA)"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0"
              required
              min="0"
              step="100"
            />
          </div>

          <Select
            label="Catégorie"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { value: '', label: 'Sélectionner une catégorie' },
              ...(formData.type === 'income' 
                ? incomeCategories.map(cat => ({ value: cat, label: cat }))
                : expenseCategories.map(cat => ({ value: cat, label: cat }))
              )
            ]}
            required
          />

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description de la transaction"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Méthode de paiement"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
              options={paymentMethods}
            />
            <Input
              label="Référence (optionnel)"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="Numéro de facture, etc."
            />
          </div>
        </div>
      </Modal>

      {/* Modal Détails */}
      {showDetailsModal && selectedTransaction && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedTransaction(null);
          }}
          title="Détails de la transaction"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                selectedTransaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {paymentMethods.find(pm => pm.value === selectedTransaction.paymentMethod)?.icon && 
                  React.createElement(paymentMethods.find(pm => pm.value === selectedTransaction.paymentMethod)!.icon, {
                    className: `h-8 w-8 ${selectedTransaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`
                  })
                }
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedTransaction.description}</h3>
                <Badge 
                  variant={selectedTransaction.type === 'income' ? 'success' : 'danger'}
                >
                  {selectedTransaction.type === 'income' ? 'Entrée' : 'Sortie'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Montant</p>
                <p className={`text-xl font-bold ${
                  selectedTransaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedTransaction.type === 'income' ? '+' : '-'}{formatCurrency(selectedTransaction.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Catégorie</p>
                <p className="font-semibold text-gray-900">{selectedTransaction.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Méthode de paiement</p>
                <p className="font-semibold text-gray-900">
                  {paymentMethods.find(pm => pm.value === selectedTransaction.paymentMethod)?.label}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-semibold text-gray-900">{formatDate(selectedTransaction.date)}</p>
              </div>
            </div>

            {selectedTransaction.reference && (
              <div>
                <p className="text-sm text-gray-500">Référence</p>
                <p className="font-semibold text-gray-900">{selectedTransaction.reference}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CashPage;

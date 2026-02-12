import { useState, useEffect } from 'react';
import { Wrench, Plus, Calendar, User, DollarSign, CheckCircle, Edit2, Trash2, Eye, Play, Package, X, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, Button, Badge, Modal, Input, Select } from '@/components/ui';
import { formatCurrency, getStatusLabel } from '@/lib/utils';
import { useVehiclesStore, Vehicle } from '@/stores/vehiclesStore';
import { useStockStore, StockArticle } from '@/stores/stockStore';
import { useInterventionsStore, Intervention } from '@/stores/interventionsStore';
import { useAgentsStore } from '@/stores/agentsStore';
import { useToast } from '@/stores/toastStore';
import { stockCategories } from '@/data/stockData';

interface StockItem {
  id: string;
  articleId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  photo?: string;
}

const mapTypeToApi = (type: string): 'diagnostic' | 'repair' | 'maintenance' | 'other' => {
  switch (type) {
    case 'reparation': return 'repair';
    case 'entretien': return 'maintenance';
    case 'diagnostic': return 'diagnostic';
    default: return 'other';
  }
};

const InterventionsPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { vehicles, fetchVehicles } = useVehiclesStore();
  const { articles: stockArticles, fetchArticles } = useStockStore();
  const { 
    interventions,
    loading,
    fetchInterventions,
    createIntervention,
    updateIntervention, 
    deleteIntervention, 
    startIntervention, 
    completeIntervention 
  } = useInterventionsStore();
  const { agents, fetchAgents } = useAgentsStore();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  
  // Mécaniciens actifs
  const mechanicAgents = agents.filter(a => a.role === 'mechanic' && a.status === 'active');
  
  // État pour la sélection d'articles du stock
  const [showStockSelection, setShowStockSelection] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Form state
  const [editingIntervention, setEditingIntervention] = useState<Intervention | null>(null);
  const [selectedInterventionForDetails, setSelectedInterventionForDetails] = useState<Intervention | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedMechanicId, setSelectedMechanicId] = useState('');
  const [interventionType, setInterventionType] = useState<'diagnostic' | 'reparation' | 'entretien' | 'other'>('other');
  const [laborCost, setLaborCost] = useState('');
  const [advancePayment, setAdvancePayment] = useState('');
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [description, setDescription] = useState('');
  
  // États pour le modal de complétion et upload PDF
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [interventionToComplete, setInterventionToComplete] = useState<Intervention | null>(null);
  const [diagnosticPdfFile, setDiagnosticPdfFile] = useState<File | null>(null);
  const [diagnosticPdfBase64, setDiagnosticPdfBase64] = useState<string>('');

  // Fetch initial data
  useEffect(() => {
    fetchInterventions().catch(() => {});
    fetchVehicles().catch(() => {});
    fetchAgents().catch(() => {});
    fetchArticles().catch(() => {});
  }, [fetchInterventions, fetchVehicles, fetchAgents, fetchArticles]);
  
  // Calcul automatique des montants
  const stockItemsTotal = stockItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalAmount = (parseFloat(laborCost) || 0) + stockItemsTotal;

  useEffect(() => {
    const advance = parseFloat(advancePayment) || 0;
    setRemainingAmount(totalAmount - advance);
  }, [totalAmount, advancePayment]);
  
  // Quand on sélectionne un véhicule, charger ses infos
  useEffect(() => {
    if (selectedVehicleId) {
      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      setSelectedVehicle(vehicle || null);
    } else {
      setSelectedVehicle(null);
    }
  }, [selectedVehicleId, vehicles]);
  
  // Fonction pour créer ou modifier une intervention
  const handleSubmitIntervention = async () => {
    if (!selectedVehicle || !selectedMechanicId || !laborCost) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);
    
    const apiStockItems = stockItems.length > 0
      ? stockItems.map(item => ({
          stock_item_id: item.articleId,
          quantity_used: item.quantity,
          unit_price_at_time: item.unitPrice,
        }))
      : undefined;
    
    try {
      if (editingIntervention) {
        await updateIntervention(editingIntervention.id, {
          vehicle_id: selectedVehicle.id,
          mechanic_id: selectedMechanicId,
          type: mapTypeToApi(interventionType),
          description: description || selectedVehicle.description || '',
          estimated_cost: totalAmount,
          advance_payment: parseFloat(advancePayment) || 0,
          remaining_amount: remainingAmount,
          stock_items: apiStockItems,
        });
        toast.success('Intervention modifiée avec succès');
      } else {
        await createIntervention({
          vehicle_id: selectedVehicle.id,
          mechanic_id: selectedMechanicId,
          type: mapTypeToApi(interventionType),
          description: description || selectedVehicle.description || 'Intervention',
          estimated_cost: totalAmount,
          advance_payment: parseFloat(advancePayment) || 0,
          remaining_amount: remainingAmount,
          stock_items: apiStockItems,
        });
        toast.success('Intervention créée avec succès');
      }
      // Rafraîchir le stock si des articles ont été utilisés
      if (stockItems.length > 0) {
        fetchArticles().catch(() => {});
      }
      handleCloseModal();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Erreur lors de l\'opération');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingIntervention(null);
    setSelectedVehicleId('');
    setSelectedVehicle(null);
    setSelectedMechanicId('');
    setInterventionType('other');
    setLaborCost('');
    setAdvancePayment('');
    setRemainingAmount(0);
    setStockItems([]);
    setDescription('');
  };
  
  const handleEditIntervention = (intervention: Intervention) => {
    setEditingIntervention(intervention);
    setSelectedVehicleId(intervention.vehicleId);
    setSelectedMechanicId(intervention.mechanicId);
    setInterventionType(intervention.type || 'other');
    const existingStockItems = intervention.stockItems || [];
    const existingStockTotal = existingStockItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const existingLaborCost = Math.max(0, intervention.totalAmount - existingStockTotal);
    setLaborCost(existingLaborCost > 0 ? existingLaborCost.toString() : '');
    setAdvancePayment(intervention.advancePayment.toString());
    setStockItems(existingStockItems);
    setDescription(intervention.description || '');
    setShowModal(true);
  };
  
  const handleDeleteIntervention = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette intervention ?')) {
      try {
        await deleteIntervention(id);
        // Rafraîchir le stock (le backend peut restaurer les quantités)
        fetchArticles().catch(() => {});
        toast.success('Intervention supprimée');
      } catch {
        toast.error('Erreur lors de la suppression');
      }
    }
  };
  
  const handleStartIntervention = async (id: string) => {
    try {
      await startIntervention(id);
      toast.success('Intervention démarrée');
    } catch {
      toast.error('Erreur lors du démarrage');
    }
  };
  
  const handleCompleteIntervention = (id: string) => {
    const intervention = interventions.find(i => i.id === id);
    if (intervention?.type === 'diagnostic') {
      setInterventionToComplete(intervention);
      setShowCompleteModal(true);
    } else {
      completeIntervention(id)
        .then(() => toast.success('Intervention terminée'))
        .catch(() => toast.error('Erreur lors de la complétion'));
    }
  };
  
  // Gérer l'upload du fichier PDF
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setDiagnosticPdfFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setDiagnosticPdfBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast.error('Veuillez sélectionner un fichier PDF valide');
    }
  };
  
  // Confirmer la complétion avec le PDF
  const confirmCompleteWithDiagnostic = async () => {
    if (!interventionToComplete) return;
    
    if (!diagnosticPdfBase64) {
      toast.error('Veuillez joindre le résultat du diagnostic en PDF');
      return;
    }
    
    try {
      await completeIntervention(
        interventionToComplete.id,
        diagnosticPdfBase64,
        diagnosticPdfFile?.name
      );
      toast.success('Diagnostic terminé avec succès');
    } catch {
      toast.error('Erreur lors de la complétion');
    }
    
    setShowCompleteModal(false);
    setInterventionToComplete(null);
    setDiagnosticPdfFile(null);
    setDiagnosticPdfBase64('');
  };
  
  const handleViewDetails = (intervention: Intervention) => {
    setSelectedInterventionForDetails(intervention);
    setShowDetailsModal(true);
  };
  
  const handleAddStockItem = () => {
    setShowStockSelection(true);
  };
  
  const handleSelectStockArticle = (article: StockArticle) => {
    if (stockItems.some(item => item.articleId === article.id)) {
      return;
    }
    
    const newItem: StockItem = {
      id: Date.now().toString(),
      articleId: article.id,
      name: article.name,
      quantity: 1,
      unitPrice: article.unit_price,
      photo: article.photos && article.photos.length > 0 ? article.photos[0] : undefined
    };
    
    setStockItems([...stockItems, newItem]);
  };
  
  const handleRemoveStockItem = (id: string) => {
    setStockItems(stockItems.filter(item => item.id !== id));
  };
  
  const handleUpdateStockItem = (id: string, field: keyof StockItem, value: string | number) => {
    setStockItems(stockItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const filteredInterventions = filterStatus === 'all' 
    ? interventions 
    : interventions.filter(i => i.status === filterStatus);

  const stats = [
    { label: 'Total', count: interventions.length, color: 'bg-blue-500' },
    { label: 'En attente', count: interventions.filter(i => i.status === 'pending').length, color: 'bg-yellow-500' },
    { label: 'En cours', count: interventions.filter(i => i.status === 'in_progress').length, color: 'bg-orange-500' },
    { label: 'Terminées', count: interventions.filter(i => i.status === 'completed').length, color: 'bg-green-500' },
  ];

  if (loading && interventions.length === 0) {
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Interventions</h1>
          <p className="text-gray-600 mt-1">Gérer les interventions et réparations</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Nouvelle intervention
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.count}</p>
                </div>
                <div className={`${stat.color} w-3 h-3 rounded-full`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filtrer par statut:</span>
            {[
              { value: 'all', label: 'Tous' },
              { value: 'pending', label: 'En attente' },
              { value: 'in_progress', label: 'En cours' },
              { value: 'completed', label: 'Terminées' },
            ].map((filter) => (
              <Button
                key={filter.value}
                size="sm"
                variant={filterStatus === filter.value ? 'primary' : 'secondary'}
                onClick={() => setFilterStatus(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Liste des interventions */}
      <div className="grid grid-cols-1 gap-4">
        {filteredInterventions.map((intervention) => (
          <Card key={intervention.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Icône et info véhicule */}
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    intervention.status === 'completed' ? 'bg-green-100' :
                    intervention.status === 'in_progress' ? 'bg-orange-100' : 'bg-yellow-100'
                  }`}>
                    <Wrench className={`h-6 w-6 ${
                      intervention.status === 'completed' ? 'text-green-600' :
                      intervention.status === 'in_progress' ? 'text-orange-600' : 'text-yellow-600'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {intervention.vehicle}
                          <span className="ml-2 text-sm font-mono text-gray-500">
                            {intervention.registration}
                          </span>
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{intervention.description}</p>
                      </div>
                      <Badge 
                        variant={
                          intervention.status === 'completed' ? 'success' :
                          intervention.status === 'in_progress' ? 'info' : 'warning'
                        }
                      >
                        {getStatusLabel(intervention.status)}
                      </Badge>
                    </div>

                    {/* Détails */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-3">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{intervention.mechanicName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(intervention.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Total: {formatCurrency(intervention.totalAmount)}</span>
                      </div>
                      {intervention.remainingAmount > 0 && (
                        <div className="flex items-center gap-1 text-orange-600 font-medium">
                          <span>Reste: {formatCurrency(intervention.remainingAmount)}</span>
                        </div>
                      )}
                      {intervention.remainingAmount === 0 && (
                        <div className="flex items-center gap-1 text-green-600 font-medium">
                          <CheckCircle className="h-4 w-4" />
                          <span>Payé</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap lg:flex-col gap-2">
                  {intervention.status === 'pending' && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleStartIntervention(intervention.id)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      title="Démarrer l'intervention"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  {intervention.status === 'in_progress' && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleCompleteIntervention(intervention.id)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      title="Terminer l'intervention"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleViewDetails(intervention)}
                    title="Voir les détails"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleEditIntervention(intervention)}
                    title="Modifier"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleDeleteIntervention(intervention.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de création */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingIntervention ? 'Modifier l\'intervention' : 'Nouvelle intervention'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>
              Annuler
            </Button>
            <Button onClick={handleSubmitIntervention} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingIntervention ? 'Modifier l\'intervention' : 'Créer l\'intervention'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Sélection du véhicule */}
          <Select
            label="Sélectionner un véhicule"
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            options={[
              { value: '', label: 'Choisir un véhicule' },
              ...vehicles.map(v => ({
                value: v.id,
                label: `${v.brand} ${v.model} - ${v.registration_number}`
              }))
            ]}
            required
          />
          
          {/* Informations du véhicule sélectionné */}
          {selectedVehicle && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <h4 className="font-semibold text-gray-900 mb-3">Informations du véhicule</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Marque:</span>
                  <p className="font-medium text-gray-900">{selectedVehicle.brand}</p>
                </div>
                <div>
                  <span className="text-gray-600">Modèle:</span>
                  <p className="font-medium text-gray-900">{selectedVehicle.model}</p>
                </div>
                <div>
                  <span className="text-gray-600">Année:</span>
                  <p className="font-medium text-gray-900">{selectedVehicle.year}</p>
                </div>
                <div>
                  <span className="text-gray-600">Couleur:</span>
                  <p className="font-medium text-gray-900">{selectedVehicle.color}</p>
                </div>
                <div>
                  <span className="text-gray-600">Propriétaire:</span>
                  <p className="font-medium text-gray-900">{selectedVehicle.owner_name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Téléphone:</span>
                  <p className="font-medium text-gray-900">{selectedVehicle.owner_phone}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Type d'intervention demandé:</span>
                  <p className="font-medium text-gray-900">{selectedVehicle.intervention_type}</p>
                </div>
                {selectedVehicle.description && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Description du problème:</span>
                    <p className="font-medium text-gray-900">{selectedVehicle.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Type d'intervention */}
          <Select
            label="Type d'intervention"
            value={interventionType}
            onChange={(e) => setInterventionType(e.target.value as any)}
            options={[
              { value: 'diagnostic', label: '🔍 Diagnostic' },
              { value: 'reparation', label: '🔧 Réparation' },
              { value: 'entretien', label: '⚙️ Entretien' },
              { value: 'other', label: '📋 Autre' },
            ]}
            required
          />

          {/* Sélection du mécanicien */}
          <Select
            label="Sélectionner un mécanicien"
            value={selectedMechanicId}
            onChange={(e) => setSelectedMechanicId(e.target.value)}
            options={[
              { value: '', label: 'Choisir un mécanicien' },
              ...mechanicAgents.map(m => ({
                value: m.id,
                label: m.name
              }))
            ]}
            required
          />

          {/* Description */}
          <Input
            label="Description de l'intervention"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez le problème ou l'intervention..."
          />

          {/* Main d'oeuvre */}
          <Input
            label="Main d'oeuvre (FCFA) *"
            type="number"
            value={laborCost}
            onChange={(e) => setLaborCost(e.target.value)}
            placeholder="100000"
            required
          />

          {/* Récapitulatif montants */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Main d'oeuvre:</span>
              <span className="font-medium text-gray-900">{formatCurrency(parseFloat(laborCost) || 0)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Pièces / Stock utilisé:</span>
              <span className="font-medium text-gray-900">{formatCurrency(stockItemsTotal)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-300">
              <span className="font-semibold text-gray-900">Total intervention:</span>
              <span className="text-xl font-bold text-primary-700">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Acompte reçu */}
          <Input
            label="Acompte reçu (FCFA)"
            type="number"
            value={advancePayment}
            onChange={(e) => setAdvancePayment(e.target.value)}
            placeholder="50000"
          />

          {/* Montant restant (calculé automatiquement) */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">Montant restant à payer:</span>
              <span className="text-xl font-bold text-blue-900">
                {formatCurrency(remainingAmount)}
              </span>
            </div>
            {remainingAmount < 0 && (
              <p className="text-xs text-red-600 mt-2">⚠️ L'acompte ne peut pas être supérieur au montant total</p>
            )}
          </div>

          {/* Articles du stock utilisés */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary-600" />
                Articles du stock utilisés
              </h4>
              <Button size="sm" variant="secondary" onClick={handleAddStockItem}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter depuis le stock
              </Button>
            </div>
            
            {/* Sélection d'articles */}
            {showStockSelection && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">Sélectionner un article</h5>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowStockSelection(false);
                      setSelectedCategory('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Sélection de catégorie */}
                <Select
                  label="Catégorie"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  options={[
                    { value: '', label: 'Choisir une catégorie' },
                    ...stockCategories.map(cat => ({ value: cat, label: cat }))
                  ]}
                  className="mb-4"
                />
                
                {/* Affichage des articles avec photos */}
                {selectedCategory && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-h-64 sm:max-h-96 overflow-y-auto">
                    {stockArticles
                      .filter(article => article.category === selectedCategory)
                      .map(article => (
                        <button
                          key={article.id}
                          type="button"
                          onClick={() => {
                            handleSelectStockArticle(article);
                            setShowStockSelection(false);
                            setSelectedCategory('');
                          }}
                          className={`p-2 rounded-lg border-2 transition-all hover:border-primary-500 hover:shadow-md ${
                            stockItems.some(item => item.articleId === article.id)
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 bg-white'
                          }`}
                          disabled={stockItems.some(item => item.articleId === article.id)}
                        >
                          {/* Photo */}
                          {article.photos && article.photos.length > 0 ? (
                            <img
                              src={article.photos[0]}
                              alt={article.name}
                              className="w-full h-24 object-cover rounded mb-2"
                            />
                          ) : (
                            <div className="w-full h-24 bg-gray-100 rounded mb-2 flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          
                          {/* Nom et prix */}
                          <p className="text-sm font-medium text-gray-900 truncate">{article.name}</p>
                          <p className="text-xs text-gray-600">{formatCurrency(article.unit_price)}</p>
                          <p className="text-xs text-gray-500">Stock: {article.quantity}</p>
                          
                          {stockItems.some(item => item.articleId === article.id) && (
                            <p className="text-xs text-green-600 font-medium mt-1">✓ Ajouté</p>
                          )}
                        </button>
                      ))}
                  </div>
                )}
                
                {selectedCategory && stockArticles.filter(a => a.category === selectedCategory).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">Aucun article dans cette catégorie</p>
                )}
              </div>
            )}
            
            {/* Liste des articles ajoutés */}
            {stockItems.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Aucun article ajouté</p>
            ) : (
              <div className="space-y-3">
                {stockItems.map((item) => (
                  <div key={item.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    {item.photo ? (
                      <img
                        src={item.photo}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-600">{formatCurrency(item.unitPrice)} / unité</p>
                    </div>
                    
                    <Input
                      type="number"
                      placeholder="Qté"
                      value={item.quantity}
                      onChange={(e) => handleUpdateStockItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-20"
                      min="1"
                    />
                    
                    <div className="w-24 text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </p>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveStockItem(item.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {/* Total des articles */}
                <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-primary-900">Total articles du stock:</span>
                    <span className="font-bold text-primary-900">
                      {formatCurrency(stockItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal de détails */}
      {selectedInterventionForDetails && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Détails de l'intervention"
          size="lg"
        >
          <div className="space-y-6">
            {/* Informations du véhicule */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary-600" />
                Véhicule
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Véhicule:</span>
                  <p className="font-medium text-gray-900">{selectedInterventionForDetails.vehicle}</p>
                </div>
                <div>
                  <span className="text-gray-600">Immatriculation:</span>
                  <p className="font-medium text-gray-900 font-mono">{selectedInterventionForDetails.registration}</p>
                </div>
                <div>
                  <span className="text-gray-600">Propriétaire:</span>
                  <p className="font-medium text-gray-900">{selectedInterventionForDetails.owner_name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Téléphone:</span>
                  <p className="font-medium text-gray-900">{selectedInterventionForDetails.owner_phone}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Description:</span>
                  <p className="font-medium text-gray-900">{selectedInterventionForDetails.description}</p>
                </div>
              </div>
            </div>

            {/* Informations de l'intervention */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Intervention
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Mécanicien:</span>
                  <p className="font-medium text-gray-900">{selectedInterventionForDetails.mechanicName}</p>
                </div>
                <div>
                  <span className="text-gray-600">Statut:</span>
                  <p>
                    <Badge variant={
                      selectedInterventionForDetails.status === 'completed' ? 'success' :
                      selectedInterventionForDetails.status === 'in_progress' ? 'info' : 'warning'
                    }>
                      {getStatusLabel(selectedInterventionForDetails.status)}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>
                  <p className="font-medium text-gray-900">
                    {selectedInterventionForDetails.type === 'diagnostic' ? '🔍 Diagnostic' :
                     selectedInterventionForDetails.type === 'reparation' ? '🔧 Réparation' :
                     selectedInterventionForDetails.type === 'entretien' ? '⚙️ Entretien' : '📋 Autre'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Date de création:</span>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedInterventionForDetails.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
                {selectedInterventionForDetails.startedAt && (
                  <div>
                    <span className="text-gray-600">Date de démarrage:</span>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedInterventionForDetails.startedAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                )}
                {selectedInterventionForDetails.completedAt && (
                  <div>
                    <span className="text-gray-600">Date de fin:</span>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedInterventionForDetails.completedAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Articles du stock utilisés */}
            {selectedInterventionForDetails.stockItems && selectedInterventionForDetails.stockItems.length > 0 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-600" />
                  Articles du stock utilisés
                </h4>
                <div className="space-y-2">
                  {selectedInterventionForDetails.stockItems.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between text-sm py-2 border-b border-green-200 last:border-0 gap-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-gray-600">Quantité: {item.quantity} × {formatCurrency(item.unitPrice)}</p>
                      </div>
                      <p className="font-bold text-gray-900">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t-2 border-green-300">
                    <span className="font-semibold text-gray-900">Total articles:</span>
                    <span className="font-bold text-green-700">
                      {formatCurrency(selectedInterventionForDetails.stockItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Informations financières */}
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-yellow-600" />
                Informations financières
              </h4>
              <div className="space-y-2">
                {(() => {
                  const detailStockTotal = (selectedInterventionForDetails.stockItems || []).reduce(
                    (sum, item) => sum + (item.quantity * item.unitPrice), 0
                  );
                  const detailLaborCost = Math.max(0, selectedInterventionForDetails.totalAmount - detailStockTotal);
                  return (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Main d'oeuvre:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(detailLaborCost)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Pièces / Stock:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(detailStockTotal)}</span>
                      </div>
                    </>
                  );
                })()}
                <div className="flex items-center justify-between text-sm pt-1 border-t border-yellow-300">
                  <span className="font-semibold text-gray-900">Total intervention:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(selectedInterventionForDetails.totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Acompte reçu:</span>
                  <span className="font-medium text-green-600">{formatCurrency(selectedInterventionForDetails.advancePayment)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t-2 border-yellow-300">
                  <span className="font-semibold text-gray-900">Montant restant:</span>
                  <span className={`font-bold text-lg ${
                    selectedInterventionForDetails.remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {formatCurrency(selectedInterventionForDetails.remainingAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Résultat du diagnostic */}
            {selectedInterventionForDetails.type === 'diagnostic' && selectedInterventionForDetails.diagnosticResult && (
              <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Résultat du diagnostic
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Fichier PDF disponible:</p>
                    <p className="font-medium text-gray-900">{selectedInterventionForDetails.diagnosticResultName || 'Diagnostic.pdf'}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (selectedInterventionForDetails.diagnosticResult) {
                        const link = document.createElement('a');
                        link.href = selectedInterventionForDetails.diagnosticResult;
                        link.download = selectedInterventionForDetails.diagnosticResultName || 'Diagnostic.pdf';
                        link.click();
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    📥 Télécharger
                  </Button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              {selectedInterventionForDetails.status === 'pending' && (
                <Button
                  onClick={() => {
                    handleStartIntervention(selectedInterventionForDetails.id);
                    setShowDetailsModal(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Démarrer
                </Button>
              )}
              {selectedInterventionForDetails.status === 'in_progress' && (
                <Button
                  onClick={() => {
                    handleCompleteIntervention(selectedInterventionForDetails.id);
                    setShowDetailsModal(false);
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  Terminer
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDetailsModal(false);
                  handleEditIntervention(selectedInterventionForDetails);
                }}
                className="flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Modifier
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowDetailsModal(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de complétion avec upload PDF pour diagnostic */}
      {showCompleteModal && interventionToComplete && (
        <Modal
          isOpen={showCompleteModal}
          onClose={() => {
            setShowCompleteModal(false);
            setInterventionToComplete(null);
            setDiagnosticPdfFile(null);
            setDiagnosticPdfBase64('');
          }}
          title="Terminer le diagnostic"
          size="md"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCompleteModal(false);
                  setInterventionToComplete(null);
                  setDiagnosticPdfFile(null);
                  setDiagnosticPdfBase64('');
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={confirmCompleteWithDiagnostic}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Terminer l'intervention
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {/* Info intervention */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-900">{interventionToComplete.vehicle}</h4>
              <p className="text-sm text-gray-600">{interventionToComplete.registration}</p>
              <p className="text-xs text-gray-500 mt-1">Type: Diagnostic</p>
            </div>

            {/* Upload du résultat */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Résultat du diagnostic (PDF) <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100
                    cursor-pointer"
                />
              </div>
              {diagnosticPdfFile && (
                <p className="mt-2 text-sm text-green-600 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Fichier sélectionné: {diagnosticPdfFile.name}
                </p>
              )}
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-900">
                <strong>Important:</strong> Le fichier PDF du diagnostic sera attaché à cette intervention 
                et pourra être consulté ultérieurement.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default InterventionsPage;

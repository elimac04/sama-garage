import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Wrench, Clock, CheckCircle, AlertCircle, Eye, Calendar, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, Select, Modal } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { useInterventionsStore } from '@/stores/interventionsStore';
import { useAuthStore } from '@/stores/authStore';

const AgentInterventionsPage = () => {
  const { user } = useAuthStore();
  const { interventions, loading, fetchInterventions, updateIntervention } = useInterventionsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch initial data + vérifier modal création
  useEffect(() => {
    fetchInterventions().catch(() => {});
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    if (action === 'new') {
      setShowCreateModal(true);
    }
  }, [fetchInterventions]);

  if (loading && interventions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Filtrer les interventions selon le rôle
  const filteredInterventions = useMemo(() => {
    let filtered = interventions;

    // Pour les mécaniciens, ne montrer que leurs interventions
    if (user?.role === 'mechanic') {
      // Pour l'instant, on montre toutes les interventions (simplifié)
      filtered = interventions;
    }

    // Filtrer par recherche
    if (searchQuery) {
      filtered = filtered.filter(i => 
        i.vehicle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrer par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(i => i.status === filterStatus);
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [interventions, searchQuery, filterStatus, user]);

  const handleStatusChange = (interventionId: string, newStatus: string) => {
    updateIntervention(interventionId, { 
      status: newStatus as 'pending' | 'in_progress' | 'completed',
    }).catch(() => {});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminée';
      case 'in_progress': return 'En cours';
      case 'pending': return 'En attente';
      default: return status;
    }
  };

  const canCreateIntervention = () => {
    return user?.role === 'admin_garage' || user?.role === 'mechanic';
  };

  const canEditIntervention = (intervention: any) => {
    if (user?.role === 'admin_garage') return true;
    if (user?.role === 'mechanic') {
      // Les mécaniciens peuvent modifier les interventions en cours ou en attente
      return intervention.status === 'pending' || intervention.status === 'in_progress';
    }
    // Les caissiers ne peuvent pas modifier les interventions
    return false;
  };

  const getAvailableStatuses = (currentStatus: string) => {
    const statuses = ['pending', 'in_progress', 'completed'];
    const currentIndex = statuses.indexOf(currentStatus);
    
    if (user?.role === 'mechanic') {
      // Les mécaniciens peuvent seulement faire avancer le statut
      return statuses.slice(currentIndex + 1);
    }
    
    return statuses;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interventions</h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'mechanic' ? 'Mes interventions' : 'Gestion des interventions'}
          </p>
        </div>
        
        {canCreateIntervention() && (
          <Button onClick={() => window.location.href = '/interventions?action=new'}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle intervention
          </Button>
        )}
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recherche
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher un véhicule ou une description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'Tous les statuts' },
                  { value: 'pending', label: 'En attente' },
                  { value: 'in_progress', label: 'En cours' },
                  { value: 'completed', label: 'Terminées' }
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des interventions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Liste des interventions ({filteredInterventions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInterventions.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucune intervention trouvée</p>
              {canCreateIntervention() && (
                <Button onClick={() => window.location.href = '/interventions?action=new'} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une intervention
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInterventions.map((intervention) => (
                <div 
                  key={intervention.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Informations principales */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          intervention.status === 'completed' ? 'bg-green-100' :
                          intervention.status === 'in_progress' ? 'bg-orange-100' : 'bg-gray-100'
                        }`}>
                          {intervention.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : intervention.status === 'in_progress' ? (
                            <Clock className="h-5 w-5 text-orange-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {intervention.vehicle || 'Véhicule non spécifié'}
                            </h3>
                            <Badge variant={getStatusColor(intervention.status)}>
                              {getStatusText(intervention.status)}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-2">
                            {intervention.description}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(intervention.createdAt)}
                            </span>
                            {intervention.type && (
                              <span className="capitalize">
                                Type: {intervention.type === 'diagnostic' ? 'Diagnostic' : 'Réparation'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setSelectedIntervention(intervention);
                          setShowDetailsModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Détails
                      </Button>
                      
                      {canEditIntervention(intervention) && (
                        <Select
                          value={intervention.status}
                          onChange={(e) => handleStatusChange(intervention.id, e.target.value)}
                          className="text-sm"
                          options={getAvailableStatuses(intervention.status).map(status => ({
                            value: status,
                            label: status === 'in_progress' ? 'Commencer' : 
                                   status === 'completed' ? 'Terminer' : status
                          }))}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de détails */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedIntervention(null);
        }}
        title="Détails de l'intervention"
        size="lg"
      >
        {selectedIntervention && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Véhicule</label>
                <p className="text-gray-900">{selectedIntervention.vehicle || 'Non spécifié'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Statut</label>
                <Badge variant={getStatusColor(selectedIntervention.status)}>
                  {getStatusText(selectedIntervention.status)}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Type</label>
                <p className="text-gray-900 capitalize">
                  {selectedIntervention.type === 'diagnostic' ? 'Diagnostic' : 'Réparation'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Date</label>
                <p className="text-gray-900">{formatDate(selectedIntervention.createdAt)}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                {selectedIntervention.description}
              </p>
            </div>
            
            {selectedIntervention.diagnostic_notes && (
              <div>
                <label className="text-sm font-medium text-gray-700">Notes de diagnostic</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedIntervention.diagnostic_notes}
                </p>
              </div>
            )}
            
            {selectedIntervention.work_done && (
              <div>
                <label className="text-sm font-medium text-gray-700">Travaux effectués</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedIntervention.work_done}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal de création d'intervention */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouvelle intervention"
        size="lg"
      >
        <div className="space-y-4">
          <div className="text-center py-8">
            <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Formulaire de création</h3>
            <p className="text-gray-600 mb-4">
              Cette fonctionnalité sera disponible prochainement.
            </p>
            <p className="text-sm text-gray-500">
              Pour l'instant, veuillez utiliser l'interface administrative complète.
            </p>
            <Button 
              onClick={() => setShowCreateModal(false)}
              variant="secondary"
            >
              Fermer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AgentInterventionsPage;

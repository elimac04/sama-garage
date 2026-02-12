import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Car, Eye, Calendar, User, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Modal } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { useVehiclesStore } from '@/stores/vehiclesStore';
import { useAuthStore } from '@/stores/authStore';

const AgentVehiclesPage = () => {
  const { user } = useAuthStore();
  const { vehicles, loading, fetchVehicles } = useVehiclesStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch initial data + vérifier modal création
  useEffect(() => {
    fetchVehicles().catch(() => {});
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    if (action === 'new') {
      setShowCreateModal(true);
    }
  }, [fetchVehicles]);

  if (loading && vehicles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Filtrer les véhicules
  const filteredVehicles = useMemo(() => {
    let filtered = vehicles;

    if (searchQuery) {
      filtered = filtered.filter(v => 
        v.registration_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.model?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [vehicles, searchQuery]);

  const canAddVehicle = () => {
    return user?.role === 'admin_garage' || user?.role === 'mechanic';
  };

  const canViewActions = () => {
    return user?.role === 'admin_garage' || user?.role === 'mechanic';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Véhicules</h1>
          <p className="text-gray-600 mt-1">
            Gestion du parc automobile
          </p>
        </div>
        
        {canAddVehicle() && (
          <Button onClick={() => window.location.href = '/vehicles?action=new'}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un véhicule
          </Button>
        )}
      </div>

      {/* Recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un véhicule (immatriculation, marque, modèle, propriétaire)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total véhicules</p>
                <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-xl">
                <Car className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Résultats de recherche</p>
                <p className="text-2xl font-bold text-gray-900">{filteredVehicles.length}</p>
              </div>
              <div className="bg-green-500 p-3 rounded-xl">
                <Search className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ajoutés ce mois</p>
                <p className="text-2xl font-bold text-gray-900">
                  {vehicles.filter(v => {
                    const createdDate = new Date(v.createdAt);
                    const thisMonth = new Date();
                        thisMonth.setDate(1);
                    return createdDate >= thisMonth;
                  }).length}
                </p>
              </div>
              <div className="bg-purple-500 p-3 rounded-xl">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des véhicules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Liste des véhicules ({filteredVehicles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-8">
              <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {searchQuery ? 'Aucun véhicule trouvé pour cette recherche' : 'Aucun véhicule enregistré'}
              </p>
              {canAddVehicle() && !searchQuery && (
                <Button onClick={() => window.location.href = '/vehicles?action=new'} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un véhicule
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVehicles.map((vehicle) => (
                <div 
                  key={vehicle.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Informations principales */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Car className="h-5 w-5 text-blue-600" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {vehicle.brand} {vehicle.model}
                            </h3>
                            <span className="text-sm text-gray-500">
                              ({vehicle.year || 'N/A'})
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Immatriculation:</span>
                              <span className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">
                                {vehicle.registration_number || 'N/A'}
                              </span>
                            </div>
                            
                            {vehicle.color && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Couleur:</span>
                                <span>{vehicle.color}</span>
                              </div>
                            )}
                            
                            {false && ( // Désactivé car la propriété owner n'existe pas dans le type Vehicle
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span>Propriétaire non disponible</span>
                            </div>
                          )}
                          </div>
                          
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Ajouté le {formatDate(vehicle.createdAt)}
                            </span>
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
                          setSelectedVehicle(vehicle);
                          setShowDetailsModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Détails
                      </Button>
                      
                      {canViewActions() && (
                        <Button 
                          size="sm"
                          onClick={() => window.location.href = `/interventions?action=new&vehicle=${vehicle.id}`}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Intervention
                        </Button>
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
          setSelectedVehicle(null);
        }}
        title="Détails du véhicule"
        size="lg"
      >
        {selectedVehicle && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Marque</label>
                <p className="text-gray-900">{selectedVehicle.brand || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Modèle</label>
                <p className="text-gray-900">{selectedVehicle.model || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Immatriculation</label>
                <p className="text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                  {selectedVehicle.registration_number || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Année</label>
                <p className="text-gray-900">{selectedVehicle.year || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Couleur</label>
                <p className="text-gray-900">{selectedVehicle.color || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">VIN</label>
                <p className="text-gray-900 font-mono text-sm">{selectedVehicle.vin || 'N/A'}</p>
              </div>
            </div>
            
            {false && ( // Section propriétaire désactivée
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Propriétaire</h4>
                <p className="text-gray-500">Informations du propriétaire non disponibles</p>
              </div>
            )}
            
            {selectedVehicle.notes && (
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-gray-700">Notes</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedVehicle.notes}
                </p>
              </div>
            )}
            
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <label className="text-sm font-medium text-gray-700">Date d'ajout</label>
                  <p>{formatDate(selectedVehicle.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Dernière mise à jour</label>
                  <p>{formatDate(selectedVehicle.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de création de véhicule */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Ajouter un véhicule"
        size="lg"
      >
        <div className="space-y-4">
          <div className="text-center py-8">
            <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
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

export default AgentVehiclesPage;

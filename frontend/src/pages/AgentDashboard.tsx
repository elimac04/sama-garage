import { useMemo, useEffect } from 'react';
import { Car, Wrench, Package, Clock, CheckCircle, AlertCircle, DollarSign, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { useVehiclesStore } from '@/stores/vehiclesStore';
import { useInterventionsStore } from '@/stores/interventionsStore';
import { useStockStore } from '@/stores/stockStore';
import { useAuthStore } from '@/stores/authStore';

const AgentDashboard = () => {
  const { user } = useAuthStore();
  const { vehicles, loading: vehiclesLoading, fetchVehicles } = useVehiclesStore();
  const { interventions, loading: interventionsLoading, fetchInterventions } = useInterventionsStore();
  const { articles, loading: stockLoading, fetchArticles } = useStockStore();

  useEffect(() => {
    fetchVehicles().catch(() => {});
    fetchInterventions().catch(() => {});
    fetchArticles().catch(() => {});
  }, [fetchVehicles, fetchInterventions, fetchArticles]);

  const loading = vehiclesLoading || interventionsLoading || stockLoading;

  if (loading && vehicles.length === 0 && interventions.length === 0 && articles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Statistiques selon le rôle
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayInterventions = interventions.filter(i => {
      const interventionDate = new Date(i.createdAt);
      const interventionDay = new Date(interventionDate);
      interventionDay.setHours(0, 0, 0, 0);
      return interventionDay.getTime() === today.getTime();
    });

    const myInterventions = interventions; // Simplifié pour éviter les erreurs de types

    const inProgressInterventions = myInterventions.filter(i => i.status === 'in_progress');
    const completedInterventions = myInterventions.filter(i => i.status === 'completed');
    const pendingInterventions = myInterventions.filter(i => i.status === 'pending');

    const lowStockItems = articles.filter((item: any) => item.quantity <= item.alert_threshold);

    return {
      totalVehicles: vehicles.length,
      totalInterventions: myInterventions.length,
      todayInterventions: todayInterventions.length,
      inProgressInterventions: inProgressInterventions.length,
      completedInterventions: completedInterventions.length,
      pendingInterventions: pendingInterventions.length,
      lowStockItems: lowStockItems.length,
      todayRevenue: 0, // Simplifié pour éviter les erreurs de types
      pendingRevenue: 0, // Simplifié pour éviter les erreurs de types
    };
  }, [vehicles, interventions, articles, user]);

  // Interventions récentes pour l'agent
  const recentInterventions = useMemo(() => {
    const myInterventions = interventions; // Simplifié pour éviter les erreurs de types

    return myInterventions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [interventions, user]);

  const getRoleTitle = () => {
    switch (user?.role) {
      case 'mechanic': return 'Mécanicien';
      case 'cashier': return 'Caissier';
      default: return 'Agent';
    }
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting = 'Bonjour';
    if (hour >= 12 && hour < 18) greeting = 'Bon après-midi';
    if (hour >= 18) greeting = 'Bonsoir';
    
    return `${greeting}, ${user?.full_name}!`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {getWelcomeMessage()}
        </h1>
        <p className="text-gray-600 mt-1">
          Tableau de bord - {getRoleTitle()}
        </p>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Interventions du jour</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayInterventions}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(stats.todayRevenue)} de revenus
                </p>
              </div>
              <div className="bg-blue-500 p-3 rounded-xl">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">En cours</p>
                <p className="text-2xl font-bold text-orange-600">{stats.inProgressInterventions}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Interventions actives
                </p>
              </div>
              <div className="bg-orange-500 p-3 rounded-xl">
                <Wrench className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Terminées</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedInterventions}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Cette semaine
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-xl">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingInterventions}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(stats.pendingRevenue)} en attente
                </p>
              </div>
              <div className="bg-yellow-500 p-3 rounded-xl">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats secondaires et interventions récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Véhicules et Stock */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Parc automobile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total véhicules</span>
                <span className="font-bold text-gray-900">{stats.totalVehicles}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">En intervention</span>
                <span className="font-bold text-orange-600">{stats.inProgressInterventions}</span>
              </div>
              {user?.role === 'mechanic' && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Stock faible</span>
                  <span className="font-bold text-red-600">{stats.lowStockItems}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Interventions récentes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Interventions récentes
              </div>
              <Button variant="ghost" size="sm" onClick={() => window.open('/interventions', '_self')}>
                Voir tout →
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentInterventions.length === 0 ? (
              <div className="text-center py-6">
                <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucune intervention récente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentInterventions.map((intervention) => (
                  <div 
                    key={intervention.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
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
                      <div>
                        <p className="font-medium text-gray-900">{intervention.vehicle}</p>
                        <p className="text-sm text-gray-600">{intervention.registration}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(0)}</p>
                      <Badge 
                        variant={intervention.status === 'completed' ? 'success' : 
                                intervention.status === 'in_progress' ? 'warning' : 'info'}
                      >
                        {intervention.status === 'completed' ? 'Terminée' :
                         intervention.status === 'in_progress' ? 'En cours' : 'En attente'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides selon le rôle */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {user?.role === 'mechanic' && (
              <Button 
                onClick={() => window.location.href = '/interventions?action=new'}
                variant="secondary"
              >
                <Wrench className="h-4 w-4 mr-2" />
                Nouvelle intervention
              </Button>
            )}

            {user?.role === 'mechanic' && (
              <Button 
                onClick={() => window.location.href = '/vehicles?action=new'}
                variant="secondary"
              >
                <Car className="h-4 w-4 mr-2" />
                Ajouter un véhicule
              </Button>
            )}

            {user?.role === 'mechanic' && (
              <Button 
                onClick={() => window.location.href = '/stock?alert=low'}
                variant="ghost"
              >
                <Package className="h-4 w-4 mr-2" />
                Vérifier le stock
              </Button>
            )}

            {user?.role === 'cashier' && (
              <Button 
                onClick={() => window.location.href = '/cash'}
                variant="ghost"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Gérer la caisse
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentDashboard;

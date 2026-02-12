import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Wrench, Package, TrendingUp, Calendar, Users, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { formatCurrency, getStatusLabel } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useVehiclesStore } from '@/stores/vehiclesStore';
import { useStockStore } from '@/stores/stockStore';
import { useInterventionsStore } from '@/stores/interventionsStore';

const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { vehicles, loading: vehiclesLoading, fetchVehicles } = useVehiclesStore();
  const { articles, loading: stockLoading, fetchArticles } = useStockStore();
  const { interventions, loading: interventionsLoading, fetchInterventions } = useInterventionsStore();

  useEffect(() => {
    fetchVehicles().catch(() => {});
    fetchInterventions().catch(() => {});
    fetchArticles().catch(() => {});
  }, [fetchVehicles, fetchInterventions, fetchArticles]);

  const loading = vehiclesLoading || stockLoading || interventionsLoading;

  if (loading && vehicles.length === 0 && interventions.length === 0 && articles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Calculer les statistiques réelles
  const totalVehicles = vehicles.length;
  const inProgressInterventions = interventions.filter(i => i.status === 'in_progress').length;
  const pendingInterventions = interventions.filter(i => i.status === 'pending').length;
  const totalArticles = articles.length;
  const lowStockCount = articles.filter(item => item.quantity <= item.alert_threshold).length;
  
  // CA du mois (interventions terminées ce mois)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyRevenue = interventions
    .filter(i => {
      if (i.status === 'completed' && i.completedAt) {
        const completedDate = new Date(i.completedAt);
        return completedDate.getMonth() === currentMonth && completedDate.getFullYear() === currentYear;
      }
      return false;
    })
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const stats = [
    { 
      name: 'Véhicules enregistrés', 
      value: totalVehicles.toString(), 
      icon: Car, 
      color: 'bg-blue-500',
      trend: `${totalVehicles} véhicule${totalVehicles > 1 ? 's' : ''}`,
      link: '/vehicles'
    },
    { 
      name: 'Interventions en cours', 
      value: inProgressInterventions.toString(), 
      icon: Wrench, 
      color: 'bg-orange-500',
      trend: `${pendingInterventions} en attente`,
      link: '/interventions'
    },
    { 
      name: 'Articles en stock', 
      value: totalArticles.toString(), 
      icon: Package, 
      color: 'bg-green-500',
      trend: `${lowStockCount} alerte${lowStockCount > 1 ? 's' : ''}`,
      link: '/stock'
    },
    { 
      name: 'CA du mois', 
      value: formatCurrency(monthlyRevenue), 
      icon: TrendingUp, 
      color: 'bg-purple-500',
      trend: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      link: '/interventions'
    },
  ];

  // Interventions récentes (les 5 dernières)
  const recentInterventions = [...interventions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(i => ({
      id: i.id,
      vehicle: `${i.vehicle} - ${i.registration}`,
      description: i.description,
      status: i.status,
      mechanic: i.mechanicName,
      date: i.createdAt
    }));

  // Alertes de stock (articles sous le seuil)
  const stockAlerts = articles
    .filter(item => item.quantity <= item.alert_threshold)
    .slice(0, 5)
    .map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      threshold: item.alert_threshold
    }));
  
  // Fonction helper pour calculer le temps écoulé
  const getTimeAgo = (date: string) => {
    const now = new Date().getTime();
    const then = new Date(date).getTime();
    const diff = now - then;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  // Activité récente (combinaison d'interventions et stock)
  const recentActivities = [
    ...interventions.map(i => ({
      action: i.status === 'completed' ? 'Intervention terminée' : 
              i.status === 'in_progress' ? 'Intervention en cours' : 
              'Nouvelle intervention',
      detail: `${i.vehicle} - ${i.description}`,
      time: getTimeAgo(i.completedAt || i.startedAt || i.createdAt),
      timestamp: new Date(i.completedAt || i.startedAt || i.createdAt).getTime(),
      type: i.status === 'completed' ? 'success' : 
            i.status === 'in_progress' ? 'info' : 'warning',
      link: '/interventions'
    })),
    ...articles
      .filter(a => a.updatedAt || a.createdAt)
      .map(a => ({
        action: a.quantity <= a.alert_threshold ? 'Alerte stock faible' : 'Stock mis à jour',
        detail: `${a.name} - Quantité: ${a.quantity}`,
        time: getTimeAgo(a.updatedAt || a.createdAt),
        timestamp: new Date(a.updatedAt || a.createdAt).getTime(),
        type: a.quantity <= a.alert_threshold ? 'warning' : 'info',
        link: '/stock'
      }))
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600 mt-1">
          Bonjour <span className="font-semibold">{user?.full_name}</span>, bienvenue sur SAMA GARAGE
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={stat.name} 
              className="hover:shadow-lg transition-all cursor-pointer hover:scale-105"
              onClick={() => navigate(stat.link)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.trend}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-xl shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interventions récentes */}
        <Card>
          <CardHeader 
            className="flex flex-row items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => navigate('/interventions')}
          >
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary-600" />
              Interventions récentes
            </CardTitle>
            <Badge variant="info">{recentInterventions.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentInterventions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucune intervention récente</p>
              ) : (
                recentInterventions.map((intervention) => (
                <div 
                  key={intervention.id} 
                  onClick={() => navigate('/interventions')}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{intervention.vehicle}</p>
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
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {intervention.mechanic}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(intervention.date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alertes de stock */}
        <Card>
          <CardHeader 
            className="flex flex-row items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => navigate('/stock')}
          >
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${stockAlerts.length > 0 ? 'text-red-600' : 'text-gray-400'}`} />
              Alertes de stock
            </CardTitle>
            <Badge variant={stockAlerts.length > 0 ? 'danger' : 'success'}>
              {stockAlerts.length === 0 ? 'Aucune alerte' : `${stockAlerts.length} alerte${stockAlerts.length > 1 ? 's' : ''}`}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stockAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-3">
                    <Package className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-gray-700 font-medium">Tout va bien !</p>
                  <p className="text-sm text-gray-500 mt-1">Tous les articles sont au-dessus du seuil d'alerte</p>
                </div>
              ) : (
                stockAlerts.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => navigate('/stock')}
                  className="p-4 bg-red-50 rounded-lg border border-red-200 hover:border-red-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <Badge variant="danger">
                      Stock faible
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Quantité actuelle: <span className="font-semibold text-red-600">{item.quantity}</span>
                    </span>
                    <span className="text-gray-500">
                      Seuil: {item.threshold}
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-red-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full transition-all"
                      style={{ width: `${(item.quantity / item.threshold) * 100}%` }}
                    />
                  </div>
                </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activité récente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary-600" />
            Activité récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucune activité récente</p>
            ) : (
              recentActivities.map((activity, index) => (
              <div 
                key={index} 
                onClick={() => navigate(activity.link)}
                className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 hover:shadow-md transition-all cursor-pointer"
              >
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'success' ? 'bg-green-500' :
                  activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.detail}</p>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">{activity.time}</span>
              </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

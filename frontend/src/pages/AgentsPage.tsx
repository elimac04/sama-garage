import { useState, useMemo, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Eye, Search, UserCheck, UserX, Phone, Mail, Loader2 } from 'lucide-react';
import { Card, CardContent, Button, Badge, Modal, Input, Select } from '@/components/ui';
import { useAgentsStore, Agent } from '@/stores/agentsStore';
import { useToast } from '@/stores/toastStore';

const AgentsPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'mechanic' as 'mechanic' | 'cashier',
  });
  
  const { agents, fetchAgents, createAgent, updateAgent, deleteAgent, changeAgentStatus } = useAgentsStore();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAgents().catch(() => {});
  }, [fetchAgents]);
  
  // Rôles disponibles
  const roles = [
    { value: 'mechanic', label: 'Mécanicien' },
    { value: 'cashier', label: 'Caissier' },
  ];
  
  // Filtrer les agents
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          agent.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          agent.phone.includes(searchQuery);
      const matchesStatus = filterStatus === 'all' || agent.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [agents, searchQuery, filterStatus]);
  
  // Statistiques simplifiées
  const stats = useMemo(() => {
    const activeCount = agents.filter(a => a.status === 'active').length;
    const inactiveCount = agents.filter(a => a.status === 'inactive').length;
    
    return {
      total: agents.length,
      active: activeCount,
      inactive: inactiveCount,
    };
  }, [agents]);
  
  // Soumettre le formulaire
  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.role) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);

    try {
      if (editingAgent) {
        // Mise à jour via API backend
        await updateAgent(editingAgent.id, {
          full_name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          role: formData.role,
        });
        toast.success('Agent mis à jour avec succès');
      } else {
        // Création via API backend
        await createAgent({
          email: formData.email,
          full_name: formData.name,
          phone: formData.phone || undefined,
          role: formData.role,
        });
        toast.success('Agent créé avec succès ! Les identifiants ont été envoyés par email.');
      }
      handleCloseModal();
    } catch (error: any) {
      console.error('❌ createAgent error response:', JSON.stringify(error.response?.data));
      const msg = error.response?.data?.message;
      const message = Array.isArray(msg) ? msg.join(', ') : msg || 'Erreur lors de l\'opération';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Réinitialiser le formulaire
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAgent(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'mechanic',
    });
  };
  
  // Modifier un agent
  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      email: agent.email || '',
      phone: agent.phone,
      role: agent.role || 'mechanic',
    });
    setShowModal(true);
  };
  
  // Supprimer un agent
  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet agent ? Cette action est irréversible.')) {
      try {
        await deleteAgent(id);
        toast.success('Agent supprimé avec succès');
      } catch (error: any) {
        const msg = error.response?.data?.message;
        toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Erreur lors de la suppression');
      }
    }
  };
  
  // Voir les détails
  const handleViewDetails = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowDetailsModal(true);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Agents</h1>
          <p className="text-gray-600 mt-1">Gérez vos mécaniciens et caissiers</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Nouvel Agent
        </Button>
      </div>

      {/* Statistiques simplifiées */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Agents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Actifs</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="bg-green-500 p-3 rounded-xl">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Inactifs</p>
                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <div className="bg-red-500 p-3 rounded-xl">
                <UserX className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche et filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recherche
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher par nom, email ou téléphone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'Tous les statuts' },
                  { value: 'active', label: 'Actifs' },
                  { value: 'inactive', label: 'Inactifs' },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des agents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAgents.map((agent) => (
          <Card key={agent.id} className="hover:shadow-lg transition-all overflow-hidden">
            <CardContent className="p-0">
              {/* Header */}
              <div className="relative h-32 bg-gradient-to-br from-primary-500 to-primary-700">
                <div className="w-full h-full flex items-center justify-center">
                  <Users className="h-16 w-16 text-white opacity-50" />
                </div>
                <div className="absolute top-3 right-3">
                  <Badge
                    variant={agent.status === 'active' ? 'success' : 'default'}
                  >
                    {agent.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </div>

              {/* Infos */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{agent.name}</h3>
                <p className="text-sm text-primary-600 font-medium mb-3">
                  {agent.role === 'mechanic' ? 'Mécanicien' : 'Caissier'}
                </p>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{agent.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{agent.email}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleViewDetails(agent)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Détails
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEdit(agent)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDelete(agent.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredAgents.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucun agent trouvé</p>
            <Button onClick={() => setShowModal(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un agent
            </Button>
          </div>
        )}
      </div>

      {/* Modal Créer/Modifier */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingAgent ? 'Modifier l\'agent' : 'Nouvel agent'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal} disabled={submitting}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {editingAgent ? 'Mise à jour...' : 'Création...'}
                </span>
              ) : (
                editingAgent ? 'Mettre à jour' : 'Créer l\'agent'
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nom complet"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Jean Dupont"
              required
            />
            <Select
              label="Rôle"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'mechanic' | 'cashier' })}
              options={roles}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Téléphone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+221 77 123 45 67"
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="agent@example.com"
              required
            />
          </div>
        </div>
      </Modal>

      {/* Modal Détails */}
      {showDetailsModal && selectedAgent && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedAgent(null);
          }}
          title="Détails de l'agent"
          size="lg"
        >
          <div className="space-y-6">
            {/* Infos principales */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary-500 to-primary-700">
                <div className="w-full h-full flex items-center justify-center">
                  <Users className="h-12 w-12 text-white opacity-50" />
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{selectedAgent.name}</h3>
                <p className="text-base sm:text-lg text-primary-600 font-medium mb-3">
                  {selectedAgent.role === 'mechanic' ? 'Mécanicien' : 'Caissier'}
                </p>
                <div className="flex justify-center sm:justify-start gap-2">
                  <Badge
                    variant={selectedAgent.status === 'active' ? 'success' : 'default'}
                  >
                    {selectedAgent.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Informations de contact */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Contact</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-600" />
                  <span>{selectedAgent.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-600" />
                  <span>{selectedAgent.email}</span>
                </div>
              </div>
            </div>

            {/* Actions de statut */}
            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
              <Button
                onClick={() => {
                  changeAgentStatus(selectedAgent.id, 'active');
                  setSelectedAgent({ ...selectedAgent, status: 'active' });
                }}
                variant={selectedAgent.status === 'active' ? 'primary' : 'secondary'}
                size="sm"
              >
                <UserCheck className="h-4 w-4 mr-1" />
                Activer
              </Button>
              <Button
                onClick={() => {
                  changeAgentStatus(selectedAgent.id, 'inactive');
                  setSelectedAgent({ ...selectedAgent, status: 'inactive' });
                }}
                variant={selectedAgent.status === 'inactive' ? 'primary' : 'secondary'}
                size="sm"
              >
                <UserX className="h-4 w-4 mr-1" />
                Désactiver
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AgentsPage;

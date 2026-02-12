import { useState, useRef, useEffect } from 'react';
import { Package, Plus, AlertTriangle, Edit2, Trash2, TrendingUp, Camera, Mic, MicOff, X, Image as ImageIcon, Eye, Play, Search, ShoppingCart, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Modal, Badge, Select, EmptyState } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { useStockStore, StockArticle } from '@/stores/stockStore';
import { useInterventionsStore } from '@/stores/interventionsStore';
import { stockCategories } from '@/data/stockData';
import { useToast } from '@/stores/toastStore';

const StockPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<StockArticle | null>(null);
  const [editingArticle, setEditingArticle] = useState<StockArticle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAlert, setFilterAlert] = useState<'all' | 'low' | 'critical' | 'out'>('all');
  const [submitting, setSubmitting] = useState(false);
  
  // Formulaire
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    unit_price: '',
    alert_threshold: '',
    reference: '',
    description: ''
  });
  
  // Photos et Audio
  const [photos, setPhotos] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [_audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const toast = useToast();
  
  const { articles, loading, fetchArticles, createArticle, updateArticle, deleteArticle } = useStockStore();
  const { interventions, fetchInterventions } = useInterventionsStore();

  // Fetch initial data
  useEffect(() => {
    fetchArticles().catch(() => {});
    fetchInterventions().catch(() => {});
  }, [fetchArticles, fetchInterventions]);

  // Attacher le stream à la vidéo
  useEffect(() => {
    if (stream && videoRef.current && showCamera) {
      videoRef.current.srcObject = stream;
      setCameraLoading(false);
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().then(() => {
          toast.success('Caméra activée');
        }).catch(err => {
          console.error('Erreur lecture vidéo:', err);
          toast.error('Impossible de lire la vidéo');
        });
      };
    }
  }, [stream, showCamera, toast]);

  // Cleanup stream
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Helpers pour les niveaux d'alerte
  const getAlertLevel = (article: StockArticle): 'ok' | 'low' | 'critical' | 'out' => {
    if (article.quantity === 0) return 'out';
    if (article.quantity <= Math.floor(article.alert_threshold * 0.5)) return 'critical';
    if (article.quantity <= article.alert_threshold) return 'low';
    return 'ok';
  };

  const getStockPercent = (article: StockArticle): number => {
    if (article.alert_threshold === 0) return 100;
    const maxRef = article.alert_threshold * 3;
    return Math.min(100, Math.round((article.quantity / maxRef) * 100));
  };

  const getBarColor = (level: string) => {
    switch (level) {
      case 'out': return 'bg-red-600';
      case 'critical': return 'bg-orange-500';
      case 'low': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getAlertLabel = (level: string) => {
    switch (level) {
      case 'out': return 'Rupture de stock';
      case 'critical': return 'Stock critique';
      case 'low': return 'Stock faible';
      default: return 'Stock OK';
    }
  };

  const getAlertBadgeVariant = (level: string): 'danger' | 'warning' | 'info' | 'success' => {
    switch (level) {
      case 'out': return 'danger';
      case 'critical': return 'danger';
      case 'low': return 'warning';
      default: return 'success';
    }
  };

  // Filtrer les articles
  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchQuery === '' ||
      article.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === '' || article.category === filterCategory;
    const level = getAlertLevel(article);
    const matchesAlert = filterAlert === 'all' ||
      (filterAlert === 'low' && level !== 'ok') ||
      (filterAlert === 'critical' && (level === 'critical' || level === 'out')) ||
      (filterAlert === 'out' && level === 'out');
    return matchesSearch && matchesCategory && matchesAlert;
  });

  const lowStockItems = articles.filter(item => item.quantity <= item.alert_threshold);
  const outOfStockItems = articles.filter(item => item.quantity === 0);
  const criticalStockItems = articles.filter(item => item.quantity > 0 && item.quantity <= Math.floor(item.alert_threshold * 0.5));
  const totalValue = articles.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  // Toast notification au chargement si articles en alerte
  useEffect(() => {
    if (!loading && articles.length > 0 && lowStockItems.length > 0) {
      if (outOfStockItems.length > 0) {
        toast.error(`${outOfStockItems.length} article(s) en rupture de stock !`);
      } else {
        toast.warning(`${lowStockItems.length} article(s) sous le seuil d'alerte`);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Calculer les articles utilisés dans les interventions (directement depuis le store)
  const usedArticlesCount = interventions.reduce((total, intervention) => {
    if (intervention.stockItems && intervention.stockItems.length > 0) {
      return total + intervention.stockItems.reduce((sum, item) => sum + item.quantity, 0);
    }
    return total;
  }, 0);

  const usedArticlesValue = interventions.reduce((total, intervention) => {
    if (intervention.stockItems && intervention.stockItems.length > 0) {
      return total + intervention.stockItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    }
    return total;
  }, 0);

  // Fonctions pour la caméra
  const handleOpenCamera = async () => {
    setCameraLoading(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setStream(mediaStream);
      setShowCamera(true);
    } catch (error) {
      console.error('Erreur accès caméra:', error);
      toast.error('Impossible d\'accéder à la caméra');
      setCameraLoading(false);
    }
  };

  const handleCloseCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    setCameraLoading(false);
  };

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const photoData = canvas.toDataURL('image/jpeg');
        setPhotos(prev => [...prev, photoData]);
        toast.success('Photo capturée !');
      }
    }
  };

  const handleUploadPhotos = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotos(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
      toast.success(`${files.length} photo(s) ajoutée(s)`);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Fonctions pour l'audio
  const handleStartRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(mediaStream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        // Convert to base64 for storage and preview
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setAudioUrl(base64);
        };
        reader.readAsDataURL(audioBlob);
        mediaStream.getTracks().forEach(track => track.stop());
        toast.success('Enregistrement audio terminé !');
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      toast.info('Enregistrement en cours...');
    } catch (error) {
      console.error('Erreur enregistrement audio:', error);
      toast.error('Impossible d\'accéder au microphone');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRemoveAudio = () => {
    setAudioBlob(null);
    setAudioUrl('');
  };

  // Fonctions CRUD
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingArticle(null);
    setFormData({
      name: '',
      category: '',
      quantity: '',
      unit_price: '',
      alert_threshold: '',
      reference: '',
      description: ''
    });
    setPhotos([]);
    setAudioUrl('');
    setAudioBlob(null);
    handleCloseCamera();
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category || !formData.quantity || !formData.unit_price || !formData.alert_threshold) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    setSubmitting(true);

    const payload = {
      name: formData.name,
      category: formData.category,
      quantity: parseInt(formData.quantity),
      unit_price: parseFloat(formData.unit_price),
      alert_threshold: parseInt(formData.alert_threshold),
      reference: formData.reference || undefined,
      description: formData.description || undefined,
      photos: photos.length > 0 ? photos : undefined,
      audio: audioUrl || undefined,
    };

    try {
      if (editingArticle) {
        await updateArticle(editingArticle.id, payload);
        toast.success('Article modifié avec succès !');
      } else {
        await createArticle(payload as any);
        toast.success('Article ajouté avec succès !');
      }
      handleCloseModal();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Erreur lors de l\'opération');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (article: StockArticle) => {
    setEditingArticle(article);
    setFormData({
      name: article.name,
      category: article.category,
      quantity: article.quantity.toString(),
      unit_price: article.unit_price.toString(),
      alert_threshold: article.alert_threshold.toString(),
      reference: article.reference || '',
      description: article.description || ''
    });
    setPhotos(article.photos || []);
    setAudioUrl(article.audio || '');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      try {
        await deleteArticle(id);
        toast.success('Article supprimé avec succès !');
      } catch {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleViewDetails = (article: StockArticle) => {
    setSelectedArticle(article);
    setShowDetailsModal(true);
  };

  if (loading && articles.length === 0) {
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Stock</h1>
          <p className="text-gray-600 mt-1">Gérer les pièces et articles en stock avec capture photo et audio</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Nouvel article
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Articles en stock</p>
                <p className="text-2xl font-bold text-gray-900">{articles.length}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-xl">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Valeur totale stock</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
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
                <p className="text-sm text-gray-600 mb-1">Articles utilisés</p>
                <p className="text-2xl font-bold text-purple-600">{usedArticlesCount}</p>
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(usedArticlesValue)}</p>
              </div>
              <div className="bg-purple-500 p-3 rounded-xl">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Alertes de stock</p>
                <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
              </div>
              <div className="bg-red-500 p-3 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes de stock faible */}
      {lowStockItems.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Alertes de stock ({lowStockItems.length})
              </span>
              <div className="flex gap-1">
                {outOfStockItems.length > 0 && (
                  <Badge variant="danger">{outOfStockItems.length} en rupture</Badge>
                )}
                {criticalStockItems.length > 0 && (
                  <Badge variant="warning">{criticalStockItems.length} critique(s)</Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lowStockItems
                .sort((a, b) => a.quantity - b.quantity)
                .map((item) => {
                  const level = getAlertLevel(item);
                  const percent = getStockPercent(item);
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border ${
                        level === 'out' ? 'bg-red-50 border-red-300' :
                        level === 'critical' ? 'bg-orange-50 border-orange-300' :
                        'bg-yellow-50 border-yellow-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">{item.name}</h4>
                          <p className="text-sm text-gray-600">{item.category}</p>
                        </div>
                        <Badge variant={getAlertBadgeVariant(level)}>
                          {getAlertLabel(level)}
                        </Badge>
                      </div>
                      {/* Barre de progression */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Quantité: <span className="font-bold">{item.quantity}</span></span>
                          <span>Seuil: {item.alert_threshold}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full transition-all ${getBarColor(level)}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end mt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(item)}
                          className="text-xs"
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Réapprovisionner
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Barre de recherche et filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Rechercher un article..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                options={[
                  { value: '', label: 'Toutes catégories' },
                  ...stockCategories.map(cat => ({ value: cat, label: cat }))
                ]}
                className="md:w-64"
              />
            </div>
            {/* Filtres par niveau de stock */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Niveau de stock:</span>
              {([
                { value: 'all' as const, label: 'Tous', count: articles.length },
                { value: 'low' as const, label: 'En alerte', count: lowStockItems.length },
                { value: 'critical' as const, label: 'Critique', count: criticalStockItems.length },
                { value: 'out' as const, label: 'Rupture', count: outOfStockItems.length },
              ]).map((f) => (
                <Button
                  key={f.value}
                  size="sm"
                  variant={filterAlert === f.value ? 'primary' : 'secondary'}
                  onClick={() => setFilterAlert(f.value)}
                  className="text-xs"
                >
                  {f.label}
                  {f.count > 0 && (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                      filterAlert === f.value ? 'bg-white/20' : 'bg-gray-200'
                    }`}>
                      {f.count}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des articles */}
      {filteredArticles.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aucun article en stock"
          description="Commencez par ajouter votre premier article au stock"
          actionLabel="Ajouter un article"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <Card key={article.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                {/* Photo */}
                {article.photos && article.photos.length > 0 ? (
                  <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={article.photos[0]}
                      alt={article.name}
                      className="w-full h-full object-cover"
                    />
                    {article.photos.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                        +{article.photos.length - 1}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-48 mb-4 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Package className="h-16 w-16 text-gray-400" />
                  </div>
                )}

                {/* Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{article.name}</h3>
                  </div>

                  <Badge variant="default">{article.category}</Badge>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Quantité</p>
                      <p className={`text-lg font-bold ${
                        getAlertLevel(article) === 'out' ? 'text-red-600' :
                        getAlertLevel(article) === 'critical' ? 'text-orange-600' :
                        getAlertLevel(article) === 'low' ? 'text-yellow-600' : 'text-gray-900'
                      }`}>
                        {article.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Prix unitaire</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(article.unit_price)}</p>
                    </div>
                  </div>

                  {/* Barre de progression stock */}
                  {(() => {
                    const level = getAlertLevel(article);
                    const percent = getStockPercent(article);
                    return (
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Stock: {article.quantity}</span>
                          <span>Seuil: {article.alert_threshold}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${getBarColor(level)}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {getAlertLevel(article) !== 'ok' && (
                    <div className={`flex items-center gap-2 text-xs p-2 rounded ${
                      getAlertLevel(article) === 'out' ? 'text-red-700 bg-red-50' :
                      getAlertLevel(article) === 'critical' ? 'text-orange-700 bg-orange-50' :
                      'text-yellow-700 bg-yellow-50'
                    }`}>
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium">{getAlertLabel(getAlertLevel(article))}</span>
                    </div>
                  )}

                  {article.audio && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-xs text-blue-600 mb-2">
                        <Mic className="h-4 w-4" />
                        <span>Description audio</span>
                      </div>
                      <audio controls src={article.audio} className="w-full h-8" />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewDetails(article)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(article)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(article.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal d'ajout/édition */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingArticle ? 'Modifier l\'article' : 'Nouvel article'}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingArticle ? 'Modifier' : 'Enregistrer'}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Capture Photo */}
          <div className="border-b pb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary-600" />
              Photos de l'article
            </h3>
            
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleOpenCamera}
                disabled={showCamera}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                {showCamera ? 'Caméra active' : 'Ouvrir caméra'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Charger photos
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleUploadPhotos}
              />
            </div>

            {/* Vidéo caméra */}
            {showCamera && (
              <div className="mb-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  {cameraLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                      <div className="text-white">Chargement de la caméra...</div>
                    </div>
                  )}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                    <Button
                      type="button"
                      onClick={handleTakePhoto}
                      className="bg-white text-gray-900 hover:bg-gray-100"
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Capturer
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleCloseCamera}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      <X className="h-5 w-5 mr-2" />
                      Fermer
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Galerie photos */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enregistrement Audio */}
          <div className="border-b pb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary-600" />
              Description audio (pour accessibilité)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Enregistrez une description vocale de l'article pour faciliter l'identification par les personnes analphabètes.
            </p>

            <div className="flex gap-2 mb-4">
              {!isRecording && !audioUrl && (
                <Button
                  type="button"
                  onClick={handleStartRecording}
                  className="flex-1"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Commencer l'enregistrement
                </Button>
              )}
              {isRecording && (
                <Button
                  type="button"
                  onClick={handleStopRecording}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <MicOff className="h-4 w-4 mr-2" />
                  Arrêter l'enregistrement
                </Button>
              )}
            </div>

            {audioUrl && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <Play className="h-5 w-5 text-green-600" />
                  <audio controls src={audioUrl} className="flex-1" />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleRemoveAudio}
                    className="text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Informations de l'article */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Informations de l'article</h3>
            
            <div className="space-y-4">
              <Input
                label="Nom de l'article"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Huile moteur 5W40"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Catégorie"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  options={[
                    { value: '', label: 'Sélectionner une catégorie' },
                    ...stockCategories.map(cat => ({ value: cat, label: cat }))
                  ]}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Quantité"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="10"
                  required
                />
                <Input
                  label="Prix unitaire (FCFA)"
                  type="number"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  placeholder="8500"
                  required
                />
                <Input
                  label="Seuil d'alerte"
                  type="number"
                  value={formData.alert_threshold}
                  onChange={(e) => setFormData({ ...formData, alert_threshold: e.target.value })}
                  placeholder="5"
                  required
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal de détails */}
      {selectedArticle && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Détails de l'article"
          size="lg"
        >
          <div className="space-y-6">
            {/* Photos */}
            {selectedArticle.photos && selectedArticle.photos.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Photos</h4>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {selectedArticle.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-32 sm:h-48 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Audio */}
            {selectedArticle.audio && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Mic className="h-5 w-5 text-blue-600" />
                  Description audio
                </h4>
                <audio controls src={selectedArticle.audio} className="w-full" />
              </div>
            )}

            {/* Alerte stock */}
            {(() => {
              const level = getAlertLevel(selectedArticle);
              const percent = getStockPercent(selectedArticle);
              if (level === 'ok') return null;
              return (
                <div className={`p-4 rounded-lg border ${
                  level === 'out' ? 'bg-red-50 border-red-300' :
                  level === 'critical' ? 'bg-orange-50 border-orange-300' :
                  'bg-yellow-50 border-yellow-300'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className={`h-5 w-5 ${
                      level === 'out' ? 'text-red-600' :
                      level === 'critical' ? 'text-orange-600' : 'text-yellow-600'
                    }`} />
                    <h4 className="font-semibold text-gray-900">{getAlertLabel(level)}</h4>
                    <Badge variant={getAlertBadgeVariant(level)}>{getAlertLabel(level)}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Quantité actuelle: <span className="font-bold">{selectedArticle.quantity}</span></span>
                    <span>Seuil d'alerte: <span className="font-bold">{selectedArticle.alert_threshold}</span></span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${getBarColor(level)}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="text-sm mt-2 text-gray-600">
                    {level === 'out'
                      ? 'Cet article est en rupture totale. Réapprovisionnement urgent nécessaire.'
                      : level === 'critical'
                      ? `Quantité très basse (${selectedArticle.quantity}/${selectedArticle.alert_threshold}). Commandez rapidement.`
                      : `Quantité en dessous du seuil d'alerte. Pensez à réapprovisionner.`
                    }
                  </p>
                </div>
              );
            })()}

            {/* Informations */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Informations</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Nom:</span>
                  <p className="font-medium text-gray-900">{selectedArticle.name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Catégorie:</span>
                  <p className="font-medium text-gray-900">{selectedArticle.category}</p>
                </div>
                <div>
                  <span className="text-gray-600">Quantité:</span>
                  <p className={`font-bold text-lg ${
                    getAlertLevel(selectedArticle) !== 'ok' ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {selectedArticle.quantity}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Prix unitaire:</span>
                  <p className="font-medium text-gray-900">{formatCurrency(selectedArticle.unit_price)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Seuil d'alerte:</span>
                  <p className="font-medium text-gray-900">{selectedArticle.alert_threshold}</p>
                </div>
                <div>
                  <span className="text-gray-600">Statut:</span>
                  <Badge variant={getAlertBadgeVariant(getAlertLevel(selectedArticle))}>
                    {getAlertLabel(getAlertLevel(selectedArticle))}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Valeur totale:</span>
                  <p className="font-bold text-lg text-gray-900">
                    {formatCurrency(selectedArticle.quantity * selectedArticle.unit_price)}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDetailsModal(false);
                  handleEdit(selectedArticle);
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
    </div>
  );
};

export default StockPage;

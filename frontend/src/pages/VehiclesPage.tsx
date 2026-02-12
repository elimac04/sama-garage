import { useState, useRef, useEffect } from 'react';
import { Car, Plus, Search, Edit2, Trash2, Eye, Phone, Mail, Camera, Mic, MicOff, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Card, CardContent, Button, Input, Modal, Badge, EmptyState, Select } from '@/components/ui';
import { useToast } from '@/stores/toastStore';
import { useVehiclesStore, Vehicle } from '@/stores/vehiclesStore';
import { getBrandsList, getModelsByBrand, vehicleColors } from '@/data/vehicleData';


const VehiclesPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // États des filtres
  const [filters, setFilters] = useState({
    color: '',
    brand: '',
    model: '',
    year: ''
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [_audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  
  // États du formulaire
  const [formData, setFormData] = useState({
    registration_number: '',
    color: '',
    brand: '',
    model: '',
    year: '',
    owner_name: '',
    owner_phone: '',
    intervention_type: '',
    description: ''
  });
  
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const toast = useToast();
  
  const [submitting, setSubmitting] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string>('');
  
  // Utiliser le store de véhicules
  const { vehicles, loading, fetchVehicles, createVehicle, updateVehicle, deleteVehicle } = useVehiclesStore();

  // Charger les véhicules au montage
  useEffect(() => {
    fetchVehicles().catch(() => toast.error('Erreur lors du chargement des véhicules'));
  }, []);

  const filteredVehicles = vehicles.filter(vehicle => {
    // Filtre de recherche
    const matchesSearch = searchQuery === '' || 
      vehicle.registration_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.owner_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filtres spécifiques
    const matchesColor = filters.color === '' || vehicle.color === filters.color;
    const matchesBrand = filters.brand === '' || vehicle.brand === filters.brand;
    const matchesModel = filters.model === '' || vehicle.model === filters.model;
    const matchesYear = filters.year === '' || String(vehicle.year) === filters.year;
    
    return matchesSearch && matchesColor && matchesBrand && matchesModel && matchesYear;
  });
  
  // Extraire les valeurs uniques pour les filtres
  const uniqueColors = Array.from(new Set(vehicles.map(v => v.color))).sort();
  const uniqueBrands = Array.from(new Set(vehicles.map(v => v.brand))).sort();
  const uniqueModels = Array.from(new Set(vehicles.filter(v => 
    filters.brand === '' || v.brand === filters.brand
  ).map(v => v.model))).sort();
  const uniqueYears = Array.from(new Set(vehicles.map(v => v.year))).sort().reverse();

  // Attacher le stream à la vidéo une fois qu'elle est montée
  useEffect(() => {
    if (stream && videoRef.current && showCamera) {
      videoRef.current.srcObject = stream;
      setCameraLoading(false);
      
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().then(() => {
          toast.success('Caméra activée');
        }).catch(() => {
          toast.error('Erreur de lecture vidéo');
        });
      };
    }
  }, [stream, showCamera, toast]);

  // Mettre à jour les modèles disponibles quand la marque change
  useEffect(() => {
    if (formData.brand) {
      const models = getModelsByBrand(formData.brand);
      setAvailableModels(models);
      // Réinitialiser le modèle si la marque change
      if (formData.model && !models.includes(formData.model)) {
        setFormData(prev => ({ ...prev, model: '' }));
      }
    } else {
      setAvailableModels([]);
    }
  }, [formData.brand, formData.model]);

  // Gestion des photos uploadées
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPhotos: string[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPhotos.push(reader.result as string);
          if (newPhotos.length === files.length) {
            setPhotos(prev => [...prev, ...newPhotos]);
            toast.success(`${files.length} photo(s) ajoutée(s)`);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Ouvrir la caméra
  const openCamera = async () => {
    setCameraLoading(true);
    setShowCamera(true);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true
      });
      setStream(mediaStream);
    } catch {

      toast.error('Impossible d\'accéder à la caméra');
      setShowCamera(false);
      setCameraLoading(false);
    }
  };

  // Fermer la caméra
  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  // Capturer une photo depuis le flux vidéo
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Définir les dimensions du canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Dessiner l'image vidéo sur le canvas
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convertir en base64
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        setPhotos(prev => [...prev, photoData]);
        toast.success('Photo capturée !');
      }
    }
  };

  // Gestion de l'enregistrement audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        // Convertir en base64 pour stockage en base
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioBase64(reader.result as string);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
        toast.success('Enregistrement audio terminé');
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      toast.info('Enregistrement audio en cours...');
    } catch (error) {
      toast.error('Erreur d\'accès au microphone');
      console.error(error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const deleteAudio = () => {
    setAudioBlob(null);
    setAudioUrl('');
    setAudioBase64('');
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setPhotos([]);
    setAudioBlob(null);
    setAudioUrl('');
    setAudioBase64('');
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    
    // Fermer la caméra si elle est ouverte
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    
    // Réinitialiser le formulaire
    setFormData({
      registration_number: '',
      color: '',
      brand: '',
      model: '',
      year: '',
      owner_name: '',
      owner_phone: '',
      intervention_type: '',
      description: ''
    });
    
    // Réinitialiser le mode édition
    setEditingVehicle(null);
  };

  const handleViewDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetailsModal(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      registration_number: vehicle.registration_number,
      color: vehicle.color,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year.toString(),
      owner_name: vehicle.owner_name,
      owner_phone: vehicle.owner_phone,
      intervention_type: vehicle.intervention_type || '',
      description: vehicle.description || ''
    });
    setPhotos(vehicle.photos || []);
    // Pré-charger l'audio (peut être base64 depuis la DB)
    if (vehicle.audioUrl) {
      setAudioUrl(vehicle.audioUrl);
      setAudioBase64(vehicle.audioUrl);
    }
    setShowModal(true);
  };

  const handleDelete = async (vehicle: Vehicle) => {
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le véhicule ${vehicle.brand} ${vehicle.model} (${vehicle.registration_number}) ?\n\nCette action est irréversible.`
    );
    
    if (confirmed) {
      try {
        await deleteVehicle(vehicle.id);
        toast.success('Véhicule supprimé avec succès !');
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleSubmit = async () => {
    // Validation des photos
    if (photos.length < 4) {
      toast.error('Veuillez ajouter au moins 4 photos du véhicule');
      return;
    }
    
    // Validation des champs obligatoires
    if (!formData.registration_number.trim()) {
      toast.error('L\'immatriculation est obligatoire');
      return;
    }
    if (!formData.color.trim()) {
      toast.error('La couleur est obligatoire');
      return;
    }
    if (!formData.brand.trim()) {
      toast.error('La marque est obligatoire');
      return;
    }
    if (!formData.model.trim()) {
      toast.error('Le modèle est obligatoire');
      return;
    }
    if (!formData.owner_name.trim()) {
      toast.error('Le nom du propriétaire est obligatoire');
      return;
    }
    if (!formData.owner_phone.trim()) {
      toast.error('Le téléphone du propriétaire est obligatoire');
      return;
    }
    if (!formData.intervention_type) {
      toast.error('Le type d\'intervention est obligatoire');
      return;
    }

    setSubmitting(true);
    
    try {
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, {
          registration_number: formData.registration_number,
          brand: formData.brand,
          model: formData.model,
          year: formData.year || undefined,
          color: formData.color,
          owner_name: formData.owner_name,
          owner_phone: formData.owner_phone,
          photos: photos,
          audio_url: audioBase64 || undefined,
          description: formData.description || undefined,
          intervention_type: formData.intervention_type,
        });
        toast.success('Véhicule modifié avec succès !');
      } else {
        await createVehicle({
          registration_number: formData.registration_number,
          brand: formData.brand,
          model: formData.model,
          year: formData.year || undefined,
          color: formData.color,
          owner_name: formData.owner_name,
          owner_phone: formData.owner_phone,
          photos: photos,
          audio_url: audioBase64 || undefined,
          description: formData.description || undefined,
          intervention_type: formData.intervention_type,
        });
        toast.success('Véhicule enregistré avec succès !');
      }
      handleCloseModal();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Erreur lors de l\'opération');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && vehicles.length === 0) {
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Véhicules</h1>
          <p className="text-gray-600 mt-1">Gérer les véhicules enregistrés</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Nouveau véhicule
        </Button>
      </div>

      {/* Barre de recherche et filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par immatriculation, marque, modèle ou propriétaire..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtres */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Select
                label="Couleur"
                value={filters.color}
                onChange={(e) => setFilters(prev => ({ ...prev, color: e.target.value }))}
                options={[
                  { value: '', label: 'Toutes les couleurs' },
                  ...uniqueColors.map(color => ({ value: color, label: color }))
                ]}
              />
              <Select
                label="Marque"
                value={filters.brand}
                onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value, model: '' }))}
                options={[
                  { value: '', label: 'Toutes les marques' },
                  ...uniqueBrands.map(brand => ({ value: brand, label: brand }))
                ]}
              />
              <Select
                label="Modèle"
                value={filters.model}
                onChange={(e) => setFilters(prev => ({ ...prev, model: e.target.value }))}
                options={[
                  { value: '', label: 'Tous les modèles' },
                  ...uniqueModels.map(model => ({ value: model, label: model }))
                ]}
                disabled={!filters.brand && uniqueModels.length === 0}
              />
              <Select
                label="Année"
                value={filters.year}
                onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
                options={[
                  { value: '', label: 'Toutes les années' },
                  ...uniqueYears.map(year => ({ value: String(year), label: String(year) }))
                ]}
              />
            </div>

            {/* Résultats et bouton de réinitialisation */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-primary-600">{filteredVehicles.length}</span> véhicule(s) trouvé(s)
                {(searchQuery || filters.color || filters.brand || filters.model || filters.year) && 
                  ` sur ${vehicles.length}`}
              </p>
              
              {(filters.color || filters.brand || filters.model || filters.year) && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setFilters({ color: '', brand: '', model: '', year: '' })}
                >
                  <X className="h-4 w-4 mr-1" />
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des véhicules */}
      {filteredVehicles.length === 0 && searchQuery === '' && !filters.color && !filters.brand && !filters.model && !filters.year ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Car}
              title="Aucun véhicule"
              description="Commencez par enregistrer votre premier véhicule"
              actionLabel="Ajouter un véhicule"
              onAction={() => setShowModal(true)}
            />
          </CardContent>
        </Card>
      ) : filteredVehicles.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Search}
              title="Aucun résultat"
              description="Aucun véhicule ne correspond à vos critères de recherche ou filtres"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2">
              <CardContent className="p-0">
                {/* En-tête de la carte avec gradient */}
                <div className="bg-gradient-to-r from-primary-500 to-primary-700 p-4 rounded-t-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-md">
                        <Car className="h-7 w-7 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">{vehicle.brand}</h3>
                        <p className="text-sm text-primary-100">{vehicle.model}</p>
                      </div>
                    </div>
                    <Badge variant="info" className="bg-white text-primary-700 font-semibold">
                      {vehicle.year}
                    </Badge>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Immatriculation */}
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 shadow-inner">
                    <p className="text-center font-mono font-extrabold text-xl text-gray-900 tracking-wider">
                      {vehicle.registration_number}
                    </p>
                  </div>

                  {/* Couleur avec pastille uniquement */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Couleur:</span>
                    <div 
                      className="w-8 h-8 rounded-full border-3 border-white shadow-lg ring-2 ring-gray-300" 
                      style={{ 
                        backgroundColor: vehicleColors.find(c => c.name === vehicle.color)?.hex || vehicle.color.toLowerCase() 
                      }}
                      title={vehicle.color}
                    />
                  </div>

                  {/* Propriétaire */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600 font-semibold mb-2 uppercase tracking-wide">Propriétaire</p>
                    <div className="space-y-1.5">
                      <p className="font-bold text-gray-900">{vehicle.owner_name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Phone className="h-3.5 w-3.5 text-blue-600" />
                        <span>{vehicle.owner_phone}</span>
                      </div>
                      {vehicle.owner_email && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Mail className="h-3.5 w-3.5 text-blue-600" />
                          <span className="truncate">{vehicle.owner_email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Type d'intervention */}
                  {vehicle.intervention_type && (
                    <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-green-700 font-semibold uppercase tracking-wide">Intervention</span>
                        <Badge variant="success" className="text-xs">
                          {vehicle.intervention_type === 'diagnostic' && '🔍 Diagnostic'}
                          {vehicle.intervention_type === 'repair' && '🔧 Réparation'}
                          {vehicle.intervention_type === 'maintenance' && '⚙️ Entretien'}
                          {vehicle.intervention_type === 'bodywork' && '🎨 Carrosserie'}
                          {vehicle.intervention_type === 'tire' && '🛞 Pneumatiques'}
                          {vehicle.intervention_type === 'electrical' && '⚡ Électrique'}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="flex-1 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => handleViewDetails(vehicle)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="flex-1 hover:bg-green-50 hover:text-green-700"
                      onClick={() => handleEdit(vehicle)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="flex-1 text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(vehicle)}
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
        title={editingVehicle ? "Modifier le véhicule" : "Nouveau véhicule"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingVehicle ? (submitting ? 'Enregistrement...' : 'Enregistrer les modifications') : (submitting ? 'Enregistrement...' : 'Enregistrer')}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Photos du véhicule - OBLIGATOIRE */}
          <div className="p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-yellow-700" />
                <h3 className="font-semibold text-yellow-900">Photos du véhicule *</h3>
              </div>
              <Badge variant="warning">4 photos minimum</Badge>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              Prenez ou uploadez des photos de l'état du véhicule lors de sa réception
            </p>
            
            {/* Input pour upload de fichiers */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoCapture}
              className="hidden"
            />
            
            {/* Deux boutons d'options */}
            {!showCamera && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Button 
                  type="button"
                  onClick={openCamera}
                  variant="secondary"
                  className="flex items-center justify-center gap-2"
                >
                  <Camera className="h-5 w-5" />
                  Prendre photo
                </Button>
                
                <Button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  variant="secondary"
                  className="flex items-center justify-center gap-2"
                >
                  <ImageIcon className="h-5 w-5" />
                  Uploader
                </Button>
              </div>
            )}

            {/* Interface de caméra en temps réel */}
            {showCamera && (
              <div className="mb-3 space-y-3">
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ height: 'min(400px, 50vh)' }}>
                  {cameraLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-3"></div>
                        <p className="text-sm text-white">Activation de la caméra...</p>
                      </div>
                    </div>
                  )}
                  
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Overlay d'aide */}
                  {!cameraLoading && (
                    <div className="absolute top-2 left-2 right-2 bg-black/50 text-white text-xs p-2 rounded">
                      Positionnez le véhicule dans le cadre et cliquez sur Capturer
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    type="button"
                    onClick={capturePhoto}
                    disabled={cameraLoading}
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                  >
                    <Camera className="h-5 w-5" />
                    Capturer
                  </Button>
                  
                  <Button 
                    type="button"
                    onClick={closeCamera}
                    variant="secondary"
                    className="flex items-center justify-center gap-2"
                  >
                    <X className="h-5 w-5" />
                    Fermer
                  </Button>
                </div>
              </div>
            )}

            {/* Compteur de photos */}
            <div className={`text-sm font-medium mb-2 ${
              photos.length >= 4 ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {photos.length}/4 photos ajoutées
              {photos.length >= 4 && ' ✓'}
            </div>

            {/* Aperçu des photos */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={photo} 
                      alt={`Photo ${index + 1}`}
                      className="w-full h-24 sm:h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Informations du véhicule */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Car className="h-5 w-5 text-primary-600" />
              Informations du véhicule
            </h3>
            
            <Input
              label="Immatriculation"
              placeholder="DK-1234-AB"
              value={formData.registration_number}
              onChange={(e) => setFormData(prev => ({ ...prev, registration_number: e.target.value }))}
              required
            />
            
            {/* Sélecteur de couleur visuel */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Couleur du véhicule <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3">
                {vehicleColors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color: color.name }))}
                    className={`group relative flex flex-col items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                      formData.color === color.name
                        ? 'border-primary-600 bg-primary-50 shadow-md scale-105'
                        : 'border-gray-200 hover:border-gray-400 hover:shadow-sm'
                    }`}
                    title={color.label}
                  >
                    <div
                      className="w-10 h-10 rounded-full border-2 border-gray-300 shadow-sm"
                      style={{ backgroundColor: color.hex }}
                    >
                      {formData.color === color.name && (
                        <div className="w-full h-full rounded-full border-4 border-primary-600 flex items-center justify-center">
                          <span className="text-white text-lg font-bold">✓</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
                      {color.label}
                    </span>
                  </button>
                ))}
              </div>
              {formData.color && (
                <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
                  <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                  Sélectionné: <strong>{formData.color}</strong>
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Marque"
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                options={[
                  { value: '', label: 'Sélectionner une marque' },
                  ...getBrandsList().map(brand => ({ value: brand, label: brand }))
                ]}
                required
              />
              <Select
                label="Modèle"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                options={[
                  { value: '', label: formData.brand ? 'Sélectionner un modèle' : 'Sélectionner d\'abord une marque' },
                  ...availableModels.map(model => ({ value: model, label: model }))
                ]}
                disabled={!formData.brand}
                required
              />
            </div>

            <Input
              label="Année"
              type="number"
              placeholder="2020"
              value={formData.year}
              onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
            />
          </div>

          {/* Informations du propriétaire */}
          <div className="pt-4 border-t border-gray-200 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary-600" />
              Informations du propriétaire
            </h3>
            
            <Input
              label="Nom complet"
              placeholder="Amadou Ba"
              value={formData.owner_name}
              onChange={(e) => setFormData(prev => ({ ...prev, owner_name: e.target.value }))}
              required
            />
            
            <Input
              label="Téléphone"
              type="tel"
              placeholder="+221 77 123 45 67"
              value={formData.owner_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, owner_phone: e.target.value }))}
              required
            />
          </div>

          {/* Type d'intervention */}
          <div className="pt-4 border-t border-gray-200 space-y-4">
            <h3 className="font-semibold text-gray-900">Type d'intervention</h3>
            <Select
              label="Sélectionner le type"
              value={formData.intervention_type}
              onChange={(e) => setFormData(prev => ({ ...prev, intervention_type: e.target.value }))}
              options={[
                { value: '', label: 'Choisir un type' },
                { value: 'diagnostic', label: 'Diagnostic' },
                { value: 'repair', label: 'Réparation' },
                { value: 'maintenance', label: 'Entretien' },
                { value: 'bodywork', label: 'Carrosserie' },
                { value: 'tire', label: 'Pneumatiques' },
                { value: 'electrical', label: 'Électrique' },
              ]}
              required
            />
          </div>

          {/* Description textuelle */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Description du problème
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              placeholder="Décrivez la raison de la venue du véhicule, les problèmes constatés, etc..."
            />
          </div>

          {/* Enregistrement audio */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Mic className="h-5 w-5 text-blue-700" />
              <h3 className="font-semibold text-blue-900">Description vocale</h3>
              <Badge variant="info">Optionnel</Badge>
            </div>
            <p className="text-sm text-blue-700 mb-3">
              Enregistrez une description vocale du problème
            </p>
            
            {!isRecording && !audioUrl && (
              <Button 
                type="button"
                onClick={startRecording}
                variant="secondary"
                className="w-full"
              >
                <Mic className="h-5 w-5 mr-2" />
                Démarrer l'enregistrement
              </Button>
            )}
            
            {isRecording && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-red-50 border-2 border-red-300 rounded-lg">
                  <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-red-900">Enregistrement en cours...</span>
                </div>
                <Button 
                  type="button"
                  onClick={stopRecording}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  <MicOff className="h-5 w-5 mr-2" />
                  Arrêter l'enregistrement
                </Button>
              </div>
            )}
            
            {audioUrl && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 border-2 border-green-300 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <Mic className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm text-green-900 font-medium">Audio enregistré ✓</span>
                  </div>
                  <Button 
                    type="button"
                    onClick={deleteAudio}
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Player audio bien visible */}
                <div className="bg-white p-4 rounded-lg border-2 border-blue-300 shadow-sm">
                  <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    Cliquez sur play pour réécouter votre enregistrement
                  </p>
                  <audio controls className="w-full" style={{ height: '40px' }}>
                    <source src={audioUrl} type="audio/webm" />
                    Votre navigateur ne supporte pas l'élément audio.
                  </audio>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal de détails du véhicule */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Fiche du véhicule"
        size="xl"
      >
        {selectedVehicle && (
          <div className="space-y-6">
            {/* Photos du véhicule */}
            {selectedVehicle.photos && selectedVehicle.photos.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary-600" />
                  Photos du véhicule ({selectedVehicle.photos.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
                  {selectedVehicle.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={photo} 
                        alt={`Photo ${index + 1}`}
                        className="w-full h-32 sm:h-48 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        Photo {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Informations du véhicule */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Car className="h-5 w-5 text-primary-600" />
                Informations du véhicule
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-sm text-gray-600">Immatriculation</p>
                  <p className="font-mono font-bold text-lg text-gray-900">{selectedVehicle.registration_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Couleur</p>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" style={{ backgroundColor: selectedVehicle.color.toLowerCase() }} />
                    <p className="font-medium text-gray-900">{selectedVehicle.color}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-sm text-gray-600">Marque</p>
                  <p className="font-medium text-gray-900">{selectedVehicle.brand}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Modèle</p>
                  <p className="font-medium text-gray-900">{selectedVehicle.model}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Année</p>
                <Badge variant="info">{selectedVehicle.year}</Badge>
              </div>
            </div>

            {/* Informations du propriétaire */}
            <div className="p-4 bg-blue-50 rounded-lg space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary-600" />
                Informations du propriétaire
              </h3>
              
              <div>
                <p className="text-sm text-gray-600">Nom complet</p>
                <p className="font-medium text-gray-900">{selectedVehicle.owner_name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Téléphone</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <p className="font-medium text-gray-900">{selectedVehicle.owner_phone}</p>
                </div>
              </div>

              {selectedVehicle.owner_email && (
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <p className="font-medium text-gray-900">{selectedVehicle.owner_email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Type d'intervention */}
            {selectedVehicle.intervention_type && (
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Type d'intervention</h3>
                <Badge variant="success">
                  {selectedVehicle.intervention_type === 'diagnostic' && 'Diagnostic'}
                  {selectedVehicle.intervention_type === 'repair' && 'Réparation'}
                  {selectedVehicle.intervention_type === 'maintenance' && 'Entretien'}
                  {selectedVehicle.intervention_type === 'bodywork' && 'Carrosserie'}
                  {selectedVehicle.intervention_type === 'tire' && 'Pneumatiques'}
                  {selectedVehicle.intervention_type === 'electrical' && 'Électrique'}
                </Badge>
              </div>
            )}

            {/* Description textuelle */}
            {selectedVehicle.description && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Description du problème</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedVehicle.description}</p>
              </div>
            )}

            {/* Audio enregistré */}
            {selectedVehicle.audioUrl && (
              <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                    <Mic className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Description vocale</h3>
                    <p className="text-xs text-gray-600">Cliquez sur play pour écouter</p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <audio controls className="w-full" style={{ height: '40px' }}>
                    <source src={selectedVehicle.audioUrl} type="audio/webm" />
                    Votre navigateur ne supporte pas l'élément audio.
                  </audio>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-200">
              <Button 
                variant="secondary" 
                className="flex-1"
                onClick={() => setShowDetailsModal(false)}
              >
                Fermer
              </Button>
              <Button 
                className="flex-1"
                onClick={() => {
                  setShowDetailsModal(false);
                  handleEdit(selectedVehicle);
                }}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VehiclesPage;

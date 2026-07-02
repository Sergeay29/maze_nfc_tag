import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Zap, Eye, EyeOff } from 'lucide-react';
import { Card, Button, Input, Modal, Badge } from '../../components';
import { getServices, createService, updateService, deleteService } from '../../api/enterpriseApi';
import type { Service } from '../../data/mockData';

const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<Partial<Service>>({
    name: '',
    description: '',
    pointsToAdd: 10,
    icon: '',
    color: '#6A35FF',
    isActive: true,
  });

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await getServices();
      setServices(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData(service);
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        pointsToAdd: 10,
        icon: '',
        color: '#6A35FF',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        await updateService(editingService.id, formData);
      } else {
        await createService(formData);
      }
      setIsModalOpen(false);
      fetchServices();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du service:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
      try {
        await deleteService(id);
        fetchServices();
      } catch (error) {
        console.error('Erreur lors de la suppression du service:', error);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-dark">Services</h1>
          <p className="text-slate mt-1">Gérez les services et les points attribués</p>
        </div>
        <Button onClick={() => handleOpenModal()} leftIcon={<Plus className="w-5 h-5" />}>
          Nouveau service
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id} padding="none" className="overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: service.color + '20' }}
                  >
                    <Zap className="w-6 h-6" style={{ color: service.color }} />
                  </div>
                  <Badge variant={service.isActive ? 'success' : 'warning'}>
                    {service.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold font-poppins text-dark mb-2">
                  {service.name}
                </h3>
                {service.description && (
                  <p className="text-sm text-slate mb-4">{service.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-primary">
                      +{service.pointsToAdd.toLocaleString()} pts
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenModal(service)}
                      leftIcon={<Edit className="w-4 h-4" />}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(service.id)}
                      leftIcon={<Trash2 className="w-4 h-4" />}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {services.length === 0 && (
            <Card className="col-span-full py-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dark">Aucun service</h3>
                  <p className="text-slate">Créez votre premier service pour commencer</p>
                </div>
                <Button onClick={() => handleOpenModal()} leftIcon={<Plus className="w-5 h-5" />}>
                  Nouveau service
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? 'Modifier le service' : 'Nouveau service'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark mb-2">Nom du service *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Coupe de cheveux"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark mb-2">Description</label>
            <Input
              as="textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description du service"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark mb-2">Points à ajouter *</label>
            <Input
              type="number"
              value={formData.pointsToAdd}
              onChange={(e) => setFormData({ ...formData, pointsToAdd: parseInt(e.target.value) || 0 })}
              placeholder="10"
              min="0"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-2">Icône (URL)</label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="URL de l'icône"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-2">Couleur</label>
              <Input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-primary rounded border-slate focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-dark">
              Service actif
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              {editingService ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ServicesPage;

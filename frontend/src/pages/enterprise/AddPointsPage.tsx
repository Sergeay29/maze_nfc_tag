import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Star, MessageSquare, Award, Loader2, Zap, Coffee, ShoppingBag, Utensils, 
  Star as StarIcon, Gift, Scissors, Camera, Music, Heart, Sparkles, 
  Home, Phone, Mail, Calendar, Clock, Settings, User, Users, ShoppingCart, 
  CreditCard, MapPin, Building, Briefcase, FileText, Check, X, MoreHorizontal, 
  Bell, Bookmark, Tag, DollarSign, Euro, Activity, TrendingUp, TrendingDown, Trophy 
} from 'lucide-react';
import { Button, Input, Select, Card, Toast } from '../../components';
import { useNavigate, useParams } from 'react-router-dom';
import { getClientDetail, getServices, adjustPoints } from '../../api/enterpriseApi';
import type { ClientData, ServiceData } from '../../api/enterpriseApi';

// Icônes prédéfinies (même que dans ServicesPage)
const ICON_MAP: Record<string, any> = {
  zap: Zap,
  coffee: Coffee,
  'shopping-bag': ShoppingBag,
  utensils: Utensils,
  star: StarIcon,
  gift: Gift,
  scissors: Scissors,
  camera: Camera,
  music: Music,
  heart: Heart,
  sparkles: Sparkles,
  home: Home,
  phone: Phone,
  mail: Mail,
  calendar: Calendar,
  clock: Clock,
  settings: Settings,
  user: User,
  users: Users,
  'shopping-cart': ShoppingCart,
  'credit-card': CreditCard,
  'map-pin': MapPin,
  building: Building,
  briefcase: Briefcase,
  'file-text': FileText,
  check: Check,
  x: X,
  bell: Bell,
  bookmark: Bookmark,
  tag: Tag,
  'dollar-sign': DollarSign,
  euro: Euro,
  activity: Activity,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  award: Award,
  trophy: Trophy,
  'more-horizontal': MoreHorizontal,
};

const AddPointsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [client, setClient] = useState<ClientData | null>(null);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [clientData, servicesData] = await Promise.all([
          getClientDetail(id),
          getServices({ activeOnly: true }),
        ]);
        setClient(clientData);
        setServices(servicesData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const serviceOptions = services.map((service) => {
    const IconComponent = ICON_MAP[service.icon || 'zap'] || Zap;
    return {
      value: service.id,
      label: `${service.name} (+${service.pointsToAdd} pts)`,
      icon: IconComponent,
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !points || parseInt(points) === 0) return;

    try {
      setSubmitting(true);
      
      // Si un service est sélectionné, utiliser ses points
      let pointsToAdd = parseInt(points);
      let finalReason = reason;
      
      if (selectedServiceId) {
        const selectedService = services.find((s) => s.id === selectedServiceId);
        if (selectedService && !points) {
          pointsToAdd = selectedService.pointsToAdd;
        }
        if (selectedService && !reason) {
          finalReason = `Service : ${selectedService.name}`;
        }
      }

      await adjustPoints({
        clientId: id,
        points: pointsToAdd,
        reason: finalReason,
      });
      
      setToast({ message: `${pointsToAdd > 0 ? '+' : ''}${pointsToAdd} points ajoutés avec succès !`, variant: 'success' });
      setTimeout(() => navigate(-1), 1500);
    } catch (error) {
      console.error('Erreur lors de l\'ajout des points:', error);
      setToast({ message: 'Erreur lors de l\'ajout des points', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-fill points when a service is selected
  useEffect(() => {
    if (selectedServiceId) {
      const selectedService = services.find((s) => s.id === selectedServiceId);
      if (selectedService) {
        setPoints(String(selectedService.pointsToAdd));
        if (!reason) {
          setReason(`Service : ${selectedService.name}`);
        }
      }
    }
  }, [selectedServiceId, services, reason]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-slate">Client non trouvé</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-cloud transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5 text-slate" />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-poppins text-dark">
            Ajouter des points
          </h1>
          <p className="text-slate mt-1">Ajoutez des points au client</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold font-poppins text-dark mb-6">
            Informations
          </h2>
          <div className="space-y-4">
            <Select
              label="Service utilisé (optionnel)"
              options={serviceOptions}
              value={selectedServiceId}
              onChange={setSelectedServiceId}
              placeholder="Sélectionner un service"
            />
            <Input
              label="Nombre de points"
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="50"
              icon={<Star className="w-5 h-5" />}
              required
            />
            <Input
              label="Raison"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Service effectué"
              icon={<MessageSquare className="w-5 h-5" />}
            />
            <Button 
              fullWidth 
              icon={submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Star className="w-5 h-5" />}
              disabled={submitting}
              type="submit"
            >
              {submitting ? 'Ajout en cours...' : 'Ajouter les points'}
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold font-poppins text-dark mb-6">
            Profil client
          </h2>
          <div className="text-center mb-6">
            {client.photo ? (
              <img
                src={client.photo}
                alt={client.name}
                className="w-24 h-24 rounded-2xl object-cover mx-auto mb-4"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">
                  {client.name.charAt(0)}
                </span>
              </div>
            )}
            <h3 className="text-xl font-semibold font-poppins text-dark">
              {client.name}
            </h3>
            {client.email && <p className="text-slate">{client.email}</p>}
          </div>

          <div className="bg-cloud rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate">Niveau actuel</span>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <span className="font-medium text-dark">{client.level}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate">Points actuels</span>
              <span className="font-semibold text-primary">{client.points.toLocaleString()}</span>
            </div>
            {points && !isNaN(parseInt(points)) && (
              <div className="pt-3 border-t border-slate/20">
                <div className="flex items-center justify-between">
                  <span className="text-slate">Nouveau solde</span>
                  <span className={`font-semibold ${parseInt(points) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(client.points + parseInt(points)).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </form>
    </div>
  );
};

export default AddPointsPage;

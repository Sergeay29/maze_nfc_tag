import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  PowerOff,
  Power,
  CreditCard,
  Users,
  QrCode,
  // Pencil,
  // Trash2,
} from 'lucide-react';
import { Card, Badge, Tabs, StatCard, Avatar, Modal, Input, Select, Button, LogoUpload, PhoneInput, Toast } from '../../components';
import { getEnterpriseDetail, updateEnterprise, deleteEnterprise } from '../../api/adminApi';
import { isValidPhoneNumber } from 'react-phone-number-input';
import type { Enterprise } from '../../data/mockData';
import { SUBSCRIPTION_PLAN_OPTIONS, getSubscriptionPlanLabel } from '../../config/subscriptions';

interface EnterpriseDetailData extends Enterprise {
  adminFirstName: string;
  adminLastName: string;
  totalClients: number;
  totalScans: number;
  activeCards: number;
  NFCCards?: Array<{ id: string; status: string; cardNumber?: string }>;
  Clients?: Array<{ id: string; name: string }>;
  Scans?: Array<{
    id: string; createdAt: string; pointsAdded?: number; notes?: string;
    Client?: { id: string; name: string };
    NFCCard?: { id: string; cardNumber: string; cardCode: string };
  }>;
  Subscription?: { plan: string; status: string; monthlyPrice: number };
}

interface EditForm {
  name: string;
  email: string;
  phone: string;
  location: string;
  adminFirstName: string;
  adminLastName: string;
  subscription: string;
  status: string;
  logo: string;
}


const STATUS_OPTIONS = [
  { value: 'active', label: 'Actif' },
  { value: 'suspended', label: 'Suspendu' },
  { value: 'inactive', label: 'Inactif' },
];

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const EnterpriseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('cards'); // ✅ Commencer par "cards" au lieu de "overview"
  const [enterprise, setEnterprise] = useState<EnterpriseDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [cardStatusFilter, setCardStatusFilter] = useState<string>('all'); // ✅ Ajout du filtre

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    name: '', email: '', phone: '', location: '',
    adminFirstName: '', adminLastName: '', subscription: 'Starter', status: 'active', logo: '',
  });
  const [editTouched, setEditTouched] = useState<Partial<Record<keyof EditForm, boolean>>>({});
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Toggle status confirm
  const [showToggleModal, setShowToggleModal] = useState(false);


  // Toast
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchEnterprise = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getEnterpriseDetail(id);
        setEnterprise(data as EnterpriseDetailData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchEnterprise();
  }, [id]);

  // ── Edit ──────────────────────────────────────────────────
  const editFieldErrors = useMemo(() => {
    const errors: Partial<Record<keyof EditForm, string>> = {};
    if (!editForm.name.trim()) errors.name = 'Le nom est obligatoire';
    if (!editForm.email.trim()) {
      errors.email = "L'email est obligatoire";
    } else if (!isValidEmail(editForm.email)) {
      errors.email = 'Email invalide';
    }
    if (editForm.phone && !isValidPhoneNumber(editForm.phone)) {
      errors.phone = 'Numéro invalide';
    }
    return errors;
  }, [editForm]);

  const isEditFormValid = Object.keys(editFieldErrors).length === 0;

  const handleEditField = (field: keyof EditForm, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    setEditTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditTouched({ name: true, email: true, phone: true });
    if (!isEditFormValid || !id) return;

    try {
      setSaving(true);
      setEditError(null);
      await updateEnterprise(id, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone || undefined,
        location: editForm.location || undefined,
        adminFirstName: editForm.adminFirstName || undefined,
        adminLastName: editForm.adminLastName || undefined,
        subscription: editForm.subscription as Enterprise['subscription'],
        status: editForm.status as Enterprise['status'],
        logo: editForm.logo || undefined,
      });
      // Recharger
      const updated = await getEnterpriseDetail(id);
      setEnterprise(updated as EnterpriseDetailData);
      setShowEditModal(false);
      setToast({ message: `Entreprise "${editForm.name}" mise à jour avec succès !`, variant: 'success' });
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
      setToast({ message: err instanceof Error ? err.message : 'Erreur lors de la sauvegarde', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!id) return;
    try {
      setDeleting(true);
      await deleteEnterprise(id);
      navigate('/admin/enterprises', { replace: true });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Erreur lors de la suppression', variant: 'error' });
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // ── Toggle status rapide ──────────────────────────────────
  const handleToggleStatus = () => {
    setShowToggleModal(true);
  };

  const handleToggleStatusConfirm = async () => {
    if (!enterprise || !id) return;
    const newStatus = enterprise.status === 'active' ? 'suspended' : 'active';
    try {
      setStatusUpdating(true);
      setShowToggleModal(false);
      await updateEnterprise(id, { status: newStatus });
      setEnterprise((prev) => prev ? { ...prev, status: newStatus } : prev);
      setToast({
        message: newStatus === 'suspended'
          ? `Entreprise "${enterprise.name}" suspendue avec succès !`
          : `Entreprise "${enterprise.name}" réactivée avec succès !`,
        variant: 'success',
      });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Erreur lors de la mise à jour', variant: 'error' });
    } finally {
      setStatusUpdating(false);
    }
  };


  const tabs = [
    { id: 'cards', label: 'Cartes' },
    { id: 'clients', label: 'Clients' },
    { id: 'scans', label: 'Scans' },
  ]; // ✅ Suppression de l'onglet "Vue d'ensemble"

  // const moduleIcons: Record<string, React.ReactNode> = {
  //   Fidélité: <Gift className="w-5 h-5" />,
  //   Conciergerie: <ConciergeBell className="w-5 h-5" />,
  //   Notifications: <Bell className="w-5 h-5" />,
  //   Récompenses: <Star className="w-5 h-5" />,
  // };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-slate animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (error || !enterprise) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate hover:text-primary transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour aux entreprises
        </button>
        <div className="p-4 bg-red-100 text-red-700 rounded-xl">
          {error || 'Entreprise non trouvée'}
        </div>
      </div>
    );
  }

  const totalCards = enterprise.NFCCards?.length ?? enterprise.cardsCount ?? 0;
  const activeCards =
    enterprise.activeCards ??
    enterprise.NFCCards?.filter((c) => c.status === 'active').length ?? 0;
  const totalClients = enterprise.totalClients ?? enterprise.Clients?.length ?? 0;
  const totalScans = enterprise.totalScans ?? enterprise.Scans?.length ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}
      {/* Header navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate hover:text-primary transition-colors duration-200 self-start"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour aux entreprises
        </button>

        {/* Actions admin */}
        {/* <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={<Pencil className="w-4 h-4" />}
            onClick={openEditModal}
          >
            Modifier
          </Button>
          <Button
            variant="secondary"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => setShowDeleteModal(true)}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Supprimer
          </Button>
        </div> */}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        {/* Sidebar infos */}
        <Card className="lg:w-80 flex-shrink-0">
          <div className="text-center">
            <Avatar
              src={enterprise.logo}
              name={enterprise.name}
              size="lg"
              shape="rounded"
              className="mx-auto mb-4"
            />
            <h1 className="text-xl font-bold font-poppins text-dark mb-2">
              {enterprise.name}
            </h1>
            <Badge
              variant={enterprise.status === 'active' ? 'active' : 'inactive'}
              size="md"
            >
              {enterprise.status === 'active' ? 'Actif' : enterprise.status === 'suspended' ? 'Suspendu' : 'Inactif'}
            </Badge>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 text-slate">
              <Mail className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{enterprise.email}</span>
            </div>
            {enterprise.phone && (
              <div className="flex items-center gap-3 text-slate">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <span>{enterprise.phone}</span>
              </div>
            )}
            {enterprise.location && (
              <div className="flex items-center gap-3 text-slate">
                <MapPin className="w-5 h-5 flex-shrink-0" />
                <span>{enterprise.location}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-slate">
              <Calendar className="w-5 h-5 flex-shrink-0" />
              <span>
                Créé le{' '}
                {new Date(enterprise.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
            {(enterprise.adminFirstName || enterprise.adminLastName) && (
              <div className="flex items-center gap-3 text-slate">
                <Users className="w-5 h-5 flex-shrink-0" />
                <span>
                  {enterprise.adminFirstName} {enterprise.adminLastName}
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-slate/10">
            <p className="text-sm text-slate mb-2">Abonnement</p>
            <Badge
              variant={
                enterprise.subscription === 'Enterprise'
                  ? 'platinum'
                  : enterprise.subscription === 'Pro'
                    ? 'gold'
                    : 'silver'
              }
              size="md"
            >
              {getSubscriptionPlanLabel(enterprise.subscription)}
            </Badge>
          </div>

          {/* Bouton activation / suspension */}
          <div className="mt-6 pt-6 border-t border-slate/10">
            <button
              onClick={handleToggleStatus}
              disabled={statusUpdating}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 ${enterprise.status === 'active'
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                  : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                }`}
            >
              {enterprise.status === 'active' ? (
                <>
                  <PowerOff className="w-4 h-4" />
                  {statusUpdating ? 'Suspension...' : 'Suspendre'}
                </>
              ) : (
                <>
                  <Power className="w-4 h-4" />
                  {statusUpdating ? 'Activation...' : 'Réactiver'}
                </>
              )}
            </button>
          </div>
        </Card>

        {/* Contenu principal */}
        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Cartes totales"
              value={totalCards.toLocaleString('fr-FR')}
              icon={<CreditCard className="w-5 h-5" />}
            />
            <StatCard
              title="Cartes actives"
              value={activeCards.toLocaleString('fr-FR')}
              icon={<CreditCard className="w-5 h-5" />}
            />
            <StatCard
              title="Clients"
              value={totalClients.toLocaleString('fr-FR')}
              icon={<Users className="w-5 h-5" />}
            />
            <StatCard
              title="Scans totaux"
              value={totalScans.toLocaleString('fr-FR')}
              icon={<QrCode className="w-5 h-5" />}
            />
          </div>

          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'cards' && (
            <Card>
              {enterprise.NFCCards && enterprise.NFCCards.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold font-poppins text-dark">
                      {enterprise.NFCCards.filter(card =>
                        cardStatusFilter === 'all' || card.status === cardStatusFilter
                      ).length} carte{enterprise.NFCCards.filter(card =>
                        cardStatusFilter === 'all' || card.status === cardStatusFilter
                      ).length > 1 ? 's' : ''} NFC
                    </h3>
                    <Select
                      options={[
                        { value: 'all', label: 'Toutes les cartes' },
                        { value: 'active', label: 'Actives' },
                        { value: 'inactive', label: 'Inactives' },
                        { value: 'unassigned', label: 'Non attribuées' },
                      ]}
                      value={cardStatusFilter}
                      onChange={setCardStatusFilter}
                      className="w-48"
                    />
                  </div>
                  <div className="space-y-3">
                    {enterprise.NFCCards
                      .filter(card => cardStatusFilter === 'all' || card.status === cardStatusFilter)
                      .map((card) => (
                        <div
                          key={card.id}
                          className="flex items-center justify-between p-3 bg-cloud rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-primary" />
                            <span className="font-mono text-sm text-dark">{card.cardNumber ?? card.id}</span>
                          </div>
                          <Badge
                            variant={
                              card.status === 'active' ? 'active'
                                : card.status === 'inactive' ? 'inactive' : 'warning'
                            }
                          >
                            {card.status === 'active' ? 'Active' : card.status === 'inactive' ? 'Inactive' : 'Non attribuée'}
                          </Badge>
                        </div>
                      ))}
                  </div>
                  {enterprise.NFCCards.filter(card => cardStatusFilter === 'all' || card.status === cardStatusFilter).length === 0 && (
                    <p className="text-slate text-center py-4">Aucune carte dans cette catégorie</p>
                  )}
                </div>
              ) : (
                <p className="text-slate">Aucune carte pour cette entreprise</p>
              )}
            </Card>
          )}

          {activeTab === 'clients' && (
            <Card>
              {enterprise.Clients && enterprise.Clients.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold font-poppins text-dark mb-4">
                    {enterprise.Clients.length} client{enterprise.Clients.length > 1 ? 's' : ''}
                  </h3>
                  {enterprise.Clients.map((client) => (
                    <div key={client.id} className="flex items-center gap-3 p-3 bg-cloud rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-gradient flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {client.name?.charAt(0) ?? '?'}
                        </span>
                      </div>
                      <span className="font-medium text-dark">{client.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate">Aucun client pour cette entreprise</p>
              )}
            </Card>
          )}

          {activeTab === 'scans' && (
            <Card>
              {enterprise.Scans && enterprise.Scans.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold font-poppins text-dark mb-4">
                    {enterprise.Scans.length} scan{enterprise.Scans.length > 1 ? 's' : ''}
                  </h3>
                  {enterprise.Scans.map((scan) => (
                    <div key={scan.id} className="flex items-center justify-between p-3 bg-cloud rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient flex items-center justify-center flex-shrink-0">
                          <QrCode className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-dark">
                            {scan.Client?.name ?? 'Client inconnu'}
                          </p>
                          <p className="text-xs text-slate font-mono">
                            {scan.NFCCard?.cardCode ?? scan.NFCCard?.cardNumber ?? '—'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${(scan.pointsAdded ?? 0) > 0 ? 'text-green-600' :
                            (scan.pointsAdded ?? 0) < 0 ? 'text-red-500' : 'text-slate'
                          }`}>
                          {(scan.pointsAdded ?? 0) > 0 ? '+' : ''}{scan.pointsAdded ?? 0} pts
                        </p>
                        <p className="text-xs text-slate">
                          {new Date(scan.createdAt).toLocaleString('fr-FR', {
                            day: '2-digit', month: '2-digit',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate">Aucun scan pour cette entreprise</p>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* ── Modale d'édition ───────────────────────────────── */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier l'entreprise"
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4" noValidate>
          {editError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{editError}</div>
          )}

          <LogoUpload
            label="Logo de l'entreprise"
            value={editForm.logo}
            onChange={(url) => handleEditField('logo', url)}
            previewName={editForm.name}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Nom de l'entreprise *"
                value={editForm.name}
                onChange={(e) => handleEditField('name', e.target.value)}
                onBlur={() => setEditTouched((p) => ({ ...p, name: true }))}
              />
              {editTouched.name && editFieldErrors.name && (
                <p className="mt-1 text-xs text-red-500">{editFieldErrors.name}</p>
              )}
            </div>
            <div>
              <Input
                label="Email *"
                type="email"
                value={editForm.email}
                onChange={(e) => handleEditField('email', e.target.value)}
                onBlur={() => setEditTouched((p) => ({ ...p, email: true }))}
              />
              {editTouched.email && editFieldErrors.email && (
                <p className="mt-1 text-xs text-red-500">{editFieldErrors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <PhoneInput
                label="Téléphone"
                value={editForm.phone}
                onChange={(val) => handleEditField('phone', val)}
              />
              {editTouched.phone && editFieldErrors.phone && (
                <p className="mt-1 text-xs text-red-500">{editFieldErrors.phone}</p>
              )}
            </div>
            <Input
              label="Localisation"
              value={editForm.location}
              onChange={(e) => handleEditField('location', e.target.value)}
              placeholder="Paris, France"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Prénom de l'admin"
              value={editForm.adminFirstName}
              onChange={(e) => handleEditField('adminFirstName', e.target.value)}
            />
            <Input
              label="Nom de l'admin"
              value={editForm.adminLastName}
              onChange={(e) => handleEditField('adminLastName', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Abonnement"
              options={SUBSCRIPTION_PLAN_OPTIONS}
              value={editForm.subscription}
              onChange={(val) => handleEditField('subscription', val)}
            />
            <Select
              label="Statut"
              options={STATUS_OPTIONS}
              value={editForm.status}
              onChange={(val) => handleEditField('status', val)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={() => setShowEditModal(false)}>
              Annuler
            </Button>
            <Button type="submit" fullWidth disabled={saving || !isEditFormValid}>
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modale de confirmation suppression ─────────────── */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Supprimer l'entreprise"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate">
            Vous êtes sur le point de supprimer <strong className="text-dark">{enterprise.name}</strong>. Cette action est
            irréversible et supprimera également toutes les cartes NFC, clients, scans et
            abonnements associés.
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              fullWidth
              disabled={deleting}
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
            >
              {deleting ? 'Suppression...' : 'Supprimer définitivement'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modale confirmation toggle statut ──────────────── */}
      <Modal
        isOpen={showToggleModal}
        onClose={() => setShowToggleModal(false)}
        title={enterprise.status === 'active' ? 'Suspendre l\'entreprise' : 'Réactiver l\'entreprise'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate">
            {enterprise.status === 'active'
              ? <>Êtes-vous sûr de vouloir suspendre <strong className="text-dark">{enterprise.name}</strong> ? Les utilisateurs de cette entreprise ne pourront plus se connecter.</>
              : <>Êtes-vous sûr de vouloir réactiver <strong className="text-dark">{enterprise.name}</strong> ?</>
            }
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" fullWidth onClick={() => setShowToggleModal(false)}>
              Annuler
            </Button>
            <button
              type="button"
              onClick={handleToggleStatusConfirm}
              disabled={statusUpdating}
              className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors text-white disabled:opacity-50 ${enterprise.status === 'active'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
                }`}
            >
              {statusUpdating
                ? (enterprise.status === 'active' ? 'Suspension...' : 'Activation...')
                : (enterprise.status === 'active' ? 'Suspendre' : 'Réactiver')
              }
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EnterpriseDetailPage;

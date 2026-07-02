import React, { useState, useEffect } from 'react';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Users,
  QrCode,
  Pencil,
  Save,
  X,
} from 'lucide-react';
import { Card, Badge, StatCard, Avatar, Button, Input, LogoUpload, PhoneInput } from '../../components';
import { getMyEnterprise, updateMyEnterprise, uploadFile } from '../../api/enterpriseApi';
import type { MyEnterpriseData } from '../../api/enterpriseApi';
import { useAuth } from '../../auth/useAuth';
import { isValidPhoneNumber } from 'react-phone-number-input';

const EnterpriseProfilePage: React.FC = () => {
  const { updateUserEnterprise } = useAuth();
  const [enterprise, setEnterprise] = useState<MyEnterpriseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const phoneError = editPhone && !isValidPhoneNumber(editPhone) ? 'Numéro de téléphone invalide' : undefined;
  const [editLocation, setEditLocation] = useState('');
  const [editLogo, setEditLogo] = useState('');
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editAdminFirstName, setEditAdminFirstName] = useState('');
  const [editAdminLastName, setEditAdminLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMyEnterprise();
        setEnterprise(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openEdit = () => {
    if (!enterprise) return;
    setEditName(enterprise.name ?? '');
    setEditPhone(enterprise.phone ?? '');
    setEditLocation(enterprise.location ?? '');
    setEditLogo(enterprise.logo ?? '');
    setEditLogoFile(null);
    setEditAdminFirstName(enterprise.adminFirstName ?? '');
    setEditAdminLastName(enterprise.adminLastName ?? '');
    setSaveError(null);
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const handleSave = async () => {
    if (!editName.trim()) {
      setSaveError('Le nom est obligatoire');
      return;
    }
    try {
      setSaving(true);
      setSaveError(null);
      // Upload du logo si un nouveau fichier a été sélectionné
      let finalLogo = editLogo;
      if (editLogoFile) {
        finalLogo = await uploadFile(editLogoFile);
      }
      const result = await updateMyEnterprise({
        name: editName.trim(),
        phone: editPhone || undefined,
        location: editLocation || undefined,
        logo: finalLogo || undefined,
        adminFirstName: editAdminFirstName || undefined,
        adminLastName: editAdminLastName || undefined,
      });
      setEnterprise((prev) => prev ? { ...prev, ...result, stats: prev.stats } : prev);
      // Mise à jour instantanée du Header sans rechargement
      updateUserEnterprise({ name: result.name, logo: result.logo ?? finalLogo });
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-slate animate-pulse">Chargement de votre profil...</div>
      </div>
    );
  }

  if (error || !enterprise) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-xl">
        {error || "Aucune entreprise associée à votre compte. Contactez l'administrateur."}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-dark">Mon entreprise</h1>
          <p className="text-slate mt-1">Vos informations et statistiques</p>
        </div>
        {!editing && (
          <Button icon={<Pencil className="w-4 h-4" />} onClick={openEdit}>
            Modifier mes informations
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Cartes NFC"
          value={(enterprise.stats?.totalCards ?? 0).toLocaleString('fr-FR')}
          icon={<CreditCard className="w-5 h-5" />}
        />
        <StatCard
          title="Cartes actives"
          value={(enterprise.stats?.activeCards ?? 0).toLocaleString('fr-FR')}
          icon={<CreditCard className="w-5 h-5" />}
        />
        <StatCard
          title="Clients"
          value={(enterprise.stats?.totalClients ?? 0).toLocaleString('fr-FR')}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="Scans (30j)"
          value={(enterprise.stats?.totalScansThisMonth ?? 0).toLocaleString('fr-FR')}
          icon={<QrCode className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne infos / édition */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold font-poppins text-dark">
                Informations de l'entreprise
              </h2>
              {editing && (
                <div className="flex gap-2">
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-1 text-sm text-slate hover:text-dark transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Annuler
                  </button>
                </div>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                {saveError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{saveError}</div>
                )}

                <LogoUpload
                  label="Logo"
                  value={editLogo}
                  onChange={setEditLogo}
                  onFileSelect={setEditLogoFile}
                  previewName={editName}
                />

                <Input
                  label="Nom de l'entreprise *"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  icon={<Building2 className="w-5 h-5" />}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PhoneInput
                    label="Téléphone"
                    value={editPhone}
                    onChange={setEditPhone}
                    error={phoneError}
                  />
                  <Input
                    label="Localisation"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    icon={<MapPin className="w-5 h-5" />}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Prénom de l'administrateur"
                    value={editAdminFirstName}
                    onChange={(e) => setEditAdminFirstName(e.target.value)}
                  />
                  <Input
                    label="Nom de l'administrateur"
                    value={editAdminLastName}
                    onChange={(e) => setEditAdminLastName(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="secondary" fullWidth onClick={cancelEdit} disabled={saving}>
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    fullWidth
                    icon={<Save className="w-4 h-4" />}
                    onClick={handleSave}
                    disabled={saving || !editName.trim() || !!phoneError}
                  >
                    {saving ? 'Sauvegarde...' : 'Enregistrer'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-cloud rounded-xl">
                  <Building2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate">Nom de l'entreprise</p>
                    <p className="font-medium text-dark">{enterprise.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-cloud rounded-xl">
                  <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate">Email</p>
                    <p className="font-medium text-dark">{enterprise.email}</p>
                  </div>
                </div>
                {enterprise.phone && (
                  <div className="flex items-center gap-3 p-3 bg-cloud rounded-xl">
                    <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate">Téléphone</p>
                      <p className="font-medium text-dark">{enterprise.phone}</p>
                    </div>
                  </div>
                )}
                {enterprise.location && (
                  <div className="flex items-center gap-3 p-3 bg-cloud rounded-xl">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate">Localisation</p>
                      <p className="font-medium text-dark">{enterprise.location}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 bg-cloud rounded-xl">
                  <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate">Date de création</p>
                    <p className="font-medium text-dark">
                      {new Date(enterprise.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                {(enterprise.adminFirstName || enterprise.adminLastName) && (
                  <div className="flex items-center gap-3 p-3 bg-cloud rounded-xl">
                    <Users className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate">Administrateur</p>
                      <p className="font-medium text-dark">
                        {enterprise.adminFirstName} {enterprise.adminLastName}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Abonnement */}
          <Card>
            <h2 className="text-lg font-semibold font-poppins text-dark mb-4">Abonnement</h2>
            <div className="flex items-center justify-between p-4 bg-cloud rounded-xl">
              <div>
                <p className="text-xs text-slate mb-1">Plan actuel</p>
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
                  {enterprise.subscription}
                </Badge>
              </div>
              {enterprise.Subscription && (
                <div className="text-right">
                  <p className="text-xs text-slate mb-1">Statut</p>
                  <Badge
                    variant={
                      enterprise.Subscription.status === 'active'
                        ? 'active'
                        : 'inactive'
                    }
                  >
                    {enterprise.Subscription.status === 'active'
                      ? 'Actif'
                      : enterprise.Subscription.status === 'paused'
                      ? 'En pause'
                      : 'Annulé'}
                  </Badge>
                </div>
              )}
            </div>
            {enterprise.Subscription?.monthlyPrice && (
              <p className="mt-3 text-sm text-slate text-center">
                {enterprise.Subscription.monthlyPrice}€ / mois
              </p>
            )}
          </Card>
        </div>

        {/* Colonne logo + modules */}
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold font-poppins text-dark mb-4">Logo</h3>
            <div className="text-center">
              <Avatar
                src={enterprise.logo}
                name={enterprise.name}
                size="lg"
                shape="rounded"
                className="mx-auto mb-3"
              />
              <p className="text-sm font-medium text-dark">{enterprise.name}</p>
              <Badge
                variant={enterprise.status === 'active' ? 'active' : 'inactive'}
                size="sm"
                className="mt-2"
              >
                {enterprise.status === 'active' ? 'Actif' : enterprise.status === 'suspended' ? 'Suspendu' : 'Inactif'}
              </Badge>
            </div>
          </Card>

          {enterprise.modules && enterprise.modules.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold font-poppins text-dark mb-4">
                Modules actifs
              </h3>
              <div className="space-y-2">
                {enterprise.modules.map((module) => (
                  <div
                    key={module}
                    className="flex items-center gap-2 px-3 py-2 bg-cloud rounded-xl"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm font-medium text-dark">{module}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Activité récente */}
          {enterprise.Scans && enterprise.Scans.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold font-poppins text-dark mb-4">
                Derniers scans
              </h3>
              <div className="space-y-2">
                {enterprise.Scans.slice(0, 5).map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between py-2 border-b border-slate/10 last:border-0">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-primary" />
                      <span className="text-sm text-dark">
                        {scan.pointsAdded ? `+${scan.pointsAdded} pts` : 'Consultation'}
                      </span>
                    </div>
                    <span className="text-xs text-slate">
                      {new Date(scan.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnterpriseProfilePage;

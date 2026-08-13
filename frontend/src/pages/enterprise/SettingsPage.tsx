import React, { useState, useEffect } from 'react';
import { Building2, Save, AlertTriangle, Shield } from 'lucide-react';
import { Card, Button, Input, Tabs, Badge, LogoUpload, Avatar, PhoneInput } from '../../components';
import TwoFactorSetup from '../../components/TwoFactorSetup';
import { getMyEnterprise, updateMyEnterprise, uploadFile } from '../../api/enterpriseApi';
import type { MyEnterpriseData } from '../../api/enterpriseApi';
import { useAuth } from '../../auth/useAuth';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { formatSubscriptionPrice, getSubscriptionPlanLabel } from '../../config/subscriptions';
import { useSearchParams } from 'react-router-dom';

const ENTERPRISE_2FA_ROLES = ['OWNER', 'MANAGER'] as const;

const EnterpriseSettingsPage: React.FC = () => {
  const { updateUserEnterprise, updateUser, user, mustSetup2FA } = useAuth();
  const [searchParams] = useSearchParams();
  const canManage2FA = ENTERPRISE_2FA_ROLES.includes(
    user?.Role?.name as (typeof ENTERPRISE_2FA_ROLES)[number]
  );
  const [activeTab, setActiveTab] = useState(
    searchParams.get('setup2fa') === '1' && canManage2FA ? 'security' : 'modules'
  );
  const [enterprise, setEnterprise] = useState<MyEnterpriseData | null>(null);
  const [loading, setLoading] = useState(true);

  // form info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const phoneError = phone && !isValidPhoneNumber(phone) ? 'Numéro de téléphone invalide' : undefined;
  const [location, setLocation] = useState('');
  const [logo, setLogo] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getMyEnterprise()
      .then((data) => {
        setEnterprise(data);
        setName(data.name ?? '');
        setPhone(data.phone ?? '');
        setLocation(data.location ?? '');
        setLogo(data.logo ?? '');
        setAdminFirstName(data.adminFirstName ?? '');
        setAdminLastName(data.adminLastName ?? '');
        setAdminEmail(data.email ?? '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setSaveMsg({ type: 'error', text: 'Le nom est obligatoire' }); return; }
    try {
      setSaving(true);
      setSaveMsg(null);
      const finalLogo = logoFile ? await uploadFile(logoFile) : (logo || undefined);
      const updated = await updateMyEnterprise({ name: name.trim(), phone: phone || undefined, location: location || undefined, logo: finalLogo, adminFirstName: adminFirstName || undefined, adminLastName: adminLastName || undefined });
      setEnterprise((prev) => prev ? { ...prev, ...updated, stats: prev.stats } : prev);
      updateUserEnterprise({ name: updated.name, logo: updated.logo ?? finalLogo });
      // Persiste firstName, lastName, email en BDD + met à jour le Header
      await updateUser({ firstName: adminFirstName || undefined, lastName: adminLastName || undefined, email: adminEmail || undefined });
      if (logoFile) setLogo(updated.logo ?? logo);
      setLogoFile(null);
      setSaveMsg({ type: 'success', text: 'Informations mises à jour avec succès' });
    } catch (err) {
      setSaveMsg({ type: 'error', text: err instanceof Error ? err.message : 'Erreur lors de la sauvegarde' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    ...(canManage2FA ? [{ id: 'security', label: 'Sécurité', icon: <Shield className="w-4 h-4" /> }] : []),
    { id: 'modules', label: 'Modules' },
    { id: 'subscription', label: 'Abonnement' },
    { id: 'notifications', label: 'Notifications' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-dark">Paramètres</h1>
        <p className="text-slate mt-1">Configurez votre entreprise</p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {mustSetup2FA && canManage2FA && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>
            La 2FA est obligatoire pour votre compte. Veuillez l'activer dans l'onglet Sécurité.
          </span>
        </div>
      )}

      {activeTab === 'security' && canManage2FA && (
        <TwoFactorSetup />
      )}

      {activeTab === 'info' && (
        <form onSubmit={handleSaveInfo}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <h2 className="text-lg font-semibold font-poppins text-dark mb-6">Informations entreprise</h2>
                {saveMsg && (
                  <div className={`mb-4 p-3 rounded-xl text-sm ${saveMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {saveMsg.text}
                  </div>
                )}
                <div className="space-y-4">
                  <Input label="Nom de l'entreprise *" value={name} onChange={(e) => setName(e.target.value)} icon={<Building2 className="w-5 h-5" />} required />
                  <Input label="Email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PhoneInput
                      label="Téléphone"
                      value={phone}
                      onChange={setPhone}
                      error={phoneError}
                    />
                    <Input label="Localisation" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ville, Pays" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Prénom administrateur" value={adminFirstName} onChange={(e) => setAdminFirstName(e.target.value)} />
                    <Input label="Nom administrateur" value={adminLastName} onChange={(e) => setAdminLastName(e.target.value)} />
                  </div>
                  <Button type="submit" icon={<Save className="w-4 h-4" />} disabled={saving || !!phoneError}>
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              </Card>
            </div>

            <Card>
              <h3 className="text-lg font-semibold font-poppins text-dark mb-6">Logo</h3>
              <div className="text-center mb-4">
                <Avatar src={logo} name={name} size="lg" shape="rounded" className="mx-auto mb-3" />
              </div>
              <LogoUpload label="Changer le logo" value={logo} onChange={setLogo} onFileSelect={setLogoFile} previewName={name} />
            </Card>
          </div>
        </form>
      )}

      {activeTab === 'modules' && (
        <Card>
          <h2 className="text-lg font-semibold font-poppins text-dark mb-4">Modules actifs</h2>
          <div className="space-y-3">
            {['Fidélité', 'Conciergerie', 'Notifications', 'Récompenses'].map((module) => (
              <div key={module} className="flex items-center justify-between p-4 bg-cloud rounded-xl">
                <span className="font-medium text-dark">{module}</span>
                <Badge variant={enterprise?.modules?.includes(module) ? 'active' : 'inactive'}>
                  {enterprise?.modules?.includes(module) ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate mt-4">Pour modifier vos modules, contactez votre administrateur Maze NFC.</p>
        </Card>
      )}

      {activeTab === 'subscription' && (
        <Card>
          <h2 className="text-lg font-semibold font-poppins text-dark mb-6">Abonnement</h2>
          <div className="text-center py-6">
            <Badge
              variant={enterprise?.subscription === 'Enterprise' ? 'platinum' : enterprise?.subscription === 'Pro' ? 'gold' : 'silver'}
              size="md"
            >
              {getSubscriptionPlanLabel(enterprise?.subscription)}
            </Badge>
            {enterprise?.Subscription && (
              <div className="mt-4 space-y-2">
                <Badge variant={enterprise.Subscription.status === 'active' ? 'active' : 'inactive'}>
                  {enterprise.Subscription.status === 'active' ? 'Actif' : enterprise.Subscription.status === 'paused' ? 'En pause' : 'Annulé'}
                </Badge>
                {enterprise.Subscription.monthlyPrice && (
                  <p className="text-slate text-sm">{formatSubscriptionPrice(enterprise.Subscription.monthlyPrice)} / mois</p>
                )}
              </div>
            )}
            <p className="mt-4 text-slate text-sm">Pour changer d'abonnement, contactez votre administrateur Maze NFC.</p>
          </div>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card>
          <h2 className="text-lg font-semibold font-poppins text-dark mb-4">Préférences de notifications</h2>
          <div className="space-y-3">
            {[
              { label: 'Alertes email', checked: true },
              { label: 'Notifications push', checked: true },
              { label: 'Rapports quotidiens', checked: false },
              { label: 'Alertes de niveau', checked: true },
            ].map((notif) => (
              <label key={notif.label} className="flex items-center justify-between p-4 bg-cloud rounded-xl cursor-pointer hover:bg-white transition-colors">
                <span className="font-medium text-dark">{notif.label}</span>
                <input type="checkbox" defaultChecked={notif.checked} className="w-4 h-4 text-primary rounded border-slate focus:ring-primary" />
              </label>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default EnterpriseSettingsPage;

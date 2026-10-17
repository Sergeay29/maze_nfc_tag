import React, { useEffect, useState } from 'react';
import { Check, Copy, Loader2, Plus, ShieldCheck, UserRound } from 'lucide-react';
import { Badge, Button, Card, Input, Modal, Table } from '../../components';
import type { Column } from '../../components';
import {
  createEnterpriseTeamMember,
  getEnterpriseTeam,
  updateEnterpriseTeamMember,
} from '../../api/enterpriseApi';
import type { EnterpriseTeamData, EnterpriseTeamMember, EnterpriseTeamRoleName } from '../../api/enterpriseApi';

const roleLabels: Record<EnterpriseTeamRoleName, string> = {
  OWNER: 'Propriétaire',
  RESTAURANT_MANAGER: 'Responsable Restaurant',
  RESTAURANT_STAFF: 'Équipe Restaurant',
};

const formatDate = (value: string) => new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
}).format(new Date(value));

const TeamPage: React.FC = () => {
  const [data, setData] = useState<EnterpriseTeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', roleId: '' });

  const loadTeam = async () => {
    try {
      setError(null);
      const nextData = await getEnterpriseTeam();
      setData(nextData);
      setForm((current) => ({ ...current, roleId: current.roleId || nextData.roles[0]?.id || '' }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Impossible de charger l’équipe');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadTeam(); }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const result = await createEnterpriseTeamMember(form);
      setGeneratedPassword(result.generatedPassword || null);
      setPasswordCopied(false);
      setForm({ firstName: '', lastName: '', email: '', roleId: data?.roles[0]?.id || '' });
      setFormOpen(false);
      await loadTeam();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Impossible d’ajouter le membre');
    } finally {
      setSaving(false);
    }
  };

  const updateRole = async (member: EnterpriseTeamMember, roleId: string) => {
    try {
      setUpdatingId(member.id);
      setError(null);
      const updated = await updateEnterpriseTeamMember(member.id, { roleId });
      setData((current) => current ? { ...current, members: current.members.map((item) => item.id === updated.id ? updated : item) } : current);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Impossible de modifier le rôle');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleMember = async (member: EnterpriseTeamMember) => {
    try {
      setUpdatingId(member.id);
      setError(null);
      const updated = await updateEnterpriseTeamMember(member.id, { isActive: !member.isActive });
      setData((current) => current ? { ...current, members: current.members.map((item) => item.id === updated.id ? updated : item) } : current);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Impossible de modifier le statut');
    } finally {
      setUpdatingId(null);
    }
  };

  const copyPassword = async () => {
    if (!generatedPassword) return;
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setPasswordCopied(true);
    } catch {
      setError('Impossible de copier le mot de passe');
    }
  };

  const columns: Column<EnterpriseTeamMember>[] = [
    {
      key: 'member',
      header: 'Membre',
      render: (member) => <div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserRound className="h-5 w-5" /></span><div className="min-w-0"><p className="truncate font-semibold text-dark">{member.firstName} {member.lastName}</p><p className="truncate text-sm text-slate">{member.email}</p></div></div>,
    },
    {
      key: 'role',
      header: 'Rôle',
      render: (member) => member.role?.name === 'OWNER' ? <Badge variant="primary"><ShieldCheck className="mr-1 inline h-3.5 w-3.5" />Propriétaire</Badge> : <select value={member.roleId} disabled={updatingId === member.id} onChange={(event) => void updateRole(member, event.target.value)} className="rounded-xl border border-slate/20 bg-white px-3 py-2 text-sm font-medium text-dark disabled:opacity-50">{data?.roles.map((role) => <option key={role.id} value={role.id}>{roleLabels[role.name]}</option>)}</select>,
    },
    {
      key: 'status',
      header: 'Statut',
      render: (member) => <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-dark"><span className="relative inline-flex items-center"><input type="checkbox" checked={member.isActive} disabled={member.role?.name === 'OWNER' || updatingId === member.id} onChange={() => void toggleMember(member)} className="peer sr-only" /><span className="h-6 w-11 rounded-full bg-slate/20 transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-disabled:cursor-not-allowed peer-disabled:opacity-50" /><span className="pointer-events-none absolute left-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" /></span><span>{member.isActive ? 'Actif' : 'Inactif'}</span></label>,
    },
    {
      key: 'createdAt',
      header: 'Ajouté le',
      render: (member) => <span className="text-sm text-slate">{formatDate(member.createdAt)}</span>,
    },
    {
      key: 'createdBy',
      header: 'Ajouté par',
      render: (member) => <span className="text-sm text-slate">{member.createdByUser ? `${member.createdByUser.firstName} ${member.createdByUser.lastName}` : 'Non renseigné'}</span>,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Module Restaurant</p>
          <h1 className="text-2xl font-bold font-poppins text-dark">Équipe et accès</h1>
          <p className="mt-1 text-slate">Attribuez à chaque membre le niveau d’accès adapté au restaurant.</p>
        </div>
        <Button type="button" onClick={() => { setError(null); setFormOpen(true); }} icon={<Plus className="h-4 w-4" />}>Ajouter un membre</Button>
      </div>

      {error && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <Card padding="none">
        <div className="border-b border-slate/10 p-5 sm:p-6"><h2 className="text-lg font-semibold text-dark">Membres de l’équipe</h2><p className="mt-1 text-sm text-slate">Le propriétaire conserve toujours les droits complets de l’entreprise.</p></div>
        <Table data={data?.members || []} columns={columns} loading={loading} emptyMessage="Aucun membre Restaurant configuré." />
      </Card>

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title="Ajouter un membre Restaurant" size="md">
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <Input label="Prénom" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} required />
          <Input label="Nom" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          <label className="block text-sm font-medium text-dark">Rôle<select value={form.roleId} onChange={(event) => setForm({ ...form, roleId: event.target.value })} required className="mt-1 w-full rounded-xl border border-slate/20 bg-white px-3 py-2.5">{data?.roles.map((role) => <option key={role.id} value={role.id}>{roleLabels[role.name]}</option>)}</select></label>
          <div className="flex justify-end gap-2 md:col-span-2"><Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Annuler</Button><Button type="submit" disabled={saving || !data?.roles.length} icon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}>{saving ? 'Création…' : 'Créer le membre'}</Button></div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(generatedPassword)} onClose={() => { setGeneratedPassword(null); setPasswordCopied(false); }} title="Membre créé" size="sm">
        {generatedPassword && <div className="text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600"><Check className="h-6 w-6" /></div><p className="mt-4 text-sm text-slate">Transmettez ce mot de passe temporaire de manière sécurisée. Le membre devra le modifier à sa première connexion.</p><div className="mt-5 flex items-center gap-2 rounded-xl border border-slate/20 bg-cloud p-2"><code className="min-w-0 flex-1 break-all px-2 text-left font-semibold text-dark">{generatedPassword}</code><button type="button" onClick={() => void copyPassword()} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/5"><Copy className="h-4 w-4" />{passwordCopied ? 'Copié' : 'Copier'}</button></div><Button type="button" className="mt-5" onClick={() => { setGeneratedPassword(null); setPasswordCopied(false); }}>Fermer</Button></div>}
      </Modal>
    </div>
  );
};

export default TeamPage;

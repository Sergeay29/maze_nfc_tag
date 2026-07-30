import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Mail, Phone, Star, Clock, TrendingUp, TrendingDown,
  Loader2, ArrowUpRight, ArrowDownRight, Award,
} from 'lucide-react';
import { Button, Badge, Card, Avatar, Toast } from '../../components';
import { useNavigate, useParams } from 'react-router-dom';
import { getClientDetail, getEnterpriseScans } from '../../api/enterpriseApi';
import type { ClientData, ScanData } from '../../api/enterpriseApi';

const LEVEL_VARIANT: Record<string, 'platinum' | 'gold' | 'silver'> = {
  Platinum: 'platinum',
  Gold: 'gold',
  Silver: 'silver',
};

const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<ClientData | null>(null);
  const [scans, setScans] = useState<ScanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);


  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const [clientData, scansData] = await Promise.all([
          getClientDetail(id),
          getEnterpriseScans({ clientId: id, limit: 10 }),
        ]);
        setClient(clientData);
        setScans(scansData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);


  // ── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // ── Erreur / introuvable ─────────────────────────────────
  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-slate">{error ?? 'Client introuvable'}</p>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Retour
        </Button>
      </div>
    );
  }

  const totalPointsAdded = scans.reduce((sum, s) => sum + (s.pointsAdded > 0 ? s.pointsAdded : 0), 0);
  const totalPointsRemoved = scans.reduce((sum, s) => sum + (s.pointsAdded < 0 ? Math.abs(s.pointsAdded) : 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-cloud transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold font-poppins text-dark truncate">{client.name}</h1>
          <p className="text-slate mt-0.5">Fiche client</p>
        </div>        
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche : profil + actions */}
        <div className="space-y-4">
          {/* Carte profil */}
          <Card>
            <div className="flex flex-col items-center text-center gap-3">
              <Avatar src={client.photo} name={client.name} size="lg" className="!w-20 !h-20 !text-2xl" />
              <div>
                <h2 className="text-xl font-semibold font-poppins text-dark">{client.name}</h2>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <Badge variant={LEVEL_VARIANT[client.level] ?? 'silver'}>{client.level}</Badge>
                  <Badge variant={client.status === 'active' ? 'active' : 'inactive'}>
                    {client.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {client.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-slate flex-shrink-0" />
                  <span className="text-dark truncate">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-slate flex-shrink-0" />
                  <span className="text-dark">{client.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-slate flex-shrink-0" />
                <span className="text-slate">
                  Inscrit le{' '}
                  {new Date(client.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </span>
              </div>
              {client.lastActivity && (
                <div className="flex items-center gap-3 text-sm">
                  <Star className="w-4 h-4 text-slate flex-shrink-0" />
                  <span className="text-slate">
                    Dernière activité :{' '}
                    {new Date(client.lastActivity).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Stats points */}
          <Card>
            <h3 className="font-semibold text-dark mb-4">Points</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate/10">
                <div className="flex items-center gap-2 text-sm text-slate">
                  <Award className="w-4 h-4" />
                  Solde actuel
                </div>
                <span className="font-bold text-primary text-lg">{client.points.toLocaleString('fr-FR')}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate/10">
                <div className="flex items-center gap-2 text-sm text-slate">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Gagnés (récents)
                </div>
                <span className="font-medium text-green-600">+{totalPointsAdded.toLocaleString('fr-FR')}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 text-sm text-slate">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  Retirés (récents)
                </div>
                <span className="font-medium text-red-500">-{totalPointsRemoved.toLocaleString('fr-FR')}</span>
              </div>
            </div>
          </Card>

          {/* Actions rapides */}
          <Card>
            <h3 className="font-semibold text-dark mb-4">Actions</h3>
            <div className="space-y-2">
              <Button
                fullWidth
                icon={<Star className="w-4 h-4" />}
                onClick={() => navigate(`/enterprise/clients/${id}/add-points`)}
              >
                Ajouter des points
              </Button>
              <Button
                fullWidth
                variant="secondary"
                icon={<Clock className="w-4 h-4" />}
                onClick={() => navigate(`/enterprise/clients/${id}/history`)}
              >
                Historique complet
              </Button>
            </div>
          </Card>
        </div>

        {/* Colonne droite : derniers scans */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="p-4 border-b border-slate/10">
              <h3 className="font-semibold text-dark">Derniers scans</h3>
            </div>
            {scans.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-slate">
                <Clock className="w-8 h-8 opacity-30" />
                <p className="text-sm">Aucun scan enregistré</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-cloud/60">
                  <tr>
                    <th className="text-left text-xs font-semibold text-slate uppercase tracking-wider px-5 py-3">Date</th>
                    <th className="text-left text-xs font-semibold text-slate uppercase tracking-wider px-5 py-3">Service</th>
                    <th className="text-right text-xs font-semibold text-slate uppercase tracking-wider px-5 py-3">Points</th>
                    <th className="text-left text-xs font-semibold text-slate uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate/10">
                  {scans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-cloud/40 transition-colors">
                      <td className="px-5 py-3 text-sm text-dark">
                        {new Date(scan.scannedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-3 text-sm text-slate">
                        {scan.Service?.name ?? scan.service?.name ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-sm text-right">
                        <div className="flex items-center justify-end gap-1">
                          {scan.pointsAdded > 0 ? (
                            <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
                          ) : scan.pointsAdded < 0 ? (
                            <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                          ) : null}
                          <span className={
                            scan.pointsAdded > 0 ? 'text-green-600 font-medium'
                            : scan.pointsAdded < 0 ? 'text-red-500 font-medium'
                            : 'text-slate'
                          }>
                            {scan.pointsAdded > 0 ? '+' : ''}{scan.pointsAdded}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate hidden sm:table-cell">
                        {scan.notes ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {scans.length >= 10 && (
              <div className="p-4 border-t border-slate/10 text-center">
                <button
                  className="text-sm text-primary hover:underline"
                  onClick={() => navigate(`/enterprise/clients/${id}/history`)}
                >
                  Voir l'historique complet
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailPage;

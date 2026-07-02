import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { Card, Badge } from '../../components';
import { useNavigate, useParams } from 'react-router-dom';
import { getClientDetail, getEnterpriseScans } from '../../api/enterpriseApi';
import type { ClientData, ScanData } from '../../api/enterpriseApi';

const PointsHistoryPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientData | null>(null);
  const [scans, setScans] = useState<ScanData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [clientData, scansData] = await Promise.all([
          getClientDetail(id),
          getEnterpriseScans({ clientId: id })
        ]);
        setClient(clientData);
        setScans(scansData.data);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const transformScansToHistory = (scanList: Scan[]): any[] => {
    let balance = 0;
    // Commencer avec le solde initial du client
    if (client) {
      balance = client.points;
    }
    
    // Calculer le solde progressivement
    return scanList.map((scan, index) => {
      const points = scan.pointsAdded;
      const entry = {
        id: scan.id,
        date: scan.scannedAt,
        action: points > 0 ? 'Points ajoutés' : 'Points retirés',
        points: points,
        balance: balance,
        reason: scan.notes || (scan.Service?.name || scan.service?.name || 'Scan')
      };
      
      // Mettre à jour le solde pour l'entrée suivante
      balance -= points;
      
      return entry;
    });
  };

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
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">
          Retour
        </button>
      </div>
    );
  }

  const history = transformScansToHistory(scans);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-cloud transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5 text-slate" />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-poppins text-dark">
            Historique des points
          </h1>
          <p className="text-slate mt-1">Historique de {client.name}</p>
        </div>
      </div>

      <Card padding="none">
        <table className="w-full">
          <thead className="bg-cloud border-b border-slate/10">
            <tr>
              <th className="table-header px-6 py-4">Date</th>
              <th className="table-header px-6 py-4">Action</th>
              <th className="table-header px-6 py-4">Points</th>
              <th className="table-header px-6 py-4 hidden sm:table-cell">Solde</th>
              <th className="table-header px-6 py-4 hidden md:table-cell">Raison</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate/10">
            {history.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-cell px-6 py-12 text-center text-slate">
                Aucun historique de points
                </td>
              </tr>
            ) : (
              history.map((entry) => (
                <tr key={entry.id} className="hover:bg-cloud transition-colors duration-200">
                  <td className="table-cell px-6 py-4">
                    <span className="text-dark">
                      {new Date(entry.date).toLocaleDateString('fr-FR')}
                    </span>
                  </td>
                  <td className="table-cell px-6 py-4">
                    <Badge variant={entry.points > 0 ? 'success' : 'error'}>
                      {entry.action}
                    </Badge>
                  </td>
                  <td className="table-cell px-6 py-4">
                    <div className="flex items-center gap-1">
                      {entry.points > 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      )}
                      <span className={entry.points > 0 ? 'text-green-600' : 'text-red-600'}>
                        {entry.points > 0 ? '+' : ''}{entry.points.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="table-cell px-6 py-4 hidden sm:table-cell">
                    <span className="font-semibold text-dark">{entry.balance.toLocaleString()}</span>
                  </td>
                  <td className="table-cell px-6 py-4 hidden md:table-cell">
                    <span className="text-slate">{entry.reason}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default PointsHistoryPage;

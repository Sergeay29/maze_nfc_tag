import React from 'react';
import { ArrowLeft, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, Badge } from '../../components';
import { pointsHistory, clients } from '../../data/mockData';
import { useNavigate, useParams } from 'react-router-dom';

const PointsHistoryPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const client = clients.find((c) => c.id === id) || clients[0];

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
            {pointsHistory.map((entry) => (
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
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default PointsHistoryPage;

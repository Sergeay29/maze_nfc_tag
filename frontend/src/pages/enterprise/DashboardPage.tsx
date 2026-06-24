import React from 'react';
import {
  Users,
  CreditCard,
  Star,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { StatCard, ChartCard, Card, Badge } from '../../components';
import { scans, pointsStats, clients } from '../../data/mockData';

const EnterpriseDashboard: React.FC = () => {
  const recentScans = scans.slice(0, 6);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-dark">
          Bonjour, Conciergerie Premium !
        </h1>
        <p className="text-slate mt-1">
          Voici le résumé de votre activité
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Clients"
          value="1,250"
          icon={<Users className="w-5 h-5" />}
          trend={{ value: 8, isPositive: true }}
          gradient
        />
        <StatCard
          title="Cartes actives"
          value="987"
          icon={<CreditCard className="w-5 h-5" />}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Points émis"
          value="45,670"
          icon={<Star className="w-5 h-5" />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Services utilisés"
          value="234"
          icon={<TrendingUp className="w-5 h-5" />}
          trend={{ value: 3, isPositive: false }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Points émis sur 7 jours"
            data={pointsStats}
            type="line"
            dataKey="points"
            xAxisKey="day"
          />
        </div>

        <Card>
          <h3 className="text-lg font-semibold font-poppins text-dark mb-6">
            Top clients
          </h3>
          <div className="space-y-3">
            {clients.slice(0, 5).map((client, index) => (
              <div
                key={client.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-cloud transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient flex items-center justify-center text-white text-sm font-medium">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dark">{client.name}</p>
                    <p className="text-xs text-slate">{client.points} pts</p>
                  </div>
                </div>
                <Badge variant={client.level === 'Platinum' ? 'platinum' : client.level === 'Gold' ? 'gold' : 'silver'}>
                  {client.level}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold font-poppins text-dark">
            Derniers scans
          </h3>
          <button className="text-sm text-primary font-medium hover:text-primary-light transition-colors duration-200">
            Voir tout
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cloud">
              <tr>
                <th className="table-header px-4 py-3">Client</th>
                <th className="table-header px-4 py-3 hidden sm:table-cell">Carte</th>
                <th className="table-header px-4 py-3">Action</th>
                <th className="table-header px-4 py-3">
                  <Clock className="w-4 h-4" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate/10">
              {recentScans.map((scan) => (
                <tr key={scan.id} className="hover:bg-cloud transition-colors duration-200">
                  <td className="table-cell px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient flex items-center justify-center text-white text-xs">
                        {scan.clientName.charAt(0)}
                      </div>
                      <span className="font-medium">{scan.clientName}</span>
                    </div>
                  </td>
                  <td className="table-cell px-4 py-3 hidden sm:table-cell">
                    <span className="font-mono text-sm text-slate">{scan.cardNumber}</span>
                  </td>
                  <td className="table-cell px-4 py-3">
                    <Badge variant={scan.points > 0 ? 'success' : scan.points < 0 ? 'error' : 'primary'}>
                      {scan.action}
                    </Badge>
                  </td>
                  <td className="table-cell px-4 py-3 text-slate text-sm">
                    {new Date(scan.timestamp).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default EnterpriseDashboard;

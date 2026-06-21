import React, { useState } from 'react';
import { ArrowLeft, Star, MessageSquare, Award } from 'lucide-react';
import { Button, Input, Select, Card } from '../../components';
import { clients } from '../../data/mockData';
import { useNavigate, useParams } from 'react-router-dom';

const AddPointsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [service, setService] = useState('');

  const client = clients.find((c) => c.id === id) || clients[0];

  const serviceOptions = [
    { value: 'concierge', label: 'Conciergerie' },
    { value: 'reservation', label: 'Réservation' },
    { value: 'purchase', label: 'Achat' },
    { value: 'referral', label: 'Parrainage' },
  ];

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
            Ajouter des points
          </h1>
          <p className="text-slate mt-1">Ajoutez des points au client</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold font-poppins text-dark mb-6">
            Informations
          </h2>
          <div className="space-y-4">
            <Input
              label="Nombre de points"
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="50"
              icon={<Star className="w-5 h-5" />}
            />
            <Input
              label="Raison"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Service effectué"
              icon={<MessageSquare className="w-5 h-5" />}
            />
            <Select
              label="Service utilisé"
              options={serviceOptions}
              value={service}
              onChange={setService}
              placeholder="Sélectionner un service"
            />
            <Button fullWidth icon={<Star className="w-5 h-5" />}>
              Ajouter les points
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold font-poppins text-dark mb-6">
            Profil client
          </h2>
          <div className="text-center mb-6">
            <img
              src={client.photo}
              alt={client.name}
              className="w-24 h-24 rounded-2xl object-cover mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold font-poppins text-dark">
              {client.name}
            </h3>
            <p className="text-slate">{client.email}</p>
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
            <div className="flex items-center justify-between">
              <span className="text-slate">Carte liée</span>
              <span className="font-mono text-sm text-slate">{client.cardNumber}</span>
            </div>
            {points && (
              <div className="pt-3 border-t border-slate/20">
                <div className="flex items-center justify-between">
                  <span className="text-slate">Nouveau solde</span>
                  <span className="font-semibold text-green-600">
                    {(client.points + parseInt(points) || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AddPointsPage;

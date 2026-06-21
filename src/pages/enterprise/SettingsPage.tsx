import React, { useState } from 'react';
import { Building2, Upload, Save } from 'lucide-react';
import { Card, Button, Input, Tabs, Badge } from '../../components';
import { enterprises } from '../../data/mockData';

const EnterpriseSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('info');
  const enterprise = enterprises[0];

  const tabs = [
    { id: 'info', label: 'Informations' },
    { id: 'modules', label: 'Modules' },
    { id: 'users', label: 'Utilisateurs' },
    { id: 'subscription', label: 'Abonnement' },
    { id: 'notifications', label: 'Notifications' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-dark">Paramètres</h1>
        <p className="text-slate mt-1">Configurez votre entreprise</p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-lg font-semibold font-poppins text-dark mb-6">
                Informations entreprise
              </h2>
              <div className="space-y-4">
                <Input
                  label="Nom de l'entreprise"
                  defaultValue={enterprise.name}
                  icon={<Building2 className="w-5 h-5" />}
                />
                <Input
                  label="Email"
                  type="email"
                  defaultValue={enterprise.email}
                />
                <Input
                  label="Téléphone"
                  defaultValue={enterprise.phone}
                />
                <Input
                  label="Localisation"
                  defaultValue={enterprise.location}
                />
                <Button icon={<Save className="w-5 h-5" />}>
                  Enregistrer
                </Button>
              </div>
            </Card>
          </div>

          <Card>
            <h3 className="text-lg font-semibold font-poppins text-dark mb-6">
              Logo
            </h3>
            <div className="text-center">
              <img
                src={enterprise.logo}
                alt="Logo"
                className="w-32 h-32 rounded-2xl object-cover mx-auto mb-6"
              />
              <Button variant="secondary" icon={<Upload className="w-5 h-5" />} fullWidth>
                Changer le logo
              </Button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'modules' && (
        <Card>
          <div className="space-y-4">
            {['Fidélité', 'Conciergerie', 'Notifications', 'Récompenses'].map((module) => (
              <label
                key={module}
                className="flex items-center justify-between p-4 bg-cloud rounded-xl cursor-pointer hover:bg-white transition-colors duration-200"
              >
                <span className="font-medium text-dark">{module}</span>
                <input
                  type="checkbox"
                  defaultChecked={enterprise.modules.includes(module)}
                  className="w-5 h-5 rounded text-primary"
                />
              </label>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'users' && (
        <Card>
          <p className="text-slate">Gestion des utilisateurs de l'entreprise</p>
        </Card>
      )}

      {activeTab === 'subscription' && (
        <Card>
          <div className="text-center py-8">
            <Badge variant="gold" size="md">{enterprise.subscription}</Badge>
            <p className="mt-4 text-slate">Votre abonnement actuel</p>
            <Button className="mt-4">Changer d'abonnement</Button>
          </div>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card>
          <div className="space-y-4">
            {[
              { label: 'Alertes email', checked: true },
              { label: 'Notifications push', checked: true },
              { label: 'Rapports quotidiens', checked: false },
              { label: 'Alertes de niveau', checked: true },
            ].map((notif) => (
              <label
                key={notif.label}
                className="flex items-center justify-between p-4 bg-cloud rounded-xl cursor-pointer hover:bg-white transition-colors duration-200"
              >
                <span className="font-medium text-dark">{notif.label}</span>
                <input
                  type="checkbox"
                  defaultChecked={notif.checked}
                  className="w-5 h-5 rounded text-primary"
                />
              </label>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default EnterpriseSettingsPage;

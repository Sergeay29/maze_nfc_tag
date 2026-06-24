import React from 'react';
import { Card, Button, Input } from '../../components';

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-dark">Paramètres</h1>
        <p className="text-slate mt-1">Configuration de la plateforme</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold font-poppins text-dark mb-6">
            Paramètres généraux
          </h2>
          <div className="space-y-4">
            <Input label="Nom de la plateforme" value="Maze NFC" readOnly />
            <Input label="Email de support" value="support@mazenfc.com" readOnly />
            <Input label="URL de l'API" value="https://api.mazenfc.com" readOnly />
            <Button>Enregistrer</Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold font-poppins text-dark mb-6">
            Notifications système
          </h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-cloud rounded-xl">
              <span className="text-dark">Alertes email</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-primary" />
            </label>
            <label className="flex items-center justify-between p-3 bg-cloud rounded-xl">
              <span className="text-dark">Notifications push</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-primary" />
            </label>
            <label className="flex items-center justify-between p-3 bg-cloud rounded-xl">
              <span className="text-dark">Rapports hebdomadaires</span>
              <input type="checkbox" className="w-5 h-5 rounded text-primary" />
            </label>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold font-poppins text-dark mb-6">
            Zone de danger
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-red-50 rounded-xl border border-red-200">
            <div>
              <h3 className="font-medium text-red-700">Réinitialiser les données</h3>
              <p className="text-sm text-red-600">Cette action est irréversible</p>
            </div>
            <button className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors duration-200">
              Réinitialiser
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;

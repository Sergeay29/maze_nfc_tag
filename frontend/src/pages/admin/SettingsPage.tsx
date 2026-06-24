import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, Button, Input } from '../../components';
import { getSettings, updateSettings } from '../../api/adminApi';
import type { SettingsGrouped } from '../../api/adminApi';

// Clés booléennes affichées comme toggles
const BOOLEAN_KEYS = ['notify_email_alerts', 'notify_push', 'notify_weekly_report'];

// Labels de groupes
const GROUP_LABELS: Record<string, string> = {
  general: 'Paramètres généraux',
  notifications: 'Notifications système',
  security: 'Sécurité',
};

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SettingsGrouped>({});
  // Valeurs éditées en local (clé → valeur string)
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getSettings();
        setSettings(data);
        // Initialiser les valeurs locales
        const flat: Record<string, string> = {};
        Object.values(data).forEach((group) =>
          group.forEach((item) => { flat[item.key] = item.value ?? ''; })
        );
        setValues(flat);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
  };

  const handleToggle = (key: string) => {
    const current = values[key] === 'true';
    handleChange(key, String(!current));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      await updateSettings(values);
      setSuccess(true);
      // Refresh depuis l'API pour être sûr
      const fresh = await getSettings();
      setSettings(fresh);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!window.confirm('Réinitialiser tous les paramètres à leur valeur actuelle ?')) return;
    const flat: Record<string, string> = {};
    Object.values(settings).forEach((group) =>
      group.forEach((item) => { flat[item.key] = item.value ?? ''; })
    );
    setValues(flat);
    setSuccess(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-slate animate-pulse">Chargement des paramètres...</div>
      </div>
    );
  }

  const groups = Object.keys(settings).filter((g) => g !== 'security');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-dark">Paramètres</h1>
          <p className="text-slate mt-1">Configuration de la plateforme Maze NFC</p>
        </div>
        <Button
          icon={<Save className="w-5 h-5" />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Sauvegarde...' : 'Enregistrer'}
        </Button>
      </div>

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>Paramètres sauvegardés avec succès.</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {groups.map((group) => (
            <Card key={group}>
              <h2 className="text-lg font-semibold font-poppins text-dark mb-6">
                {GROUP_LABELS[group] ?? group}
              </h2>
              <div className="space-y-4">
                {settings[group].map((item) => {
                  if (BOOLEAN_KEYS.includes(item.key)) {
                    return (
                      <label
                        key={item.key}
                        className="flex items-center justify-between p-3 bg-cloud rounded-xl cursor-pointer hover:bg-primary/5 transition-colors"
                      >
                        <span className="text-dark font-medium">{item.label}</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={values[item.key] === 'true'}
                          onClick={() => handleToggle(item.key)}
                          className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                            values[item.key] === 'true' ? 'bg-primary' : 'bg-slate/30'
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                              values[item.key] === 'true' ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </label>
                    );
                  }

                  return (
                    <Input
                      key={item.key}
                      label={item.label}
                      value={values[item.key] ?? ''}
                      onChange={(e) => handleChange(item.key, e.target.value)}
                    />
                  );
                })}
              </div>
            </Card>
          ))}
        </div>

        {/* Zone de danger */}
        <Card>
          <h2 className="text-lg font-semibold font-poppins text-dark mb-6">
            Zone de danger
          </h2>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800">Réinitialiser les modifications</h3>
                  <p className="text-sm text-yellow-700">Annule les changements non sauvegardés</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors duration-200 text-sm font-medium"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default SettingsPage;

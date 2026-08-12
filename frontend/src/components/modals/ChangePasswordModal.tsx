import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Button, Input } from '../';

interface ChangePasswordModalProps {
  onSubmit: (newPassword: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  onSubmit,
  loading = false,
  error,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (newPassword.length < 8) {
      setLocalError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      await onSubmit(newPassword);
    } catch (err) {
      // L'erreur est gérée par le parent
    }
  };

  const displayError = error || localError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay bloquant */}
      <div className="absolute inset-0 bg-dark/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-card animate-fade-in">
        {/* Header */}
        <div className="p-6 border-b border-slate/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold font-poppins text-dark">
              Changement de mot de passe requis
            </h2>
          </div>
          <p className="text-sm text-slate">
            Pour des raisons de sécurité, vous devez définir un nouveau mot de passe avant de continuer.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {displayError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-start gap-2">
              <span className="font-medium">⚠️</span>
              <span>{displayError}</span>
            </div>
          )}

          <div className="relative">
            <Input
              label="Nouveau mot de passe"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 caractères"
              required
              disabled={loading}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="text-slate hover:text-dark transition-colors"
                  tabIndex={-1}
                >
                  {showNew ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />
          </div>

          <div className="relative">
            <Input
              label="Confirmer le mot de passe"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Répéter le mot de passe"
              required
              disabled={loading}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="text-slate hover:text-dark transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />
          </div>

          <div className="pt-2">
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Enregistrement...' : 'Confirmer le nouveau mot de passe'}
            </Button>
          </div>

          {/* Info de sécurité */}
          <div className="p-3 bg-cloud rounded-xl">
            <p className="text-xs text-slate">
              💡 <strong>Conseil :</strong> Utilisez un mot de passe unique et sécurisé d'au moins 8 caractères.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;

import React, { useState } from 'react';
import { Shield, ShieldCheck, ShieldOff, Copy, Check } from 'lucide-react';
import { Card, Button, Input } from '../components';
import {
  setup2FA,
  enable2FA,
  disable2FA,
  get2FAStatus,
} from '../api/authApi';
import { useAuth } from '../auth/useAuth';

export default function TwoFactorSetup() {
  const { token, refreshUser } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState<{
    qrCodeDataUrl: string;
    secret: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    async function loadStatus() {
      if (!token) return;
      try {
        const status = await get2FAStatus(token);
        setEnabled(status.enabled);
      } catch {
        setError('Impossible de charger le statut 2FA');
      } finally {
        setLoading(false);
      }
    }
    loadStatus();
  }, [token]);

  const handleStartSetup = async () => {
    if (!token) return;
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      const data = await setup2FA(token);
      setSetupData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const handleEnable = async () => {
    if (!token || !verificationCode) return;
    setError('');
    setBusy(true);
    try {
      const data = await enable2FA(token, verificationCode);
      setBackupCodes(data.backupCodes);
      setEnabled(true);
      setSetupData(null);
      setVerificationCode('');
      setSuccess('Authentification à double facteur activée.');
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Code invalide');
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    if (!token || !disablePassword || !disableCode) return;
    setError('');
    setBusy(true);
    try {
      await disable2FA(token, disablePassword, disableCode);
      setEnabled(false);
      setDisablePassword('');
      setDisableCode('');
      setBackupCodes(null);
      setSuccess('Authentification à double facteur désactivée.');
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const copyBackupCodes = async () => {
    if (!backupCodes) return;
    await navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-slate animate-pulse">Chargement de la configuration 2FA...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        {enabled ? (
          <ShieldCheck className="w-8 h-8 text-green-500" />
        ) : (
          <Shield className="w-8 h-8 text-primary" />
        )}
        <div>
          <h2 className="text-lg font-semibold font-poppins text-dark">
            Authentification à double facteur (2FA)
          </h2>
          <p className="text-sm text-slate">
            {enabled
              ? 'Votre compte est protégé par une application d\'authentification.'
              : 'Ajoutez une couche de sécurité supplémentaire à votre compte.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          {success}
        </div>
      )}

      {backupCodes && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <h3 className="font-medium text-yellow-800 mb-2">Codes de secours</h3>
          <p className="text-sm text-yellow-700 mb-3">
            Conservez ces codes en lieu sûr. Chaque code ne peut être utilisé qu'une fois.
          </p>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 font-mono text-sm mb-3">
            {backupCodes.map((code) => (
              <span key={code} className="bg-white px-2 py-1 rounded border">
                {code}
              </span>
            ))}
          </div>
          <Button
            type="button"
            size="sm"
            onClick={copyBackupCodes}
            icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? 'Copié' : 'Copier les codes'}
          </Button>
        </div>
      )}

      {!enabled && !setupData && (
        <Button onClick={handleStartSetup} disabled={busy} icon={<Shield className="w-5 h-5" />}>
          {busy ? 'Configuration...' : 'Configurer la 2FA'}
        </Button>
      )}

      {!enabled && setupData && (
        <div className="space-y-4">
          <p className="text-sm text-slate">
            Scannez ce QR code avec Google Authenticator, Authy ou une application compatible TOTP.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <img
              src={setupData.qrCodeDataUrl}
              alt="QR Code 2FA"
              className="w-full max-w-[12rem] sm:w-48 sm:h-48 aspect-square mx-auto sm:mx-0 border rounded-xl"
            />
            <div className="text-sm">
              <p className="text-slate mb-1">Clé manuelle :</p>
              <code className="block bg-cloud px-3 py-2 rounded-lg break-all">
                {setupData.secret}
              </code>
            </div>
          </div>
          <Input
            label="Code de vérification"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="000000"
            maxLength={6}
          />
          <div className="flex gap-2">
            <Button onClick={handleEnable} disabled={busy || verificationCode.length < 6}>
              Activer la 2FA
            </Button>
            <Button
              variant="primary"
              onClick={() => setSetupData(null)}
              disabled={busy}
            >
              Annuler
            </Button>
          </div>
        </div>
      )}

      {enabled && (
        <div className="space-y-4 border-t border-slate/10 pt-6">
          <p className="text-sm text-slate">
            Pour désactiver la 2FA, confirmez votre mot de passe et entrez un code actuel.
          </p>
          <Input
            label="Mot de passe"
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
          />
          <Input
            label="Code 2FA"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value)}
            placeholder="000000"
            maxLength={6}
          />
          <Button
            onClick={handleDisable}
            disabled={busy || !disablePassword || disableCode.length < 6}
            icon={<ShieldOff className="w-5 h-5" />}
          >
            Désactiver la 2FA
          </Button>
        </div>
      )}
    </Card>
  );
}

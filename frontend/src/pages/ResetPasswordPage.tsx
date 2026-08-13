import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { Button, Input, Card } from '../components';

const API_URL = import.meta.env.VITE_API_URL;

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Lien invalide. Le token de réinitialisation est manquant.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!token) {
      setError('Token manquant');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (data.success) {
        setDone(true);
        // Redirection automatique après 3 secondes
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.message || 'Une erreur est survenue');
      }
    } catch {
      setError('Impossible de contacter le serveur');
    } finally {
      setSubmitting(false);
    }
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordTooShort = password.length > 0 && password.length < 8;

  return (
    <div className="min-h-screen bg-cloud flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src={`${import.meta.env.BASE_URL}images/icons/icons.png`}
            alt="Maze NFC"
            className="w-20 mx-auto drop-shadow-xl rounded-3xl mb-4"
          />
          <h1 className="font-bold font-poppins text-dark text-2xl">Maze NFC</h1>
        </div>

        <Card className="p-6 sm:p-8">
          {done ? (
            // ── Confirmation succès ─────────────────────────────
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-dark">Mot de passe réinitialisé !</h2>
              <p className="text-slate text-sm">
                Votre mot de passe a été mis à jour avec succès.
              </p>
              <p className="text-xs text-slate/70">
                Redirection automatique vers la connexion dans quelques secondes...
              </p>
              <Link to="/login">
                <Button fullWidth>
                  Se connecter maintenant
                </Button>
              </Link>
            </div>
          ) : (
            // ── Formulaire ─────────────────────────────────────
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-dark mb-1">Nouveau mot de passe</h2>
                <p className="text-sm text-slate">
                  Choisissez un mot de passe sécurisé pour votre compte.
                </p>
              </div>

              {!token ? (
                <div className="text-center space-y-4">
                  <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-4">
                    {error}
                  </div>
                  <Link to="/forgot-password">
                    <Button fullWidth variant="secondary">
                      Faire une nouvelle demande
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <div>
                    <Input
                      label="Nouveau mot de passe"
                      type="password"
                      placeholder="Au moins 8 caractères"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      icon={<Lock className="w-5 h-5" />}
                      required
                    />
                    {passwordTooShort && (
                      <p className="text-xs text-red-500 mt-1">
                        Au moins 8 caractères requis
                      </p>
                    )}
                  </div>

                  <div>
                    <Input
                      label="Confirmer le mot de passe"
                      type="password"
                      placeholder="Répétez le mot de passe"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      icon={<Lock className="w-5 h-5" />}
                      required
                    />
                    {confirmPassword && !passwordsMatch && (
                      <p className="text-xs text-red-500 mt-1">
                        Les mots de passe ne correspondent pas
                      </p>
                    )}
                    {passwordsMatch && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Les mots de passe correspondent
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    fullWidth
                    disabled={submitting || !passwordsMatch || passwordTooShort}
                    icon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                  >
                    {submitting ? 'Mise à jour...' : 'Réinitialiser le mot de passe'}
                  </Button>
                </form>
              )}

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-sm text-slate hover:text-primary transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour à la connexion
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
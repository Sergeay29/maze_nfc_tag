import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { Button, Input, Card } from '../components';

const API_URL = import.meta.env.VITE_API_URL;

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
      } else {
        setError(data.message || 'Une erreur est survenue');
      }
    } catch {
      setError('Impossible de contacter le serveur');
    } finally {
      setSubmitting(false);
    }
  };

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
            // ── Confirmation envoi ────────────────────────────
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-dark">Email envoyé !</h2>
              <p className="text-slate text-sm leading-relaxed">
                Si l'adresse <strong>{email}</strong> est enregistrée, vous allez recevoir
                un lien de réinitialisation valable <strong>1 heure</strong>.
              </p>
              <p className="text-xs text-slate/70">
                Vérifiez vos spams si vous ne le recevez pas.
              </p>
              <Link to="/login">
                <Button fullWidth variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          ) : (
            // ── Formulaire ────────────────────────────────────
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-dark mb-1">Mot de passe oublié ?</h2>
                <p className="text-sm text-slate">
                  Entrez votre email et nous vous enverrons un lien de réinitialisation.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <Input
                  label="Adresse email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="w-5 h-5" />}
                  required
                />

                <Button
                  type="submit"
                  fullWidth
                  disabled={submitting}
                  icon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                >
                  {submitting ? 'Envoi en cours...' : 'Envoyer le lien'}
                </Button>
              </form>

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

export default ForgotPasswordPage;

import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Button, Input, Card } from '../../components';
import { useClientAuth } from '../../auth/client/useClientAuth';

const ClientLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { client, loading, login } = useClientAuth();

  useEffect(() => {
    if (!loading && client) {
      const state = location.state as { from?: { pathname?: string } } | null;
      navigate(state?.from?.pathname || '/client/home', { replace: true });
    }
  }, [client, loading, location.state, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      await login({ email, password });
      const state = location.state as { from?: { pathname?: string } } | null;
      navigate(state?.from?.pathname || '/client/home', { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Connexion impossible');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cloud flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src={`${import.meta.env.BASE_URL}images/icons/icons.png`}
            alt="Maze NFC"
            className="w-20 mx-auto drop-shadow-xl rounded-3xl mb-4"
          />
          <h1 className="font-bold font-poppins text-dark text-2xl">Espace client</h1>
          <p className="text-slate text-sm mt-1">Consultez vos points et récompenses</p>
        </div>

        <Card className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-dark mb-1">Connexion</h2>
            <p className="text-sm text-slate">
              Connectez-vous avec l&apos;email enregistré chez votre établissement.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {formError}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-5 h-5" />}
              required
            />

            <Input
              label="Mot de passe"
              type="password"
              placeholder="Votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-5 h-5" />}
              required
            />

            <div className="flex justify-end">
              <Link
                to="/client/forgot-password"
                className="text-sm text-primary hover:text-primary-light transition-colors duration-200"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <Button
              type="submit"
              fullWidth
              disabled={submitting}
              icon={
                submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )
              }
            >
              {submitting ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate leading-relaxed">
            Première connexion ? Utilisez « Mot de passe oublié » pour définir votre mot de passe
            si votre établissement a enregistré votre email.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default ClientLoginPage;

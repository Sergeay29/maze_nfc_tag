import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';
import { Button, Card, Input } from '../components';
import { useAuth } from '../auth/useAuth';
import type { AuthUser } from '../auth/types';

function getRedirectPath(user: AuthUser) {
  if (user.Role?.name === 'SUPER_ADMIN') {
    return '/admin/dashboard';
  }

  return '/enterprise/dashboard';
}

const RegisterPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, register, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate(getRedirectPath(user), { replace: true });
    }
  }, [loading, navigate, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (password !== confirmPassword) {
      setFormError('Les mots de passe ne correspondent pas');
      return;
    }

    setSubmitting(true);

    try {
      const createdUser = await register({
        firstName,
        lastName,
        email,
        password,
      });

      navigate(getRedirectPath(createdUser), { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Création impossible');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-cloud flex">
      <div className="hidden lg:flex lg:flex-1 bg-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <div className="w-32 h-32 mb-8 relative">
            <div className="absolute inset-0 bg-white/20 rounded-3xl rotate-12" />
            <div className="absolute inset-0 bg-white/30 rounded-3xl -rotate-12" />
            <div className="absolute inset-4 bg-white/40 rounded-2xl flex items-center justify-center">
              <div className="w-16 h-16 rounded-xl bg-white/60 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-white" />
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold font-poppins text-white text-center mb-4">
            Rejoignez Maze NFC
          </h2>
          <h3 className="text-2xl font-poppins text-white/90 text-center">
            Créez votre espace entreprise
          </h3>
          <div className="mt-12 flex gap-4">
            <div className="w-3 h-3 rounded-full bg-white/40" />
            <div className="w-3 h-3 rounded-full bg-white/60" />
            <div className="w-3 h-3 rounded-full bg-white" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-2">
              <img
                src="/images/icons/icons.png"
                alt="Maze NFC"
                className="w-[100px] max-w-full drop-shadow-2xl animate-float rounded-3xl"
              />
              <div>
                <h1 className="font-bold font-poppins text-dark text-2xl">Maze NFC</h1>
              </div>
            </div>
            <h2 className="text-2xl font-bold font-poppins text-dark mb-2">
              Créer un utilisateur
            </h2>
            <p className="text-slate">
              Renseignez les informations du nouvel espace
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Prénom"
                  type="text"
                  placeholder="Marie"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  icon={<User className="w-5 h-5" />}
                  required
                />
                <Input
                  label="Nom"
                  type="text"
                  placeholder="Dupont"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  icon={<User className="w-5 h-5" />}
                  required
                />
              </div>

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
                placeholder="Minimum 8 caractères"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-5 h-5" />}
                required
              />
              <Input
                label="Confirmer le mot de passe"
                type="password"
                placeholder="Répétez le mot de passe"
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={<Lock className="w-5 h-5" />}
                required
              />

              <Button
                type="submit"
                fullWidth
                icon={<ArrowRight className="w-5 h-5" />}
                iconPosition="right"
                disabled={submitting}
              >
                {submitting ? 'Création...' : "Créer l'utilisateur"}
              </Button>
            </form>
          </Card>

          <p className="text-center text-sm text-slate mt-6">
            Déjà un compte ?{' '}
            <Link
              to="/login"
              className="text-primary font-medium hover:text-primary-light transition-colors duration-200"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Button, Input, Card } from '../components';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/admin/dashboard');
  };

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
            Transform Physical Cards
          </h2>
          <h3 className="text-2xl font-poppins text-white/90 text-center">
            Into Digital Experiences
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
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient flex items-center justify-center">
                <span className="text-white font-bold text-xl font-poppins">M</span>
              </div>
              <div>
                <h1 className="font-bold font-poppins text-dark text-2xl">Maze NFC</h1>
              </div>
            </div>
            <h2 className="text-2xl font-bold font-poppins text-dark mb-2">
              Bienvenue
            </h2>
            <p className="text-slate">
              Connectez-vous pour accéder à votre espace
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-5 h-5" />}
              />
              <Input
                label="Mot de passe"
                type="password"
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-5 h-5" />}
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate/20 text-primary focus:ring-primary/20"
                  />
                  <span className="text-sm text-slate">Se souvenir de moi</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:text-primary-light transition-colors duration-200"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <Button type="submit" fullWidth icon={<ArrowRight className="w-5 h-5" />} iconPosition="right">
                Se connecter
              </Button>
            </form>
          </Card>

          <p className="text-center text-sm text-slate mt-6">
            Pas encore de compte ?{' '}
            <Link
              to="/register"
              className="text-primary font-medium hover:text-primary-light transition-colors duration-200"
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Building2, Shield, Eye, EyeOff } from 'lucide-react';
import {
  updateUser,
  getRoles,
  getEnterprises,
  type UpdateUserPayload,
  type AdminUser,
  type Role,
} from '../../api/adminApi';
import type { Enterprise } from '../../data/mockData';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: AdminUser;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, onSuccess, user }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [roles, setRoles] = useState<Role[]>([]);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);

  const [formData, setFormData] = useState<UpdateUserPayload>({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    password: '',
    roleId: user.roleId,
    enterpriseId: user.enterpriseId,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: '',
        roleId: user.roleId,
        enterpriseId: user.enterpriseId,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
      });
      setChangePassword(false);
    }
  }, [isOpen, user]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [rolesData, enterprisesData] = await Promise.all([
        getRoles(),
        getEnterprises({ limit: 500 }),
      ]);
      setRoles(rolesData);
      setEnterprises(enterprisesData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? null : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.roleId) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (changePassword && (!formData.password || formData.password.length < 8)) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      setLoading(true);

      const payload: UpdateUserPayload = {
        ...formData,
        password: changePassword ? formData.password : undefined,
      };

      await updateUser(user.id, payload);
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setChangePassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-poppins text-dark">Modifier l'utilisateur</h2>
              <p className="text-sm text-slate">
                {user.firstName} {user.lastName}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg hover:bg-cloud flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Nom et Prénom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate" />
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-slate/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="Jean"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate" />
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-slate/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="Dupont"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-slate/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="jean.dupont@example.com"
                    required
                  />
                </div>
              </div>

              {/* Rôle */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Rôle <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate" />
                  <select
                    name="roleId"
                    value={formData.roleId}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-slate/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white"
                    required
                  >
                    <option value="">Sélectionner un rôle</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} {role.description && `- ${role.description}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Entreprise */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Entreprise <span className="text-slate text-xs">(optionnel)</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate" />
                  <select
                    name="enterpriseId"
                    value={formData.enterpriseId || ''}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-slate/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white"
                  >
                    <option value="">Aucune entreprise</option>
                    {enterprises.map((enterprise) => (
                      <option key={enterprise.id} value={enterprise.id}>
                        {enterprise.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Changer le mot de passe */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={changePassword}
                    onChange={(e) => setChangePassword(e.target.checked)}
                    className="w-4 h-4 text-primary focus:ring-primary border-slate/20 rounded"
                  />
                  <span className="text-sm font-medium text-dark">Changer le mot de passe</span>
                </label>
                {changePassword && (
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-12 py-3 border border-slate/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="Nouveau mot de passe (min 8 caractères)"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-dark"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary focus:ring-primary border-slate/20 rounded"
                  />
                  <span className="text-sm text-dark">Compte actif</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="mustChangePassword"
                    checked={formData.mustChangePassword}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary focus:ring-primary border-slate/20 rounded"
                  />
                  <span className="text-sm text-dark">
                    Forcer le changement de mot de passe à la prochaine connexion
                  </span>
                </label>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-slate/20 rounded-xl text-slate hover:bg-cloud font-medium transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || loadingData}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-lg hover:shadow-primary/25 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;

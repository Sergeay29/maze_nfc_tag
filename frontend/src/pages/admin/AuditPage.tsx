import React, { useState, useEffect } from 'react';
import { Eye,  Download, User, Activity, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Card, Table, Badge, SearchInput, Button, Column } from '../../components';
import { getAuditLogs, getAuditStats, exportAuditCsv } from '../../api/adminApi';
import toast from 'react-hot-toast';

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  success: boolean;
  createdAt: string;
  User: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

interface AuditStats {
  period: string;
  stats: {
    total: number;
    success: number;
    failed: number;
    successRate: string;
  };
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{
    user: { id: string; name: string; email: string };
    count: number;
  }>;
}

const ACTION_LABELS: Record<string, string> = {
  CREATE_ENTERPRISE: 'Création entreprise',
  UPDATE_ENTERPRISE: 'Modification entreprise',
  DELETE_ENTERPRISE: 'Suppression entreprise',
  GENERATE_CARDS: 'Génération cartes',
  ASSIGN_CARD: 'Attribution carte',
  DELETE_CARD: 'Suppression carte',
  CREATE_USER: 'Création utilisateur',
  UPDATE_USER: 'Modification utilisateur',
  DELETE_USER: 'Suppression utilisateur',
  LOGIN_SUCCESS: 'Connexion réussie',
  LOGIN_FAILED: 'Échec connexion',
  LOGOUT: 'Déconnexion',
  UPDATE_SETTINGS: 'Mise à jour config',
  ENABLE_2FA: 'Activation 2FA',
  DISABLE_2FA: 'Désactivation 2FA',
  UPDATE_SUBSCRIPTION: 'Modification abonnement',
  UPDATE_CARD: 'Modification carte',
  RESET_PASSWORD: 'Réinitialisation mot de passe',
};

const RESOURCE_LABELS: Record<string, string> = {
  enterprise: 'Entreprise',
  nfcCard: 'Carte NFC',
  user: 'Utilisateur',
  scan: 'Scan',
  settings: 'Paramètres',
  auth: 'Authentification',
};



export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    action: '',
    resource: '',
    success: '',
    period: '7d',
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadAuditLogs();
    loadAuditStats();
  }, [currentPage, filters, searchTerm]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await getAuditLogs({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        ...filters,
      });
      
      if (response.success) {
        setLogs(response.data);
        setTotalPages(response.pagination.pages);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des logs d\'audit:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditStats = async () => {
    try {
      const response = await getAuditStats({ period: filters.period });
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const formatDateTime = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(new Date(dateString));
  };

  const getActionBadgeColor = (success: boolean) => {
    return success ? 'success' : 'error';
  };

  const showLogDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  const downloadCsv = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const { blob, filename } = await exportAuditCsv({
        search: searchTerm,
        action: filters.action,
        resource: filters.resource,
        success: filters.success,
        period: filters.period,
      });
      downloadCsv(blob, filename);
      toast.success('Export CSV généré avec succès.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'export CSV");
    } finally {
      setExporting(false);
    }
  };

  if (loading && !logs.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  const columns: Column<AuditLog>[] = [
    {
      key: 'createdAt',
      header: 'Date & Heure',
      render: (log) => <span className="text-sm">{formatDateTime(log.createdAt)}</span>,
    },
    {
      key: 'user',
      header: 'Utilisateur',
      render: (log) =>
        log.User ? (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <div>
              <p className="font-medium">{log.User.firstName} {log.User.lastName}</p>
              <p className="text-xs text-gray-500">{log.User.email}</p>
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (log) => <Badge variant="primary">{ACTION_LABELS[log.action] || log.action}</Badge>,
    },
    {
      key: 'resource',
      header: 'Ressource',
      render: (log) => <Badge variant="primary">{RESOURCE_LABELS[log.resource] || log.resource}</Badge>,
    },
    {
      key: 'success',
      header: 'Statut',
      render: (log) => (
        <Badge variant={getActionBadgeColor(log.success)}>
          {log.success ? 'Réussie' : 'Échouée'}
        </Badge>
      ),
    },
    {
      key: 'details',
      header: 'Détails',
      className: 'max-w-xs truncate',
      render: (log) => <span className="text-sm text-gray-600">{log.details || '-'}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (log) => (
        <Button
          variant="primary"
          size="sm"
          onClick={() => showLogDetails(log)}
          className="flex items-center gap-1"
        >
          <Eye className="w-4 h-4" />
          Voir
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Journal d'audit</h1>
          <p className="text-gray-600">Suivi des actions administrateurs</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            className="flex items-center gap-2"
            onClick={handleExport}
            disabled={exporting}
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Export...' : 'Exporter'}
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total actions</p>
                <p className="text-2xl font-bold">{stats.stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Réussies</p>
                <p className="text-2xl font-bold text-green-600">{stats.stats.success}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Échouées</p>
                <p className="text-2xl font-bold text-red-600">{stats.stats.failed}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Taux de réussite</p>
                <p className="text-2xl font-bold">{stats.stats.successRate}%</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <SearchInput
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
          
          <select
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Toutes les actions</option>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={filters.resource}
            onChange={(e) => handleFilterChange('resource', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Toutes les ressources</option>
            {Object.entries(RESOURCE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={filters.success}
            onChange={(e) => handleFilterChange('success', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tous les statuts</option>
            <option value="true">Réussies</option>
            <option value="false">Échouées</option>
          </select>

          <select
            value={filters.period}
            onChange={(e) => handleFilterChange('period', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="24h">24h</option>
            <option value="7d">7 jours</option>
            <option value="30d">30 jours</option>
          </select>
        </div>
      </Card>

      {/* Table des logs */}

  <Table
    data={logs}
    columns={columns}
    emptyMessage="Aucun log d'audit trouvé"
  />


      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="primary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            Précédent
          </Button>
          <span className="flex items-center px-4 py-2 text-sm">
            Page {currentPage} sur {totalPages}
          </span>
          <Button
            variant="primary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Suivant
          </Button>
        </div>
      )}

      {/* Modal détails */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Détails du log d'audit</h3>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                >
                  Fermer
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">ID</label>
                    <p className="text-sm">{selectedLog.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Date</label>
                    <p className="text-sm">{formatDateTime(selectedLog.createdAt)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Action</label>
                    <p className="text-sm">
                      <Badge variant="primary">
                        {ACTION_LABELS[selectedLog.action] || selectedLog.action}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Ressource</label>
                    <p className="text-sm">
                      <Badge variant="primary">
                        {RESOURCE_LABELS[selectedLog.resource] || selectedLog.resource}
                      </Badge>
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Utilisateur</label>
                  <p className="text-sm">
                    {selectedLog.User
                      ? `${selectedLog.User.firstName} ${selectedLog.User.lastName} (${selectedLog.User.email})`
                      : '—'}
                  </p>
                </div>

                {selectedLog.resourceId && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">ID Ressource</label>
                    <p className="text-sm font-mono">{selectedLog.resourceId}</p>
                  </div>
                )}

                {selectedLog.details && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Détails</label>
                    <p className="text-sm">{selectedLog.details}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700">Statut</label>
                  <p className="text-sm">
                    <Badge variant={getActionBadgeColor(selectedLog.success)}>
                      {selectedLog.success ? 'Réussie' : 'Échouée'}
                    </Badge>
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts';
import ProtectedRoute from './auth/ProtectedRoute';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  AdminDashboard,
  EnterprisesPage,
  NFCCardsPage,
  GenerateCardsPage,
  CardAttributionPage,
  EnterpriseDetailPage,
  ScansPage,
  SubscriptionsPage,
  ModulesPage,
  StockPage,
  UsersPage,
  SettingsPage,
  AuditPage,
  EnterpriseDashboard,
  ClientsPage,
  ClientDetailPage,
  EnterpriseCardsPage,
  EnterpriseScansPage,
  RewardsPage,
  LevelsPage,
  NotificationsPage,
  EnterpriseSettingsPage,
  AddPointsPage,
  PointsHistoryPage,
  ClientHomePage,
  ClientRewardsPage,
  ClientProfilePage,
  EnterpriseProfilePage,
  ServicesPage,
} from './pages';
import ScanLandingPage from './pages/ScanLandingPage';
import GenerateStockPage from './pages/admin/GenerateStockPage';
import AssignStockPage from './pages/admin/AssignStockPage';
import { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Routes publiques de scan NFC */}
        {/* Format: /entreprise/type/token */}
        <Route path="/:enterpriseSlug/:cardType/:token" element={<ScanLandingPage />} />

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
          <Route element={<MainLayout type="admin" />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/enterprises" element={<EnterprisesPage />} />
            <Route path="/admin/enterprises/:id" element={<EnterpriseDetailPage />} />
            <Route path="/admin/nfc-cards" element={<NFCCardsPage />} />
            <Route path="/admin/nfc-cards/generate" element={<GenerateCardsPage />} />
            <Route path="/admin/nfc-cards/assign" element={<CardAttributionPage />} />
            <Route path="/admin/scans" element={<ScansPage />} />
            <Route path="/admin/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/admin/card-types" element={<ModulesPage />} />
            <Route path="/admin/modules" element={<Navigate to="/admin/card-types" replace />} />
            <Route path="/admin/stock" element={<StockPage />} />
            <Route path="/admin/stock/generate" element={<GenerateStockPage />} />
            <Route path="/admin/stock/assign" element={<AssignStockPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Enterprise Routes */}
        <Route element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'EMPLOYEE']} />}>
          <Route element={<MainLayout type="enterprise" />}>
            <Route path="/enterprise/dashboard" element={<EnterpriseDashboard />} />
            <Route path="/enterprise/profile" element={<EnterpriseProfilePage />} />
            <Route path="/enterprise/clients" element={<ClientsPage />} />
            <Route path="/enterprise/clients/:id" element={<ClientDetailPage />} />
            <Route path="/enterprise/clients/:id/add-points" element={<AddPointsPage />} />
            <Route path="/enterprise/clients/:id/history" element={<PointsHistoryPage />} />
            <Route path="/enterprise/cards" element={<EnterpriseCardsPage />} />
            <Route path="/enterprise/services" element={<ServicesPage />} />
            <Route path="/enterprise/scans" element={<EnterpriseScansPage />} />
            <Route path="/enterprise/rewards" element={<RewardsPage />} />
            <Route path="/enterprise/levels" element={<LevelsPage />} />
            <Route path="/enterprise/notifications" element={<NotificationsPage />} />
            <Route path="/enterprise/settings" element={<EnterpriseSettingsPage />} />
          </Route>
        </Route>

        {/* Client Mobile Routes */}
        <Route path="/client/home" element={<ClientHomePage />} />
        <Route path="/client/rewards" element={<ClientRewardsPage />} />
        <Route path="/client/profile" element={<ClientProfilePage />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster />
    </Router>
  );
};

export default App;

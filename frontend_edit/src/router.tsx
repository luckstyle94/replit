import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthLayout } from "./components/layout/AuthLayout";
import { AppShell } from "./components/layout/AppShell";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { MfaSetupPage } from "./pages/MfaSetupPage";
import { MfaChallengePage } from "./pages/MfaChallengePage";
import { DashboardPage } from "./pages/DashboardPage";
import { HomeMenuPage } from "./pages/HomeMenuPage";
import { SocialCallbackPage } from "./pages/SocialCallbackPage";
import { SSOCallbackPage } from "./pages/SSOCallbackPage";
import { BridgeLayout } from "./features/bridge/BridgeLayout";
import { BridgeGuard } from "./features/bridge/BridgeGuard";
import { BridgeDashboardPage } from "./features/bridge/pages/BridgeDashboardPage";
import { BridgeWebhooksPage } from "./features/bridge/pages/BridgeWebhooksPage";
import { BridgeIntegrationsPage } from "./features/bridge/pages/BridgeIntegrationsPage";
import { BridgeSecretsPage } from "./features/bridge/pages/BridgeSecretsPage";
import { BridgeAuditPage } from "./features/bridge/pages/BridgeAuditPage";
import { BridgeReportsPage } from "./features/bridge/pages/BridgeReportsPage";
import { BridgePerformancePage } from "./features/bridge/pages/BridgePerformancePage";
import { BridgePartnersPage } from "./features/bridge/pages/BridgePartnersPage";
import { BridgeUpsellPage } from "./features/bridge/pages/BridgeUpsellPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthLayout />,
    children: [
      { index: true, element: <LoginPage /> },
      { path: "forgot", element: <ForgotPasswordPage /> },
      { path: "reset", element: <ResetPasswordPage /> },
      { path: "mfa/setup", element: <MfaSetupPage /> },
      { path: "mfa/challenge", element: <MfaChallengePage /> },
      { path: "auth/social/:provider/callback", element: <SocialCallbackPage /> },
      { path: "auth/sso/oidc/callback", element: <SSOCallbackPage /> },
      { path: "auth/sso/saml/callback", element: <SSOCallbackPage /> },
    ],
  },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HomeMenuPage /> },
      { path: "profile", element: <DashboardPage /> },
      {
        path: "bridge",
        element: (
          <BridgeGuard>
            <BridgeLayout />
          </BridgeGuard>
        ),
        children: [
          { index: true, element: <BridgeDashboardPage /> },
          { path: "webhooks", element: <BridgeWebhooksPage /> },
          { path: "integrations", element: <BridgeIntegrationsPage /> },
          { path: "partners", element: <BridgePartnersPage /> },
          { path: "performance", element: <BridgePerformancePage /> },
          { path: "secrets", element: <BridgeSecretsPage /> },
          { path: "audit", element: <BridgeAuditPage /> },
          { path: "reports", element: <BridgeReportsPage /> },
          { path: "upsell", element: <BridgeUpsellPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

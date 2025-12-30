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
import { SocialCallbackPage } from "./pages/SocialCallbackPage";
import { SSOCallbackPage } from "./pages/SSOCallbackPage";

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
    children: [{ index: true, element: <DashboardPage /> }],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

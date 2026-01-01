import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout/Layout";
import { Login } from "./pages/Login/Login";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { Tenants } from "./pages/Tenants/Tenants";
import { Users } from "./pages/Users/Users";
import { Features } from "./pages/Features/Features";
import { SSOSettings } from "./pages/SSOSettings/SSOSettings";
import { Sessions } from "./pages/Sessions/Sessions";

function ProtectedRoute() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Carregando...</div>;
  if (!isAuthenticated || !isAdmin) return <Navigate to="/login" replace />;

  return <Outlet />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tenants" element={<Tenants />} />
              <Route path="/sso" element={<SSOSettings />} />
              <Route path="/users" element={<Users />} />
              <Route path="/features" element={<Features />} />
              <Route path="/sessions" element={<Sessions />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

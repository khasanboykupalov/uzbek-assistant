import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Setup from "./pages/Setup";
import Dashboard from "./pages/Dashboard";
import AdminsList from "./pages/AdminsList";
import Warehouses from "./pages/Warehouses";
import Tenants from "./pages/Tenants";
import OwnerTenants from "./pages/OwnerTenants";
import Payments from "./pages/Payments";
import Statistics from "./pages/Statistics";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

// Wrapper component to render correct tenants page based on role
const TenantsRouteWrapper = () => {
  const { role } = useAuth();
  return role === 'owner' ? <OwnerTenants /> : <Tenants />;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/setup" element={<Setup />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/admins"
                element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <AdminsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/warehouses"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin']}>
                    <Warehouses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/tenants"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin']}>
                    {/* Component selection based on role is handled inside */}
                    <TenantsRouteWrapper />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/payments"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Payments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/statistics"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin']}>
                    <Statistics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/profile"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin']}>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;

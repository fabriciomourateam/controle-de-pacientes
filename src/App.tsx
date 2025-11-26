import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import "./test-theme.css";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientDetails from "./pages/PatientDetails";
import Checkins from "./pages/Checkins";
import PatientEvolution from "./pages/PatientEvolution";
import PatientPortal from "./pages/PatientPortal";
import PortalLogin from "./pages/PortalLogin";
import Plans from "./pages/Plans";
import MetricsDashboard from "./pages/MetricsDashboard";
import CommercialMetrics from "./pages/CommercialMetrics";
import DebugVendas from "./pages/DebugVendas";
import Workspace from "./pages/Workspace";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Reports from "./pages/Reports";
import RetentionDashboard from "./pages/RetentionDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          {/* Rotas públicas - não requerem autenticação */}
          <Route path="/login" element={<Login />} />
          <Route path="/portal" element={<PortalLogin />} />
          <Route path="/portal/:token" element={<PatientPortal />} />
          
          {/* Rotas protegidas - requerem autenticação */}
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/patients" element={
            <ProtectedRoute>
              <Patients />
            </ProtectedRoute>
          } />
          <Route path="/patients/:id" element={
            <ProtectedRoute>
              <PatientDetails />
            </ProtectedRoute>
          } />
          <Route path="/checkins" element={
            <ProtectedRoute>
              <Checkins />
            </ProtectedRoute>
          } />
          <Route path="/checkins/evolution/:telefone" element={
            <ProtectedRoute>
              <PatientEvolution />
            </ProtectedRoute>
          } />
          <Route path="/plans" element={
            <ProtectedRoute>
              <Plans />
            </ProtectedRoute>
          } />
          <Route path="/metrics" element={
            <ProtectedRoute>
              <MetricsDashboard />
            </ProtectedRoute>
          } />
          <Route path="/commercial-metrics" element={
            <ProtectedRoute>
              <CommercialMetrics />
            </ProtectedRoute>
          } />
          <Route path="/retention" element={
            <ProtectedRoute>
              <RetentionDashboard />
            </ProtectedRoute>
          } />
          <Route path="/debug-vendas" element={
            <ProtectedRoute>
              <DebugVendas />
            </ProtectedRoute>
          } />
          <Route path="/workspace" element={
            <ProtectedRoute>
              <Workspace />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/help" element={
            <ProtectedRoute>
              <Help />
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Skeleton } from "@/components/ui/skeleton";
import "./test-theme.css";

// Componentes leves - import direto
import Index from "./pages/Index";
import Login from "./pages/Login";
import PortalLogin from "./pages/PortalLogin";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";

// Componentes pesados - lazy loading
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Patients = lazy(() => import("./pages/Patients"));
const PatientDetails = lazy(() => import("./pages/PatientDetails"));
const Checkins = lazy(() => import("./pages/Checkins"));
const PatientEvolution = lazy(() => import("./pages/PatientEvolution"));
const PatientPortal = lazy(() => import("./pages/PatientPortal"));
const Plans = lazy(() => import("./pages/Plans"));
const MetricsDashboard = lazy(() => import("./pages/MetricsDashboard"));
const CommercialMetrics = lazy(() => import("./pages/CommercialMetrics"));
const DebugVendas = lazy(() => import("./pages/DebugVendas"));
const Workspace = lazy(() => import("./pages/Workspace"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Help = lazy(() => import("./pages/Help"));
const Reports = lazy(() => import("./pages/Reports"));
const RetentionDashboard = lazy(() => import("./pages/RetentionDashboard"));
const Pricing = lazy(() => import("./pages/Pricing"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

// Componente de loading
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="space-y-4 w-full max-w-md p-6">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

// Configurar React Query com cache otimizado
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos - dados considerados "frescos"
      cacheTime: 10 * 60 * 1000, // 10 minutos - cache mantido
      refetchOnWindowFocus: false, // Não refetch ao focar na janela
      retry: 1, // Tentar apenas 1 vez em caso de erro
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          {/* Rotas públicas - não requerem autenticação */}
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/portal" element={<PortalLogin />} />
          <Route path="/portal/:token" element={
            <Suspense fallback={<PageLoader />}>
              <PatientPortal />
            </Suspense>
          } />
          
          {/* Rotas protegidas - requerem autenticação */}
          <Route path="/" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/patients" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <Patients />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/patients/:id" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <PatientDetails />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/checkins" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <Checkins />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/checkins/evolution/:telefone" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <PatientEvolution />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/plans" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <Plans />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/metrics" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <MetricsDashboard />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/commercial-metrics" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <CommercialMetrics />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/retention" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <RetentionDashboard />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/debug-vendas" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <DebugVendas />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/workspace" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <Workspace />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <Reports />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <Profile />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <Settings />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/help" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <Help />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/pricing" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <Pricing />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <AdminDashboard />
              </Suspense>
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

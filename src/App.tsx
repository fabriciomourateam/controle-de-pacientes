import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { UpdateNotification } from "@/components/UpdateNotification";
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
// Settings removido - funcionalidades movidas para Help
const Help = lazy(() => import("./pages/Help"));
const Reports = lazy(() => import("./pages/Reports"));
const RetentionDashboard = lazy(() => import("./pages/RetentionDashboard"));
const Pricing = lazy(() => import("./pages/Pricing"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const TeamManagement = lazy(() => import("./pages/TeamManagement"));
const TeamMeetings = lazy(() => import("./pages/TeamMeetings"));
const TestGoogleDrive = lazy(() => import("./pages/TestGoogleDrive"));
const DietPlanEditor = lazy(() => import("./pages/DietPlanEditor"));

// Componente de loading melhorado
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="space-y-4 w-full max-w-md p-6">
      <div className="flex items-center justify-center mb-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

// Configurar React Query com cache otimizado e refetch automático
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 segundos - dados considerados "frescos" (reduzido para atualizações mais rápidas)
      gcTime: 5 * 60 * 1000, // 5 minutos - cache mantido (cacheTime foi renomeado para gcTime no React Query v5)
      refetchOnWindowFocus: true, // Refetch ao focar na janela para dados atualizados
      refetchOnReconnect: true, // Refetch ao reconectar
      retry: 1, // Tentar apenas 1 vez em caso de erro
      refetchInterval: false, // Desabilitado por padrão, pode ser habilitado por query específica
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <UpdateNotification />
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
            <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
          } />
          <Route path="/dashboard" element={
            <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
          } />
          <Route path="/patients" element={
            <Suspense fallback={<PageLoader />}>
                <Patients />
              </Suspense>
          } />
          <Route path="/patients/:id" element={
            <Suspense fallback={<PageLoader />}>
                <PatientDetails />
              </Suspense>
          } />
          <Route path="/checkins" element={
            <Suspense fallback={<PageLoader />}>
                <Checkins />
              </Suspense>
          } />
          <Route path="/checkins/evolution/:telefone" element={
            <Suspense fallback={<PageLoader />}>
                <PatientEvolution />
              </Suspense>
          } />
          <Route path="/plans" element={
            <Suspense fallback={<PageLoader />}>
                <Plans />
              </Suspense>
          } />
          <Route path="/metrics" element={
            <Suspense fallback={<PageLoader />}>
                <MetricsDashboard />
              </Suspense>
          } />
          <Route path="/commercial-metrics" element={
            <Suspense fallback={<PageLoader />}>
                <CommercialMetrics />
              </Suspense>
          } />
          <Route path="/retention" element={
            <Suspense fallback={<PageLoader />}>
                <RetentionDashboard />
              </Suspense>
          } />
          <Route path="/debug-vendas" element={
            <Suspense fallback={<PageLoader />}>
                <DebugVendas />
              </Suspense>
          } />
          <Route path="/workspace" element={
            <Suspense fallback={<PageLoader />}>
                <Workspace />
              </Suspense>
          } />
          <Route path="/reports" element={
            <Suspense fallback={<PageLoader />}>
                <Reports />
              </Suspense>
          } />
          <Route path="/profile" element={
            <Suspense fallback={<PageLoader />}>
                <Profile />
              </Suspense>
          } />

          <Route path="/help" element={
            <Suspense fallback={<PageLoader />}>
                <Help />
              </Suspense>
          } />
          <Route path="/pricing" element={
            <Suspense fallback={<PageLoader />}>
                <Pricing />
              </Suspense>
          } />
          <Route path="/admin" element={
            <Suspense fallback={<PageLoader />}>
                <AdminDashboard />
              </Suspense>
          } />
          <Route path="/team" element={
            <Suspense fallback={<PageLoader />}>
                <TeamManagement />
              </Suspense>
          } />
          <Route path="/meetings" element={
            <Suspense fallback={<PageLoader />}>
                <TeamMeetings />
              </Suspense>
          } />
          <Route path="/test-google-drive" element={
            <Suspense fallback={<PageLoader />}>
                <TestGoogleDrive />
              </Suspense>
          } />
          <Route path="/patients/:patientId/diet-plan/new" element={
            <Suspense fallback={<PageLoader />}>
                <DietPlanEditor />
              </Suspense>
          } />
          <Route path="/patients/:patientId/diet-plan/:planId/edit" element={
            <Suspense fallback={<PageLoader />}>
                <DietPlanEditor />
              </Suspense>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;


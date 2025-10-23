import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "./test-theme.css";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientDetails from "./pages/PatientDetails";
import Checkins from "./pages/Checkins";
import PatientEvolution from "./pages/PatientEvolution";
import PatientPortal from "./pages/PatientPortal";
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
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:id" element={<PatientDetails />} />
          <Route path="/checkins" element={<Checkins />} />
          <Route path="/checkins/evolution/:telefone" element={<PatientEvolution />} />
          <Route path="/portal/:token" element={<PatientPortal />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/metrics" element={<MetricsDashboard />} />
          <Route path="/commercial-metrics" element={<CommercialMetrics />} />
          <Route path="/debug-vendas" element={<DebugVendas />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

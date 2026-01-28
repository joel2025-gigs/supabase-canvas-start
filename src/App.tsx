import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import OfficerLogin from "./pages/auth/OfficerLogin";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Assets from "./pages/Assets";
import Loans from "./pages/Loans";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import Branches from "./pages/Branches";
import Users from "./pages/Users";
import AuditLogs from "./pages/AuditLogs";
import Settings from "./pages/Settings";
import Products from "./pages/Products";
import ProductManagement from "./pages/ProductManagement";
import GetStarted from "./pages/GetStarted";
import About from "./pages/About";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import Jobs from "./pages/Jobs";
import NotFound from "./pages/NotFound";

// Department pages
import Sales from "./pages/departments/Sales";
import CreditCollection from "./pages/departments/CreditCollection";
import Recovery from "./pages/departments/Recovery";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public website routes */}
          <Route path="/" element={<Index />} />
          <Route path="/products" element={<Products />} />
          <Route path="/about" element={<About />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/get-started" element={<GetStarted />} />
          
          {/* Staff authentication */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/auth/officer" element={<OfficerLogin />} />
          
          {/* Staff dashboard routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/branches" element={<Branches />} />
          <Route path="/users" element={<Users />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/product-management" element={<ProductManagement />} />
          <Route path="/jobs" element={<Jobs />} />
{/* Department routes */}
          <Route path="/departments/sales" element={<Sales />} />
          <Route path="/departments/credit-collection" element={<CreditCollection />} />
          <Route path="/departments/recovery" element={<Recovery />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

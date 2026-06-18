import { AppLayout } from "@/components/AppLayout";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LockProvider } from "@/contexts/LockContext";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/Dashboard";
import CustomersList from "@/pages/CustomersList";
import CustomerDetail from "@/pages/CustomerDetail";
import JobsList from "@/pages/JobsList";
import InvoicesList from "@/pages/InvoicesList";
import InvoiceForm from "@/pages/InvoiceForm";
import InvoiceDetail from "@/pages/InvoiceDetail";
import Settings from "@/pages/Settings";
import LockScreen from "@/pages/LockScreen";
import SuppliersList from "@/pages/SuppliersList";
import EquipmentList from "@/pages/EquipmentList";
import PanelsList from "@/pages/PanelsList";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/lock" component={LockScreen} />

      <Route>
        <AppLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/customers" component={CustomersList} />
            <Route path="/customers/:id" component={CustomerDetail} />
            <Route path="/jobs" component={JobsList} />
            <Route path="/invoices/new" component={InvoiceForm} />
            <Route path="/invoices/:id/edit" component={InvoiceForm} />
            <Route path="/invoices/:id" component={InvoiceDetail} />
            <Route path="/invoices" component={InvoicesList} />
            <Route path="/settings" component={Settings} />
            <Route path="/suppliers" component={SuppliersList} />
            <Route path="/equipment" component={EquipmentList} />
            <Route path="/panels" component={PanelsList} />
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <LockProvider>
            <Router />
          </LockProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

import { HashRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import POSBilling from "./pages/POSBilling";
import Inventory from "./pages/Inventory";
import InventoryAdd from "./pages/InventoryAdd";
import Customers from "./pages/Customers";
import Settings from "./pages/Settings";
import { Toaster as Sonner } from "./components/ui/sonner";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";
import PricingSection from "./pages/Pricing";
import Auth from "./pages/Auth";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import InvoiceHistory from "./pages/InvoiceHistory";

function Main() {
  return (
    // <TooltipProvider>
    // <Toaster />
    // <Sonner />
    // <HashRouter>
    <Routes>
      <Route path="/main_window" element={<Dashboard />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="/pos" element={<POSBilling />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/inventory/add" element={<InventoryAdd />} />
      <Route path="/customers" element={<Customers />} />
      {/* <Route path="/suppliers" element={<Suppliers />} /> */}
      <Route path="/invoice/history" element={<InvoiceHistory />} />
      {/* <Route path="/reports" element={<Auth />} /> */}
      <Route path="/settings" element={<Settings />} />
      <Route path="/pricing" element={<PricingSection />} />
      <Route path="/support" element={<Support />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    // </HashRouter>
    // </TooltipProvider>
  );
}

export default Main;

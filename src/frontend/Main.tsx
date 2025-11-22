import { HashRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import POSBilling from "./pages/POSBilling";
import Inventory from "./pages/Inventory";
import InventoryAdd from "./pages/InventoryAdd";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import Settings from "./pages/Settings";
import { Toaster as Sonner } from "./components/ui/sonner";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";
import PricingSection from "./pages/Pricing";
import Auth from "./pages/Auth";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";

function Main() {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path="/main_window" element={<Dashboard />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/pos" element={<POSBilling />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/inventory/add" element={<InventoryAdd />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/reports" element={<Auth />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/pricing" element={<PricingSection />} />
          <Route path="/support" element={<Support />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  );
}

export default Main;

// {errors.productName && (
//   <p className="text-red-500 text-xs -mt-2 mb-2">
//     {errors.productName.message}
//   </p>
// )}

// import { createRoot } from 'react-dom/client';
// import Wrapper from './app-components/Wrapper';

// const root = createRoot(document.body);
// root.render(<Wrapper />);

// import { Toaster } from "@/frontend/components/ui/toaster";
// import { Toaster as Sonner } from "@/frontend/components/ui/sonner";
// import { TooltipProvider } from "@/frontend/components/ui/tooltip";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { ThemeProvider, createTheme } from "@mui/material/styles";
// import CssBaseline from "@mui/material/CssBaseline";

// const queryClient = new QueryClient();

// const Main = () => (
//   <BrowserRouter>
//     <Routes>
//       <Route path="/" element={<Dashboard />} />
//       <Route path="/pos" element={<POSBilling />} />
//       <Route path="/inventory" element={<Inventory />} />
//       <Route path="/inventory/add" element={<InventoryAdd />} />
//       <Route path="/customers" element={<Customers />} />
//       <Route path="/suppliers" element={<Suppliers />} />
//       <Route path="/reports" element={<Auth />} />
//       <Route path="/settings" element={<Settings />} />
//       <Route path="/pricing" element={<PricingSection />} />
//       <Route path="/support" element={<Support />} />
//       {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
//       <Route path="*" element={<NotFound />} />
//     </Routes>
//   </BrowserRouter>
// );

//  default Main;

//   <QueryClientProvider client={queryClient}>
//     {/* <ThemeProvider theme={theme}> */}
//       {/* <CssBaseline /> */}
//       {/* <TooltipProvider> */}
//         {/* <Toaster /> */}
//         {/* <Sonner /> */}
//         <BrowserRouter>
//           <Routes>
//             <Route path="/" element={<Dashboard />} />
//             <Route path="/pos" element={<POSBilling />} />
//             <Route path="/inventory" element={<Inventory />} />
//             <Route path="/inventory/add" element={<InventoryAdd />} />
//             <Route path="/customers" element={<Customers />} />
//             <Route path="/suppliers" element={<Suppliers />} />
//             <Route path="/reports" element={<Auth />} />
//             <Route path="/settings" element={<Settings />} />
//             <Route path="/pricing" element={<PricingSection />} />
//             <Route path="/support" element={<Support />} />
//             {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
//             <Route path="*" element={<NotFound />} />
//           </Routes>
//         </BrowserRouter>
//       {/* </TooltipProvider> */}
//     {/* </ThemeProvider> */}
//   </QueryClientProvider>

import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  Settings,
  DollarSign,
  Headphones,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Plus,
  List,
  PointerOff,
  Receipt,
} from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import { useAppSelector } from "../../store/hooks";

const drawerWidth = 240;

// Optional: attach a requiredFeature string to require that entitlement for the menu item to show
const menuItems: Array<{
  icon: any;
  label: string;
  path: string;
  children?: any[];
  requiredFeature?: string;
}> = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/",
    // requiredFeature: "DASHBOARD_SERVICES",
  },
  {
    icon: PointerOff,
    label: "Billing (POS)",
    path: "/pos",
    requiredFeature: "QUICK_BILLING",
  },
  {
    icon: Package,
    label: "Inventory",
    path: "/inventory",
    requiredFeature: "INVENTORY_MANAGEMENT",
    children: [
      { icon: Plus, label: "Add Inventory", path: "/inventory/add" },
      { icon: List, label: "Listing", path: "/inventory" },
    ],
  },
  {
    icon: Users,
    label: "Customers",
    path: "/customers",
    requiredFeature: "CUSTOMER_SUPPLIER_MODULES",
  },
  // { icon: Truck, label: "reports", path: "/reports" },
  {
    icon: Receipt,
    label: "Invoices",
    path: "/invoice/history",
    requiredFeature: "INVOICE_LISTING",
  },
  {
    icon: Settings,
    label: "Settings",
    path: "/settings",
    requiredFeature: "SETTING_CHANGES",
  },
  { icon: DollarSign, label: "Pricing", path: "/pricing" },
  { icon: Headphones, label: "Contact/Support", path: "/support" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [inventoryOpen, setInventoryOpen] = useState(
    location.pathname.startsWith("/inventory")
  );

  const entitlements = useAppSelector((state) => state.auth.entitlements);
  console.log("------------", entitlements);

  return (
    <>
      <div
        className="fixed left-0 top-0 flex flex-col justify-between h-full w-60 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-r border-gray-200 dark:border-slate-700 shadow-xl z-50"
        style={{ width: drawerWidth }}
      >
        <div>
          {/* Logo */}
          <div className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                RetailPro
              </h1>
            </div>
          </div>

          {/* Menu */}
          <nav className="px-3 flex-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const hasChildren = item.children && item.children.length > 0;
              const isActive = hasChildren
                ? location.pathname.startsWith("/inventory")
                : location.pathname === item.path;

              // check if user has required feature for this menu item
              const isAllowed =
                !item.requiredFeature ||
                entitlements?.features?.includes(item.requiredFeature);
              if (!isAllowed) return null;

              return (
                <div key={item.path}>
                  <button
                    onClick={() => {
                      if (hasChildren) {
                        setInventoryOpen(!inventoryOpen);
                      } else {
                        navigate(item.path);
                      }
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl transition-all duration-200 mb-1 ${
                      isActive
                        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-md"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-5 h-5 ${
                          isActive ? "text-blue-700 dark:text-blue-300" : ""
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          isActive ? "font-semibold" : ""
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    {hasChildren &&
                      (inventoryOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      ))}
                  </button>

                  {/* Children */}
                  {hasChildren && (
                    <div
                      className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        inventoryOpen
                          ? "max-h-40 opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="pl-11 space-y-1 mt-1">
                        {item.children?.map((child) => {
                          const ChildIcon = child.icon;
                          const isChildActive =
                            location.pathname === child.path;

                          return (
                            <button
                              key={child.path}
                              onClick={() => navigate(child.path)}
                              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-sm ${
                                isChildActive
                                  ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold"
                                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                              }`}
                            >
                              <ChildIcon
                                className={`w-4 h-4 ${
                                  isChildActive
                                    ? "text-blue-700 dark:text-blue-300"
                                    : ""
                                }`}
                              />
                              <span>{child.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3 p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
              AC
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                Alex Carter
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Store Manager
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </>
  );
}

import { TierColors } from "@/frontend/types/common";
import { Asterisk, Box, PersonStanding, Receipt, ShoppingBag } from "lucide-react";

export const quickActions = [
  {
    title: "POS Billing",
    description: "Quick barcode entry, item list, and split payments.",
    icon: Receipt,
    path: "/pos",
  },
  {
    title: "Inventory",
    description: "Track stock, batches, expiry, and reorders.",
    icon: Box,
    path: "/inventory",
  },
  {
    title: "Customers",
    description: "Directory with purchase history and loyalty tiers.",
    icon: PersonStanding,
    path: "/customers",
  },
  {
    title: "Suppliers",
    description: "Manage vendors, POs, and payments.",
    icon: ShoppingBag,
    path: "/suppliers",
  },
  {
    title: "Reports",
    description: "Daily sales, stock summary, P&L and exports.",
    icon: Asterisk,
    path: "/reports",
  },
];

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  tier: "Platinum" | "Gold" | "Silver" | "Regular";
  totalSpent: string;
  visits: number;
  lastVisit: string;
}

export const getTierColor = (tier: Customer["tier"]): TierColors => {
  const colors: Record<Customer["tier"], TierColors> = {
    Platinum: {
      bg: "bg-purple-100",
      text: "text-purple-700",
      border: "border-purple-300",
    },
    Gold: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      border: "border-yellow-300",
    },
    Silver: {
      bg: "bg-gray-100",
      text: "text-gray-700",
      border: "border-gray-300",
    },
    Regular: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      border: "border-blue-300",
    },
  };
  return colors[tier];
};

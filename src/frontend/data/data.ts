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

export const salesData = [
  { month: "Jan", sales: 42000, profit: 8000 },
  { month: "Feb", sales: 38000, profit: 7500 },
  { month: "Mar", sales: 45000, profit: 9000 },
  { month: "Apr", sales: 48000, profit: 9500 },
  { month: "May", sales: 52000, profit: 10000 },
  { month: "Jun", sales: 50000, profit: 9800 },
  { month: "Jul", sales: 54000, profit: 11000 },
  { month: "Aug", sales: 58000, profit: 11500 },
  { month: "Sep", sales: 56000, profit: 10700 },
  { month: "Oct", sales: 60000, profit: 12000 },
  { month: "Non", sales: 60000, profit: 12000 },
  { month: "Dec", sales: 60000, profit: 12000 },
];

export const topCategories = [
  { category: "Dairy", sales: "$12,300", profit: "$3,540", margin: "28.8%" },
  { category: "Produce", sales: "$9,420", profit: "$2,260", margin: "24.0%" },
  { category: "Bakery", sales: "$7,880", profit: "$1,960", margin: "24.9%" },
  { category: "Snacks", sales: "$6,210", profit: "$1,310", margin: "21.1%" },
];

export const topProducts = [
  { product: "Milk 1L", units: 1240, revenue: "$1,736" },
  { product: "Eggs (12)", units: 980, revenue: "$3,136" },
  { product: "Bread Loaf", units: 860, revenue: "$2,150" },
  { product: "Bananas", units: 745, revenue: "$1,341" },
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

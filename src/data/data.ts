import { TierColors } from "@/types/common";
import {
  Assessment,
  Inventory2,
  LocalShipping,
  People,
  Receipt,
} from "@mui/icons-material";

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
    icon: Inventory2,
    path: "/inventory",
  },
  {
    title: "Customers",
    description: "Directory with purchase history and loyalty tiers.",
    icon: People,
    path: "/customers",
  },
  {
    title: "Suppliers",
    description: "Manage vendors, POs, and payments.",
    icon: LocalShipping,
    path: "/suppliers",
  },
  {
    title: "Reports",
    description: "Daily sales, stock summary, P&L and exports.",
    icon: Assessment,
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
export const sampleCustomers: Customer[] = [
  {
    id: 1,
    name: "Rajesh Kumar",
    email: "rajesh.k@email.com",
    phone: "+91 98765 43210",
    tier: "Gold",
    totalSpent: "₹45,000",
    visits: 23,
    lastVisit: "2024-11-10",
  },
  {
    id: 2,
    name: "Priya Sharma",
    email: "priya.s@email.com",
    phone: "+91 98765 43211",
    tier: "Platinum",
    totalSpent: "₹78,500",
    visits: 45,
    lastVisit: "2024-11-12",
  },
  {
    id: 3,
    name: "Amit Patel",
    email: "amit.p@email.com",
    phone: "+91 98765 43212",
    tier: "Silver",
    totalSpent: "₹12,000",
    visits: 8,
    lastVisit: "2024-11-08",
  },
  {
    id: 4,
    name: "Sneha Gupta",
    email: "sneha.g@email.com",
    phone: "+91 98765 43213",
    tier: "Gold",
    totalSpent: "₹52,300",
    visits: 31,
    lastVisit: "2024-11-13",
  },
  {
    id: 5,
    name: "Vikram Singh",
    email: "vikram.s@email.com",
    phone: "+91 98765 43214",
    tier: "Regular",
    totalSpent: "₹8,900",
    visits: 5,
    lastVisit: "2024-11-05",
  },
  {
    id: 6,
    name: "Ananya Reddy",
    email: "ananya.r@email.com",
    phone: "+91 98765 43215",
    tier: "Platinum",
    totalSpent: "₹95,000",
    visits: 67,
    lastVisit: "2024-11-14",
  },
  {
    id: 7,
    name: "Karan Mehta",
    email: "karan.m@email.com",
    phone: "+91 98765 43216",
    tier: "Gold",
    totalSpent: "₹41,200",
    visits: 19,
    lastVisit: "2024-11-11",
  },
  {
    id: 8,
    name: "Pooja Iyer",
    email: "pooja.i@email.com",
    phone: "+91 98765 43217",
    tier: "Silver",
    totalSpent: "₹15,600",
    visits: 11,
    lastVisit: "2024-11-09",
  },
  {
    id: 9,
    name: "Rohit Joshi",
    email: "rohit.j@email.com",
    phone: "+91 98765 43218",
    tier: "Regular",
    totalSpent: "₹6,750",
    visits: 4,
    lastVisit: "2024-11-07",
  },
  {
    id: 10,
    name: "Neha Kapoor",
    email: "neha.k@email.com",
    phone: "+91 98765 43219",
    tier: "Gold",
    totalSpent: "₹48,900",
    visits: 28,
    lastVisit: "2024-11-13",
  },
  {
    id: 11,
    name: "Arjun Desai",
    email: "arjun.d@email.com",
    phone: "+91 98765 43220",
    tier: "Platinum",
    totalSpent: "₹82,400",
    visits: 52,
    lastVisit: "2024-11-14",
  },
  {
    id: 12,
    name: "Divya Nair",
    email: "divya.n@email.com",
    phone: "+91 98765 43221",
    tier: "Silver",
    totalSpent: "₹18,300",
    visits: 13,
    lastVisit: "2024-11-10",
  },
];
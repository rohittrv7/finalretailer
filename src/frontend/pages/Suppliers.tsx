import { useState } from "react";
import {
  Truck,
  CheckCircle,
  Clock,
  DollarSign,
  Search,
  Plus,
  Download,
  Eye,
  Edit3,
  Filter,
} from "lucide-react";
import MainLayout from "@/frontend/components/Layout/MainLayout";
import CustomTable from "@/frontend/components/CustomTable";

interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  products: string;
  totalOrders: number;
  outstanding: string;
  status: "active" | "pending";
}

const suppliersData: Supplier[] = [
  {
    id: "1",
    name: "Fresh Farms Ltd",
    contact: "+1 234 567 8901",
    email: "contact@freshfarms.com",
    products: "Dairy, Produce",
    totalOrders: 145,
    outstanding: "$2,340",
    status: "active",
  },
  {
    id: "2",
    name: "Bakery Supplies Co",
    contact: "+1 234 567 8902",
    email: "orders@bakerysup.com",
    products: "Bakery",
    totalOrders: 89,
    outstanding: "$0",
    status: "active",
  },
  {
    id: "3",
    name: "Wholesale Distributors",
    contact: "+1 234 567 8903",
    email: "info@wholesale.com",
    products: "Snacks, Beverages",
    totalOrders: 203,
    outstanding: "$1,850",
    status: "active",
  },
  {
    id: "4",
    name: "Organic Produce Inc",
    contact: "+1 234 567 8904",
    email: "sales@organic.com",
    products: "Produce",
    totalOrders: 67,
    outstanding: "$950",
    status: "pending",
  },
];

const statsCards = [
  { title: "Total Suppliers", value: "24", icon: Truck, color: "blue" },
  { title: "Active", value: "21", icon: CheckCircle, color: "green" },
  { title: "Pending", value: "3", icon: Clock, color: "yellow" },
  { title: "Outstanding", value: "$8,450", icon: DollarSign, color: "red" },
];

export default function Suppliers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "pending"
  >("all");

  const filteredSuppliers = suppliersData.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.contact.includes(searchQuery);
    const matchesStatus = filterStatus === "all" || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const columns = [
    {
      key: "name" as keyof Supplier,
      header: "Supplier",
      render: (item: Supplier) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
            {getInitials(item.name)}
          </div>
          <span className="font-semibold text-gray-900 dark:text-white">
            {item.name}
          </span>
        </div>
      ),
    },
    {
      key: "contact" as keyof Supplier,
      header: "Contact",
      render: (item: Supplier) => (
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {item.contact}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {item.email}
          </p>
        </div>
      ),
    },
    {
      key: "products" as keyof Supplier,
      header: "Products",
      className: "text-gray-700 dark:text-gray-300",
    },
    {
      key: "totalOrders" as keyof Supplier,
      header: "Total Orders",
      render: (item: Supplier) => (
        <span className="font-semibold text-gray-900 dark:text-white">
          {item.totalOrders}
        </span>
      ),
    },
    {
      key: "outstanding" as keyof Supplier,
      header: "Outstanding",
      render: (item: Supplier) => (
        <span
          className={`font-bold ${
            item.outstanding === "$0"
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {item.outstanding}
        </span>
      ),
    },
    {
      key: "status" as keyof Supplier,
      header: "Status",
      render: (item: Supplier) => (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            item.status === "active"
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
          }`}
        >
          {item.status === "active" ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <Clock className="w-3 h-3" />
          )}
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </span>
      ),
    },
    {
      key: "actions" as keyof Supplier,
      header: "",
      render: () => (
        <>
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
            <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
            <Edit3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Suppliers
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage your supplier relationships
              </p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                <Download className="w-4 h-4" /> Export
              </button>
              <button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl">
                <Plus className="w-5 h-5" /> New Supplier
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat, i) => {
              const Icon = stat.icon;
              const colors = {
                blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                green:
                  "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
                yellow:
                  "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
                red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
              };
              return (
                <div
                  key={i}
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                >
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <div
                      className={`p-2 rounded-xl ${
                        colors[stat.color as keyof typeof colors]
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </h3>
                </div>
              );
            })}
          </div>

          {/* Table with Search + Filter */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search suppliers by name or contact"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="pl-10 pr-8 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reusable Table */}
            <CustomTable data={filteredSuppliers} columns={columns} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

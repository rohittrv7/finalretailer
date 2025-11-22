import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Users,
  Star,
  ShoppingBag,
  DollarSign,
  Search,
  Plus,
  Download,
  Edit3,
  Trash2,
  Crown,
  Medal,
  Award,
} from "lucide-react";
import MainLayout from "@/frontend/components/Layout/MainLayout";

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  image: string;
  tier: "Gold" | "Silver" | "Bronze" | "Regular";
  totalSpent: string;
  visits: number;
  lastVisit: string;
}

const statsCards = [
  { title: "Total Customers", value: "1,847", icon: Users, color: "blue" },
  { title: "Gold Members", value: "124", icon: Crown, color: "yellow" },
  {
    title: "Avg. Purchase",
    value: "$54.20",
    icon: ShoppingBag,
    color: "green",
  },
  {
    title: "Lifetime Value",
    value: "$125k",
    icon: DollarSign,
    color: "purple",
  },
];

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios
      .get("https://dummyjson.com/users?limit=10")
      .then((res) => {
        const fetched = res.data.users.map((u: any, i: number) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          phone: u.phone,
          image: u.image,
          tier: ["Gold", "Silver", "Bronze", "Regular"][
            Math.floor(Math.random() * 4)
          ] as any,
          totalSpent: `$${Math.floor(Math.random() * 3000 + 100)}`,
          visits: Math.floor(Math.random() * 80 + 5),
          lastVisit: [
            "Today",
            "Yesterday",
            "2 days ago",
            "1 week ago",
            "2 weeks ago",
          ][Math.floor(Math.random() * 5)],
        }));
        setCustomers(fetched);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      `${c.firstName} ${c.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const getTierConfig = (tier: string) => {
    switch (tier) {
      case "Gold":
        return {
          bg: "bg-yellow-100 dark:bg-yellow-900/30",
          text: "text-yellow-700 dark:text-yellow-400",
          icon: Crown,
        };
      case "Silver":
        return {
          bg: "bg-gray-100 dark:bg-gray-800/50",
          text: "text-gray-700 dark:text-gray-400",
          icon: Medal,
        };
      case "Bronze":
        return {
          bg: "bg-orange-100 dark:bg-orange-900/30",
          text: "text-orange-700 dark:text-orange-400",
          icon: Award,
        };
      default:
        return {
          bg: "bg-slate-100 dark:bg-slate-700",
          text: "text-slate-700 dark:text-slate-400",
          icon: null,
        };
    }
  };

  const getInitials = (first: string, last: string) => {
    return `${first[0]}${last[0]}`.toUpperCase();
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Customers
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage loyalty and customer relationships
              </p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                <Download className="w-4 h-4" /> Export
              </button>
              <button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl">
                <Plus className="w-5 h-5" /> Add Customer
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat, i) => {
              const Icon = stat.icon;
              const colors = {
                blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                yellow:
                  "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
                green:
                  "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
                purple:
                  "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
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

          {/* Customers Table */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers by name, email, or phone"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700">
                      <th className="text-left p-4 font-semibold text-blue-600 dark:text-blue-400">
                        Customer
                      </th>
                      <th className="text-left p-4 font-semibold text-blue-600 dark:text-blue-400">
                        Contact
                      </th>
                      <th className="text-left p-4 font-semibold text-blue-600 dark:text-blue-400">
                        Tier
                      </th>
                      <th className="text-left p-4 font-semibold text-blue-600 dark:text-blue-400">
                        Total Spent
                      </th>
                      <th className="text-left p-4 font-semibold text-blue-600 dark:text-blue-400">
                        Visits
                      </th>
                      <th className="text-left p-4 font-semibold text-blue-600 dark:text-blue-400">
                        Last Visit
                      </th>
                      <th className="text-left p-4 font-semibold text-blue-600 dark:text-blue-400"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => {
                      const tier = getTierConfig(customer.tier);
                      const TierIcon = tier.icon;
                      return (
                        <tr
                          key={customer.id}
                          className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <img
                                  src={customer.image}
                                  alt={customer.firstName}
                                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-800"
                                />
                                <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {customer.firstName} {customer.lastName}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {customer.email}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {customer.phone}
                              </p>
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${tier.bg} ${tier.text}`}
                            >
                              {TierIcon && <TierIcon className="w-3 h-3" />}
                              {customer.tier}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-green-600 dark:text-green-400">
                            {customer.totalSpent}
                          </td>
                          <td className="p-4 font-semibold text-gray-900 dark:text-white">
                            {customer.visits}
                          </td>
                          <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                            {customer.lastVisit}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
                                <Edit3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              </button>
                              <button className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

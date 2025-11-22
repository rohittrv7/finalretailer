import { useNavigate } from "react-router-dom";
import { TrendingUp, Receipt, AlertTriangle, Clock, Plus } from "lucide-react";
import { quickActions, topCategories, topProducts } from "@/frontend/data/data";
import MainLayout from "@/frontend/components/Layout/MainLayout";
import SalesOverviewCard from "@/frontend/components/Graph/SalesOverviewCard";

const statsCards = [
  {
    title: "Today's Sales",
    value: "$8,420",
    change: "+12% vs yesterday",
    badge: "Live",
    icon: TrendingUp,
    color: "blue",
  },
  {
    title: "Profit",
    value: "$2,310",
    subtitle: "Margin 27.4%",
    icon: Receipt,
    color: "green",
  },
  {
    title: "Orders",
    value: "156",
    subtitle: "Avg basket $54",
    icon: Receipt,
    color: "yellow",
  },
  {
    title: "Stock Alerts",
    value: "18 items",
    subtitle: "5 expiring soon",
    icon: AlertTriangle,
    color: "red",
  },
];

const lowStockItems = [
  {
    name: "Milk 1L",
    quantity: "3 left",
    status: "critical",
    icon: AlertTriangle,
  },
  {
    name: "Yogurt Pack",
    quantity: "Expiry 5 days",
    status: "warning",
    icon: Clock,
  },
  {
    name: "AA Batteries",
    quantity: "7 left",
    status: "critical",
    icon: AlertTriangle,
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Welcome back! Here's what's happening today.
              </p>
            </div>
            <button
              onClick={() => navigate("/pos")}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
            >
              <Plus className="w-5 h-5" /> New Invoice
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat, i) => {
              // const Icon = stat.icon;
              // const colors = {
              //   blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
              //   green:
              //     "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
              //   yellow:
              //     "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
              //   red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
              // };
              return (
                <div
                  key={i}
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                >
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    {stat.badge && (
                      <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded-full">
                        {stat.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {stat.value}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {stat.change || stat.subtitle}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Overview */}
            <div className="lg:col-span-2">
              <SalesOverviewCard />
            </div>

            {/* Low Stock & Expiry */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-5">
                Low Stock & Expiry
              </h3>
              <div className="space-y-3">
                {lowStockItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-xl ${
                        item.status === "critical"
                          ? "bg-red-50 dark:bg-red-900/20"
                          : "bg-yellow-50 dark:bg-yellow-900/20"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          item.status === "critical"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                            : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {item.quantity}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-bold rounded-full text-white ${
                          item.status === "critical"
                            ? "bg-red-600"
                            : "bg-yellow-600"
                        }`}
                      >
                        {item.quantity.split(" ")[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Categories */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Top Categories
                </h3>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-full">
                  Revenue
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700">
                      <th className="text-left py-2 font-semibold text-blue-600 dark:text-blue-400">
                        Category
                      </th>
                      <th className="text-left py-2 font-semibold text-blue-600 dark:text-blue-400">
                        Sales
                      </th>
                      <th className="text-left py-2 font-semibold text-blue-600 dark:text-blue-400">
                        Profit
                      </th>
                      <th className="text-left py-2 font-semibold text-blue-600 dark:text-blue-400">
                        Margin
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCategories.map((cat, i) => (
                      <tr
                        key={i}
                        className="border-b border-gray-100 dark:border-slate-700"
                      >
                        <td className="py-2 font-semibold text-gray-900 dark:text-white">
                          {cat.category}
                        </td>
                        <td className="py-2 text-gray-700 dark:text-gray-300">
                          {cat.sales}
                        </td>
                        <td className="py-2 text-green-600 dark:text-green-400">
                          {cat.profit}
                        </td>
                        <td className="py-2 text-gray-700 dark:text-gray-300">
                          {cat.margin}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Products */}
            <div className="lg:col-span-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Top Products
                </h3>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-full">
                  Units Sold
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700">
                      <th className="text-left py-3 font-semibold text-blue-600 dark:text-blue-400">
                        Product
                      </th>
                      <th className="text-left py-3 font-semibold text-blue-600 dark:text-blue-400">
                        Units
                      </th>
                      <th className="text-left py-3 font-semibold text-blue-600 dark:text-blue-400">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((product, i) => (
                      <tr
                        key={i}
                        className="border-b border-gray-100 dark:border-slate-700"
                      >
                        <td className="py-3 font-semibold text-gray-900 dark:text-white">
                          {product.product}
                        </td>
                        <td className="py-3 text-gray-700 dark:text-gray-300">
                          {product.units.toLocaleString()}
                        </td>
                        <td className="py-3 font-bold text-green-600 dark:text-green-400">
                          {product.revenue}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <button
                  key={i}
                  onClick={() => navigate(action.path)}
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                      <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white">
                        {action.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

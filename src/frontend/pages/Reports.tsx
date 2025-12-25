import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  FileText,
  Download,
  Printer,
  Package,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { format } from "date-fns";

const salesMetrics = [
  {
    title: "Total Sales",
    value: 48320,
    change: "+12%",
    trending: "up",
    icon: TrendingUp,
    color: "green",
  },
  {
    title: "Gross Profit",
    value: 14760,
    change: "+8%",
    trending: "up",
    icon: FileText,
    color: "blue",
  },
  {
    title: "Avg. Order Value",
    value: 28.4,
    change: "+3%",
    trending: "up",
    icon: ShoppingCart,
    color: "purple",
  },
  {
    title: "Refund Rate",
    value: 1.6,
    change: "-0.2pp",
    trending: "down",
    icon: TrendingDown,
    color: "orange",
  },
];

const topCategories = [
  { category: "Dairy", sales: 12300, profit: 3540, margin: 28.8 },
  { category: "Produce", sales: 9420, profit: 2260, margin: 24.0 },
  { category: "Bakery", sales: 7880, profit: 1960, margin: 24.9 },
  { category: "Snacks", sales: 6210, profit: 1310, margin: 21.1 },
];

const topProducts = [
  { product: "Milk 1L", units: 1240, revenue: 1736 },
  { product: "Eggs (12)", units: 980, revenue: 3136 },
  { product: "Bread Loaf", units: 860, revenue: 2150 },
  { product: "Bananas", units: 745, revenue: 1341 },
];

const lowStockAlerts = [
  { item: "Chocolate Bar", inStock: 12, reorder: 50 },
  { item: "Butter 200g", inStock: 8, reorder: 30 },
  { item: "Apples", inStock: "15kg", reorder: "40kg" },
];

export default function Reports() {
  const [dateRange, setDateRange] = useState("Last 30 days");
  const [animatedValues, setAnimatedValues] = useState(
    salesMetrics.map((m) => 0)
  );

  // Animate numbers on load
  useEffect(() => {
    salesMetrics.forEach((metric, i) => {
      let start = 0;
      const end = metric.value;
      const duration = 1500;
      const increment = end / (duration / 16);

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setAnimatedValues((prev) => {
            const newVals = [...prev];
            newVals[i] = end;
            return newVals;
          });
          clearInterval(timer);
        } else {
          setAnimatedValues((prev) => {
            const newVals = [...prev];
            newVals[i] = Math.floor(start);
            return newVals;
          });
        }
      }, 16);

      return () => clearInterval(timer);
    });
  }, []);

  const formatCurrency = (val: number) => `$${val.toLocaleString()}`;
  const formatAOV = (val: number) => `$${val.toFixed(2)}`;
  const formatPercent = (val: number) => `${val}%`;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Reports
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-300 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>This year</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-800 transition-all">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl">
                <Download className="w-5 h-5" /> Export
              </button>
            </div>
          </div>

          {/* Sales Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {salesMetrics.map((metric, i) => {
              const Icon = metric.icon;
              const isUp = metric.trending === "up";
              return (
                <div
                  key={metric.title}
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                >
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {metric.title}
                    </p>
                    <div
                      className={`flex items-center gap-1 text-xs font-bold ${
                        isUp ? "text-green-600" : "text-orange-600"
                      }`}
                    >
                      {isUp ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : (
                        <ArrowDown className="w-3 h-3" />
                      )}
                      {metric.change}
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {i === 2
                        ? formatAOV(animatedValues[i])
                        : i === 3
                        ? formatPercent(animatedValues[i])
                        : formatCurrency(animatedValues[i])}
                    </h3>
                    <div
                      className={`p-3 rounded-xl ${
                        isUp
                          ? "bg-green-100 dark:bg-green-900/20"
                          : "bg-orange-100 dark:bg-orange-900/20"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          isUp ? "text-green-600" : "text-orange-600"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Overview Chart */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Sales Overview
                </h3>
                <div className="h-80 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl flex items-center justify-center border-2 border-dashed border-blue-300 dark:border-blue-700">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                      [Interactive Chart Coming Soon]
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Low Stock Alerts */}
            <div>
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Low Stock Alerts
                  </h3>
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Critical
                  </span>
                </div>
                <div className="space-y-3">
                  {lowStockAlerts.map((alert) => (
                    <div
                      key={alert.item}
                      className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {alert.item}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Reorder: {alert.reorder}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-red-600 dark:text-red-400">
                        {alert.inStock}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Categories */}
            <div>
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Top Categories
                  </h3>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full">
                    Revenue
                  </span>
                </div>
                <div className="space-y-3">
                  {topCategories.map((cat) => (
                    <div
                      key={cat.category}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-xl"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {cat.category}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Margin: {cat.margin}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">
                          ${cat.sales.toLocaleString()}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          +${cat.profit.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Products */}
            <div>
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Top Products
                  </h3>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-full">
                    Units Sold
                  </span>
                </div>
                <div className="space-y-3">
                  {topProducts.map((prod, i) => (
                    <div
                      key={prod.product}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-200 dark:bg-purple-700 rounded-full flex items-center justify-center text-xs font-bold text-purple-700 dark:text-purple-300">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {prod.product}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {prod.units.toLocaleString()} units
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-purple-600 dark:text-purple-400">
                        ${prod.revenue.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

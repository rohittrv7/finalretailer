import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import MainLayout from "@/components/Layout/MainLayout";
import CustomTable, { Column } from "@/components/CustomTable";

interface InventoryItem {
  id: string;
  title: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  reorder: number;
  price: string;
  status: "in-stock" | "low" | "out";
  movement: "up" | "down";
}

const inventoryData: InventoryItem[] = [
  {
    id: "1",
    name: "Milk 1L",
    sku: "MK-1L",
    category: "Dairy",
    stock: 25,
    reorder: 50,
    price: "$1.40",
    status: "low",
    movement: "down",
  },
  {
    id: "2",
    name: "Bread Loaf",
    sku: "BR-001",
    category: "Bakery",
    stock: 42,
    reorder: 30,
    price: "$2.50",
    status: "in-stock",
    movement: "up",
  },
  {
    id: "3",
    name: "Eggs (12)",
    sku: "EG-012",
    category: "Dairy",
    stock: 18,
    reorder: 20,
    price: "$3.20",
    status: "low",
    movement: "down",
  },
  {
    id: "4",
    name: "Chocolate Bar",
    sku: "CH-099",
    category: "Snacks",
    stock: 120,
    reorder: 50,
    price: "$0.99",
    status: "in-stock",
    movement: "up",
  },
  {
    id: "5",
    name: "Apples",
    sku: "AP-210",
    category: "Produce",
    stock: 0,
    reorder: 40,
    price: "$2.10/kg",
    status: "out",
    movement: "down",
  },
  {
    id: "6",
    name: "Orange Juice",
    sku: "OJ-500",
    category: "Beverages",
    stock: 35,
    reorder: 25,
    price: "$3.50",
    status: "in-stock",
    movement: "up",
  },
  {
    id: "7",
    name: "Rice 5kg",
    sku: "RC-5KG",
    category: "Grocery",
    stock: 12,
    reorder: 15,
    price: "$8.99",
    status: "low",
    movement: "down",
  },
  {
    id: "8",
    name: "Tomatoes",
    sku: "TM-001",
    category: "Produce",
    stock: 55,
    reorder: 30,
    price: "$2.50/kg",
    status: "in-stock",
    movement: "up",
  },
  {
    id: "9",
    name: "Pasta",
    sku: "PS-500",
    category: "Grocery",
    stock: 0,
    reorder: 20,
    price: "$1.99",
    status: "out",
    movement: "down",
  },
  {
    id: "10",
    name: "Coffee Beans",
    sku: "CF-250",
    category: "Beverages",
    stock: 28,
    reorder: 15,
    price: "$12.99",
    status: "in-stock",
    movement: "up",
  },
  {
    id: "11",
    name: "Chicken Breast",
    sku: "CK-1KG",
    category: "Meat",
    stock: 8,
    reorder: 10,
    price: "$9.99/kg",
    status: "low",
    movement: "down",
  },
  {
    id: "12",
    name: "Butter 500g",
    sku: "BT-500",
    category: "Dairy",
    stock: 45,
    reorder: 25,
    price: "$4.50",
    status: "in-stock",
    movement: "up",
  },
];

const stats = [
  {
    title: "Total Items",
    value: "1,247",
    icon: Package,
    color: "from-blue-500 to-indigo-600",
  },
  {
    title: "Low Stock",
    value: "23",
    icon: AlertTriangle,
    color: "from-amber-500 to-orange-600",
  },
  {
    title: "Out of Stock",
    value: "5",
    icon: AlertTriangle,
    color: "from-red-500 to-rose-600",
  },
  {
    title: "Stock Value",
    value: "$45,320",
    icon: TrendingUp,
    color: "from-green-500 to-emerald-600",
  },
];

export default function Inventory() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  // const [page, setPage] = useState(0);
  // const [rowsPerPage, setRowsPerPage] = useState(10);
  // const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);
  const [inventory, setInventory] = useState(inventoryData);

  // const filtered = inventory.filter(
  //   (item) =>
  //     item.name.toLowerCase().includes(search.toLowerCase()) ||
  //     item.sku.toLowerCase().includes(search.toLowerCase())
  // );

  // const paginated = filtered.slice(
  //   page * rowsPerPage,
  //   page * rowsPerPage + rowsPerPage
  // );

  const handleDelete = () => {
    if (deleteItem) {
      setInventory((prev) => prev.filter((i) => i.id !== deleteItem.id));
      setDeleteItem(null);
      // toast
    }
  };

  // const getStatusStyle = (status: string) => {
  //   switch (status) {
  //     case "in-stock":
  //       return {
  //         bg: "bg-green-100 text-green-700",
  //         border: "border-green-200",
  //       };
  //     case "low":
  //       return {
  //         bg: "bg-amber-100 text-amber-700",
  //         border: "border-amber-200",
  //       };
  //     case "out":
  //       return { bg: "bg-red-100 text-red-700", border: "border-red-200" };
  //     default:
  //       return { bg: "bg-gray-100 text-gray-700", border: "border-gray-200" };
  //   }
  // };

  const inventoryColumns: Column<InventoryItem>[] = [
    { key: "name", header: "Product", sortable: true },
    { key: "sku", header: "SKU", sortable: true },
    { key: "category", header: "Category" },
    { key: "stock", header: "Stock", sortable: true, align: "center" },
    { key: "reorder", header: "Reorder", align: "center" },
    { key: "price", header: "Price" },
    {
      key: "status",
      header: "Status",
      render: (item: InventoryItem) => {
        const status = {
          "in-stock": "bg-green-100 text-green-700 border-green-200",
          low: "bg-amber-100 text-amber-700 border-amber-200",
          out: "bg-red-100 text-red-700 border-red-200",
        }[item.status];
        return (
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${status}`}
          >
            {item.status === "in-stock"
              ? "In Stock"
              : item.status === "low"
              ? "Low Stock"
              : "Out of Stock"}
          </span>
        );
      },
    },
    { key: "actions", header: "" },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Inventory
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage your stock levels and reorder points
              </p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-800 transition-all">
                <Download className="w-4 h-4" /> Export
              </button>
              <button
                onClick={() => navigate("/inventory/add")}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
              >
                <Plus className="w-5 h-5" /> Add Item
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="group relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-white/20"
                >
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <div
                      className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-md`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* <div className="overflow-x-auto"> */}
            <CustomTable
              data={inventory}
              columns={inventoryColumns}
              title="Inventory"
              onAdd={() => navigate("/inventory/add")}
              onExport={() => alert("Exporting...")}
              onEdit={(item) => navigate(`/inventory/edit/${item.id}`)}
              onDelete={(item) => setDeleteItem(item)}
            />
          {/* </div> */}
        </div>
      </div>

      {deleteItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Confirm Delete
              </h3>
              <button
                onClick={() => setDeleteItem(null)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {deleteItem.name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteItem(null)}
                className="px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

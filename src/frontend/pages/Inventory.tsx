import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Download,
  Package,
  AlertTriangle,
  TrendingUp,
  Trash2,
} from "lucide-react";
import MainLayout from "@/frontend/components/Layout/MainLayout";
import { InventoryItem } from "@/frontend/types/inventry";
import CustomTable, { Column } from "../components/CustomTable";
import DeletePopup from "../components/DeletePopup";
import { toast } from "sonner";
import { CartItem } from "../types/cart";

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
  const [openDeletePopup, setOpenDeletePopup] = useState(false);
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const refreshCart = async () => {
    const res = await window.electronAPI.cart.getAll();
    if (res.success) {
      setCartItems(res.data || []);
    }
  };

  const loadItems = async () => {
    const result = await window.electronAPI.inventory.getAll();
    if (result.success && result.data) {
      setInventory(result.data || []);
    }
  };

  const handleItem = async (row: InventoryItem, key: string) => {
    if (key === "edit") {
      // setSelectedBeneficiary(row);
      // setIsBeneficiaryModalOpen(true);
    } else if (key === "delete") {
      setOpenDeletePopup(true);
      setDeleteItem(row);
    }
  };

  const deleteProduct = async () => {
    setOpenDeletePopup(false);
    try {
      const result = await window.electronAPI.inventory.delete(deleteItem.id);
      if (result.success) {
        toast.success("Item deleted successfully");
        setDeleteItem(null);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      loadItems();
      refreshCart();
    };
    loadData();
  }, [location, deleteItem]);

  const inventoryColumns: Column<InventoryItem>[] = [
    { key: "productName", header: "Product", sortable: true },
    { key: "sku", header: "SKU", sortable: true },
    { key: "category", header: "Category" },
    {
      key: "stock",
      header: "Stock",
      sortable: true,
      align: "center",
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {item.stock} {item.unit}
          </span>
        </div>
      ),
    },
    { key: "reorderLevel", header: "Reorder", align: "center" },
    {
      key: "sellingPrice",
      header: "Price",
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">
            ₹ {item.sellingPrice}/{item.unit}
          </span>
        </div>
      ),
    },
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
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (item: InventoryItem) => {
        const cartItem = Array.isArray(cartItems)
          ? cartItems.find((c) => c.inventoryId === item.id)
          : null;

        const qtyInCart = cartItem?.quantity ?? 0;
        const availableStock = Math.max(0, item.stock - qtyInCart);
        const isOutOfStock = availableStock <= 0;

        const handleIncrement = async () => {
          if (isOutOfStock) {
            toast.error("Out of stock!");
            return;
          }

          if (cartItem) {
            await window.electronAPI.cart.updateQuantity({
              cartId: cartItem.id,
              newQuantity: qtyInCart + 1,
            });
          } else {
            await window.electronAPI.cart.add({
              item,
              quantity: 1,
            });
            toast.success("Added to cart");
          }
          loadItems();
          refreshCart();
        };

        const handleDecrement = async () => {
          if (!cartItem) return;

          if (qtyInCart <= 1) {
            await window.electronAPI.cart.remove(cartItem.id);
            toast.success("Removed from cart");
          } else {
            await window.electronAPI.cart.updateQuantity({
              cartId: cartItem.id,
              newQuantity: qtyInCart - 1,
            });
          }
          loadItems();
          refreshCart();
        };

        return (
          <div className="flex items-center justify-center gap-3">
            {/* ADD Button or Stepper */}
            {qtyInCart === 0 ? (
              <button
                onClick={handleIncrement}
                disabled={isOutOfStock}
                className={`px-4 py-1 rounded-xl tracking-wide transition-all duration-200 shadow-lg active:scale-95 ${
                  isOutOfStock
                    ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white shadow-fuchsia-500/30"
                }`}
              >
                {isOutOfStock ? "OUT OF STOCK" : "ADD"}
              </button>
            ) : (
              <div className="flex items-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-pink-300 dark:border-pink-800 rounded-2xl shadow-xl overflow-hidden">
                {/* Minus */}
                <button
                  onClick={handleDecrement}
                  className="w-9 h-9 flex items-center justify-center text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/40 font-black text-2xl transition-all active:scale-90"
                >
                  −
                </button>

                {/* Quantity */}
                <div className="px-2">
                  <span className="text-gray-800 dark:text-gray-100 drop-shadow-md">
                    {qtyInCart}
                  </span>
                </div>

                {/* Plus */}
                <button
                  onClick={handleIncrement}
                  disabled={isOutOfStock}
                  className={`w-9 h-9 flex items-center justify-center font-black text-2xl transition-all active:scale-90 ${
                    isOutOfStock
                      ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                      : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/40"
                  }`}
                >
                  +
                </button>
              </div>
            )}

            {/* Delete from Inventory */}
            <button
              onClick={() => handleItem(item, "delete")}
              className="p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-2xl shadow-lg hover:shadow-red-500/30 transition-all hover:scale-110 active:scale-95"
              title="Delete item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 p-6">
        <div className="max-w-7xl mx-auto space-y-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

          <CustomTable
            data={inventory}
            columns={inventoryColumns}
            createButtonPath="/inventory/add"
          />
        </div>
      </div>

      {openDeletePopup && (
        <DeletePopup
          isOpen={openDeletePopup}
          title={"Inventry"}
          name={deleteItem?.productName}
          onClose={() => setOpenDeletePopup(false)}
          onConfirm={() => deleteProduct()}
        />
      )}
    </MainLayout>
  );
}

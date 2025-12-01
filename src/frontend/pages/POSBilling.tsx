import { useEffect, useState } from "react";
import { Search, QrCode, Receipt, Plus, Package, Trash2 } from "lucide-react";
import CustomTable, { Column } from "@/frontend/components/CustomTable";
import MainLayout from "@/frontend/components/Layout/MainLayout";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { InventoryItem } from "../types/inventry";
import { StoreInfo } from "../types/storeSetting";
import { CartItem } from "../types/cart";
import SaveInvoiceModal from "../components/SaveInvoiceModal";

export default function POSBilling() {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [qtyInput, setQtyInput] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [storeInfo, setStoreInfo] = useState<StoreInfo>();
  const [openSaveModal, setOpenSaveModal] = useState(false);

  const loadItems = async () => {
    const invRes = await window.electronAPI.inventory.getAll();
    if (invRes.success) setInventoryItems(invRes.data || []);
  };

  useEffect(() => {
    const loadStore = async () => {
      const res = await window.electronAPI.store.get();
      if (res.success && res.data) {
        const data = res.data;
        setStoreInfo(data);
        // setGstin(data.gstin || "");
        // setGstVerified(data.gstVerified === 1);
      }
    };
    loadStore();
  }, []);

  const refreshCart = async () => {
    const res = await window.electronAPI.cart.getAll();
    if (res.success) setCartItems(res.data || []);
  };

  useEffect(() => {
    loadItems();
    refreshCart();
  }, [cartItems]);

  const navigation = useNavigate();

  useEffect(() => {
    loadItems();
  }, []);

  const columns: Column<CartItem>[] = [
    {
      key: "productName",
      header: "Item",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{item.productName}</span>
        </div>
      ),
    },
    {
      key: "quantity",
      header: "Qty",
      align: "center",
      render: (item) => (
        <div className="flex items-center justify-center">
          {item.quantity} {item.unit}
        </div>
      ),
    },
    {
      key: "sellingPrice",
      header: "Price",
      align: "center",
      render: (item) => (
        <span className="font-bold text-green-600">
          ₹{item.sellingPrice.toFixed(2)} / {item.unit}
        </span>
      ),
    },
    {
      key: "totalPrice",
      header: "Total",
      align: "center",
      render: (item) => (
        <span className="font-bold text-green-600">
          ₹ {item.sellingPrice * item.quantity}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Qty",
      align: "center",
      // width: "180px",
      render: (cartItem: CartItem) => {
        const inventoryItem = inventoryItems.find(
          (i) => i.id === cartItem.inventoryId
        );
        const canIncrease = inventoryItem ? inventoryItem.stock > 0 : false;

        const handleIncrement = async () => {
          if (!canIncrease) {
            toast.error("Stock khatam!");
            return;
          }
          const res = await window.electronAPI.cart.updateQuantity({
            cartId: cartItem.id,
            newQuantity: cartItem.quantity + 1,
          });
          if (res.success) {
            refreshCart();
            loadItems();
          }
        };

        const handleDecrement = async () => {
          if (cartItem.quantity <= 1) {
            const res = await window.electronAPI.cart.remove(cartItem.id);
            if (res.success) {
              toast.success("Hata diya");
              refreshCart();
              loadItems();
            }
          } else {
            const res = await window.electronAPI.cart.updateQuantity({
              cartId: cartItem.id,
              newQuantity: cartItem.quantity - 1,
            });
            if (res.success) {
              refreshCart();
              loadItems();
            }
          }
        };

        return (
          <div className="flex items-center justify-center gap-3">
            {/* Quantity Stepper - Modern Glassmorphism Style */}
            <div className="flex items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl shadow-md overflow-hidden">
              {/* Minus */}
              <button
                onClick={handleDecrement}
                className="w-9 h-9 flex items-center justify-center text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/30 font-bold text-xl transition-all active:scale-90"
              >
                −
              </button>

              {/* Quantity - Bold & Big */}
              <div className="px-2">
                <span className="text-1xl font-normal text-gray-800 dark:text-gray-100">
                  {cartItem.quantity}
                </span>
              </div>

              {/* Plus */}
              <button
                onClick={handleIncrement}
                disabled={!canIncrease}
                className={`w-9 h-9 flex items-center justify-center font-bold text-xl transition-all active:scale-90 ${
                  canIncrease
                    ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                    : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                }`}
              >
                +
              </button>
            </div>

            {/* Delete Button - Floating Style */}
            <button
              onClick={async () => {
                const res = await window.electronAPI.cart.remove(cartItem.id);
                if (res.success) {
                  toast.success(res.message ?? "Item remove from Billing");
                  refreshCart();
                  loadItems();
                }
              }}
              className="p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-xl shadow-lg hover:shadow-red-500/25 transition-all hover:scale-110 active:scale-95"
              title="Remove"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 p-6">
        <div className="w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Billing (POS)
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Point of Sale System
              </p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-800 transition-all">
                <QrCode className="w-4 h-4" /> Barcode
              </button>
              <button
                onClick={() => navigation("/inventory")}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
              >
                <Plus className="w-5 h-5" /> New Sale
              </button>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Current Sale */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Current Sale
                  </h3>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                      <QrCode className="w-4 h-4" /> Scan
                    </button>
                    <button
                      onClick={() => navigation("/inventory")}
                      className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
                    >
                      <Search className="w-4 h-4" /> Search
                    </button>
                  </div>
                </div>

                {/* Input Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  <div className="relative">
                    <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Scan barcode or type item name"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Qty"
                    value={qtyInput}
                    onChange={(e) => setQtyInput(e.target.value)}
                    className="px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Discount code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  />
                </div>

                {/* Cart Table */}

                <CustomTable
                  data={cartItems}
                  columns={columns}
                  showPagination={false}
                  createButtonPath={"/inventory"}
                />
                {cartItems.length > 0 && (
                  <>
                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-end gap-3 mt-6">
                      {/* Save Draft - Small Subtle */}
                      <button className="flex border border-gray-600 items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all">
                        <Receipt className="w-4 h-4" />
                        Draft
                      </button>

                      {/* Clear Cart - Small Danger */}
                      {/* <button
                    onClick={handleClearCart}
                    className="flex items-center gap-2 px-4 py-2 text-sm border border-red-900/90 font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button> */}

                      <button
                        type="button"
                        onClick={() => setOpenSaveModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer"
                      >
                        Check Bill & Amount
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <SaveInvoiceModal
              open={openSaveModal}
              onClose={() => {
                setOpenSaveModal(false);
              }}
              cartItems={cartItems}
              storeInfo={storeInfo}
              cashierName={"Rohit Kumar"}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

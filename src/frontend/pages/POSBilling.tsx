import { useEffect, useState } from "react";
import {
  Search,
  QrCode,
  X,
  Receipt,
  Plus,
  Package,
  Trash2,
  Printer,
  User,
} from "lucide-react";
import CustomTable, { Column } from "@/frontend/components/CustomTable";
import MainLayout from "@/frontend/components/Layout/MainLayout";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { InventoryItem } from "../types/inventry";
import { StoreSettings } from "../types/storeSetting";
import { CartItem } from "../types/cart";

export default function POSBilling() {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [qtyInput, setQtyInput] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [note, setNote] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [cashReceived, setCashReceived] = useState("");
  const [changeAmount, setChangeAmount] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [storeInfo, setStoreInfo] = useState<StoreSettings>();
  const [gstVerified, setGstVerified] = useState(false);
  const [gstin, setGstin] = useState("");

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
        setGstin(data.gstin || "");
        setGstVerified(data.gstVerified === 1);
      }
    };
    loadStore();
  }, []);

  const refreshCart = async () => {
    const res = await window.electronAPI.cart.getAll();
    if (res.success) setCartItems(res.data || []);
  };

  const handleClearCart = async () => {
    const res = await window.electronAPI.cart.clear();
    if (res.success) {
      toast.success("Cart cleared & stock returned!");
      refreshCart();
      loadItems();
    } else {
      toast.error(res.error || "Failed to clear cart");
    }
  };

  const handlePayAndPrint = () => {
    if (cartItems.length === 0) {
      toast.error("Cart is empty!");
      return;
    }
    setShowPaymentModal(true);
  };

  const confirmAndPrint = async () => {
    // Thermal printer pe print
    const billData = [
      {
        type: "text",
        value: "        MY SHOP",
        style: { fontSize: "20px", fontWeight: "700", textAlign: "center" },
      },
      {
        type: "text",
        value: "   Your Address Here",
        style: { textAlign: "center" },
      },
      {
        type: "text",
        value: "   GSTIN: 22AAAAA0000A1Z5 | Ph: 98765 43210",
        style: { textAlign: "center" },
      },
      { type: "text", value: "------------------------------------------" },
      {
        type: "text",
        value: `Date: ${new Date().toLocaleString()}`,
        style: { fontSize: "12px" },
      },
      {
        type: "text",
        value: customerName ? `Customer: ${customerName}` : "",
        style: { fontSize: "12px" },
      },
      { type: "text", value: "------------------------------------------" },

      ...cartItems.map((item) => ({
        type: "text",
        value: `${item.productName.substring(0, 22).padEnd(22)} ${
          item.quantity
        }x${parseFloat(item.sellingPrice).toFixed(2)} = ${(
          item.quantity * parseFloat(item.sellingPrice)
        ).toFixed(2)}`,
      })),

      { type: "text", value: "------------------------------------------" },
      {
        type: "text",
        value: `Subtotal:                 ₹${subtotal.toFixed(2)}`,
        style: { textAlign: "right" },
      },
      {
        type: "text",
        value: `GST (${storeInfo.defaultTaxRate || 18}%): ₹${gst.toFixed(2)}`,
        style: { textAlign: "right" },
      },
      {
        type: "text",
        value: `TOTAL:                    ₹${total.toFixed(2)}`,
        style: { fontWeight: "700", fontSize: "16px", textAlign: "right" },
      },
      {
        type: "text",
        value:
          paymentMethod === "Cash"
            ? `Cash Received:           ₹${parseFloat(
                cashReceived || "0"
              ).toFixed(2)}`
            : "",
        style: { textAlign: "right" },
      },
      {
        type: "text",
        value:
          changeAmount > 0
            ? `Change:                  ₹${changeAmount.toFixed(2)}`
            : "",
        style: { textAlign: "right" },
      },
      { type: "text", value: "------------------------------------------" },
      {
        type: "text",
        value: "         THANK YOU!",
        style: { fontWeight: "700", fontSize: "18px", textAlign: "center" },
      },
      {
        type: "text",
        value: "       Visit Again :)",
        style: { textAlign: "center" },
      },
      { type: "text", value: "\n\n\n" },
    ];

    const res = await window.electronAPI.cart.printBill(billData);
    if (res.success) {
      toast.success("Bill printed successfully!");
      await window.electronAPI.cart.clear(); // cart clear + stock return
      refreshCart();
      setShowPaymentModal(false);
      setCashReceived("");
      setChangeAmount(0);
    } else {
      toast.error("Printer not connected!");
    }
  };

  useEffect(() => {
    loadItems();
    refreshCart();
  }, []);

  const navigation = useNavigate();

  // const discountRate = 0.1; // or from settings / coupon
  const subtotal = cartItems.reduce((sum, item) => sum + item.taxableAmount, 0);
  const discount = cartItems.reduce(
    (sum, item) => sum + (item.discount || 0),
    0
  );
  const gst = cartItems.reduce((sum, item) => sum + item.gstAmount, 0);
  const total = subtotal - discount + gst;

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
          ₹ {parseFloat(item.sellingPrice)}/{item.unit}
        </span>
      ),
    },
    {
      key: "totalPrice",
      header: "Total",
      align: "center",
      render: (item) => (
        <span className="font-bold text-green-600">
          ₹ {parseFloat(item.sellingPrice) * item.quantity}
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

                {/* Note */}
                <div className="mt-6">
                  <textarea
                    placeholder="Add note (order, delivery, etc.)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-end gap-3 mt-6">
                  {/* Save Draft - Small Subtle */}
                  <button className="flex border border-gray-600 items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all">
                    <Receipt className="w-4 h-4" />
                    Draft
                  </button>

                  {/* Clear Cart - Small Danger */}
                  <button
                    onClick={handleClearCart}
                    className="flex items-center gap-2 px-4 py-2 text-sm border border-red-900/90 font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button>

                  <button
                    onClick={handlePayAndPrint}
                    className="flex items-center border border-green-800 gap-2.5 px-6 py-2 bg-gradient-to-r from-green-300/20 to-emerald-600/20 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-101 active:scale-100 text-base"
                  >
                    <Printer className="w-5 h-5" />
                    Pay & Print — ₹{total.toFixed(2)}
                  </button>
                </div>
              </div>
            </div>

            {/* Payment */}
            {showPaymentModal && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[90vh]">
                  {/* Header - Fixed */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex justify-between items-center rounded-t-3xl flex-shrink-0">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      <Receipt className="w-8 h-8" />
                      Complete Payment & Print Bill
                    </h2>
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="p-2 hover:bg-white/20 rounded-xl transition-all"
                    >
                      <X className="w-7 h-7" />
                    </button>
                  </div>

                  {/* Main Content - Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 overflow-hidden">
                    {/* Left - Payment (Fixed) */}
                    <div className="p-8 space-y-6 overflow-y-auto scroll-hide border-r border-gray-200 dark:border-slate-700">
                      {/* Customer Name */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Customer Name (Optional)
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Walk-in Customer"
                            className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-blue-500/30 text-base"
                          />
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div>
                        <label className="block text-sm font-medium mb-3">
                          Payment Method
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {["Cash", "Card", "UPI", "PhonePe"].map((method) => (
                            <button
                              key={method}
                              onClick={() => setPaymentMethod(method)}
                              className={`py-4 rounded-xl font-bold transition-all ${
                                paymentMethod === method
                                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                                  : "bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600"
                              }`}
                            >
                              {method}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Cash Received */}
                      {paymentMethod === "Cash" && (
                        <div>
                          <label className="block text-sm font-medium mb-3">
                            Cash Received
                          </label>
                          <input
                            type="number"
                            value={cashReceived}
                            onChange={(e) => setCashReceived(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-6 py-4 text-3xl font-black text-center border-4 border-green-500 rounded-2xl focus:ring-4 focus:ring-green-500/30"
                          />
                          {changeAmount > 0 && (
                            <div className="mt-5 text-center">
                              <p className="text-lg text-gray-600">
                                Change Return
                              </p>
                              <p className="text-5xl font-black text-green-600">
                                ₹{changeAmount.toFixed(2)}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right - Bill Preview (Scrollable) */}
                    <div className="bg-gray-50 dark:bg-slate-900/90 p-8 overflow-y-auto scroll-hide">
                      {/* Store Header */}
                      <div className="text-center mb-6 pb-6 border-b-4 border-dashed border-gray-300 dark:border-slate-700">
                        <h3 className="text-3xl font-black">
                          {storeInfo.storeName || "My Store"}
                        </h3>
                        <p>{storeInfo.address || "Address not set"}</p>
                        {storeInfo.gstin ? (
                          <p className="font-bold">GSTIN: {storeInfo.gstin}</p>
                        ) : (
                          <p className="text-amber-600 dark:text-amber-400">
                            GST Unregistered
                          </p>
                        )}
                        <p>Phone: {storeInfo.phone || "Not set"}</p>
                      </div>

                      {/* Items */}
                      <div className="space-y-2 mb-6">
                        {cartItems.map((item, i) => (
                          <div
                            key={i}
                            className="flex justify-between font-medium"
                          >
                            <span className="max-w-[200px] truncate">
                              {item.productName}
                            </span>
                            <span>
                              {item.quantity} × ₹
                              {parseFloat(item.sellingPrice).toFixed(2)} = ₹
                              {(
                                item.quantity * parseFloat(item.sellingPrice)
                              ).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Calculations */}
                      <div className="border-t-4 border-dashed border-gray-300 dark:border-slate-700 pt-4 space-y-3 text-right font-bold text-lg">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>₹{subtotal.toFixed(2)}</span>
                        </div>

                        {discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount</span>
                            <span>-₹{discount.toFixed(2)}</span>
                          </div>
                        )}

                        {gstVerified ? (
                          <div className="flex justify-between">
                            <span>GST ({gstin || 18}%)</span>
                            <span>₹{gstin}</span>
                          </div>
                        ) : (
                          <div className="flex justify-between text-gray-500">
                            <span>GST</span>
                            <span>Not Applied</span>
                          </div>
                        )}

                        <div className="pt-4 border-t-2 border-gray-400 dark:border-slate-600">
                          <div className="flex justify-between text-3xl font-black text-green-600">
                            <span>TOTAL</span>
                            <span>₹{total.toFixed(2)}</span>
                          </div>
                        </div>

                        {paymentMethod === "Cash" && cashReceived && (
                          <>
                            <div className="flex justify-between text-lg">
                              <span>Cash Received</span>
                              <span>
                                ₹{parseFloat(cashReceived).toFixed(2)}
                              </span>
                            </div>
                            {changeAmount > 0 && (
                              <div className="flex justify-between text-2xl font-bold text-green-600">
                                <span>Change</span>
                                <span>₹{changeAmount.toFixed(2)}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="text-center mt-8">
                        <p className="text-3xl font-black">THANK YOU!</p>
                        <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                          Visit Again 😊
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Buttons - Fixed & Compact */}
                  <div className="p-5 border-t border-gray-200 dark:border-slate-700 flex gap-4 flex-shrink-0">
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="flex-1 py-3.5 border-2 border-gray-300 dark:border-slate-600 rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmAndPrint}
                      className="flex-1 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all hover:scale-105"
                    >
                      <Printer className="w-6 h-6" />
                      Print Bill
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

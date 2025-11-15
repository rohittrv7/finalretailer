"use client";

import React, { useState } from "react";
import {
  Search,
  QrCode,
  X,
  CreditCard,
  Wallet,
  Receipt,
  Plus,
  Package,
  Trash2,
} from "lucide-react";
import CustomTable, { Column } from "@/components/CustomTable";
import CatalogModal from "@/components/POS/CatalogModal";
import MainLayout from "@/components/Layout/MainLayout";

interface CartItem {
  id: string;
  name: string;
  qty: number | string;
  price: string;
  total: string;
}

export default function POSBilling() {
  const [showCatalog, setShowCatalog] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [qtyInput, setQtyInput] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [note, setNote] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<string>(""); // Payment state

  const [cartItems, setCartItems] = useState<CartItem[]>([
    { id: "1", name: "Bread Loaf", qty: 2, price: "$2.50", total: "$5.00" },
    { id: "2", name: "Eggs (12)", qty: 1, price: "$3.20", total: "$3.20" },
    {
      id: "3",
      name: "Bananas",
      qty: "1.2kg",
      price: "$1.80/kg",
      total: "$2.16",
    },
  ]);

  const products = [
    { id: 1, name: "Bread Loaf", qty: 2, price: 2.5 },
    { id: 2, name: "Eggs (12)", qty: 1, price: 3.2 },
    { id: 3, name: "Bananas", qty: 1.2, price: 1.8 },
  ];

  const discount = 0.5;
  const taxRate = 0.08;
  const subtotal = products.reduce((acc, p) => acc + p.qty * p.price, 0);
  const tax = (subtotal - discount) * taxRate;
  const total = subtotal - discount + tax;

  // Only Remove Action
  const columns: Column<CartItem>[] = [
    {
      key: "name",
      header: "Item",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{item.name}</span>
        </div>
      ),
    },
    { key: "qty", header: "Qty", align: "center" },
    { key: "price", header: "Price", align: "center" },
    {
      key: "total",
      header: "Total",
      align: "center",
      render: (item) => (
        <span className="font-bold text-green-600">{item.total}</span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      // width: "60px",
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCartItems(cartItems.filter((i) => i.id !== item.id));
          }}
          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
          title="Remove item"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
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
                onClick={() => setShowCatalog(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
              >
                <Plus className="w-5 h-5" /> New Sale
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                      onClick={() => setShowCatalog(true)}
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
                  emptyMessage={
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="mb-4 rounded-full bg-gray-100 dark:bg-slate-700 p-3">
                        <Search className="w-6 h-6 text-gray-400" />
                      </div>
                      <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">
                        Add Item for Billing
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Search or scan to add products
                      </p>
                    </div>
                  }
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
                <div className="flex gap-3 mt-4">
                  <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-800 transition-all">
                    <Receipt className="w-4 h-4" /> Save Draft
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-800 transition-all">
                    <X className="w-4 h-4" /> Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div>
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Payment
                </h3>

                <div className="space-y-2 mb-4">
                  {products.map((p) => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {p.name} × {p.qty}
                      </span>
                      <span className="font-medium">
                        ${(p.price * p.qty).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 dark:border-slate-700 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Subtotal
                    </span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Discount
                    </span>
                    <span className="font-medium text-green-600">
                      -${discount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Tax (8%)
                    </span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-slate-700">
                    <span>Total</span>
                    <span className="text-green-600">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Methods - Selectable */}
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Payment Methods
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {["Card", "Cash", "UPI", "Split"].map((method) => (
                      <button
                        key={method}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click
                          setSelectedPayment(method);
                        }}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 border rounded-xl text-sm font-medium transition-all ${
                          selectedPayment === method
                            ? "bg-blue-600 text-white border-blue-600 shadow-md"
                            : "border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700"
                        }`}
                      >
                        {method === "Card" && (
                          <CreditCard className="w-4 h-4" />
                        )}
                        {method === "Cash" && <Receipt className="w-4 h-4" />}
                        {method === "UPI" && <Wallet className="w-4 h-4" />}
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <button className="mt-6 w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2">
                  <Receipt className="w-5 h-5" /> Pay & Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CatalogModal
        open={showCatalog}
        onClose={() => setShowCatalog(false)}
        onAddToCart={(product, qty) => {
          const newItem = {
            id: Date.now().toString(),
            name: product.title,
            qty,
            price: `$${product.price}`,
            total: `$${(product.price * qty).toFixed(2)}`,
          };
          setCartItems([...cartItems, newItem]);
        }}
      />
    </MainLayout>
  );
}

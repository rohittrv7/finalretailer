"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  RefreshCw,
  Save,
  Camera,
  Plus,
  Info,
  AlertCircle,
  Package,
  DollarSign,
  Calendar,
  Image as ImageIcon,
  Tag,
  Hash,
  Percent,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import MainLayout from "@/components/Layout/MainLayout";

interface FormData {
  productName: string;
  category: string;
  brand: string;
  sku: string;
  barcode: string;
  unit: string;
  quantity: string;
  reorderLevel: string;
  purchasePrice: string;
  sellingPrice: string;
  mrp: string;
  discount: string;
  gstRate: string;
  supplier: string;
  description: string;
  lowStockAlert: boolean;
}

const categories = ["Grocery", "Pharmacy", "Fertilizer", "Others"];
const units = ["pcs", "kg", "ltr", "box", "pack", "bottle"];
const gstRates = ["0%", "5%", "12%", "18%", "28%"];
const suppliers = ["ABC Distributors", "XYZ Wholesale", "Global Supplies Inc."];

export default function AddProduct() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    productName: "",
    category: "",
    brand: "",
    sku: generateSKU(),
    barcode: "",
    unit: "pcs",
    quantity: "",
    reorderLevel: "",
    purchasePrice: "",
    sellingPrice: "",
    mrp: "",
    discount: "",
    gstRate: "18%",
    supplier: "",
    description: "",
    lowStockAlert: true,
  });

  const [purchaseDate, setPurchaseDate] = useState("2025-11-15");
  const [expiryDate, setExpiryDate] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  function generateSKU() {
    const prefix = "SKU";
    const random = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${random}`;
  }

  useEffect(() => {
    setFormData((prev) => ({ ...prev, sku: generateSKU() }));
  }, []);

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!formData.productName || !formData.category) {
      alert("Product name and category are required.");
      return;
    }
    alert(`${formData.productName} saved!`);
  };

  const handleReset = () => {
    setFormData({
      productName: "",
      category: "",
      brand: "",
      sku: generateSKU(),
      barcode: "",
      unit: "pcs",
      quantity: "",
      reorderLevel: "",
      purchasePrice: "",
      sellingPrice: "",
      mrp: "",
      discount: "",
      gstRate: "18%",
      supplier: "",
      description: "",
      lowStockAlert: true,
    });
    setPurchaseDate("2025-11-15");
    setExpiryDate("");
    setImagePreview(null);
  };

  const stockStatus = !formData.quantity
    ? "Out of Stock"
    : Number(formData.quantity) < Number(formData.reorderLevel || 0)
    ? "Low Stock"
    : "In Stock";

  const statusColor =
    stockStatus === "Out of Stock"
      ? "text-red-600 bg-red-50 border-red-200"
      : stockStatus === "Low Stock"
      ? "text-amber-600 bg-amber-50 border-amber-200"
      : "text-green-600 bg-green-50 border-green-200";

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Add New Product
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Add a new item to your inventory
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Reset
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
              >
                <Save className="w-5 h-5" /> Save Product
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Basic Information
                  </h3>
                </div>

                <input
                  type="text"
                  placeholder="Product Name *"
                  value={formData.productName}
                  onChange={(e) => handleChange("productName", e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 mb-3"
                />

                <select
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mb-3"
                >
                  <option value="">Category *</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Brand (Optional)"
                  value={formData.brand}
                  onChange={(e) => handleChange("brand", e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 mb-3"
                />

                <div className="relative mb-3">
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => handleChange("sku", e.target.value)}
                    className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    onClick={() => handleChange("sku", generateSKU())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Barcode"
                    value={formData.barcode}
                    onChange={(e) => handleChange("barcode", e.target.value)}
                    className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                    <Camera className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
              </div>

              {/* Stock Details */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Stock Details
                  </h3>
                </div>

                <select
                  value={formData.unit}
                  onChange={(e) => handleChange("unit", e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mb-3"
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Quantity"
                  value={formData.quantity}
                  onChange={(e) => handleChange("quantity", e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 mb-3"
                />

                <div className="relative mb-3">
                  <input
                    type="number"
                    placeholder="Reorder Level"
                    value={formData.reorderLevel}
                    onChange={(e) =>
                      handleChange("reorderLevel", e.target.value)
                    }
                    className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  />
                  <Info className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>

                <div className={`p-3 rounded-xl border ${statusColor} mb-3`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Status
                    </span>
                    <span className="font-bold">{stockStatus}</span>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  {formData.lowStockAlert ? (
                    <ToggleRight className="w-10 h-10 text-blue-600" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Low Stock Alert
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.lowStockAlert}
                    onChange={(e) =>
                      handleChange("lowStockAlert", e.target.checked)
                    }
                    className="sr-only"
                  />
                </label>
              </div>

              {/* Supplier */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Supplier
                  </h3>
                </div>

                <select
                  value={formData.supplier}
                  onChange={(e) => handleChange("supplier", e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mb-3"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm">
                  <Plus className="w-4 h-4" /> Add New Supplier
                </button>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Pricing & Tax */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Pricing & Tax
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      placeholder="Purchase Price"
                      value={formData.purchasePrice}
                      onChange={(e) =>
                        handleChange("purchasePrice", e.target.value)
                      }
                      className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                    />
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      placeholder="Selling Price"
                      value={formData.sellingPrice}
                      onChange={(e) =>
                        handleChange("sellingPrice", e.target.value)
                      }
                      className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                    />
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      placeholder="MRP"
                      value={formData.mrp}
                      onChange={(e) => handleChange("mrp", e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                    />
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Discount %"
                      value={formData.discount}
                      onChange={(e) => handleChange("discount", e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>

                  <select
                    value={formData.gstRate}
                    onChange={(e) => handleChange("gstRate", e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {gstRates.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Dates
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>

                  <div>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      For perishable goods only
                    </p>
                  </div>
                </div>
              </div>

              {/* Image & Description */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Image & Description
                  </h3>
                </div>

                <div
                  onClick={() =>
                    document.getElementById("image-upload")?.click()
                  }
                  className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all mb-4"
                >
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleImageUpload}
                  />
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full max-h-40 mx-auto rounded-lg"
                    />
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto text-blue-600 mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        PNG, JPG up to 10MB
                      </p>
                    </>
                  )}
                </div>

                <textarea
                  placeholder="Add short notes about this product..."
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="mt-6 p-4 bg-gray-100 dark:bg-slate-800 rounded-xl">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last Updated By: Admin • {new Date().toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw,
  Save,
  Tag,
  Camera,
  Package,
  Info,
  Plus,
  DollarSign,
  Percent,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import MainLayout from "../components/Layout/MainLayout";
import { InventoryItem } from "../types/inventry";
import { calculateGSTForUnit, generateSKU } from "../helper/helper";

export default function AddProduct() {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InventoryItem>({
    defaultValues: {
      productName: "",
      category: "",
      brand: "",
      sku: generateSKU(),
      barcode: "",
      unit: "pcs",
      stock: 0,
      status: "active",
      reorderLevel: 10,
      purchasePrice: 0,
      sellingPrice: 0,
      mrp: 0,
      discount: 0,
      gstRate: 18,
      gstType: "CGST_SGST",
      isGstIncluded: true,
      supplier: "",
      description: "",
      lowStockAlert: true,
      hsnCode: "",
    },
  });

  const navigation = useNavigate();

  // local UI state
  const stock = watch("stock") || 0;
  const reorderLevel = watch("reorderLevel") || 0;
  const lowStockAlert = watch("lowStockAlert");
  const sellingPrice = watch("sellingPrice") || 0;
  const gstRate = watch("gstRate") ?? 0;
  const isGstIncluded = watch("isGstIncluded") ?? true;

  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [gstin, setGstin] = useState<string>("");
  const [gstVerified, setGstVerified] = useState<boolean>(false);
  const [hsnSuggestions, setHsnSuggestions] = useState<any[]>([]);
  const [hsnSearch, setHsnSearch] = useState<string>("");
  const [selectedHsn, setSelectedHsn] = useState<string>("");

  const categories = ["General", "Groceries", "Clothing", "Electronics"];
  const suppliers = ["Default Supplier"];
  const units = ["pcs", "kg", "ltr", "box", "Dozen"];

  useEffect(() => {
    // load store settings (GSTIN) from electron store API
    (async () => {
      try {
        const res = await window.electronAPI.store.get();
        if (res?.success && res.data) {
          setGstin(res.data.gstin || "");
          setGstVerified(res.data.gstVerified === 1);
        }
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  // HSN search (debounced simple)
  useEffect(() => {
    const t = setTimeout(() => {
      if (!hsnSearch || hsnSearch.length < 3) return setHsnSuggestions([]);

      (async () => {
        try {
          // NOTE: gst.gov.in API may require API key or CORS restrictions.
          // This code gracefully falls back if search fails.
          const res = await fetch(
            `https://api.gst.gov.in/hsn/search?q=${encodeURIComponent(
              hsnSearch
            )}&page=1&size=10`,
            {
              headers: { "User-Agent": "POS-App" },
            }
          );
          if (!res.ok) throw new Error("HSN search failed");
          const data = await res.json();
          setHsnSuggestions(data.data || []);
        } catch (err) {
          // optional: fallback mock suggestions
          setHsnSuggestions([
            { hsnCode: "1001", description: "Wheat", gstRate: 0 },
            { hsnCode: "6109", description: "T-shirts", gstRate: 12 },
          ]);
        }
      })();
    }, 450);

    return () => clearTimeout(t);
  }, [hsnSearch]);

  const selectHSN = (hsn: any) => {
    setSelectedHsn(hsn.hsnCode);
    setValue("hsnCode", hsn.hsnCode);
    // auto-suggest a rate
    const rate = hsn.gstRate ?? (hsn.hsnCode?.startsWith("61") ? 12 : 18);
    setValue("gstRate", Number(rate));
    setHsnSuggestions([]);
    setHsnSearch("");
    toast.success(`HSN ${hsn.hsnCode} selected - GST ${rate}%`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const r = reader.result as string;
      setImagePreview(r);
      setValue("imageUrl", r);
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    reset();
    setValue("sku", generateSKU());
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setExpiryDate("");
    setImagePreview(null);
    setSelectedHsn("");
    setHsnSuggestions([]);
  };

  const onSubmit: SubmitHandler<InventoryItem> = async (data) => {
    // basic client validation
    if (!data.productName || !data.sku || !data.category) {
      return toast.error("Please fill required fields");
    }

    // prepare gst fields and compute taxable/gst if possible
    const unitSellingPrice = Number(data.sellingPrice) || 0;
    const rate = Number(data.gstRate) || 0;
    const isIncluded = !!data.isGstIncluded;

    const gstCalc = calculateGSTForUnit(
      unitSellingPrice,
      rate,
      isIncluded,
      gstVerified
    );

    const finalData = {
      ...data,
      gstRate: rate,
      gstType: data.gstType ?? "CGST_SGST",
      isGstIncluded: isIncluded,
      gstAmount: gstCalc.gstAmount,
      taxableAmount: gstCalc.taxable,
      imageUrl: imagePreview || data.imageUrl,
      purchaseDate,
      expiryDate: expiryDate || undefined,
      lowStockAlert: !!data.lowStockAlert,
    } as any;

    try {
      const result = await window.electronAPI.inventory.add(finalData);
      if (result?.success) {
        toast.success("Product added successfully");
        handleReset();
        navigation("/inventory");
      } else {
        toast.error(result?.error || "Save failed");
      }
    } catch (err: any) {
      toast.error(err?.message || "Save failed");
    }
  };

  // const totalPrice = isGstIncluded
  //   ? sellingPrice
  //   : sellingPrice + (sellingPrice * gstRate) / 100;

  // stock status helper
  const stockStatus =
    stock <= 0
      ? "Out of stock"
      : stock <= reorderLevel
      ? "Low stock"
      : "In stock";
  const statusColor =
    stock <= 0
      ? "border-red-300"
      : stock <= reorderLevel
      ? "border-amber-400"
      : "border-green-400";

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 p-6">
        <form onSubmit={handleSubmit(onSubmit)}>
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
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
                >
                  <RefreshCw className="w-4 h-4" /> Reset
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
                >
                  <Save className="w-5 h-5" /> Save Product
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Basic Information */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                  <div className="flex items-center gap-2 mb-6">
                    <Tag className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Basic Information
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {/* Product Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Product Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter product name"
                        {...register("productName", {
                          required: "Product name required",
                        })}
                        className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400"
                      />
                      {errors.productName && (
                        <p className="text-red-500 text-xs mt-1.5">
                          {errors.productName.message}
                        </p>
                      )}
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register("category", {
                          required: "Category required",
                        })}
                        className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        <option value="">Select category</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="text-red-500 text-xs mt-1.5">
                          {errors.category.message}
                        </p>
                      )}
                    </div>

                    {/* Brand */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Brand (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Enter brand name"
                        {...register("brand")}
                        className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400"
                      />
                    </div>

                    {/* SKU */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        SKU (Stock Keeping Unit)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          {...register("sku", { required: true })}
                          className="w-full pl-4 pr-12 py-3.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setValue("sku", generateSKU())}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                          title="Generate new SKU"
                        >
                          <RefreshCw className="w-5 h-5 text-blue-600" />
                        </button>
                      </div>
                    </div>

                    {/* Barcode */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Barcode (Optional)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Enter or scan barcode"
                          {...register("barcode")}
                          className="w-full pl-4 pr-12 py-3.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                          title="Scan barcode"
                        >
                          <Camera className="w-5 h-5 text-blue-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock Details */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                  <div className="flex items-center gap-2 mb-6">
                    <Package className="w-6 h-6 text-amber-600" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Stock Details
                    </h3>
                  </div>

                  <div className="space-y-5">
                    {/* Unit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Unit
                      </label>
                      <select
                        {...register("unit")}
                        className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate--avatar600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        {units.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Stock Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        {...register("stock", { valueAsNumber: true, min: 0 })}
                        className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400"
                      />
                      {errors.stock && (
                        <p className="text-red-500 text-xs mt-1.5">
                          {errors.stock.message}
                        </p>
                      )}
                    </div>

                    {/* Reorder Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Reorder Level
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="10"
                          {...register("reorderLevel", { valueAsNumber: true })}
                          className="w-full pr-12 pl-4 py-3.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400"
                        />
                        <Info
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                          title="Minimum stock to trigger alert"
                        />
                      </div>
                    </div>

                    {/* Stock Status Badge */}
                    <div
                      className={`p-4 rounded-xl border-2 ${statusColor} bg-opacity-10`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Current Status
                        </span>
                        <span className="text-lg font-bold">{stockStatus}</span>
                      </div>
                    </div>

                    {/* Low Stock Alert Toggle */}
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Low Stock Alert
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Get notified when stock is low
                        </p>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          {...register("lowStockAlert")}
                          className="sr-only"
                        />
                        <div
                          className={`w-14 h-8 rounded-full transition-all ${
                            lowStockAlert
                              ? "bg-blue-600"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-all duration-300 ${
                              lowStockAlert ? "translate-x-7" : "translate-x-1"
                            } mt-1`}
                          />
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Supplier */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                  <div className="flex items-center gap-2 mb-6">
                    <AlertCircle className="w-6 h-6 text-purple-600" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Supplier Information
                    </h3>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Supplier *
                      </label>
                      <select
                        {...register("supplier")}
                        className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        <option value="">Choose supplier</option>
                        {suppliers.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {errors.supplier && (
                        <p className="text-red-500 text-xs mt-1.5">
                          {errors.supplier.message}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      Add New Supplier
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                  <div className="flex items-center gap-2 mb-6">
                    <DollarSign className="w-6 h-6 text-green-600" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Pricing & GST
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {/* Purchase Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Purchase Price *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...register("purchasePrice", {
                            valueAsNumber: true,
                            required: true,
                          })}
                          className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400"
                        />
                      </div>
                      {errors.purchasePrice && (
                        <p className="text-red-500 text-xs mt-1.5">
                          {errors.purchasePrice.message}
                        </p>
                      )}
                    </div>

                    {/* Selling Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Selling Price *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 font-bold text-lg">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...register("sellingPrice", {
                            valueAsNumber: true,
                            required: true,
                          })}
                          className="w-full pl-12 pr-4 py-3.5 bg-green-50 dark:bg-green-900/20 border-2 border-green-400 dark:border-green-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all font-semibold placeholder:text-green-600 dark:placeholder:text-green-400"
                        />
                      </div>
                      {errors.sellingPrice && (
                        <p className="text-red-500 text-xs mt-1.5">
                          {errors.sellingPrice.message}
                        </p>
                      )}
                    </div>

                    {/* MRP */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        MRP *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...register("mrp", {
                            valueAsNumber: true,
                            required: true,
                          })}
                          className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder:text-gray-400"
                        />
                      </div>
                      {errors.mrp && (
                        <p className="text-red-500 text-xs mt-1.5">
                          {errors.mrp.message}
                        </p>
                      )}
                    </div>

                    {/* Discount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Discount % (Optional)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="0"
                          {...register("discount", { valueAsNumber: true })}
                          className="w-full pr-12 pl-4 py-3.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all placeholder:text-orange-600 dark:placeholder:text-orange-400"
                        />
                        <Percent className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>

                    {/* HSN Code - Only if GST Verified */}
                    {gstVerified && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          HSN Code *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Type to search HSN (e.g. shirt, rice)"
                            value={hsnSearch}
                            onChange={(e) => {
                              setHsnSearch(e.target.value);
                            }}
                            className="w-full px-4 py-3.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-300 dark:border-indigo-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-indigo-400"
                          />
                          {selectedHsn && (
                            <div className="absolute right-3 top-3.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-md">
                              {selectedHsn}
                            </div>
                          )}
                        </div>
                        {hsnSuggestions.length > 0 && (
                          <div className="mt-2 max-h-64 overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl">
                            {hsnSuggestions.map((hsn) => (
                              <button
                                key={hsn.hsnCode}
                                onClick={() => selectHSN(hsn)}
                                className="w-full text-left px-5 py-3.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-all flex justify-between items-center border-b border-gray-100 dark:border-slate-700 last:border-0"
                              >
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {hsn.hsnCode} - {hsn.description}
                                </span>
                                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                  GST {hsn.gstRate || "18"}%
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* GST Section */}
                    <div className="border-t-2 border-dashed border-gray-200 dark:border-slate-700 pt-6">
                      {gstVerified ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-300 dark:border-green-700 rounded-2xl">
                            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <div>
                              <p className="text-lg font-bold text-green-800 dark:text-green-300">
                                GST Registered & Verified ✓
                              </p>
                              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                                GSTIN:{" "}
                                <span className="font-mono text-base">
                                  {gstin}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <select
                              {...register("gstRate")}
                              className="w-full px-5 py-3.5 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium"
                            >
                              <option value="">Select GST Rate</option>
                              <option value="0">0% - Exempted</option>
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18% (Most Common)</option>
                              <option value="28">28%</option>
                            </select>
                            <select
                              {...register("gstType")}
                              className="w-full px-5 py-3.5 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium"
                            >
                              <option value="CGST_SGST">CGST + SGST</option>
                              <option value="IGST">IGST</option>
                            </select>
                            <label className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                {...register("isGstIncluded")}
                                className="h-4 w-4"
                              />
                              <span className="text-sm">
                                Selling price includes GST
                              </span>
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-2 border-amber-300 dark:border-amber-700 rounded-2xl text-center">
                          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-amber-600 dark:text-amber-400" />
                          <p className="font-bold text-amber-800 dark:text-amber-300 text-lg">
                            GST Not Enabled
                          </p>
                          <p className="text-sm text-amber-700 dark:text-amber-400 mt-2">
                            GSTIN verify karne ke liye{" "}
                            <span
                              className="font-bold underline cursor-pointer hover:text-amber-900 dark:hover:text-amber-200"
                              onClick={() => navigation("/settings")}
                            >
                              Store Settings
                            </span>{" "}
                            mein jao
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dates - Modern & Premium */}
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/30 dark:border-slate-700/50">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3.5  rounded-2xl shadow-lg">
                      <Calendar className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                        Dates
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Track purchase & expiry for better inventory control
                      </p>
                    </div>
                  </div>

                  <div className="space-y-7">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Purchase Date
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={purchaseDate}
                          onChange={(e) => setPurchaseDate(e.target.value)}
                          className="w-full px-5 py-4 border-2 border-indigo-300 dark:border-indigo-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-lg font-medium placeholder:text-indigo-400"
                        />
                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-indigo-600 dark:text-indigo-400 pointer-events-none group-focus-within:text-indigo-700" />
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Expiry Date{" "}
                        <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                          (For perishable items only)
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className="w-full px-5 py-4 border-2 border-amber-300 dark:border-amber-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-lg font-medium placeholder:text-amber-400"
                        />
                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-amber-600 dark:text-amber-400 pointer-events-none group-focus-within:text-amber-700" />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2.5">
                        Leave empty if product has no expiry date
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
                    {...register("description")}
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
        </form>
      </div>
    </MainLayout>
  );
}

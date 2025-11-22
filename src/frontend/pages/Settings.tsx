import { useEffect, useState } from "react";
import {
  Store,
  Receipt,
  Bell,
  Shield,
  Save,
  Edit,
  Globe,
  Palette,
  DollarSign,
  Check,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import MainLayout from "@/frontend/components/Layout/MainLayout";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { storeSchema } from "../schema/store";
import { zodResolver } from "@hookform/resolvers/zod";

const settingsSections = [
  {
    icon: Store,
    title: "Store Profile",
    description: "Manage your store information and branding",
    color: "blue",
  },
  {
    icon: Receipt,
    title: "Taxes & Billing",
    description: "Configure tax rates and invoice settings",
    color: "green",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Control email and system notifications",
    color: "purple",
  },
  {
    icon: Shield,
    title: "Security & Users",
    description: "Roles, permissions, and access control",
    color: "red",
  },
];

type StoreFormData = z.infer<typeof storeSchema>;

export default function Settings() {
  const [lowStock, setLowStock] = useState(true);
  const [dailyReport, setDailyReport] = useState(true);
  const [loyalty, setLoyalty] = useState(false);
  const [autoPO, setAutoPO] = useState(true);
  const [stockAlert, setStockAlert] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [gstinStatus, setGstinStatus] = useState<
    "idle" | "checking" | "valid" | "invalid"
  >("idle");
  const [companyName, setCompanyName] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<StoreFormData>({
    resolver: zodResolver(storeSchema),
    defaultValues: {},
  });

  useEffect(() => {
    const load = async () => {
      const res = await window.electronAPI.store.get();
      if (res.success && res.data) {
        setValue("storeName", res.data.storeName || "");
        setValue("email", res.data.email || "");
        setValue("phone", res.data.phone || "");
        setValue("gstin", res.data.gstin || "");
        setValue("taxId", res.data.taxId || "");
        setValue("address", res.data.address || "");
        if (res.data.gstin) {
          setGstinStatus("valid");
          setCompanyName(res.data.companyName || "");
        }
      }
    };
    load();
  }, [setValue]);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1500);
  };

  const verifyGSTIN = async (gstin: string) => {
    setGstinStatus("checking");
    try {
      const res = await fetch(
        `https://gst-verification-api.onrender.com/api/gstin/${gstin}`
      );
      const data = await res.json();
      if (data.success && data.data?.tradeNam) {
        setGstinStatus("valid");
        toast.success("GSTIN Verified!");
      } else {
        setGstinStatus("invalid");
        toast.error("Invalid GSTIN");
      }
    } catch {
      setGstinStatus("invalid");
      toast.error("Verification failed");
    }
  };

  const onSubmit = async (data: StoreFormData) => {
    const saveData = {
      ...data,
      companyName: companyName || null,
      gstin: gstinStatus === "valid" ? data.gstin : "",
      gstVerified: gstinStatus === "valid" ? 1 : 0
    };

    const res = await window.electronAPI.store.save(saveData);
    if (res.success) {
      toast.success("Store settings saved successfully!");
    } else {
      toast.error(res.error || "Failed to save");
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your store settings and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {settingsSections.map((section, i) => {
                  const Icon = section.icon;
                  const colors = {
                    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                    green:
                      "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
                    purple:
                      "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
                    red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
                  };
                  return (
                    <div
                      key={i}
                      className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-xl ${
                            colors[section.color as keyof typeof colors]
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 dark:text-white">
                            {section.title}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {section.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Store Information */}
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                    Store Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Store Name */}
                    <div>
                      <input
                        type="text"
                        placeholder="Store Name *"
                        {...register("storeName")}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400"
                      />
                      {errors.storeName && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.storeName.message}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <input
                        type="email"
                        placeholder="Contact Email (Optional)"
                        {...register("email")}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <input
                        type="tel"
                        placeholder="Phone Number *"
                        {...register("phone")}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400"
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>

                    {/* GSTIN with Verification */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="GSTIN (15 digits) - Optional"
                        {...register("gstin")}
                        onChange={(e) => {
                          const val = e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, "");
                          setValue("gstin", val);
                          if (val.length === 15) {
                            verifyGSTIN(val);
                          } else {
                            setGstinStatus("idle");
                            setCompanyName("");
                          }
                        }}
                        maxLength={15}
                        className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase font-mono tracking-wider placeholder:text-gray-400"
                      />
                      {gstinStatus === "checking" && (
                        <div className="absolute right-3 top-3.5">
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      {gstinStatus === "valid" && (
                        <CheckCircle2 className="absolute right-3 top-3.5 w-6 h-6 text-green-500" />
                      )}
                      {gstinStatus === "invalid" && (
                        <XCircle className="absolute right-3 top-3.5 w-6 h-6 text-red-500" />
                      )}
                    </div>

                    {/* Verified Company Name */}
                    {companyName && (
                      <div className="sm:col-span-2 p-4 bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-xl">
                        <p className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          GST Verified:{" "}
                          <span className="font-bold">{companyName}</span>
                        </p>
                      </div>
                    )}

                    {/* Tax ID */}
                    <div>
                      <input
                        type="text"
                        placeholder="PAN / Tax ID (Optional)"
                        {...register("taxId")}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400"
                      />
                    </div>

                    {/* Address */}
                    <div className="sm:col-span-2">
                      <textarea
                        placeholder="Full Address *"
                        rows={3}
                        {...register("address")}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none placeholder:text-gray-400"
                      />
                      {errors.address && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.address.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="mt-8 flex justify-end">
                    <button
                      type="submit"
                      className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
                    >
                      <Save className="w-6 h-6" />
                      Save Store Settings
                    </button>
                  </div>
                </div>
              </form>

              {/* Preferences */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-5">
                  Preferences
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      label: "Email notifications for low stock",
                      state: lowStock,
                      setState: setLowStock,
                    },
                    {
                      label: "Send daily sales reports",
                      state: dailyReport,
                      setState: setDailyReport,
                    },
                    {
                      label: "Enable customer loyalty program",
                      state: loyalty,
                      setState: setLoyalty,
                    },
                    {
                      label: "Auto-generate purchase orders",
                      state: autoPO,
                      setState: setAutoPO,
                    },
                    {
                      label: "Show stock alerts on dashboard",
                      state: stockAlert,
                      setState: setStockAlert,
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-xl"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.label}
                      </p>
                      <button
                        onClick={() => item.setState(!item.state)}
                        className={`relative w-12 h-6 rounded-full transition-all ${
                          item.state
                            ? "bg-blue-600"
                            : "bg-gray-300 dark:bg-slate-600"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            item.state ? "translate-x-6" : ""
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* User Profile */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-5">
                  Your Profile
                </h3>
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    AC
                  </div>
                  <div className="mt-4">
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      Alex Carter
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Store Manager
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      alex@retailpro.app
                    </p>
                  </div>
                  <button className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                    <Edit className="w-4 h-4" /> Edit Profile
                  </button>
                </div>
              </div>

              {/* System Settings */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-5">
                  System Settings
                </h3>
                <div className="space-y-4">
                  {[
                    { icon: Globe, label: "Language", value: "English (US)" },
                    { icon: Palette, label: "Theme", value: "Light Mode" },
                    { icon: DollarSign, label: "Currency", value: "USD ($)" },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-xl"
                      >
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {item.label}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white shadow-lg transform transition-all duration-300 ${
                  saving
                    ? "bg-gray-400 cursor-not-allowed"
                    : saved
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-105 hover:shadow-xl"
                }`}
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <Check className="w-5 h-5" /> Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

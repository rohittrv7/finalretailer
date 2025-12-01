import { useState } from "react";
import {
  Store,
  Receipt,
  Bell,
  Shield,
  Save,
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  Building,
  Smartphone,
  ChevronRight,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import MainLayout from "../components/Layout/MainLayout";
import { useNavigate } from "react-router-dom";

const storeSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Phone must be 10+ digits"),
  gstin: z.string().optional(),
  taxId: z.string().optional(),
  address: z.string().min(1, "Address is required"),
});

type StoreFormData = z.infer<typeof storeSchema>;

export default function Settings() {
  const navigation = useNavigate();
  const [preferences, setPreferences] = useState({
    lowStock: true,
    dailyReport: true,
    loyalty: false,
    autoPO: true,
    stockAlert: true,
  });
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
    defaultValues: {
      storeName: "My Awesome Store",
      email: "store@example.com",
      phone: "9876543210",
      gstin: "",
      taxId: "",
      address: "123 Main Road, Delhi - 110001",
    },
  });

  const handlePreferenceChange = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const verifyGSTIN = (gstin: string) => {
    setGstinStatus("checking");
    setTimeout(() => {
      if (
        gstin.length === 15 &&
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)
      ) {
        setGstinStatus("valid");
        setCompanyName("Verified Business Pvt Ltd");
        toast.success("GSTIN Verified!");
      } else if (gstin.length > 0) {
        setGstinStatus("invalid");
        toast.error("Invalid GSTIN format");
      } else {
        setGstinStatus("idle");
      }
    }, 1200);
  };

  const onSubmit = (data: StoreFormData) => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      toast.success("Settings saved successfully!");
      setTimeout(() => setSaved(false), 2000);
    }, 1500);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your store, preferences and security
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Access Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: Store,
                    title: "Store Profile",
                    desc: "Business name, logo, address",
                    color: "from-blue-500 to-cyan-500",
                    path: "/settings",
                  },
                  {
                    icon: Receipt,
                    title: "Taxes & Billing",
                    desc: "GST, invoice format, prefixes",
                    color: "from-green-500 to-emerald-500",
                    path: "/invoice/history",
                  },
                  {
                    icon: Bell,
                    title: "Notifications",
                    desc: "Email, WhatsApp, alerts",
                    color: "from-purple-500 to-pink-500",
                    path: "/settings",
                  },
                  {
                    icon: Shield,
                    title: "Security & Users",
                    desc: "Roles, permissions, login",
                    color: "from-red-500 to-orange-500",
                    path: "/settings",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    onClick={() => navigation(item.path)}
                    className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} p-3 text-white shadow-lg`}
                      >
                        <item.icon className="w-8 h-8" />
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition" />
                    </div>
                    <h3 className="text-xl font-bold mt-4">{item.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Store Form */}
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-lg">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Building className="w-8 h-8 text-blue-600" />
                    Store Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Store Name *
                      </label>
                      <input
                        {...register("storeName")}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="My Awesome Store"
                      />
                      {errors.storeName?.message && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.storeName.message as string}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email (Optional)
                      </label>
                      <input
                        {...register("email")}
                        type="email"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                        placeholder="store@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number *
                      </label>
                      <input
                        {...register("phone")}
                        type="tel"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                        placeholder="9876543210"
                      />
                      {errors.phone?.message && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.phone.message as string}
                        </p>
                      )}
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        GSTIN (Optional)
                      </label>
                      <input
                        {...register("gstin")}
                        onChange={(e) => {
                          const val = e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, "");
                          setValue("gstin", val);
                          verifyGSTIN(val);
                        }}
                        maxLength={15}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 font-mono tracking-wider uppercase"
                        placeholder="22AAAAA0000A1Z5"
                      />
                      <div className="absolute right-3 top-10">
                        {gstinStatus === "checking" && (
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        )}
                        {gstinStatus === "valid" && (
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        )}
                        {gstinStatus === "invalid" && (
                          <XCircle className="w-6 h-6 text-red-500" />
                        )}
                      </div>
                    </div>

                    {companyName && (
                      <div className="md:col-span-2 p-4 bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-xl">
                        <p className="text-green-700 dark:text-green-400 font-medium flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          GST Verified:{" "}
                          <span className="font-bold">{companyName}</span>
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        PAN / Tax ID
                      </label>
                      <input
                        {...register("taxId")}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                        placeholder="ABCDE1234F"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Address *
                      </label>
                      <textarea
                        {...register("address")}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="123 Main Road, Near Market, Delhi - 110001"
                      />
                      {errors.address?.message && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.address.message as string}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
                    >
                      {saving ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Save className="w-6 h-6" />
                      )}
                      {saving ? "Saving..." : "Save Store Settings"}
                    </button>
                  </div>
                </div>
              </form>

              {/* Preferences */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-5">Preferences</h3>
                <div className="space-y-4">
                  {[
                    { key: "lowStock", label: "Low stock alerts" },
                    { key: "dailyReport", label: "Daily sales report" },
                    { key: "loyalty", label: "Customer loyalty program" },
                    { key: "autoPO", label: "Auto generate purchase orders" },
                    {
                      key: "stockAlert",
                      label: "Show stock alerts on dashboard",
                    },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center justify-between cursor-pointer group"
                    >
                      <span className="text-gray-700 dark:text-gray-300 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition">
                        {label}
                      </span>
                      <div
                        onClick={() =>
                          handlePreferenceChange(
                            key as keyof typeof preferences
                          )
                        }
                        className={`w-14 h-8 rounded-full transition-all duration-300 relative ${
                          preferences[key as keyof typeof preferences]
                            ? "bg-blue-600"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${
                            preferences[key as keyof typeof preferences]
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    AC
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Alex Carter</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Store Manager
                    </p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span>alex@store.com</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <Smartphone className="w-4 h-4" />
                    <span>+91 98765 43210</span>
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div className="bg-gradient-to-br from-gray-900 to-black text-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Settings2 className="w-5 h-5" />
                  System Status
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Database</span>
                    <span className="text-green-400">Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Backup</span>
                    <span className="text-green-400">Daily</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Version</span>
                    <span>v2.4.1</span>
                  </div>
                </div>
              </div>

              {/* Global Save */}
              <button
                onClick={() => {
                  setSaving(true);
                  setTimeout(() => {
                    setSaving(false);
                    setSaved(true);
                    toast.success("All settings saved!");
                    setTimeout(() => setSaved(false), 2000);
                  }, 1500);
                }}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-3"
              >
                {saved ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : saving ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Save className="w-6 h-6" />
                )}
                {saved ? "Saved!" : "Save All Settings"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

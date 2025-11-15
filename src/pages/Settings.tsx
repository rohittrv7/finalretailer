import { useState } from "react";
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
  X,
} from "lucide-react";
import MainLayout from "@/components/Layout/MainLayout";

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

export default function Settings() {
  const [storeName, setStoreName] = useState("RetailPro Mart");
  const [email, setEmail] = useState("contact@retailpro.com");
  const [phone, setPhone] = useState("+1 234 567 8900");
  const [taxId, setTaxId] = useState("TAX-123456789");
  const [address, setAddress] = useState("123 Market St, Springfield");
  const [lowStock, setLowStock] = useState(true);
  const [dailyReport, setDailyReport] = useState(true);
  const [loyalty, setLoyalty] = useState(false);
  const [autoPO, setAutoPO] = useState(true);
  const [stockAlert, setStockAlert] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1500);
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
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-5">
                  Store Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Store Name"
                    className="px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Contact Email"
                    className="px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone Number"
                    className="px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="Tax ID"
                    className="px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Address"
                    rows={2}
                    className="col-span-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  />
                </div>
              </div>

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

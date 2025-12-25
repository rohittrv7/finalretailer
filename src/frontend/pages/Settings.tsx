import { useEffect, useState } from "react";
import { Store, Receipt, Bell, Settings2, Camera, Check } from "lucide-react";
import { toast } from "sonner";
import MainLayout from "../components/Layout/MainLayout";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import SettingsInput from "../components/Setting/SettingInput";
import SettingsSelect from "../components/Setting/SettingsSelect";
import SettingsToggle from "../components/Setting/SettingsToggle";
import SettingsTextarea from "../components/Setting/SettingsTextarea";

const indianStatesWithCode = [
  ["01", "Jammu and Kashmir"],
  ["02", "Himachal Pradesh"],
  ["03", "Punjab"],
  ["04", "Chandigarh"],
  ["05", "Uttarakhand"],
  ["06", "Haryana"],
  ["07", "Delhi"],
  ["08", "Rajasthan"],
  ["09", "Uttar Pradesh"],
  ["10", "Bihar"],
  ["11", "Sikkim"],
  ["12", "Arunachal Pradesh"],
  ["13", "Nagaland"],
  ["14", "Manipur"],
  ["15", "Mizoram"],
  ["16", "Tripura"],
  ["17", "Meghalaya"],
  ["18", "Assam"],
  ["19", "West Bengal"],
  ["20", "Jharkhand"],
  ["21", "Odisha"],
  ["22", "Chhattisgarh"],
  ["23", "Madhya Pradesh"],
  ["24", "Gujarat"],
  ["25", "Dadra and Nagar Haveli and Daman and Diu"],
  ["26", "Maharashtra"],
  ["27", "Karnataka"],
  ["28", "Goa"],
  ["29", "Lakshadweep"],
  ["30", "Kerala"],
  ["31", "Tamil Nadu"],
  ["32", "Puducherry"],
  ["33", "Andaman and Nicobar Islands"],
  ["34", "Telangana"],
  ["35", "Andhra Pradesh"],
  ["36", "Ladakh"],
  ["37", "Other Territory"],
];

const storeSchema = z
  .object({
    storeName: z.string().min(1, "Store name is required"),
    companyName: z.string().optional().nullable(),
    ownerName: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email("Invalid email").or(z.literal("")).nullable(),
    address: z.string().optional().nullable(),
    currency: z.string().default("INR"),
    financialYear: z.string().optional().nullable(),
    gstEnabled: z.coerce.boolean(),
    gstNumber: z.string().optional().nullable(),
    stateCode: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.gstEnabled) {
        return (
          data.gstNumber &&
          data.gstNumber.trim() !== "" &&
          data.stateCode &&
          data.stateCode.trim() !== ""
        );
      }
      return true;
    },
    {
      message: "GST Number and State Code are required when GST is enabled",
      path: ["gstNumber"], // error ko gstNumber field pe show karega
    }
  );

type StoreFormData = z.infer<typeof storeSchema>;

const billingSchema = z.object({
  invoicePrefix: z.string().min(1, "Prefix is required"),
  invoiceStartNumber: z.number().min(1, "Must be at least 1"),
  defaultGstRate: z.number().min(0).max(100),
  financialYear: z.string().optional(),
  invoiceFooterNote: z.string().optional(),
  gstIncludedDefault: z.boolean(),
  roundOffBill: z.boolean(),
  showHsnOnInvoice: z.boolean(),
  showCustomerPhone: z.boolean(),
});

type BillingFormData = z.infer<typeof billingSchema>;

type PreferenceForm = {
  showDashboardStocks: boolean;
  autoGeneratePO: boolean;
  darkMode: boolean;
  language: string;
};

interface PreferenceSettings {
  showDashboardStocks: boolean;
  autoGeneratePO: boolean;
  darkMode: boolean;
  language: string;
}

type NotificationForm = {
  lowStockAlert: boolean;
  dailySalesReport: boolean;
  emailNotification: boolean;
  whatsappNotification: boolean;
  smsNotification: boolean;
};

interface NotificationSettings {
  lowStockAlert: number;
  dailySalesReport: number;
  emailNotification: number;
  whatsappNotification: number;
  smsNotification: number;
}

// Tabs
type Tab = "store" | "billing" | "notifications" | "preferences";

export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>("store");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Store Settings State
  const [storeSettings, setStoreSettings] = useState({
    storeName: "",
    email: "",
    phone: "",
    gstNumber: "",
    address: "",
    state: "",
  });

  // Billing Settings State
  const [billingSettings, setBillingSettings] = useState({
    gstIncludedDefault: false,
    defaultGstRate: 0,
    invoicePrefix: "INV-",
    invoiceStartNumber: 1,
    roundOffBill: true,
    showHsnOnInvoice: true,
    showCustomerPhone: true,
    invoiceFooterNote: "",
    financialYear: "",
  });
  // Notification Settings
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings | null>(null);

  // App Preferences
  const [appPreferences, setAppPreferences] =
    useState<PreferenceSettings | null>(null);

  const {
    register: registerNotification,
    handleSubmit: handleNotificationSubmit,
    reset: resetNotificationForm,
  } = useForm<NotificationForm>({
    defaultValues: {
      lowStockAlert: false,
      dailySalesReport: false,
      emailNotification: false,
      whatsappNotification: false,
      smsNotification: false,
    },
  });

  useEffect(() => {
    if (notificationSettings) {
      resetNotificationForm({
        lowStockAlert: !!notificationSettings.lowStockAlert,
        dailySalesReport: !!notificationSettings.dailySalesReport,
        emailNotification: !!notificationSettings.emailNotification,
        whatsappNotification: !!notificationSettings.whatsappNotification,
        smsNotification: !!notificationSettings.smsNotification,
      });
    }
  }, [notificationSettings]);

  const {
    register: storeRegister,
    handleSubmit: storeHandleSubmit,
    reset: storeReset,
    watch: storeWatch,
    formState: { errors: errorsStore },
  } = useForm<z.infer<typeof storeSchema>>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      storeName: "",
      companyName: "",
      ownerName: "",
      phone: "",
      email: "",
      address: "",
      currency: "INR",
      financialYear: "",
      gstEnabled: false,
      gstNumber: "",
      stateCode: "",
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BillingFormData>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      invoicePrefix: billingSettings.invoicePrefix,
      invoiceStartNumber: billingSettings.invoiceStartNumber,
      defaultGstRate: billingSettings.defaultGstRate,
      financialYear: billingSettings.financialYear,
      invoiceFooterNote: billingSettings.invoiceFooterNote,
      gstIncludedDefault: billingSettings.gstIncludedDefault,
      roundOffBill: billingSettings.roundOffBill,
      showHsnOnInvoice: billingSettings.showHsnOnInvoice,
      showCustomerPhone: billingSettings.showCustomerPhone,
    },
  });

  const {
    register: registerPreference,
    handleSubmit: handlePreferenceSubmit,
    reset: resetPreference,
  } = useForm<PreferenceForm>({
    defaultValues: {
      showDashboardStocks: false,
      autoGeneratePO: false,
      darkMode: false,
      language: "en",
    },
  });

  useEffect(() => {
    if (!appPreferences) return;

    resetPreference({
      showDashboardStocks: Boolean(appPreferences.showDashboardStocks),
      autoGeneratePO: Boolean(appPreferences.autoGeneratePO),
      darkMode: Boolean(appPreferences.darkMode),
      language: appPreferences.language || "en",
    });
  }, [appPreferences, resetPreference]);

  useEffect(() => {
    storeReset(storeSettings);
    reset(billingSettings);
  }, [billingSettings, reset]);

  // Load all settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [storeRes, billingRes, notifRes, prefRes] = await Promise.all([
          window.electronAPI.store.get(),
          window.electronAPI.store.getBillingSettings(),
          window.electronAPI.store.getNotifications(),
          window.electronAPI.store.getPreference(),
        ]);
        console.log("noti", storeRes, "pre", prefRes);
        if (storeRes.success && storeRes.data) {
          setStoreSettings(storeRes.data);
        }
        if (billingRes.success && billingRes.data) {
          setBillingSettings(billingRes.data);
        }
        if (notifRes.success && notifRes.data) {
          setNotificationSettings(notifRes.data);
        }
        if (prefRes.success && prefRes.data) {
          setAppPreferences(prefRes.data);
        }
        // Load logo if exists
        if (storeRes.data?.logoPath) {
          // You can load from file path if needed
          setLogoPreview(storeRes.data.logoPath);
        }
      } catch (err) {
        toast.error("Failed to load settings", err);
      }
    };

    loadSettings();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const path = reader.result as string;
        setLogoPreview(path);
        window.electronAPI.store.save({
          ...storeSettings,
          logoPath: path,
        });
        toast.success("Logo updated!");
      };
      reader.readAsDataURL(file);
    }
  };

  const onUpdateNotifications = async (data: NotificationForm) => {
    try {
      const res = await window.electronAPI.store.updateNotifications(data);
      if (res.success) return toast.success("Notification settings updated");
      console.log("Failed to update notification settings", res);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const onUpdatePreferences = async (data: PreferenceForm) => {
    try {
      const res = await window.electronAPI.store.updatePreference(data);
      if (res.success) toast.success("App preferences updated");
      console.log("Failed to update notification settings", res);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const saveStoreSettings = async (data: StoreFormData) => {
    try {
      const res = await window.electronAPI.store.updateStoreSettings(data);
      if (res.success)
        return toast.success("Store settings saved successfully!");
    } catch (err) {
      toast.error("Failed to save store settings");
    }
  };

  const saveBillingSettings = async (data: any) => {
    try {
      const res = await window.electronAPI.store.updateBillingSettings(data);
      if (res.success) return toast.success("Billing settings updated");
      console.log("Failed to update billing settings", res);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const tabs = [
    { id: "store", label: "Store", icon: Store },
    { id: "billing", label: "Billing", icon: Receipt },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "preferences", label: "Preferences", icon: Settings2 },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Settings
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure your store preferences and business settings
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-secondary/50 rounded-2xl animate-fade-in">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="animate-slide-up">
            {/* Store Settings */}
            {activeTab === "store" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 settings-card">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-accent rounded-xl">
                      <Store className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">
                      Store Information
                    </h2>
                  </div>

                  <form
                    onSubmit={storeHandleSubmit(saveStoreSettings)}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SettingsInput
                        label="Store Name"
                        required
                        {...storeRegister("storeName")}
                        error={errorsStore.storeName?.message}
                      />
                      <SettingsInput
                        label="Company Name"
                        {...storeRegister("companyName")}
                      />
                      <SettingsInput
                        label="Owner Name"
                        {...storeRegister("ownerName")}
                      />
                      <SettingsInput
                        label="Phone"
                        {...storeRegister("phone")}
                      />
                      <SettingsInput
                        label="Email"
                        type="email"
                        {...storeRegister("email")}
                      />
                      <SettingsInput
                        label="Currency"
                        {...storeRegister("currency")}
                      />
                    </div>

                    {/* GST Section */}
                    <div className="pt-5 border-t border-border">
                      <SettingsToggle
                        label="Enable GST"
                        description="Turn on if your business is GST registered"
                        {...storeRegister("gstEnabled")}
                      />

                      {storeWatch("gstEnabled") && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-fade-in">
                          <SettingsInput
                            label="GST Number"
                            required
                            placeholder="22AAAAA0000A1Z5"
                            {...storeRegister("gstNumber")}
                            error={errorsStore.gstNumber?.message}
                          />
                          <SettingsSelect
                            label="State Code"
                            required
                            {...storeRegister("stateCode")}
                            error={errorsStore.stateCode?.message}
                            options={[
                              { value: "", label: "Select State" },
                              ...indianStatesWithCode.map(([code, name]) => ({
                                value: code,
                                label: `${code} - ${name}`,
                              })),
                            ]}
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SettingsInput
                        label="Financial Year"
                        placeholder="2024-25"
                        {...storeRegister("financialYear")}
                      />
                      <SettingsTextarea
                        label="Full Address"
                        rows={3}
                        {...storeRegister("address")}
                      />
                    </div>

                    <div className="pt-5 flex justify-end">
                      <button type="submit" className="btn-primary">
                        <Check className="w-4 h-4" />
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>

                {/* Logo Upload */}
                <div className="settings-card flex flex-col items-center text-center">
                  <h3 className="text-lg font-semibold mb-5">Store Logo</h3>
                  <div className="relative mb-4">
                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-3xl font-bold overflow-hidden border-2 border-dashed border-border">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Store Logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        storeSettings.storeName?.slice(0, 2).toUpperCase() ||
                        "ST"
                      )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 p-2.5 bg-primary text-primary-foreground rounded-xl cursor-pointer shadow-md hover:opacity-90 transition-opacity">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-[200px]">
                    Upload a logo for invoices and receipts
                  </p>
                </div>
              </div>
            )}

            {/* Billing Settings */}
            {activeTab === "billing" && (
              <div className="settings-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-accent rounded-xl">
                    <Receipt className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Billing & Invoice Settings
                  </h2>
                </div>

                <form
                  onSubmit={handleSubmit(saveBillingSettings)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <SettingsInput
                      label="Invoice Prefix"
                      placeholder="INV-"
                      {...register("invoicePrefix")}
                      error={errors.invoicePrefix?.message}
                    />
                    <SettingsInput
                      label="Next Invoice Number"
                      type="number"
                      {...register("invoiceStartNumber", {
                        valueAsNumber: true,
                      })}
                    />
                    <SettingsInput
                      label="Default GST Rate (%)"
                      type="number"
                      placeholder="18"
                      {...register("defaultGstRate", { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Invoice Options
                    </h3>
                    <SettingsToggle
                      label="Prices are GST Inclusive"
                      description="Show prices with GST already included"
                      {...register("gstIncludedDefault")}
                    />
                    <SettingsToggle
                      label="Auto Round Off Bill"
                      description="Round final amount to nearest rupee"
                      {...register("roundOffBill")}
                    />
                    <SettingsToggle
                      label="Show HSN Code"
                      description="Print HSN/SAC code for each item"
                      {...register("showHsnOnInvoice")}
                    />
                    <SettingsToggle
                      label="Show Customer Phone"
                      description="Print customer's phone number on bill"
                      {...register("showCustomerPhone")}
                    />
                  </div>

                  <SettingsTextarea
                    label="Invoice Footer Note"
                    rows={3}
                    placeholder="Thank you for shopping with us!"
                    {...register("invoiceFooterNote")}
                  />

                  <div className="pt-4 flex justify-end">
                    <button type="submit" className="btn-primary">
                      <Check className="w-4 h-4" />
                      Save Billing Settings
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Notifications */}
            {activeTab === "notifications" && (
              <div className="settings-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-accent rounded-xl">
                    <Bell className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Notification Settings
                  </h2>
                </div>

                <form
                  onSubmit={handleNotificationSubmit(onUpdateNotifications)}
                  className="space-y-6 max-w-2xl"
                >
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Alerts
                    </h3>
                    <SettingsToggle
                      label="Low Stock Alert"
                      description="Notify when stock is running low"
                      {...registerNotification("lowStockAlert")}
                    />
                    <SettingsToggle
                      label="Daily Sales Report"
                      description="Receive end of day summary"
                      {...registerNotification("dailySalesReport")}
                    />
                  </div>

                  <div className="space-y-3 pt-4 border-t border-border">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Channels
                    </h3>
                    <SettingsToggle
                      label="Email Notifications"
                      {...registerNotification("emailNotification")}
                    />
                    <SettingsToggle
                      label="WhatsApp Notifications"
                      {...registerNotification("whatsappNotification")}
                    />
                    <SettingsToggle
                      label="SMS Notifications"
                      {...registerNotification("smsNotification")}
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button type="submit" className="btn-primary">
                      <Check className="w-4 h-4" />
                      Save Notifications
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Preferences */}
            {activeTab === "preferences" && (
              <div className="settings-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-accent rounded-xl">
                    <Settings2 className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">
                    App Preferences
                  </h2>
                </div>

                <form
                  onSubmit={handlePreferenceSubmit(onUpdatePreferences)}
                  className="space-y-6 max-w-2xl"
                >
                  <div className="space-y-3">
                    <SettingsToggle
                      label="Show Stock on Dashboard"
                      description="Display stock levels on main dashboard"
                      {...registerPreference("showDashboardStocks")}
                    />
                    <SettingsToggle
                      label="Auto Generate Purchase Orders"
                      description="Create POs automatically when stock is low"
                      {...registerPreference("autoGeneratePO")}
                    />
                    <SettingsToggle
                      label="Dark Mode"
                      description="Use dark theme for the application"
                      {...registerPreference("darkMode")}
                    />
                  </div>

                  <SettingsSelect
                    label="Language"
                    {...registerPreference("language")}
                    options={[
                      { value: "en", label: "English" },
                      { value: "hi", label: "हिंदी" },
                      { value: "ta", label: "தமிழ்" },
                      { value: "te", label: "తెలుగు" },
                    ]}
                  />

                  <div className="pt-4 flex justify-end">
                    <button type="submit" className="btn-primary">
                      <Check className="w-4 h-4" />
                      Save Preferences
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );

  // return (
  //   <MainLayout>
  //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
  //       <div className="max-w-6xl mx-auto">
  //         {/* Header */}
  //         <div className="mb-5">
  //           <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 bg-clip-text text-transparent">
  //             Settings
  //           </h1>
  //           <p className="text-gray-600 dark:text-gray-400 mt-3 text-lg">
  //             Configure your store exactly how you want
  //           </p>
  //         </div>

  //         {/* Tabs */}
  //         <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 dark:border-gray-700">
  //           {tabs.map((tab) => (
  //             <button
  //               key={tab.id}
  //               onClick={() => setActiveTab(tab.id as Tab)}
  //               className={`flex items-center gap-3 px-6 py-4 font-medium text-lg transition-all border-b-4 ${
  //                 activeTab === tab.id
  //                   ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
  //                   : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
  //               }`}
  //             >
  //               <tab.icon className="w-6 h-6" />
  //               {tab.label}
  //             </button>
  //           ))}
  //         </div>

  //         <div className="space-y-8">
  //           {/* Store Settings Tab */}
  //           {activeTab === "store" && (
  //             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  //               <div className="lg:col-span-3 bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700 p-10">
  //                 <div className="flex items-center gap-4 mb-10">
  //                   <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl">
  //                     <Store className="w-8 h-8 text-white" />
  //                   </div>
  //                   <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
  //                     Store Information
  //                   </h2>
  //                 </div>

  //                 <form
  //                   onSubmit={storeHandleSubmit(saveStoreSettings)}
  //                   className="space-y-7"
  //                 >
  //                   {/* Same grid layout as before */}
  //                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  //                     {/* All fields same, just using storeRegister */}
  //                     <div>
  //                       <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
  //                         Store Name <span className="text-red-500">*</span>
  //                       </label>
  //                       <input
  //                         {...storeRegister("storeName")}
  //                         className="mt-2 w-full px-5 py-4 bg-white/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-blue-500/30"
  //                       />
  //                       {errorsStore.storeName && (
  //                         <p className="text-red-500 text-sm mt-1">
  //                           {errorsStore.storeName.message}
  //                         </p>
  //                       )}
  //                     </div>

  //                     <div>
  //                       <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
  //                         Company Name
  //                       </label>
  //                       <input
  //                         {...storeRegister("companyName")}
  //                         className="mt-2 w-full px-5 py-4 bg-white/50 dark:bg-gray-700/50 border rounded-2xl focus:ring-4 focus:ring-blue-500/30"
  //                       />
  //                     </div>

  //                     <div>
  //                       <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
  //                         Owner Name
  //                       </label>
  //                       <input
  //                         {...storeRegister("ownerName")}
  //                         className="mt-2 w-full px-5 py-4 bg-white/50 dark:bg-gray-700/50 border rounded-2xl focus:ring-4 focus:ring-blue-500/30"
  //                       />
  //                     </div>

  //                     <div>
  //                       <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
  //                         Phone
  //                       </label>
  //                       <input
  //                         {...storeRegister("phone")}
  //                         className="mt-2 w-full px-5 py-4 bg-white/50 dark:bg-gray-700/50 border rounded-2xl focus:ring-4 focus:ring-blue-500/30"
  //                       />
  //                     </div>

  //                     <div>
  //                       <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
  //                         Email
  //                       </label>
  //                       <input
  //                         {...storeRegister("email")}
  //                         type="email"
  //                         className="mt-2 w-full px-5 py-4 bg-white/50 dark:bg-gray-700/50 border rounded-2xl focus:ring-4 focus:ring-blue-500/30"
  //                       />
  //                     </div>

  //                     <div>
  //                       <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
  //                         Currency
  //                       </label>
  //                       <input
  //                         {...storeRegister("currency")}
  //                         className="mt-2 w-full px-5 py-4 bg-white/50 dark:bg-gray-700/50 border rounded-2xl focus:ring-4 focus:ring-blue-500/30"
  //                       />
  //                     </div>
  //                   </div>

  //                   {/* GST Toggle */}
  //                   <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
  //                     <div className="flex items-center justify-between mb-6">
  //                       <div>
  //                         <p className="text-xl font-semibold">Enable GST</p>
  //                         <p className="text-sm text-gray-600 dark:text-gray-400">
  //                           Turn on if your business is GST registered
  //                         </p>
  //                       </div>
  //                       <input
  //                         type="checkbox"
  //                         {...storeRegister("gstEnabled")}
  //                         className="w-7 h-7 text-blue-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
  //                       />
  //                     </div>

  //                     {storeWatch("gstEnabled") && (
  //                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  //                         <div>
  //                           <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
  //                             GST Number <span className="text-red-500">*</span>
  //                           </label>
  //                           <input
  //                             {...storeRegister("gstNumber")}
  //                             placeholder="22AAAAA0000A1Z5"
  //                             className="mt-2 w-full px-5 py-4 bg-white/50 dark:bg-gray-700/50 border rounded-2xl font-mono tracking-wider focus:ring-4 focus:ring-blue-500/30"
  //                           />
  //                           {errorsStore.gstNumber && (
  //                             <p className="text-red-500 text-sm mt-1">
  //                               {errorsStore.gstNumber.message}
  //                             </p>
  //                           )}
  //                         </div>

  //                         <div>
  //                           <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
  //                             State Code <span className="text-red-500">*</span>
  //                           </label>
  //                           <select
  //                             {...storeRegister("stateCode")}
  //                             className="mt-2 w-full px-5 py-4 bg-white/50 dark:bg-gray-700/50 border rounded-2xl focus:ring-4 focus:ring-blue-500/30"
  //                           >
  //                             <option value="">Select State</option>
  //                             {indianStatesWithCode.map(([code, name]) => (
  //                               <option key={code} value={code}>
  //                                 {code} - {name}
  //                               </option>
  //                             ))}
  //                           </select>
  //                           {errorsStore.stateCode && (
  //                             <p className="text-red-500 text-sm mt-1">
  //                               {errorsStore.stateCode.message}
  //                             </p>
  //                           )}
  //                         </div>
  //                       </div>
  //                     )}
  //                   </div>

  //                   {/* Address & Financial Year */}
  //                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  //                     <div>
  //                       <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
  //                         Financial Year
  //                       </label>
  //                       <input
  //                         {...storeRegister("financialYear")}
  //                         className="mt-2 w-full px-5 py-4 bg-white/50 dark:bg-gray-700/50 border rounded-2xl focus:ring-4 focus:ring-blue-500/30"
  //                       />
  //                     </div>

  //                     <div>
  //                       <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
  //                         Full Address
  //                       </label>
  //                       <textarea
  //                         {...storeRegister("address")}
  //                         rows={4}
  //                         className="mt-2 w-full px-5 py-4 bg-white/50 dark:bg-gray-700/50 border rounded-2xl resize-none focus:ring-4 focus:ring-blue-500/30"
  //                       />
  //                     </div>
  //                   </div>

  //                   <div className="pt-8 flex justify-end">
  //                     <button
  //                       type="submit"
  //                       className="bg-gradient-to-r from-blue-600 to-indigo-600 ..."
  //                     >
  //                       <Check className="w-7 h-7" />
  //                       Save Store Settings
  //                     </button>
  //                   </div>
  //                 </form>
  //               </div>

  //               <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl border p-8 shadow-xl flex flex-col items-center justify-center">
  //                 <h3 className="text-xl font-bold mb-6">Store Logo</h3>
  //                 <div className="relative mb-6">
  //                   <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold shadow-2xl overflow-hidden">
  //                     {logoPreview ? (
  //                       <img
  //                         src={logoPreview}
  //                         alt="Store Logo"
  //                         className="w-full h-full object-cover"
  //                       />
  //                     ) : (
  //                       storeSettings.storeName.slice(0, 2).toUpperCase()
  //                     )}
  //                   </div>
  //                   <label className="absolute bottom-2 right-2 bg-indigo-600 p-4 rounded-full cursor-pointer shadow-xl hover:bg-indigo-700 transition">
  //                     <Camera className="w-7 h-7 text-white" />
  //                     <input
  //                       type="file"
  //                       accept="image/*"
  //                       onChange={handleLogoUpload}
  //                       className="hidden"
  //                     />
  //                   </label>
  //                 </div>
  //                 <p className="text-sm text-gray-600 text-center max-w-xs">
  //                   Upload a high-quality logo for your invoices and receipts
  //                 </p>
  //               </div>
  //             </div>
  //           )}

  //           {/* Billing Settings Tab */}
  //           {activeTab === "billing" && (
  //             <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700 p-10">
  //               <div className="flex items-center gap-4 mb-10">
  //                 <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl">
  //                   <Receipt className="w-8 h-8 text-white" />
  //                 </div>
  //                 <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
  //                   Billing & Invoice Settings
  //                 </h2>
  //               </div>

  //               <form
  //                 onSubmit={handleSubmit(saveBillingSettings)}
  //                 className="space-y-3 max-w-5xl"
  //               >
  //                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
  //                   {/* Left Column - Text Inputs */}
  //                   <div className="space-y-2">
  //                     <div>
  //                       <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
  //                         Invoice Prefix
  //                       </label>
  //                       <input
  //                         {...register("invoicePrefix")}
  //                         className="mt-2 w-full px-5 py-4 bg-white/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
  //                         placeholder="e.g. INV-, BILL-, RB-"
  //                       />
  //                       {errors.invoicePrefix && (
  //                         <p className="text-red-500 text-sm mt-1">
  //                           {errors.invoicePrefix.message}
  //                         </p>
  //                       )}
  //                     </div>

  //                     <div>
  //                       <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
  //                         Next Invoice Number
  //                       </label>
  //                       <input
  //                         type="number"
  //                         {...register("invoiceStartNumber", {
  //                           valueAsNumber: true,
  //                         })}
  //                         className="mt-2 w-full px-5 py-4 bg-white/50 dark:bg-gray-700/50 border rounded-2xl focus:ring-4 focus:ring-emerald-500/30"
  //                       />
  //                     </div>

  //                     <div>
  //                       <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
  //                         Default GST Rate (%)
  //                       </label>
  //                       <input
  //                         type="number"
  //                         step="0.01"
  //                         {...register("defaultGstRate", {
  //                           valueAsNumber: true,
  //                         })}
  //                         className="mt-2 w-full px-5 py-4 bg-white/50 dark:bg-gray-700/50 border rounded-2xl focus:ring-4 focus:ring-emerald-500/30"
  //                         placeholder="18"
  //                       />
  //                     </div>

  //                     {/* <div>
  //                       <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
  //                         Financial Year
  //                       </label>
  //                       <input
  //                         {...register("financialYear")}
  //                         placeholder="2025-2026"
  //                         className="mt-2 w-full px-5 py-4 bg-white/50 dark:bg-gray-700/50 border rounded-2xl focus:ring-4 focus:ring-emerald-500/30"
  //                       />
  //                     </div> */}
  //                   </div>

  //                   {/* Right Column - Toggles + Footer */}
  //                   <div className="space-y-7">
  //                     {/* Toggle Items */}
  //                     <div className="space-y-5">
  //                       <div className="flex items-start justify-between p-5 rounded-2xl bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-800/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-all border border-gray-200 dark:border-gray-700">
  //                         <div>
  //                           <p className="text-lg font-semibold">
  //                             Prices are GST Inclusive by default
  //                           </p>
  //                           <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
  //                             Show prices with GST already included (common in
  //                             retail)
  //                           </p>
  //                         </div>
  //                         <input
  //                           type="checkbox"
  //                           {...register("gstIncludedDefault")}
  //                           className="w-7 h-7 text-emerald-600 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
  //                         />
  //                       </div>

  //                       <div className="flex items-start justify-between p-5 rounded-2xl bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-800/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-all border border-gray-200 dark:border-gray-700">
  //                         <div>
  //                           <p className="text-lg font-semibold">
  //                             Auto Round Off Bill Total
  //                           </p>
  //                           <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
  //                             Round final amount to nearest rupee
  //                           </p>
  //                         </div>
  //                         <input
  //                           type="checkbox"
  //                           {...register("roundOffBill")}
  //                           className="w-7 h-7 text-emerald-600 rounded focus:ring-emerald-500 focus:ring-2"
  //                         />
  //                       </div>

  //                       <div className="flex items-start justify-between p-5 rounded-2xl bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-800/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-all border border-gray-200 dark:border-gray-700">
  //                         <div>
  //                           <p className="text-lg font-semibold">
  //                             Show HSN Code on Invoice
  //                           </p>
  //                           <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
  //                             Print HSN/SAC code for each item
  //                           </p>
  //                         </div>
  //                         <input
  //                           type="checkbox"
  //                           {...register("showHsnOnInvoice")}
  //                           className="w-7 h-7 text-emerald-600 rounded focus:ring-emerald-500 focus:ring-2"
  //                         />
  //                       </div>

  //                       <div className="flex items-start justify-between p-5 rounded-2xl bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-800/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-all border border-gray-200 dark:border-gray-700">
  //                         <div>
  //                           <p className="text-lg font-semibold">
  //                             Show Customer Phone on Invoice
  //                           </p>
  //                           <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
  //                             Print customer's phone number on bill
  //                           </p>
  //                         </div>
  //                         <input
  //                           type="checkbox"
  //                           {...register("showCustomerPhone")}
  //                           className="w-7 h-7 text-emerald-600 rounded focus:ring-emerald-500 focus:ring-2"
  //                         />
  //                       </div>
  //                     </div>

  //                     {/* Footer Note */}
  //                     <div>
  //                       <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
  //                         Invoice Footer Note
  //                       </label>
  //                       <textarea
  //                         {...register("invoiceFooterNote")}
  //                         rows={5}
  //                         placeholder="Thank you for shopping with us! Goods once sold will not be returned."
  //                         className="mt-2 w-full px-5 py-4 bg-white/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-2xl resize-none focus:ring-4 focus:ring-emerald-500/30"
  //                       />
  //                     </div>
  //                   </div>
  //                 </div>

  //                 {/* Save Button */}
  //                 <div className="pt-8 flex justify-end">
  //                   <button
  //                     type="submit"
  //                     className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-lg px-12 py-5 rounded-2xl shadow-2xl hover:shadow-emerald-500/40 transform hover:scale-105 transition-all duration-300 flex items-center gap-4"
  //                   >
  //                     <Check className="w-7 h-7" />
  //                     Save Billing Settings
  //                   </button>
  //                 </div>
  //               </form>
  //             </div>
  //           )}

  //           {/* Notifications Tab */}
  //           {activeTab === "notifications" && (
  //             <form
  //               onSubmit={handleNotificationSubmit(onUpdateNotifications)}
  //               className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl border p-8 shadow-xl"
  //             >
  //               <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
  //                 <Bell className="w-8 h-8 text-purple-600" />
  //                 Notification Settings
  //               </h2>

  //               <div className="space-y-4 max-w-2xl">
  //                 <Toggle
  //                   label="Low Stock Alert"
  //                   desc="Notify when stock is low"
  //                   {...registerNotification("lowStockAlert")}
  //                 />
  //                 <Toggle
  //                   label="Daily Sales Report"
  //                   desc="End of day summary"
  //                   {...registerNotification("dailySalesReport")}
  //                 />

  //                 <div className="pt-4 border-t space-y-3">
  //                   <Toggle
  //                     label="Email Notifications"
  //                     {...registerNotification("emailNotification")}
  //                   />
  //                   <Toggle
  //                     label="WhatsApp Notifications"
  //                     {...registerNotification("whatsappNotification")}
  //                   />
  //                   <Toggle
  //                     label="SMS Notifications"
  //                     {...registerNotification("smsNotification")}
  //                   />
  //                 </div>

  //                 <button className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-xl">
  //                   Save Notification Settings
  //                 </button>
  //               </div>
  //             </form>
  //           )}

  //           {/* Preferences Tab */}
  //           {activeTab === "preferences" && (
  //             <form
  //               onSubmit={handlePreferenceSubmit(onUpdatePreferences)}
  //               className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl border p-8 shadow-xl"
  //             >
  //               <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
  //                 <Settings2 className="w-8 h-8 text-orange-600" />
  //                 App Preferences
  //               </h2>

  //               <div className="space-y-5 max-w-2xl">
  //                 <Toggle
  //                   label="Show Stock on Dashboard"
  //                   {...registerPreference("showDashboardStocks")}
  //                 />
  //                 <Toggle
  //                   label="Auto Generate Purchase Orders"
  //                   {...registerPreference("autoGeneratePO")}
  //                 />
  //                 <Toggle
  //                   label="Dark Mode"
  //                   {...registerPreference("darkMode")}
  //                 />

  //                 <div>
  //                   <label className="block text-sm font-medium mb-2">
  //                     Language
  //                   </label>
  //                   <select
  //                     {...registerPreference("language")}
  //                     className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-700"
  //                   >
  //                     <option value="en">English</option>
  //                     <option value="hi">हिंदी</option>
  //                     <option value="ta">தமிழ்</option>
  //                     <option value="te">తెలుగు</option>
  //                   </select>
  //                 </div>

  //                 <button className="mt-6 px-6 py-3 bg-orange-600 text-white rounded-xl">
  //                   Save Preferences
  //                 </button>
  //               </div>
  //             </form>
  //           )}
  //         </div>
  //       </div>
  //     </div>
  //   </MainLayout>
  // );
}

const Toggle = ({ label, desc, ...props }: any) => (
  <label className="flex items-center justify-between py-2">
    <div>
      <p className="font-medium">{label}</p>
      {desc && <p className="text-sm text-gray-600">{desc}</p>}
    </div>
    <input type="checkbox" className="w-6 h-6" {...props} />
  </label>
);

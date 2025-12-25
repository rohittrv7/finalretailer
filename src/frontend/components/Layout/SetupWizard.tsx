import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Store,
  User,
  Phone,
  Mail,
  Lock,
  Building2,
  ChevronDown,
  CheckCircle2,
  Loader2,
  Zap,
  IndianRupee,
  Users,
  Package,
  Printer,
  Smartphone,
  Sparkles,
  Shield,
  ArrowRight,
} from "lucide-react";
import { setAuthData } from "@/frontend/store/slices/authSlice";
import { useDispatch } from "react-redux";

const setupSchema = z.object({
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters"),
  ownerName: z.string().min(2, "Your name must be at least 2 characters"),
  phone: z
    .string()
    .min(2, { message: "Mobile number is required" })
    .regex(/^[6-9]\d{9}$/, {
      message: "Enter a valid 10-digit Indian mobile number (e.g., 9876543210)",
    })
    .transform((val) => val.replace(/\D/g, "").slice(-10)),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  businessCategory: z.string().min(1, "Please select a business type"),
});

type SetupFormData = z.infer<typeof setupSchema>;

const categories = [
  "Grocery Store",
  "Kirana Store",
  "Pharmacy",
  "Medical Store",
  "Fertilizer Shop",
  "General Store",
  "Electronics",
  "Mobile Shop",
  "Clothing Store",
  "Restaurant",
  "Sweet Shop",
  "Hardware Store",
  "Others",
];

const features = [
  { icon: Zap, text: "Lightning-fast Billing", delay: "0ms" },
  { icon: IndianRupee, text: "Automatic Ledger", delay: "100ms" },
  { icon: Package, text: "Smart Inventory", delay: "200ms" },
  { icon: Users, text: "Customer Accounts", delay: "300ms" },
  { icon: Printer, text: "Thermal Print Ready", delay: "400ms" },
  { icon: Smartphone, text: "WhatsApp Integration", delay: "500ms" },
];

// const stats = [
//   { value: "1M+", label: "Active Shops" },
//   { value: "₹500Cr+", label: "Daily Sales" },
//   { value: "99.9%", label: "Uptime" },
// ];

export default function SetupWizard() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    mode: "onChange",
    defaultValues: {
      businessCategory: "",
    },
  });

  const selectedCategory = watch("businessCategory");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) =>
      localStorage.setItem("theme", e.matches ? "dark" : "light");
    media.addEventListener("change", handler);

    if (media.matches) {
      document.documentElement.classList.add("dark");
    }

    return () => media.removeEventListener("change", handler);
  }, []);

  const onSubmit = async (data: SetupFormData) => {
    setLoading(true);
    try {
      const result = await window.electronAPI.auth.setupBusiness({
        ...data,
        phone: "+91" + data.phone,
      });

      if (result.success && result.user) {
        try {
          const me = await window.electronAPI.auth.getUser();
          if (me && me.user && me.entitlements) {
            dispatch(setAuthData({ user: me.user, entitlements: me.entitlements }));
          } else {
            dispatch(
              setAuthData({
                user: result.user,
                entitlements: {
                  plan: "trial",
                  features: [],
                  isTrial: true,
                  trialEndsAt: result.user.trialEndsAt,
                  licenseKey: null,
                },
              })
            );
          }
        } catch (e) {
          dispatch(
            setAuthData({
              user: result.user,
              entitlements: {
                plan: "trial",
                features: [],
                isTrial: true,
                trialEndsAt: result.user.trialEndsAt,
                licenseKey: null,
              },
            })
          );
        }

        toast.success("Store successfully ban gaya!");
        window.location.reload();
      } else {
        toast.error(result.error || "Kuch galat ho gaya");
      }
    } catch (err) {
      toast.error("Connection issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background dark:bg-gray-950 text-foreground">
      {/* Background Pattern - Light mein dikhe, Dark mein na dikhe ya soft */}
      <div
        className="absolute inset-0 opacity-10 dark:opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* LEFT SIDE - Hero (Gradient Background) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="relative z-10 p-8 text-white flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-5 mb-5">
              <div className="w-16 h-16 bg-blue-500/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                <Store className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Dukaan POS</h1>
                <p className="text-white/80">Point of Sale System</p>
              </div>
            </div>

            <div className="space-y-4 max-w-lg">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">80% Free • Works Offline</span>
              </div>

              <h2 className="text-5xl font-extrabold leading-tight">
                Run Your Shop
                <br />
                <span className="text-blue-500/90">Smarter & Faster</span>
              </h2>

              <p className="text-xl text-white/90">
                10 lakh+ dukaandaaron ka bharosa – roz ka business ab bilkul
                aasaan
              </p>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-blue-500/10 backdrop-blur-md rounded-2xl p-5 border border-white/20"
                style={{ animationDelay: f.delay }}
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <f.icon className="w-7 h-7" />
                </div>
                <span className="font-medium text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background dark:bg-gray-950">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
              <Store className="w-11 h-11 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Dukaan POS</h1>
            <p className="text-muted-foreground">30 second mein setup</p>
          </div>

          <h2 className="text-3xl font-bold text-center lg:text-left mb-8 text-foreground">
            Create Your Store
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {/* Business Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register("businessName")}
                placeholder="Sharma Kirana Store"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-foreground placeholder-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              />
              {errors.businessName && (
                <p className="mt-1.5 text-sm text-red-500">
                  {errors.businessName.message}
                </p>
              )}
            </div>

            {/* Owner Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register("ownerName")}
                placeholder="Rahul Kumar"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-foreground placeholder-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              />
            </div>

            {/* Phone + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Mobile <span className="text-red-500">*</span>
                </label>
                <div className="flex rounded-xl overflow-hidden">
                  <span className="inline-flex items-center px-4 bg-gray-100 dark:bg-gray-800 border border-r-0 border-gray-300 dark:border-gray-700 text-sm font-medium text-muted-foreground">
                    +91
                  </span>
                  <input
                    {...register("phone")}
                    placeholder="98765 43210"
                    className="w-full px-4 py-3.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-foreground placeholder-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Email{" "}
                </label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="you@shop.com"
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-foreground placeholder-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Password <span className="text-red-500">*</span>
              </label>
              <input
                {...register("password")}
                type="password"
                placeholder="Minimum 6 characters"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-foreground placeholder-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              />
            </div>

            {/* Business Category Dropdown */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <Store className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Business Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-foreground flex justify-between items-center text-left hover:border-blue-500 transition"
                >
                  <span
                    className={
                      selectedCategory
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {selectedCategory || "Select category"}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 transition ${
                      showDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showDropdown && (
                  <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 z-50 max-h-64 overflow-y-auto">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setValue("businessCategory", cat, {
                            shouldValidate: true,
                          });
                          setShowDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center gap-3 ${
                          selectedCategory === cat
                            ? "bg-blue-50 dark:bg-gray-800 font-medium"
                            : ""
                        }`}
                      >
                        {selectedCategory === cat && (
                          <CheckCircle2 className="w-5 h-5 text-blue-600" />
                        )}
                        <span
                          className={selectedCategory === cat ? "" : "ml-8"}
                        >
                          {cat}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isValid}
              className="w-full mt-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all shadow-xl active:scale-98"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Creating Store...
                </>
              ) : (
                <>
                  <Store className="w-6 h-6" />
                  Start Selling Now
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
              <Shield className="w-4 h-4" />
              <span>Your data is 100% secure & encrypted</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

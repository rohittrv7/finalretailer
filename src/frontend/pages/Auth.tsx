import { Store } from "lucide-react";
// import retailShop from "@/assets/retail-shop.jpg";
import { AuthTabs } from "@/frontend/components/Layout/AuthTabs";

const Auth = () => {
  return (
    <div className="min-h-screen bg-gradient-portal flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-glow/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-start relative z-10">
        {/* Left side - Branding and illustration */}
        <div className="hidden lg:flex flex-col items-center justify-start pt-8 text-white space-y-6 animate-fade-in sticky top-8">
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <Store className="h-8 w-8" />
              <h1 className="text-3xl font-bold">Retailer Portal</h1>
            </div>
            <p className="text-lg text-white/90 max-w-md mx-auto">
              Manage your business with ease. Built for grocery stores,
              pharmacies, and retail shops.
            </p>
          </div>

          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-elevated">
            <img
              src={'retailShop'}
              alt="Modern retail shop storefront"
              className="w-full h-auto object-cover"
            />
          </div>

          <div className="flex gap-8 text-center text-white/80 text-sm">
            <div>
              <div className="text-2xl font-bold text-white">10K+</div>
              <div>Active Retailers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">99.9%</div>
              <div>Uptime</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">24/7</div>
              <div>Support</div>
            </div>
          </div>
        </div>

        {/* Right side - Auth card */}
        <div
          className="w-full max-w-md mx-auto animate-fade-in py-8"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="bg-card backdrop-blur-sm rounded-2xl shadow-elevated p-6 border border-border/50">
            {/* Mobile header */}
            <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
              <Store className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                Retailer Portal
              </h1>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Welcome Back
              </h2>
              <p className="text-muted-foreground">
                Access your business management dashboard
              </p>
            </div>

            <AuthTabs />

            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-center text-sm text-muted-foreground">
                Need help?{" "}
                <a
                  href="#"
                  className="text-primary hover:text-primary-glow transition-colors font-medium"
                >
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

// src/pages/NotFound.tsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 - Page not found:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0f1e] flex items-center justify-center">
      {/* Animated Gradient Orbs */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-900 rounded-full mix-blend-multiply blur-3xl animate-pulse opacity-50" />
        <div className="absolute top-40 -right-40 w-96 h-96 bg-blue-900 rounded-full mix-blend-multiply blur-3xl animate-pulse opacity-50 animation-delay-2000" />
        <div className="absolute -bottom-40 left-40 w-96 h-96 bg-pink-900 rounded-full mix-blend-multiply blur-3xl animate-pulse opacity-50 animation-delay-4000" />
      </div>

      {/* Dotted Orbit Ring */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg className="w-100 h-100 animate-spin-slow" viewBox="0 0 400 400">
          <circle
            cx="200"
            cy="200"
            r="180"
            fill="none"
            stroke="url(#orbit-gradient)"
            strokeWidth="2"
            strokeDasharray="8 12"
            opacity="0.3"
          />
          <defs>
            <linearGradient
              id="orbit-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-6">
        {/* 404 with Spinning Zero */}
        <div className="relative inline-block mb-8">
          <h1 className="text-9xl font-black text-white tracking-tighter">
            4<span className="inline-block relative mx-4">0</span>4
          </h1>
        </div>

        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-lg text-gray-400 max-w-md mx-auto mb-10">
          Sorry, we couldn't find the page you're looking for.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.history.back()}
            className="group flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-white/10 backdrop-blur-sm text-white font-medium hover:bg-white/20 transition-all"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            Go Back
          </button>

          {/* <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold shadow-lg hover:shadow-2xl hover:shadow-purple-500/30 transition-all"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </button> */}
        </div>

        <p className="mt-16 text-sm text-gray-500">
          © 2025 Retailer • Made with{" "}
          <span className="text-red-500">Love</span> in India
        </p>
      </div>
    </div>
  );
  
}

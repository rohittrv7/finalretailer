"use client";

import { useState } from "react";
import { Check, BadgeCheck } from "lucide-react";
import MainLayout from "@/components/Layout/MainLayout";

export default function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const pricingPlans = [
    {
      name: "Starter",
      description: "App trial + basic offline billing",
      price: { oneTime: 99 },
      features: [
        "Quick Billing",
        "Inventory Management",
        "Daily Sales Summary",
        "Local Backup (Manual)",
        "Offline Data (No Cloud)",
        "Basic Thermal Printer Support",
      ],
      buttonText: "Get Started",
      buttonVariant: "outline",
    },
    {
      name: "Standard",
      description: "Cloud sync + GST + Barcode + Alerts",
      price: { monthly: 299, yearly: 299 * 12 },
      features: [
        "All Starter Features",
        "Cloud Sync (Access Anywhere)",
        "GST Invoicing",
        "Barcode Generation & Scanning",
        "Low Stock Alerts",
        "Multi-device Access",
        "Auto Cloud Backup",
      ],
      buttonText: "Upgrade to Pro",
      buttonVariant: "default",
      popular: true,
    },
    {
      name: "Pro",
      description: "Multi-branch + Role-based management",
      price: { monthly: 499, yearly: 499 * 12 },
      features: [
        "All Standard Features",
        "Multi-branch Billing",
        "Staff Roles & Permissions",
        "Sales & Expense Analytics",
        "Customer & Supplier Modules",
        "WhatsApp Invoice Share",
        "Activity Logs",
      ],
      buttonText: "Start Business Plan",
      buttonVariant: "outline",
    },
  ];

  const faqs = [
    {
      question: "Can I change my plan later?",
      answer:
        "Yes! You can upgrade, downgrade, or cancel your subscription anytime from your dashboard.",
    },
    {
      question: "Do you offer refunds?",
      answer:
        "We offer a 14-day money-back guarantee if you’re not satisfied with our service.",
    },
    {
      question: "Is my data secure?",
      answer:
        "Absolutely. We use bank-level encryption and regular security audits to protect your data.",
    },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-blue-950/30 dark:to-indigo-950/20">
        <div className="container mx-auto px-4 py-16 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-14">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Choose a plan that grows with you
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Monthly and annual billing available. Cancel anytime.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-3 bg-gray-100 dark:bg-slate-800 p-1.5 rounded-xl shadow-sm">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                  billingCycle === "monthly"
                    ? "bg-white dark:bg-slate-700 shadow-md text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                  billingCycle === "yearly"
                    ? "bg-white dark:bg-slate-700 shadow-md text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Yearly
                <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {pricingPlans.map((plan) => {
              const isStarter = plan.name === "Starter";
              const price = isStarter
                ? plan.price.oneTime
                : billingCycle === "monthly"
                ? plan.price.monthly
                : plan.price.yearly;

              return (
                <div
                  key={plan.name}
                  className={`relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-slate-700 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                    plan.popular
                      ? "ring-2 ring-blue-600 dark:ring-blue-500"
                      : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-4 py-1 rounded-full text-sm shadow-lg flex items-center gap-1">
                        <BadgeCheck className="w-4 h-4" /> Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Check className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {plan.name}
                      </h3>
                    </div>
                    <p className="text-base text-gray-600 dark:text-gray-400">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        ₹{price}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {isStarter ? " one-time" : "/mo"}
                      </span>
                    </div>
                    {billingCycle === "yearly" && !isStarter && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Billed ₹{price * 12} annually
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`w-full font-semibold py-2.5 rounded-lg transition-all duration-200 ${
                      plan.buttonVariant === "default"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
                        : "border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              );
            })}
          </div>

          {/* FAQs */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-slate-700 mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="text-center md:text-left">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

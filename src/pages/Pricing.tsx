import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
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
      icon: Check,
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
      price: {
        monthly: 299,
        yearly: 299 * 12,
      },
      icon: Check,
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
      price: {
        monthly: 499,
        yearly: 499 * 12,
      },
      icon: Check,
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
    // {
    //   name: "Enterprise",
    //   description: "For big stores & growing chains",
    //   price: { monthly: 2499, yearly: 2000 },
    //   icon: Check,
    //   features: [
    //     "All Pro Features",
    //     "Dedicated Cloud Server",
    //     "API Access for Integration",
    //     "Dedicated Account Manager",
    //     "Custom Branding (Logo + Domain)",
    //     "Advanced Business Reports",
    //     "Priority Support & SLA Guarantee",
    //   ],
    //   buttonText: "Contact Sales",
    //   buttonVariant: "default",
    // },
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
      <div className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-muted/30">
        <div className="container mx-auto px-4 py-16 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-14 relative">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Choose a plan that grows with you
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Monthly and annual billing available. Cancel anytime.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-3 bg-muted p-1.5 rounded-xl shadow-sm">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                  billingCycle === "monthly"
                    ? "bg-card shadow-md text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                  billingCycle === "yearly"
                    ? "bg-card shadow-md text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Yearly
                <Badge
                  variant="default"
                  className="bg-primary text-primary-foreground text-xs font-bold px-2"
                >
                  Save 20%
                </Badge>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {pricingPlans.map((plan) => {
              const Icon = plan.icon;
              const isStarter = plan.name === "Starter";
              const price =
                isStarter && plan.price.oneTime
                  ? plan.price.oneTime
                  : billingCycle === "monthly"
                  ? plan.price.monthly
                  : plan.price.yearly;

              return (
                <Card
                  key={plan.name}
                  className={`relative transition-all duration-300 hover:shadow-2x ${
                    plan.popular
                      ? "border-primary shadow-md"
                      : "hover:border-primary/50"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-primary text-primary-foreground font-bold px-4 py-1 shadow-md">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    </div>
                    <CardDescription className="text-base text-muted-foreground">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">₹{price}</span>
                        <span className="text-muted-foreground">
                          {isStarter ? " one-time" : "/mo"}
                        </span>
                      </div>
                      {billingCycle === "yearly" && !isStarter && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Billed ₹{price * 12} annually
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                          <span className="text-sm leading-relaxed">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={plan.buttonVariant}
                      className={`w-full font-semibold py-2.5 rounded-lg transition-all ${
                        plan.buttonVariant === "default"
                          ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                          : "hover:bg-muted"
                      }`}
                    >
                      {plan.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* FAQs */}
          <Card className="mx-auto shadow-lg hover:shadow-xl transition-all">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="text-center md:text-left">
                  <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

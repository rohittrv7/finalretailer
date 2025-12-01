import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  Copy,
  TrendingUp,
  TrendingDown,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { CustomerData } from "@/frontend/types/customer";
import { toast } from "sonner";

interface CustomerDetailsModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  data: CustomerData | null;
}

export default function CustomerDetailsModal({
  isOpen,
  setIsOpen,
  data,
}: CustomerDetailsModalProps) {
  const handleCopyPhone = () => {
    if (data?.customer.phone) {
      navigator.clipboard.writeText(data.customer.phone);
      toast("Phone number copied!");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 overflow-y-auto">
        <div
          className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/25 backdrop-blur rounded-full flex items-center justify-center">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {data?.customer.name || "Loading..."}
                  </h2>
                  <p className="text-blue-100 text-xs">Customer Details</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Body - Super Compact */}
          <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
            {!data ? (
              <div className="flex justify-center py-16">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Top Cards - Tight */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  {/* Contact */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">
                      Contact
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="font-bold text-lg">
                            {data.customer.phone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Address</p>
                          <p className="font-medium text-sm">
                            {data.customer.address || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Since</p>
                          <p className="text-sm font-medium">
                            {new Date(
                              data.customer.created_at
                            ).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total Due */}
                  <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-xl p-5 text-center">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xs font-bold text-red-600 uppercase">
                        Total Due
                      </h3>
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-4xl font-extrabold text-red-600">
                      ₹{data.summary.totalDue.toLocaleString("en-IN")}
                    </p>
                    <p className="text-sm font-bold text-red-600 mt-2 bg-red-100 dark:bg-red-800/50 px-3 py-1 rounded-full inline-block">
                      {data.summary.pendingInvoices} Pending
                    </p>
                  </div>
                </div>

                {/* Pending Invoices */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-8 bg-red-600 rounded-full" />
                    <h3 className="font-bold text-lg">Pending Invoices</h3>
                  </div>

                  {data.dueInvoices.length === 0 ? (
                    <div className="text-center py-10 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-300 dark:border-green-800">
                      <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                      <p className="font-bold text-green-600 text-lg">
                        All Clear!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.dueInvoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                        >
                          <div className="bg-gray-900 px-4 py-3 flex justify-between items-center text-white">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5" />
                              <div>
                                <p className="font-bold">#{inv.invoice_no}</p>
                                <p className="text-xs opacity-80">
                                  {new Date(inv.date).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "numeric",
                                      month: "short",
                                    }
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-extrabold text-red-400">
                                ₹{inv.remainingAmount.toLocaleString("en-IN")}
                              </p>
                              <span
                                className={`text-xs font-bold px-3 py-1 rounded-full ${
                                  inv.status === "Partial"
                                    ? "bg-yellow-400 text-black"
                                    : "bg-red-600"
                                }`}
                              >
                                {inv.status}
                              </span>
                            </div>
                          </div>

                          <div className="p-4">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-gray-300 dark:border-gray-600 text-left text-gray-600 dark:text-gray-400">
                                    <th className="pb-2 font-bold">Item</th>
                                    <th className="pb-2 text-center font-bold">
                                      Qty
                                    </th>
                                    <th className="pb-2 text-right font-bold">
                                      Rate
                                    </th>
                                    <th className="pb-2 text-right font-bold">
                                      Total
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {inv.items.map((item: any, i: number) => (
                                    <tr
                                      key={i}
                                      className="border-b border-gray-200 dark:border-gray-700 last:border-0"
                                    >
                                      <td className="py-2.5 font-medium">
                                        {item.productName}
                                      </td>
                                      <td className="py-2.5 text-center">
                                        {item.quantity}
                                      </td>
                                      <td className="py-2.5 text-right">
                                        ₹{item.unitPrice}
                                      </td>
                                      <td className="py-2.5 text-right font-bold">
                                        ₹
                                        {(
                                          item.lineTotal ||
                                          item.quantity * item.unitPrice
                                        ).toLocaleString("en-IN")}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr>
                                    <td
                                      colSpan={3}
                                      className="pt-3 text-right font-bold text-lg"
                                    >
                                      Total:
                                    </td>
                                    <td className="pt-3 text-right font-bold text-xl text-blue-600">
                                      ₹{inv.grandTotal.toLocaleString("en-IN")}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Transactions */}
                {data.recentTransactions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
                      <h3 className="font-bold text-lg">Recent Activity</h3>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      {data.recentTransactions
                        .slice(0, 5)
                        .map((t: any, i: number) => (
                          <div
                            key={i}
                            className={`flex items-center justify-between px-4 py-3 ${
                              i !== 0
                                ? "border-t border-gray-300 dark:border-gray-600"
                                : ""
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  t.type === "debit"
                                    ? "bg-red-100 text-red-600"
                                    : "bg-green-100 text-green-600"
                                }`}
                              >
                                {t.type === "debit" ? (
                                  <TrendingDown className="w-6 h-6" />
                                ) : (
                                  <TrendingUp className="w-6 h-6" />
                                )}
                              </div>
                              <div>
                                <p
                                  className={`font-bold text-lg ${
                                    t.type === "debit"
                                      ? "text-red-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {t.type === "debit" ? "- " : "+ "}₹
                                  {t.amount.toLocaleString("en-IN")}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {t.reference || t.invoice_no}
                                </p>
                              </div>
                            </div>
                            <div className="text-right text-xs">
                              <p className="font-medium">
                                {new Date(t.date).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </p>
                              <p className="text-gray-500">
                                ₹{t.balance.toLocaleString("en-IN")}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-5 py-3 flex justify-end gap-3">
            <button
              onClick={() => setIsOpen(false)}
              className="px-5 py-2.5 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 rounded-lg font-medium text-sm transition"
            >
              Close
            </button>
            <button
              onClick={handleCopyPhone}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition"
            >
              <Copy className="w-4 h-4" />
              Copy Phone
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

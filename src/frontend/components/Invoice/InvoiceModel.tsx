import {
  X,
  Printer,
  FileText,
  User,
  Package,
  CreditCard,
  History,
  StickyNote,
} from "lucide-react";
import { formatDateTime } from "@/frontend/helper/helper";
import { InvoiceData, Item, LedgerEntry } from "@/frontend/types/invoice";

interface InvoiceModalProps {
  selectedInvoice: InvoiceData | null;
  onClose: () => void;
}

export default function InvoiceModal({
  selectedInvoice,
  onClose,
}: InvoiceModalProps) {
  if (!selectedInvoice) return null;

  // payment
  const { invoice, items, paymentBreakdown, customer, ledger } =
    selectedInvoice;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-success/10 text-success";
      case "pending":
        return "bg-warning/10 text-warning";
      case "overdue":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return (
    <div
      className="fixed inset-0 bg-foreground/10 flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl shadow-modal w-full max-w-3xl max-h-[95vh] overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-primary-foreground">
                  #{invoice.invoiceNumber}
                </h2>
                <p className="text-xs text-primary-foreground/70">
                  {formatDateTime(invoice.date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  invoice.status
                )}`}
              >
                {invoice.status}
              </span>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-primary-foreground/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-primary-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto scroll-hide max-h-[calc(95vh-140px)] scrollbar-thin">
          <div className="p-4 sm:p-5 space-y-4">
            {/* Customer Details */}
            <section className="bg-secondary/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  Customer
                </h3>
              </div>
              {customer ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium text-foreground">
                      {customer.name || invoice.customerName || "N/A"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium text-foreground">
                      {customer.phone || invoice.customerPhone || "N/A"}
                    </span>
                  </div>
                  {customer.address && (
                    <div className="flex gap-2 col-span-full">
                      <span className="text-muted-foreground">Address:</span>
                      <span className="text-foreground">
                        {customer.address}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Walk-in Customer
                </p>
              )}
            </section>

            {/* Items Table */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  Items{" "}
                  <span className="font-normal text-muted-foreground">
                    ({items.length} items, {totalQty} qty)
                  </span>
                </h3>
              </div>
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
                        <th className="px-3 py-2 text-left font-medium">
                          Product
                        </th>
                        <th className="px-3 py-2 text-center font-medium">
                          Qty
                        </th>
                        <th className="px-3 py-2 text-right font-medium">
                          Rate
                        </th>
                        <th className="px-3 py-2 text-right font-medium">
                          GST
                        </th>
                        <th className="px-3 py-2 text-right font-medium">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {items.map((item: Item, index: number) => (
                        <tr
                          key={item.id || index}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-3 py-2">
                            <div className="font-medium text-foreground leading-tight">
                              {item.productName}
                            </div>
                            {(item.sku || item.hsnCode) && (
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {item.sku && <span>SKU: {item.sku}</span>}
                                {item.sku && item.hsnCode && (
                                  <span className="mx-1">•</span>
                                )}
                                {item.hsnCode && (
                                  <span>HSN: {item.hsnCode}</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center text-foreground">
                            {item.quantity}
                            {item.unit && (
                              <span className="text-muted-foreground text-xs ml-0.5">
                                {item.unit}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right text-foreground">
                            ₹{(item.unitPrice || 0).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground">
                            ₹{(item.gstAmount || 0).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-success">
                            ₹{(item.lineTotal || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Billing Summary */}
              <section className="bg-secondary/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Billing Summary
                  </h3>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">
                      ₹{invoice.subTotal?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>
                        Discount{" "}
                        {invoice.discountType && `(${invoice.discountType})`}
                      </span>
                      <span>-₹{invoice.discount?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST</span>
                    <span className="text-foreground">
                      ₹{invoice.gstAmount?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  {invoice.roundOff !== 0 && invoice.roundOff !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Round Off</span>
                      <span className="text-foreground">
                        ₹{invoice.roundOff?.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="pt-1.5 mt-1.5 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-foreground">
                        Grand Total
                      </span>
                      <span className="text-lg font-bold text-success">
                        ₹{invoice.grandTotal?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Payments */}
              <section className="bg-secondary/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Payments
                  </h3>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="text-success font-medium">
                      ₹{invoice.paidAmount?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due</span>
                    <span
                      className={`font-medium ${
                        invoice.dueAmount > 0
                          ? "text-destructive"
                          : "text-success"
                      }`}
                    >
                      ₹{invoice.dueAmount?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  {Object.entries(paymentBreakdown).length > 0 && (
                    <div className="pt-1.5 mt-1.5 border-t border-border space-y-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Breakdown
                      </span>
                      {Object.entries(paymentBreakdown).map(
                        ([mode, amount]) => (
                          <div
                            key={mode}
                            className="flex justify-between text-xs"
                          >
                            <span className="text-muted-foreground">
                              {mode}
                            </span>
                            <span className="text-foreground">
                              ₹{amount.toFixed(2)}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Ledger History */}
            {ledger.length > 0 && (
              <section className="bg-warning/5 border border-warning/20 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <History className="w-4 h-4 text-warning" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Payment History
                  </h3>
                </div>
                <div className="space-y-1.5">
                  {ledger.map((entry: LedgerEntry, index: number) => (
                    <div
                      key={entry.id || index}
                      className={`flex justify-between items-center px-2.5 py-1.5 rounded-lg text-sm ${
                        entry.type === "credit"
                          ? "bg-success/10"
                          : "bg-destructive/10"
                      }`}
                    >
                      <span className="text-foreground">
                        <span
                          className={`font-medium ${
                            entry.type === "credit"
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        >
                          {entry.type.toUpperCase()}
                        </span>
                        <span className="text-muted-foreground ml-1.5">
                          • {entry.reference}
                        </span>
                      </span>
                      <span
                        className={
                          entry.type === "credit"
                            ? "text-success"
                            : "text-destructive"
                        }
                      >
                        ₹{entry.amount.toFixed(2)}
                        <span className="text-muted-foreground text-xs ml-1">
                          (Bal: ₹{entry.balance.toFixed(2)})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Notes */}
            {(invoice.notes || invoice.footerMessage) && (
              <section className="space-y-2">
                {invoice.notes && (
                  <div className="bg-accent/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <StickyNote className="w-4 h-4 text-accent-foreground" />
                      <h3 className="text-sm font-semibold text-foreground">
                        Notes
                      </h3>
                    </div>
                    <p className="text-sm text-foreground">{invoice.notes}</p>
                  </div>
                )}
                {invoice.footerMessage && (
                  <p className="text-center text-sm italic text-muted-foreground px-3">
                    {invoice.footerMessage}
                  </p>
                )}
              </section>
            )}

            {/* Footer Info */}
            <div className="flex justify-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
              <span>Cashier: {invoice.cashierName || "N/A"}</span>
              <span>•</span>
              <span>Store: {invoice.storeId}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-3 sm:px-5 border-t border-border bg-muted/30 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Close
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}

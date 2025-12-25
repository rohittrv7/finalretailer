import { useMemo, useState } from "react";
import {
  Receipt,
  X,
  Plus,
  Trash2,
  CreditCard,
  Wallet,
  Smartphone,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";
import { StoreInfo } from "../types/storeSetting";

type CartRow = {
  id?: string;
  inventoryId: string;
  productName: string;
  sku?: string;
  unit?: string;
  sellingPrice: number;
  quantity: number;
  hsnCode?: string | null;
  gstRate?: number;
  isGstIncluded?: boolean | number;
  lineDiscount?: number;
  taxableAmount?: number;
  gstAmount?: number;
  lineTotal?: number;
};

export default function SaveInvoiceModal({
  open,
  onClose,
  cartItems,
  storeInfo,
  cashierName,
}: {
  open: boolean;
  onClose: () => void;
  cartItems: CartRow[];
  storeInfo?: StoreInfo;
  cashierName?: string;
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentLines, setPaymentLines] = useState<
    { mode: string; amount: number; ref?: string }[]
  >([{ mode: "Cash", amount: 0 }]);
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [invoiceDiscountType, setInvoiceDiscountType] = useState<
    "flat" | "percent"
  >("flat");
  const [notes, setNotes] = useState("");
  const [footerMessage, setFooterMessage] = useState("Thank you!");
  const [transport, setTransport] = useState({
    vehicleNo: "",
    lrNumber: "",
    transportName: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  // calculate per-line totals (same logic as main)
  const computedLines = useMemo(() => {
    return cartItems.map((r) => {
      const unitPrice = Number(r.sellingPrice || 0);
      const qty = Number(r.quantity || 1);
      const gstRate = Number(r.gstRate || 0);
      const isIncluded = r.isGstIncluded === 1 || r.isGstIncluded === true;
      const lineDiscount = Number(r.lineDiscount || 0);

      // price after discount per unit
      const priceAfterDiscount = unitPrice - lineDiscount;
      let unitTaxable = 0;
      let unitGST = 0;
      if (!gstRate) {
        unitTaxable = priceAfterDiscount;
        unitGST = 0;
      } else if (isIncluded) {
        unitTaxable = priceAfterDiscount / (1 + gstRate / 100);
        unitGST = priceAfterDiscount - unitTaxable;
      } else {
        unitTaxable = priceAfterDiscount;
        unitGST = (unitTaxable * gstRate) / 100;
      }

      const taxable = +(unitTaxable * qty).toFixed(2);
      const gstAmount = +(unitGST * qty).toFixed(2);
      const lineTotal = +(taxable + gstAmount).toFixed(2);

      return { ...r, taxableAmount: taxable, gstAmount, lineTotal };
    });
  }, [cartItems]);

  const subtotal = useMemo(
    () => computedLines.reduce((s, l) => s + (l.lineTotal || 0), 0),
    [computedLines]
  );

  const itemDiscount = useMemo(
    () =>
      computedLines.reduce(
        (s, l) => s + (l.lineDiscount || 0) * (l.quantity || 1),
        0
      ),
    [computedLines]
  );

  const gstTotal = useMemo(
    () => computedLines.reduce((s, l) => s + (l.gstAmount || 0), 0),
    [computedLines]
  );

  const invoiceDiscountAmount = useMemo(() => {
    if (!invoiceDiscount) return 0;
    if (invoiceDiscountType === "percent") {
      return parseFloat((subtotal * (invoiceDiscount / 100)).toFixed(2));
    }
    return parseFloat(Number(invoiceDiscount || 0).toFixed(2));
  }, [subtotal, invoiceDiscount, invoiceDiscountType]);

  const totalBeforeRound = subtotal - invoiceDiscountAmount;
  const roundedTotal = Math.round(totalBeforeRound);
  const roundOff = parseFloat((roundedTotal - totalBeforeRound).toFixed(2));
  const grandTotal = parseFloat(roundedTotal.toFixed(2));

  // Total qty & items
  const totalQty = useMemo(
    () => computedLines.reduce((s, l) => s + (l.quantity || 0), 0),
    [computedLines]
  );
  const totalItems = computedLines.length;

  // payments handling
  function updatePayment(
    index: number,
    delta: Partial<{ mode: string; amount: number; ref?: string }>
  ) {
    const p = [...paymentLines];
    p[index] = { ...p[index], ...delta };
    setPaymentLines(p);
  }

  function addPaymentLine() {
    setPaymentLines([...paymentLines, { mode: "UPI", amount: 0 }]);
  }

  function removePaymentLine(i: number) {
    const p = paymentLines.filter((_, idx) => idx !== i);
    setPaymentLines(p.length ? p : [{ mode: "Cash", amount: 0 }]);
  }

  const totalPaid = paymentLines.reduce((s, p) => s + Number(p.amount || 0), 0);

  const dueAmount = Math.max(grandTotal - totalPaid, 0);
  // const changeReturn = Math.max(totalPaid - grandTotal, 0);

  const paymentStatus = dueAmount > 0 ? "Due" : "Paid";
  // const totalPaid = paymentLines.reduce((s, p) => s + Number(p.amount || 0), 0);
  const changeReturn = +(totalPaid - grandTotal).toFixed(2);

  // Check if all payment lines have amount entered
  const hasEmptyPayment = paymentLines.some((p) => !p.amount || p.amount <= 0);

  // If due amount exists (not fully paid), customer details are mandatory
  const isDuePayment = dueAmount > 0;
  const hasCustomerDetails =
    customerName.trim() && customerPhone.trim() && billingAddress.trim();
  const showCustomerError = isDuePayment && !hasCustomerDetails && isSubmitted;

  const isSaveDisabled = hasEmptyPayment || !cartItems.length;

  async function handleSaveAndPrint() {
    setIsSubmitted(true);

    if (!cartItems.length) {
      toast.error("Cart is empty");
      return;
    }

    if (hasEmptyPayment) {
      toast.error("Please enter amounts for all payment methods");
      return;
    }

    if (isDuePayment && !hasCustomerDetails) {
      toast.error(
        "Customer details including name, phone, and billing address are required for due payments."
      );
      return;
    }

    // prepare payload
    const payload = {
      cartItems: computedLines.map((l) => ({
        inventoryId: l.inventoryId,
        productName: l.productName,
        sku: l.sku,
        unit: l.unit,
        quantity: l.quantity,
        unitPrice: l.sellingPrice,
        hsnCode: l.hsnCode || null,
        gstRate: l.gstRate || 0,
        isGstIncluded: l.isGstIncluded ? 1 : 0,
        lineDiscount: l.lineDiscount || 0,
      })),
      customerName,
      customerPhone,
      billingAddress,
      shippingAddress,
      transportDetails: transport,
      payments: paymentLines,
      discountType: invoiceDiscountType,
      discountValue: invoiceDiscountAmount,
      cashierName: cashierName || null,
      storeId: storeInfo?.id || "1",
      applyGST: storeInfo?.isGstEnabled === 1 || !!storeInfo?.gstNumber,
      roundOff: true,
      notes,
      footerMessage,
      paidAmount: totalPaid,
      dueAmount: changeReturn,
      paymentStatus,
    };

    // create invoice
    const res = await window.electronAPI.invoice.create(payload);

    if (!res?.success) {
      toast.error(res?.error || "Failed to save invoice");
      return;
    }
    toast.success(`Invoice saved: ${res.invoiceNumber}`);

    // // get print HTML
    // const printRes = await window.electronAPI.invoice.print(res.invoiceId);
    // if (printRes?.success && printRes.data) {
    //   // you can either open a print window OR send to printer API
    //   // here we open a hidden print window in renderer and call window.print()
    //   const w = window.open("", "_blank", "width=600,height=800");
    //   if (w) {
    //     w.document.write(printRes.data);
    //     w.document.close();
    //     w.focus();
    //     setTimeout(() => {
    //       w.print();
    //       w.close();
    //     }, 600);
    //   } else {
    //     toast.error("Unable to open print window");
    //   }
    // }

    onClose();
  }

  const getPaymentIcon = (mode: string) => {
    switch (mode) {
      case "Cash":
        return <Banknote className="w-4 h-4" />;
      case "Card":
        return <CreditCard className="w-4 h-4" />;
      case "UPI":
        return <Smartphone className="w-4 h-4" />;
      case "Wallet":
        return <Wallet className="w-4 h-4" />;
      default:
        return <Banknote className="w-4 h-4" />;
    }
  };

  const getCustomerInputClass = () => {
    let baseClass =
      "w-full px-4 py-2.5 rounded-lg border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm";
    if (showCustomerError) {
      baseClass +=
        " border-destructive focus:border-destructive focus:ring-destructive/20";
    } else {
      baseClass += " border-input";
    }
    return baseClass;
  };

  const getBillingInputClass = () => {
    let baseClass =
      "w-full px-4 py-2.5 rounded-lg border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none";
    if (showCustomerError) {
      baseClass +=
        " border-destructive focus:border-destructive focus:ring-destructive/20";
    } else {
      baseClass += " border-input";
    }
    return baseClass;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-7xl bg-background rounded-2xl shadow-2xl overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Receipt className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                Complete Payment
              </h3>
              <p className="text-sm text-muted-foreground">
                Save invoice and print receipt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 scroll-hide lg:grid-cols-5 gap-6 p-6 max-h-[calc(80vh-200px)] overflow-y-auto">
          {/* Left: Form Section (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Customer Details Card */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                Customer Details{" "}
                {isDuePayment && (
                  <span className="text-destructive text-xs font-normal">
                    (Mandatory for due payments)
                  </span>
                )}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Customer Name {isDuePayment && "*"}
                  </label>
                  <input
                    placeholder="Enter name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={getCustomerInputClass()}
                  />
                  {showCustomerError && !customerName.trim() && (
                    <p className="text-xs text-destructive mt-1">
                      Customer name is required for due payments.
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Phone Number {isDuePayment && "*"}
                  </label>
                  <input
                    placeholder="Enter phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className={getCustomerInputClass()}
                  />
                  {showCustomerError && !customerPhone.trim() && (
                    <p className="text-xs text-destructive mt-1">
                      Customer phone is required for due payments.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Billing Address {isDuePayment && "*"}
                  </label>
                  <textarea
                    placeholder="Enter billing address"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    rows={3}
                    className={getBillingInputClass()}
                  />
                  {showCustomerError && !billingAddress.trim() && (
                    <p className="text-xs text-destructive mt-1">
                      Billing address is required for due payments.
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Shipping Address (Optional)
                  </label>
                  <textarea
                    placeholder="Enter shipping address"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Transport Details Card */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                Transport Details (Optional)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Transport Name
                  </label>
                  <input
                    placeholder="Enter name"
                    value={transport.transportName}
                    onChange={(e) =>
                      setTransport({
                        ...transport,
                        transportName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Vehicle Number
                  </label>
                  <input
                    placeholder="Enter vehicle no"
                    value={transport.vehicleNo}
                    onChange={(e) =>
                      setTransport({ ...transport, vehicleNo: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    LR Number
                  </label>
                  <input
                    placeholder="Enter LR no"
                    value={transport.lrNumber}
                    onChange={(e) =>
                      setTransport({ ...transport, lrNumber: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Discount & Notes Card */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                Additional Details
              </h4>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Invoice Discount
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={invoiceDiscount || ""}
                      onChange={(e) =>
                        setInvoiceDiscount(Number(e.target.value) || 0)
                      }
                      placeholder="0"
                      className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                    />
                    <select
                      value={invoiceDiscountType}
                      onChange={(e) =>
                        setInvoiceDiscountType(e.target.value as any)
                      }
                      className="px-4 py-2.5 rounded-lg border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm min-w-[120px]"
                    >
                      <option value="flat">Flat (₹)</option>
                      <option value="percent">Percent (%)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Add any notes or special instructions"
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Footer Message
                  </label>
                  <input
                    value={footerMessage}
                    onChange={(e) => setFooterMessage(e.target.value)}
                    placeholder="Thank you message"
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Summary Section (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bill Summary Card */}
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-border rounded-xl p-5 shadow-sm">
              <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-success rounded-full"></div>
                Bill Summary
              </h4>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Total Items</span>
                  <span className="font-semibold text-foreground">
                    {totalItems}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Total Quantity</span>
                  <span className="font-semibold text-foreground">
                    {totalQty}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold text-foreground">
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>

                {itemDiscount > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-success">Item Discount</span>
                    <span className="font-semibold text-success">
                      -₹{itemDiscount.toFixed(2)}
                    </span>
                  </div>
                )}

                {invoiceDiscountAmount > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-success">Invoice Discount</span>
                    <span className="font-semibold text-success">
                      -₹{invoiceDiscountAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">GST Total</span>
                  <span className="font-semibold text-foreground">
                    ₹{gstTotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-warning">Round Off</span>
                  <span className="font-semibold text-warning">
                    ₹{roundOff.toFixed(2)}
                  </span>
                </div>

                <div className="pt-3 mt-3 border-t-2 border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-foreground">
                      Grand Total
                    </span>
                    <span className="text-2xl font-black text-success">
                      ₹{grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods Card */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                Payment Methods
              </h4>

              <div className="space-y-3">
                {paymentLines.map((p, idx) => (
                  <div key={idx} className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {getPaymentIcon(p.mode)}
                      </div>
                      <select
                        value={p.mode}
                        onChange={(e) =>
                          updatePayment(idx, { mode: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm appearance-none"
                      >
                        <option>Cash</option>
                        <option>Card</option>
                        <option>UPI</option>
                        <option>Wallet</option>
                      </select>
                    </div>
                    <input
                      type="number"
                      value={p.amount || ""}
                      onChange={(e) =>
                        updatePayment(idx, {
                          amount: Number(e.target.value) || 0,
                        })
                      }
                      placeholder="Amount"
                      className="w-28 px-4 py-2.5 rounded-lg border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                    />
                    <input
                      placeholder="Ref#"
                      value={p.ref || ""}
                      onChange={(e) =>
                        updatePayment(idx, { ref: e.target.value })
                      }
                      className="w-24 px-3 py-2.5 rounded-lg border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                    />
                    <button
                      onClick={() => removePaymentLine(idx)}
                      className="p-2.5 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-colors"
                      aria-label="Remove payment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addPaymentLine}
                className="mt-3 w-full py-2.5 px-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Payment Method
              </button>

              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Total Paid</span>
                  <span className="font-semibold text-foreground">
                    ₹{totalPaid.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">
                    Due:
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      changeReturn >= 0 ? "text-success" : "text-destructive"
                    }`}
                  >
                    ₹{changeReturn.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 border-2 border-border hover:bg-muted rounded-lg transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                disabled={isSaveDisabled}
                onClick={handleSaveAndPrint}
                className="flex-1 py-3 px-4 rounded-lg transition-all font-semibold text-sm shadow-lg
           bg-success cursor-pointer hover:bg-success/90 text-success-foreground shadow-success/20
           disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed disabled:opacity-70"
              >
                Save & Print
              </button>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="p-6 border-t border-border bg-gradient-to-br from-muted/30 to-muted/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              <h4 className="text-lg font-bold text-foreground">
                Invoice Items
              </h4>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg font-medium">
                {totalItems} item{totalItems !== 1 ? "s" : ""}
              </span>
              <span className="px-3 py-1.5 bg-accent/10 text-accent-foreground rounded-lg font-medium">
                {totalQty} qty
              </span>
            </div>
          </div>

          <div className="overflow-auto max-h-64 rounded-xl border border-border/50 bg-background shadow-sm">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm border-b border-border/50 z-10">
                <tr className="text-left">
                  <th className="px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider min-w-[180px]">
                    Product
                  </th>
                  <th className="px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-center">
                    HSN
                  </th>
                  <th className="px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-center">
                    Qty
                  </th>
                  <th className="px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right">
                    Rate
                  </th>
                  <th className="px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right">
                    Disc
                  </th>
                  <th className="px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right">
                    Taxable
                  </th>
                  <th className="px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right">
                    GST
                  </th>
                  <th className="px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {computedLines.map((it, i) => (
                  <tr
                    key={i}
                    className="hover:bg-muted/20 transition-colors group"
                  >
                    <td className="px-4 py-3.5 text-muted-foreground font-medium">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {it.productName}
                      </div>
                      {it.sku && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          SKU: {it.sku}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center text-muted-foreground font-mono text-xs">
                      {it.hsnCode || (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-md font-semibold">
                        {it.quantity}
                        {it.unit && (
                          <span className="text-xs opacity-70">{it.unit}</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-foreground">
                      ₹{(+it.sellingPrice).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-success">
                      {(+it.lineDiscount || 0) > 0 ? (
                        `-₹${(+it.lineDiscount || 0).toFixed(2)}`
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-foreground">
                      ₹{(+it.taxableAmount || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-primary">
                      ₹{(+it.gstAmount || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-foreground text-base">
                      ₹{(+it.lineTotal || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

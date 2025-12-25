export const generateSKU = () => {
  // simple SKU generator: PROD- + timestamp + random
  return `PROD-${Date.now().toString().slice(-6)}-${Math.floor(
    Math.random() * 900 + 100
  )}`;
};

export function calculateGSTForUnit(
  sellingPrice: number,
  gstRate: number,
  isGstIncluded: boolean,
  applyGST: boolean
) {
  const rate = Number(gstRate) || 0;

  if (!applyGST || rate === 0) {
    return {
      taxable: parseFloat(sellingPrice.toFixed(2)),
      gstAmount: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      finalPrice: parseFloat(sellingPrice.toFixed(2)),
    };
  }

  let taxable: number;
  let gstAmount: number;

  if (isGstIncluded) {
    taxable = sellingPrice / (1 + rate / 100);
    gstAmount = sellingPrice - taxable;
  } else {
    taxable = sellingPrice;
    gstAmount = (taxable * rate) / 100;
  }

  // Split GST: 50% CGST + 50% SGST (default intrastate)
  const cgst = parseFloat((gstAmount / 2).toFixed(2));
  const sgst = parseFloat((gstAmount / 2).toFixed(2));
  const igst = 0; // Abhi default 0, interstate logic laga sakte ho agar required

  return {
    taxable: parseFloat(taxable.toFixed(2)),
    gstAmount: parseFloat(gstAmount.toFixed(2)),
    finalPrice: parseFloat((taxable + gstAmount).toFixed(2)),
    cgst,
    sgst,
    igst,
  };
}

// export function updateItemCalculations(item: CartItem, gstPercent: number) {
//     const price = Number(item.sellingPrice);

//     const totalPrice = price * item.quantity;

//     const taxable = totalPrice / (1 + gstPercent / 100);
//     const gstAmount = totalPrice - taxable;

//     return {
//         ...item,
//         totalPrice,
//         taxableAmount: taxable,
//         gstAmount,
//     };
// }

export interface GSTTotals {
  taxable: number;
  gstAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export function calculateTotals(
  sellingPrice: string | number,
  qty: number,
  gstRate: number,
  isGstIncluded: boolean
): GSTTotals {
  const rate = Number(gstRate) || 0;

  let taxable = 0;
  let gstAmount = 0;
  const price =
    typeof sellingPrice === "string" ? parseFloat(sellingPrice) : sellingPrice;

  if (isGstIncluded) {
    taxable = price / (1 + rate / 100);
    gstAmount = price - taxable;
  } else {
    taxable = price;
    gstAmount = (price * rate) / 100;
  }

  const finalTaxable = taxable * qty;
  const finalGST = gstAmount * qty;

  return {
    taxable: parseFloat(finalTaxable.toFixed(2)),
    gstAmount: parseFloat(finalGST.toFixed(2)),
    cgst: parseFloat((finalGST / 2).toFixed(2)),
    sgst: parseFloat((finalGST / 2).toFixed(2)),
    igst: 0,
    total: parseFloat((finalTaxable + finalGST).toFixed(2)),
  };
}

// export function validatePayments(paymentLines, grandTotal) {
//   if (!paymentLines.length) {
//     return { ok: false, error: "Add at least 1 payment mode" };
//   }

//   for (const p of paymentLines) {
//     if (!p.mode) return { ok: false, error: "Select payment mode" };

//     if (!p.amount || p.amount <= 0)
//       return { ok: false, error: "Enter valid amount" };

//     // Ref validation
//     if (["UPI", "Card", "Wallet"].includes(p.mode) && !p.ref?.trim()) {
//       return { ok: false, error: `${p.mode} reference required` };
//     }
//   }

//   const totalPaid = paymentLines.reduce((a, b) => a + (b.amount || 0), 0);

//   const change = totalPaid - grandTotal;

//   return { ok: true, totalPaid, change };
// }

export function formatDateTime(isoString: string): string {
  const date: Date = new Date(isoString);

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  };

  return date.toLocaleDateString("en-GB", options);
}

// Random unique barcode generate karne ka function
export const generateRandomBarcode = (length: number = 12): string => {
  // EAN13 ke liye 13 digits chahiye (last digit check digit hota hai)
  // Ya CODE128 ke liye flexible – hum 12-13 digits ka bana rahe hain
  let barcode = "";
  for (let i = 0; i < length; i++) {
    barcode += Math.floor(Math.random() * 10);
  }

  if (length === 12) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(barcode[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    barcode += checkDigit;
  }

  return barcode;
};

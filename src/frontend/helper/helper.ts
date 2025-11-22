import { CartItem } from "../types/cart";

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
    const price = typeof sellingPrice === "string" ? parseFloat(sellingPrice) : sellingPrice;

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

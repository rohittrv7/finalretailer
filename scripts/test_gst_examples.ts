import { calculateBillGst } from '../db/gstCalculator'

console.log('================================================================');
console.log('WORKED GST CALCULATION EXAMPLES (INDIAN RETAIL POS COMPLIANT)');
console.log('================================================================\n');

// Example 1: Single-Item Bill (Inclusive: ₹118 @ 18% GST vs Exclusive: ₹100 @ 18% GST)
console.log('----------------------------------------------------------------');
console.log('EXAMPLE 1: Single-Item Bill');
console.log('----------------------------------------------------------------');

const ex1Inclusive = calculateBillGst([
  {
    productId: 1,
    productName: 'Shampoo 200ml',
    sku: 'SHAMP-200',
    hsnCode: '3305',
    qty: 1,
    unitPrice: 118,
    gstRate: 18,
  }
], { pricingMode: 'INCLUSIVE' })

console.log('1A. GST-INCLUSIVE (Shelf Price = ₹118.00, GST = 18%):');
console.log(`   - Taxable Base Value : ₹${ex1Inclusive.taxableSubtotal.toFixed(2)}  (₹118 ÷ 1.18)`);
console.log(`   - CGST (9%)          : ₹${ex1Inclusive.totalCgst.toFixed(2)}`);
console.log(`   - SGST (9%)          : ₹${ex1Inclusive.totalSgst.toFixed(2)}`);
console.log(`   - Total Tax          : ₹${ex1Inclusive.totalTax.toFixed(2)}`);
console.log(`   - Grand Total        : ₹${ex1Inclusive.grandTotal.toFixed(2)}`);

const ex1Exclusive = calculateBillGst([
  {
    productId: 1,
    productName: 'Shampoo 200ml',
    sku: 'SHAMP-200',
    hsnCode: '3305',
    qty: 1,
    unitPrice: 100,
    gstRate: 18,
  }
], { pricingMode: 'EXCLUSIVE' })

console.log('\n1B. GST-EXCLUSIVE (Shelf Price = ₹100.00, GST = 18% added on top):');
console.log(`   - Taxable Base Value : ₹${ex1Exclusive.taxableSubtotal.toFixed(2)}`);
console.log(`   - CGST (9%)          : ₹${ex1Exclusive.totalCgst.toFixed(2)}`);
console.log(`   - SGST (9%)          : ₹${ex1Exclusive.totalSgst.toFixed(2)}`);
console.log(`   - Total Tax          : ₹${ex1Exclusive.totalTax.toFixed(2)}`);
console.log(`   - Grand Total        : ₹${ex1Exclusive.grandTotal.toFixed(2)}`);

// Example 2: Multi-Item Bill with Mixed GST Rates (5%, 12%, 18%)
console.log('\n----------------------------------------------------------------');
console.log('EXAMPLE 2: Multi-Item Bill with Mixed GST Rates (Inclusive Mode)');
console.log('----------------------------------------------------------------');

const ex2Mixed = calculateBillGst([
  {
    productId: 1,
    productName: 'Atta 5kg (GST 5%)',
    hsnCode: '1101',
    qty: 2,
    unitPrice: 50, // 2 x 50 = ₹100
    gstRate: 5,
  },
  {
    productId: 2,
    productName: 'Butter 500g (GST 12%)',
    hsnCode: '0405',
    qty: 1,
    unitPrice: 224, // 1 x 224 = ₹224
    gstRate: 12,
  },
  {
    productId: 3,
    productName: 'Toothpaste 150g (GST 18%)',
    hsnCode: '3306',
    qty: 1,
    unitPrice: 118, // 1 x 118 = ₹118
    gstRate: 18,
  }
], { pricingMode: 'INCLUSIVE' })

console.log(`Items Total (Payable): ₹${ex2Mixed.unroundedTotal.toFixed(2)}`);
console.log(`Taxable Subtotal     : ₹${ex2Mixed.taxableSubtotal.toFixed(2)}`);
console.log(`Total CGST           : ₹${ex2Mixed.totalCgst.toFixed(2)}`);
console.log(`Total SGST           : ₹${ex2Mixed.totalSgst.toFixed(2)}`);
console.log(`Total Tax            : ₹${ex2Mixed.totalTax.toFixed(2)}`);
console.log(`Round Off            : ₹${ex2Mixed.roundOff.toFixed(2)}`);
console.log(`Grand Total          : ₹${ex2Mixed.grandTotal.toFixed(2)}`);

console.log('\nRate Slab Breakdown:');
ex2Mixed.rateBreakup.forEach(s => {
  console.log(`   - GST @${s.gstRate}% : Taxable ₹${s.taxableValue.toFixed(2)} | CGST (${s.cgstRate}%): ₹${s.cgstAmount.toFixed(2)} | SGST (${s.sgstRate}%): ₹${s.sgstAmount.toFixed(2)} | Total: ₹${s.totalTax.toFixed(2)}`)
})

console.log('\nHSN Statutory Summary:');
ex2Mixed.hsnSummary.forEach(h => {
  console.log(`   - HSN ${h.hsnCode.padEnd(6)}: Taxable ₹${h.taxableValue.toFixed(2)} | CGST: ₹${h.cgstAmount.toFixed(2)} | SGST: ₹${h.sgstAmount.toFixed(2)} | Total Tax: ₹${h.totalTax.toFixed(2)}`)
})

// Example 3: Multi-Item Bill with Overall Bill-Level Discount
console.log('\n----------------------------------------------------------------');
console.log('EXAMPLE 3: Multi-Item Bill with Overall Bill Discount (₹42.00 off)');
console.log('----------------------------------------------------------------');

const ex3Discounted = calculateBillGst([
  {
    productId: 1,
    productName: 'Atta 5kg (GST 5%)',
    hsnCode: '1101',
    qty: 2,
    unitPrice: 50,
    gstRate: 5,
  },
  {
    productId: 2,
    productName: 'Butter 500g (GST 12%)',
    hsnCode: '0405',
    qty: 1,
    unitPrice: 224,
    gstRate: 12,
  },
  {
    productId: 3,
    productName: 'Toothpaste 150g (GST 18%)',
    hsnCode: '3306',
    qty: 1,
    unitPrice: 118,
    gstRate: 18,
  }
], { pricingMode: 'INCLUSIVE', billDiscount: 42 })

console.log(`Original Payable     : ₹${ex3Discounted.grossSubtotal.toFixed(2)}`);
console.log(`Bill Discount Applied: -₹${ex3Discounted.billDiscount.toFixed(2)}`);
console.log(`Net Taxable Base     : ₹${ex3Discounted.taxableSubtotal.toFixed(2)}`);
console.log(`Recalculated CGST    : ₹${ex3Discounted.totalCgst.toFixed(2)}`);
console.log(`Recalculated SGST    : ₹${ex3Discounted.totalSgst.toFixed(2)}`);
console.log(`Recalculated TotalTax: ₹${ex3Discounted.totalTax.toFixed(2)}`);
console.log(`Net Grand Total      : ₹${ex3Discounted.grandTotal.toFixed(2)} (Exactly ₹442.00 - ₹42.00 = ₹400.00)`);

console.log('\nDiscounted Rate Slab Breakdown:');
ex3Discounted.rateBreakup.forEach(s => {
  console.log(`   - GST @${s.gstRate}% : Taxable ₹${s.taxableValue.toFixed(2)} | CGST: ₹${s.cgstAmount.toFixed(2)} | SGST: ₹${s.sgstAmount.toFixed(2)} | Total: ₹${s.totalTax.toFixed(2)}`)
})

console.log('\nDiscounted HSN Summary:');
ex3Discounted.hsnSummary.forEach(h => {
  console.log(`   - HSN ${h.hsnCode.padEnd(6)}: Taxable ₹${h.taxableValue.toFixed(2)} | CGST: ₹${h.cgstAmount.toFixed(2)} | SGST: ₹${h.sgstAmount.toFixed(2)} | Total Tax: ₹${h.totalTax.toFixed(2)}`)
})

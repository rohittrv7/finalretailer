import {
  calculateBillGst,
  TaxPricingMode,
  RawLineItemInput,
  GstRateBreakup,
  HsnSummaryRow,
  round2,
} from '../../../db/gstCalculator'

export type DiscountType = 'percent' | 'flat'
export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'CREDIT' | 'SPLIT'

export interface BillLineItem {
  id: string | number
  productId: number
  name: string
  sku?: string | null
  hsnCode?: string | null
  unit: string
  stockQty: number
  unitPrice: number
  mrp: number
  qty: number
  discountType: DiscountType
  discountValue: number
  gstRate: number // 0, 5, 12, 18, 28
}

export interface CalculatedLineItem extends BillLineItem {
  baseAmount: number // unitPrice * qty
  discountAmount: number
  taxableAmount: number // Base value on which GST is levied
  taxAmount: number
  cgstAmount: number
  sgstAmount: number
  lineTotal: number
}

export interface GstSlabBreakdown {
  rate: number
  taxableAmount: number
  cgst: number
  sgst: number
  totalTax: number
}

export interface BillCalculationResult {
  taxPricingMode: TaxPricingMode
  items: CalculatedLineItem[]
  rawSubtotal: number
  totalItemDiscount: number
  netTaxableBeforeBillDiscount: number
  billDiscountType: 'percent' | 'flat'
  billDiscountValue: number
  billDiscountAmount: number
  netTaxableAmount: number
  gstBreakdown: GstSlabBreakdown[]
  hsnSummary: HsnSummaryRow[]
  totalCgst: number
  totalSgst: number
  totalTax: number
  unroundedTotal: number
  roundOff: number
  grandTotal: number
  amountPaid: number
  amountDue: number
  changeDue: number
}

/**
 * Single source of truth calculation function for retail billing.
 * Computes line-item discounts, GST tax slabs, CGST/SGST splits, bill-level discounts,
 * round-off adjustments, and baki (due) balance using the unified GST engine.
 */
export function calculateBill(params: {
  items: BillLineItem[]
  billDiscountType: 'percent' | 'flat'
  billDiscountValue: number
  roundOffEnabled: boolean
  pricingMode?: TaxPricingMode
  paymentMode?: PaymentMode
  amountPaidInput?: number | null
  cashTenderedInput?: number
}): BillCalculationResult {
  const {
    items,
    billDiscountType,
    billDiscountValue,
    roundOffEnabled,
    pricingMode = 'INCLUSIVE',
    paymentMode = 'CASH',
    amountPaidInput,
    cashTenderedInput = 0,
  } = params

  // 1. Prepare raw inputs for the unified GST engine
  const rawInputs: RawLineItemInput[] = items.map((item) => ({
    productId: item.productId,
    productName: item.name,
    sku: item.sku,
    hsnCode: item.hsnCode,
    unit: item.unit,
    qty: item.qty,
    unitPrice: item.unitPrice,
    mrp: item.mrp,
    gstRate: item.gstRate,
    discountType: item.discountType,
    discountValue: item.discountValue,
  }))

  // 2. Pre-calculate provisional total to evaluate percentage bill discount
  let provisionalBaseTotal = 0
  for (const item of items) {
    const gross = (Number(item.unitPrice) || 0) * (Number(item.qty) || 0)
    let disc = 0
    if (item.discountType === 'percent') {
      disc = (gross * Math.min(100, Math.max(0, Number(item.discountValue) || 0))) / 100
    } else {
      disc = Math.min(gross, Math.max(0, Number(item.discountValue) || 0))
    }
    provisionalBaseTotal += Math.max(0, gross - disc)
  }

  let flatBillDiscount = 0
  if (billDiscountType === 'percent') {
    const pct = Math.min(100, Math.max(0, Number(billDiscountValue) || 0))
    flatBillDiscount = round2((provisionalBaseTotal * pct) / 100)
  } else {
    flatBillDiscount = Math.min(provisionalBaseTotal, Math.max(0, Number(billDiscountValue) || 0))
  }

  // 3. Execute authoritative Indian GST calculation
  const gstResult = calculateBillGst(rawInputs, {
    pricingMode,
    billDiscount: flatBillDiscount,
    enableRoundOff: roundOffEnabled,
  })

  // 4. Map calculated items back with UI metadata
  const calculatedItems: CalculatedLineItem[] = gstResult.items.map((ci, idx) => {
    const original = items[idx]
    return {
      ...original,
      qty: ci.qty,
      unitPrice: ci.unitPrice,
      mrp: ci.mrp,
      baseAmount: ci.grossAmount,
      discountAmount: ci.itemDiscount,
      taxableAmount: ci.finalTaxableValue,
      taxAmount: ci.totalGst,
      cgstAmount: ci.cgstAmount,
      sgstAmount: ci.sgstAmount,
      lineTotal: ci.lineTotal,
    }
  })

  // 5. Convert rate slabs for UI breakdown
  const gstBreakdown: GstSlabBreakdown[] = gstResult.rateBreakup.map((s: GstRateBreakup) => ({
    rate: s.gstRate,
    taxableAmount: s.taxableValue,
    cgst: s.cgstAmount,
    sgst: s.sgstAmount,
    totalTax: s.totalTax,
  }))

  const grandTotal = gstResult.grandTotal
  const cashTender = Math.max(0, Number(cashTenderedInput) || 0)

  // 6. Payment, due amount ("baki"), and change due
  let amountPaid = grandTotal
  if (paymentMode === 'CREDIT') {
    amountPaid = 0
  } else if (amountPaidInput !== undefined && amountPaidInput !== null) {
    amountPaid = Math.max(0, Math.min(grandTotal, Number(amountPaidInput) || 0))
  } else if (paymentMode === 'CASH' && cashTender > 0 && cashTender < grandTotal) {
    amountPaid = cashTender
  }
  amountPaid = round2(amountPaid)

  const amountDue = Math.max(0, round2(grandTotal - amountPaid))
  const changeDue = Math.max(0, round2(cashTender - grandTotal))

  return {
    taxPricingMode: pricingMode,
    items: calculatedItems,
    rawSubtotal: gstResult.grossSubtotal,
    totalItemDiscount: gstResult.totalItemDiscount,
    netTaxableBeforeBillDiscount: round2(provisionalBaseTotal),
    billDiscountType,
    billDiscountValue: Number(billDiscountValue) || 0,
    billDiscountAmount: gstResult.billDiscount,
    netTaxableAmount: gstResult.taxableSubtotal,
    gstBreakdown,
    hsnSummary: gstResult.hsnSummary,
    totalCgst: gstResult.totalCgst,
    totalSgst: gstResult.totalSgst,
    totalTax: gstResult.totalTax,
    unroundedTotal: gstResult.unroundedTotal,
    roundOff: gstResult.roundOff,
    grandTotal: gstResult.grandTotal,
    amountPaid,
    amountDue,
    changeDue,
  }
}


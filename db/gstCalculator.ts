/**
 * GST Calculation Engine for Indian Retail POS
 * 
 * Rules:
 * - Fixed slabs: 0%, 5%, 12%, 18%, 28%
 * - Intra-state sale (CGST = GST/2, SGST = GST/2)
 * - Supported Pricing Modes:
 *     - 'INCLUSIVE': Shelf/entered price already contains tax.
 *     - 'EXCLUSIVE': Tax is calculated and added on top of the entered price.
 * - Handles line-level discount and proportional bill-level discount.
 * - Slabs grouping (e.g. GST@5%, GST@12%, GST@18%)
 * - HSN-wise tax summary table for statutory GST compliance.
 * - Strict 2-decimal rounding with zero-paisa mismatch (CGST + SGST === Total Tax).
 */

export type TaxPricingMode = 'INCLUSIVE' | 'EXCLUSIVE'

export interface RawLineItemInput {
  productId: number
  productName: string
  sku?: string | null
  hsnCode?: string | null
  unit?: string | null
  qty: number
  unitPrice: number // Entered selling price
  mrp?: number | null
  gstRate: number // Slabs: 0, 5, 12, 18, 28
  discountType?: 'flat' | 'percent' // item-level discount type
  discountValue?: number // item-level discount value
}

export interface CalculatedLineItem {
  productId: number
  productName: string
  sku: string | null
  hsnCode: string
  unit: string
  qty: number
  unitPrice: number
  mrp: number
  gstRate: number
  cgstRate: number
  sgstRate: number
  grossAmount: number
  itemDiscount: number
  netAmount: number // grossAmount - itemDiscount
  allocatedBillDiscount: number
  finalTaxableValue: number // Base value on which GST is levied
  cgstAmount: number
  sgstAmount: number
  totalGst: number
  lineTotal: number // Final amount charged for this line
}

export interface GstRateBreakup {
  gstRate: number
  cgstRate: number
  sgstRate: number
  taxableValue: number
  cgstAmount: number
  sgstAmount: number
  totalTax: number
  totalGst: number
}

export interface HsnSummaryRow {
  hsnCode: string
  taxableValue: number
  cgstRate: number
  cgstAmount: number
  sgstRate: number
  sgstAmount: number
  totalTax: number
}

export interface BillCalculationResult {
  taxPricingMode: TaxPricingMode
  items: CalculatedLineItem[]
  grossSubtotal: number // Sum of gross amounts before any discounts
  totalItemDiscount: number // Sum of line-level discounts
  billDiscount: number // Overall bill discount applied
  totalDiscount: number // totalItemDiscount + billDiscount
  taxableSubtotal: number // Total taxable base value
  totalCgst: number
  totalSgst: number
  totalTax: number
  unroundedTotal: number
  roundOff: number
  grandTotal: number
  rateBreakup: GstRateBreakup[]
  hsnSummary: HsnSummaryRow[]
}

/** Standard 2-decimal currency rounding (0.5 rounds up) */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100
}

/**
 * Calculates complete Indian GST for a retail bill.
 */
export function calculateBillGst(
  items: RawLineItemInput[],
  options?: {
    pricingMode?: TaxPricingMode
    billDiscount?: number
    enableRoundOff?: boolean
  }
): BillCalculationResult {
  const pricingMode: TaxPricingMode = options?.pricingMode || 'INCLUSIVE'
  const billDiscount = Math.max(0, options?.billDiscount || 0)
  const enableRoundOff = options?.enableRoundOff ?? true

  if (!items || items.length === 0) {
    return {
      taxPricingMode: pricingMode,
      items: [],
      grossSubtotal: 0,
      totalItemDiscount: 0,
      billDiscount: 0,
      totalDiscount: 0,
      taxableSubtotal: 0,
      totalCgst: 0,
      totalSgst: 0,
      totalTax: 0,
      unroundedTotal: 0,
      roundOff: 0,
      grandTotal: 0,
      rateBreakup: [],
      hsnSummary: [],
    }
  }

  // Step 1: Calculate basic item totals and line-level discounts
  let totalGrossAmount = 0
  let totalItemDiscount = 0
  let totalPreBillDiscountAmount = 0 // sum of discounted amounts across items

  const preProcessedItems = items.map((raw) => {
    const qty = Math.max(0, Number(raw.qty) || 0)
    const unitPrice = Math.max(0, Number(raw.unitPrice) || 0)
    const mrp = Number(raw.mrp) || unitPrice
    const gstRate = Math.max(0, Number(raw.gstRate) || 0)
    const cgstRate = round2(gstRate / 2)
    const sgstRate = round2(gstRate / 2)

    const grossAmount = round2(qty * unitPrice)
    let itemDiscount = 0

    if (raw.discountType === 'percent') {
      const pct = Math.min(100, Math.max(0, Number(raw.discountValue) || 0))
      itemDiscount = round2(grossAmount * (pct / 100))
    } else {
      itemDiscount = Math.min(grossAmount, Math.max(0, Number(raw.discountValue) || 0))
    }

    const netAmount = Math.max(0, round2(grossAmount - itemDiscount))

    totalGrossAmount = round2(totalGrossAmount + grossAmount)
    totalItemDiscount = round2(totalItemDiscount + itemDiscount)
    totalPreBillDiscountAmount = round2(totalPreBillDiscountAmount + netAmount)

    return {
      raw,
      qty,
      unitPrice,
      mrp,
      gstRate,
      cgstRate,
      sgstRate,
      grossAmount,
      itemDiscount,
      netAmount,
    }
  })

  // Effective bill discount cannot exceed the available pre-bill discount sum
  const effectiveBillDiscount = Math.min(billDiscount, totalPreBillDiscountAmount)

  // Step 2: Proportionally allocate bill discount across items and calculate statutory GST
  let allocatedDiscountRunning = 0
  let runningCgstTotal = 0
  let runningSgstTotal = 0
  const calculatedItems: CalculatedLineItem[] = []

  preProcessedItems.forEach((item, index) => {
    const isLast = index === preProcessedItems.length - 1

    let allocatedBillDisc = 0
    if (effectiveBillDiscount > 0 && totalPreBillDiscountAmount > 0) {
      if (isLast) {
        allocatedBillDisc = round2(effectiveBillDiscount - allocatedDiscountRunning)
      } else {
        const proportion = item.netAmount / totalPreBillDiscountAmount
        allocatedBillDisc = round2(effectiveBillDiscount * proportion)
        allocatedDiscountRunning = round2(allocatedDiscountRunning + allocatedBillDisc)
      }
    }

    const effectiveChargedBase = Math.max(0, round2(item.netAmount - allocatedBillDisc))

    let taxableValue = 0
    let totalGst = 0
    let lineTotal = 0

    if (pricingMode === 'INCLUSIVE') {
      // Selling price already includes tax
      // Taxable Value = Amount / (1 + GST% / 100)
      if (item.gstRate === 0) {
        taxableValue = effectiveChargedBase
        totalGst = 0
      } else {
        taxableValue = round2(effectiveChargedBase / (1 + item.gstRate / 100))
        totalGst = round2(effectiveChargedBase - taxableValue)
      }
      lineTotal = effectiveChargedBase
    } else {
      // EXCLUSIVE: Selling price is taxable base, GST added on top
      taxableValue = effectiveChargedBase
      if (item.gstRate === 0) {
        totalGst = 0
      } else {
        totalGst = round2(taxableValue * (item.gstRate / 100))
      }
      lineTotal = round2(taxableValue + totalGst)
    }

    // Exact half-half split with balanced odd-paise tie-break
    let cgstAmount: number
    let sgstAmount: number
    const cents = Math.round(totalGst * 100)

    if (cents % 2 === 0) {
      cgstAmount = round2(totalGst / 2)
      sgstAmount = cgstAmount
    } else {
      const halfLower = Math.floor(cents / 2) / 100
      const halfHigher = Math.ceil(cents / 2) / 100

      if (runningCgstTotal > runningSgstTotal) {
        // CGST is currently higher, award extra paisa to SGST
        sgstAmount = halfHigher
        cgstAmount = halfLower
      } else {
        // SGST is equal or higher, award extra paisa to CGST
        cgstAmount = halfHigher
        sgstAmount = halfLower
      }
    }

    runningCgstTotal = round2(runningCgstTotal + cgstAmount)
    runningSgstTotal = round2(runningSgstTotal + sgstAmount)

    calculatedItems.push({
      productId: item.raw.productId,
      productName: item.raw.productName,
      sku: item.raw.sku ?? null,
      hsnCode: (item.raw.hsnCode && item.raw.hsnCode.trim()) || 'N/A',
      unit: (item.raw.unit && item.raw.unit.trim()) || 'pcs',
      qty: item.qty,
      unitPrice: item.unitPrice,
      mrp: item.mrp,
      gstRate: item.gstRate,
      cgstRate: item.cgstRate,
      sgstRate: item.sgstRate,
      grossAmount: item.grossAmount,
      itemDiscount: item.itemDiscount,
      netAmount: item.netAmount,
      allocatedBillDiscount: allocatedBillDisc,
      finalTaxableValue: taxableValue,
      cgstAmount,
      sgstAmount,
      totalGst,
      lineTotal,
    })
  })

  // Step 3: Aggregate totals
  let taxableSubtotal = 0
  let totalCgst = 0
  let totalSgst = 0
  let totalTax = 0
  let unroundedTotal = 0

  for (const item of calculatedItems) {
    taxableSubtotal = round2(taxableSubtotal + item.finalTaxableValue)
    totalCgst = round2(totalCgst + item.cgstAmount)
    totalSgst = round2(totalSgst + item.sgstAmount)
    totalTax = round2(totalTax + item.totalGst)
    unroundedTotal = round2(unroundedTotal + item.lineTotal)
  }

  // Step 4: Final Round-off
  const grandTotal = enableRoundOff ? Math.round(unroundedTotal) : unroundedTotal
  const roundOff = enableRoundOff ? round2(grandTotal - unroundedTotal) : 0

  // Step 5: Group by GST Rate Slab
  const slabMap = new Map<number, GstRateBreakup>()
  for (const item of calculatedItems) {
    const existing = slabMap.get(item.gstRate)
    if (!existing) {
      slabMap.set(item.gstRate, {
        gstRate: item.gstRate,
        cgstRate: item.cgstRate,
        sgstRate: item.sgstRate,
        taxableValue: item.finalTaxableValue,
        cgstAmount: item.cgstAmount,
        sgstAmount: item.sgstAmount,
        totalTax: item.totalGst,
        totalGst: item.totalGst,
      })
    } else {
      existing.taxableValue = round2(existing.taxableValue + item.finalTaxableValue)
      existing.cgstAmount = round2(existing.cgstAmount + item.cgstAmount)
      existing.sgstAmount = round2(existing.sgstAmount + item.sgstAmount)
      existing.totalTax = round2(existing.totalTax + item.totalGst)
      existing.totalGst = round2(existing.totalGst + item.totalGst)
    }
  }

  const rateBreakup = Array.from(slabMap.values()).sort((a, b) => a.gstRate - b.gstRate)

  // Step 6: Group by HSN Code for Statutory Summary
  const hsnMap = new Map<string, HsnSummaryRow>()
  for (const item of calculatedItems) {
    const key = `${item.hsnCode}__${item.gstRate}`
    const existing = hsnMap.get(key)
    if (!existing) {
      hsnMap.set(key, {
        hsnCode: item.hsnCode,
        taxableValue: item.finalTaxableValue,
        cgstRate: item.cgstRate,
        cgstAmount: item.cgstAmount,
        sgstRate: item.sgstRate,
        sgstAmount: item.sgstAmount,
        totalTax: item.totalGst,
      })
    } else {
      existing.taxableValue = round2(existing.taxableValue + item.finalTaxableValue)
      existing.cgstAmount = round2(existing.cgstAmount + item.cgstAmount)
      existing.sgstAmount = round2(existing.sgstAmount + item.sgstAmount)
      existing.totalTax = round2(existing.totalTax + item.totalGst)
    }
  }

  const hsnSummary = Array.from(hsnMap.values()).sort((a, b) => a.hsnCode.localeCompare(b.hsnCode))

  return {
    taxPricingMode: pricingMode,
    items: calculatedItems,
    grossSubtotal: totalGrossAmount,
    totalItemDiscount,
    billDiscount: effectiveBillDiscount,
    totalDiscount: round2(totalItemDiscount + effectiveBillDiscount),
    taxableSubtotal,
    totalCgst,
    totalSgst,
    totalTax,
    unroundedTotal,
    roundOff,
    grandTotal,
    rateBreakup,
    hsnSummary,
  }
}

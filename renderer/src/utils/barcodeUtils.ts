import JsBarcode from 'jsbarcode'

/**
 * Generates a unique 12-digit retail barcode string (Code-128 compatible).
 * Uses standard retail prefix '890' followed by 9 digits.
 */
export function generateBarcodeNumber(existingSkus: string[] = []): string {
  const existingSet = new Set(existingSkus.map((s) => s.trim().toLowerCase()))
  let candidate = ''
  let attempts = 0

  do {
    const randomPart = Math.floor(100000000 + Math.random() * 900000000).toString()
    candidate = `890${randomPart}`
    attempts++
  } while (existingSet.has(candidate.toLowerCase()) && attempts < 100)

  return candidate
}

/**
 * Renders a scannable Code-128 barcode into an SVG DOM element.
 */
export function renderBarcodeToSvg(
  svgElement: SVGSVGElement | null,
  value: string,
  options?: {
    height?: number
    width?: number
    fontSize?: number
    displayValue?: boolean
    margin?: number
  }
): boolean {
  if (!svgElement || !value || !value.trim()) return false

  try {
    JsBarcode(svgElement, value.trim(), {
      format: 'CODE128',
      width: options?.width ?? 1.6,
      height: options?.height ?? 42,
      displayValue: options?.displayValue ?? true,
      fontSize: options?.fontSize ?? 12,
      font: 'monospace',
      textMargin: 3,
      margin: options?.margin ?? 6,
      background: '#ffffff',
      lineColor: '#000000',
    })
    return true
  } catch (err) {
    console.error('[Barcode] Failed to render barcode with JsBarcode:', err)
    return false
  }
}

import React, { useState, useEffect, useRef } from 'react'
import { Product } from '../vite-env'
import { renderBarcodeToSvg } from '../utils/barcodeUtils'

interface BarcodeLabelModalProps {
  product: Product
  onClose: () => void
}

export const BarcodeLabelModal: React.FC<BarcodeLabelModalProps> = ({ product, onClose }) => {
  const [copies, setCopies] = useState<number>(10)
  const [customCopies, setCustomCopies] = useState<string>('10')
  const [storeName, setStoreName] = useState<string>('RETAILER POS')
  const [labelFormat, setLabelFormat] = useState<'roll' | 'sheet'>('roll') // 'roll' (thermal sticker roll) vs 'sheet' (A4 grid)
  const previewSvgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    const loadStoreName = async () => {
      if (window.electronAPI?.db?.settings) {
        try {
          const name = await window.electronAPI.db.settings.get('store_name')
          if (name && name.trim()) setStoreName(name.trim())
        } catch {}
      }
    }
    loadStoreName()
  }, [])

  // Render preview barcode
  useEffect(() => {
    if (previewSvgRef.current && product.sku) {
      renderBarcodeToSvg(previewSvgRef.current, product.sku, {
        height: 38,
        width: 1.5,
        fontSize: 11,
      })
    }
  }, [product.sku])

  const handlePrint = async () => {
    try {
      if (window.electronAPI?.window?.print) {
        await window.electronAPI.window.print({ silent: false })
      } else {
        window.print()
      }
    } catch {
      window.print()
    }
  }

  const handleCopiesPreset = (val: number) => {
    setCopies(val)
    setCustomCopies(val.toString())
  }

  const handleCustomCopiesChange = (valStr: string) => {
    setCustomCopies(valStr)
    const parsed = parseInt(valStr, 10)
    if (!isNaN(parsed) && parsed > 0 && parsed <= 500) {
      setCopies(parsed)
    }
  }

  // Generate copy array
  const copiesArray = Array.from({ length: copies }, (_, i) => i)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(12, 14, 18, 0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.5rem',
      }}
    >
      {/* Print CSS Rules for Barcode Sticker Printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .barcode-modal-backdrop {
            display: none !important;
          }
          #printable-barcode-sheet, #printable-barcode-sheet * {
            visibility: visible !important;
          }
          #printable-barcode-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 4mm !important;
          }
          .barcode-sticker-print-unit {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div
        className="barcode-modal-backdrop"
        style={{
          backgroundColor: '#15181E',
          border: '1px solid #262B36',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #262B36',
            backgroundColor: '#1C2028',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F59E0B',
                fontSize: '1.2rem',
              }}
            >
              🏷️
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#F9FAFB' }}>
                Print Barcode Labels
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#9CA3AF' }}>
                {product.name} &bull; Code: {product.sku || 'No Barcode'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '6px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Label Preview Card */}
          <div>
            <label style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: '0.5rem' }}>
              Sticker Label Live Preview (40mm × 25mm / 50mm × 30mm)
            </label>

            <div
              style={{
                backgroundColor: '#0C0E12',
                border: '1px solid #262B36',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/* Single Realistic Sticker Replica */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#000000',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  padding: '8px 12px',
                  width: '240px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                  textAlign: 'center',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {/* Store Name Header */}
                <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {storeName}
                </div>

                {/* Product Name */}
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    margin: '2px 0 4px 0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={product.name}
                >
                  {product.name}
                </div>

                {/* Scannable Barcode SVG */}
                <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0' }}>
                  <svg ref={previewSvgRef} style={{ maxWidth: '100%' }} />
                </div>

                {/* Price Display */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px', fontSize: '0.72rem', fontWeight: 800 }}>
                  <span>MRP / SALE:</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 900 }}>₹{product.selling_price.toFixed(2)}</span>
                </div>
                <div style={{ fontSize: '0.62rem', color: '#4B5563' }}>Incl. of all taxes</div>
              </div>
            </div>
          </div>

          {/* Copies Selector */}
          <div>
            <label style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: '0.5rem' }}>
              Number of Label Copies to Print
            </label>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {[1, 5, 10, 20, 50].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleCopiesPreset(preset)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    border: copies === preset ? '1px solid #F59E0B' : '1px solid #262B36',
                    backgroundColor: copies === preset ? '#F59E0B' : '#1C2028',
                    color: copies === preset ? '#000000' : '#E5E7EB',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {preset} {preset === 1 ? 'copy' : 'copies'}
                </button>
              ))}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}>
                <span style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>Custom:</span>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={customCopies}
                  onChange={(e) => handleCustomCopiesChange(e.target.value)}
                  style={{
                    width: '70px',
                    padding: '0.4rem 0.5rem',
                    backgroundColor: '#0C0E12',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    color: '#F9FAFB',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Format Selection: Thermal Roll vs A4 Sticker Sheet */}
          <div>
            <label style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: '0.5rem' }}>
              Printer Target Format
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setLabelFormat('roll')}
                style={{
                  flex: 1,
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: labelFormat === 'roll' ? '1px solid #F59E0B' : '1px solid #262B36',
                  backgroundColor: labelFormat === 'roll' ? 'rgba(245, 158, 11, 0.1)' : '#0C0E12',
                  color: labelFormat === 'roll' ? '#F59E0B' : '#9CA3AF',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>🖨️ Direct Thermal Roll</div>
                <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '2px' }}>
                  Sticker rolls (e.g. TSC, Zebra, Xprinter 40x25mm)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLabelFormat('sheet')}
                style={{
                  flex: 1,
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: labelFormat === 'sheet' ? '1px solid #F59E0B' : '1px solid #262B36',
                  backgroundColor: labelFormat === 'sheet' ? 'rgba(245, 158, 11, 0.1)' : '#0C0E12',
                  color: labelFormat === 'sheet' ? '#F59E0B' : '#9CA3AF',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>📄 A4 Sticker Sheet Grid</div>
                <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '2px' }}>
                  Multi-label adhesive sheet (24-up / 40-up stickers)
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #262B36',
            backgroundColor: '#1C2028',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '0.82rem', color: '#9CA3AF' }}>
            Ready to print: <strong style={{ color: '#F3F4F6' }}>{copies} {copies === 1 ? 'sticker' : 'stickers'}</strong>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#262B36',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#E5E7EB',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              style={{
                padding: '0.5rem 1.25rem',
                backgroundColor: '#F59E0B',
                color: '#000000',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print {copies} Labels
            </button>
          </div>
        </div>
      </div>

      {/* Hidden DOM element rendered specifically for physical print execution */}
      <div
        id="printable-barcode-sheet"
        style={{
          display: 'none',
        }}
      >
        {copiesArray.map((_, i) => (
          <div
            key={i}
            className="barcode-sticker-print-unit"
            style={{
              width: labelFormat === 'roll' ? '38mm' : '48mm',
              height: labelFormat === 'roll' ? '24mm' : '28mm',
              padding: '2mm',
              border: labelFormat === 'roll' ? 'none' : '1px dashed #E5E7EB',
              textAlign: 'center',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              fontFamily: 'system-ui, sans-serif',
              color: '#000000',
              backgroundColor: '#FFFFFF',
            }}
          >
            <div style={{ fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1 }}>
              {storeName}
            </div>
            <div
              style={{
                fontSize: '7.5pt',
                fontWeight: 700,
                lineHeight: 1.1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {product.name}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <BarcodePrintItem value={product.sku || ''} />
            </div>
            <div style={{ fontSize: '8pt', fontWeight: 900, lineHeight: 1, display: 'flex', justifyContent: 'space-between' }}>
              <span>MRP:</span>
              <span>₹{product.selling_price.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const BarcodePrintItem: React.FC<{ value: string }> = ({ value }) => {
  const svgRef = useRef<SVGSVGElement | null>(null)
  useEffect(() => {
    if (svgRef.current && value) {
      renderBarcodeToSvg(svgRef.current, value, {
        height: 28,
        width: 1.2,
        fontSize: 9,
        margin: 2,
      })
    }
  }, [value])
  return <svg ref={svgRef} />
}

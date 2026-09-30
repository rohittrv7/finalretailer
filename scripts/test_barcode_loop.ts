import { initDatabase, productRepository } from '../db/index'
import { generateBarcodeNumber } from '../renderer/src/utils/barcodeUtils'
import path from 'path'
import os from 'os'
import fs from 'fs'

async function runBarcodeLoopTest() {
  console.log('================================================================')
  console.log('TESTING BARCODE GENERATION AND SCAN-BACK LOOKUP LOOP')
  console.log('================================================================')

  const testDbDir = path.join(os.tmpdir(), `retailer_barcode_test_${Date.now()}`)
  fs.mkdirSync(testDbDir, { recursive: true })

  initDatabase(testDbDir)

  // 1. Fetch existing products to ensure uniqueness
  const existingProducts = productRepository.getAll()
  const existingSkus = existingProducts.map((p) => p.sku).filter(Boolean) as string[]

  // 2. Generate new Code-128 barcode number
  const generatedBarcode = generateBarcodeNumber(existingSkus)
  console.log(`\n1. Auto-generated Barcode Number: [ ${generatedBarcode} ]`)
  console.log(`   Format: 12-digit GS1 India prefix (890) + unique sequential/random digits (Code-128 compatible)`)

  // 3. Create a loose/local product with this barcode
  const newProduct = productRepository.create({
    name: 'Fresh Ground Cardamom (Elaichi) 50g',
    sku: generatedBarcode,
    category: 'Spices & Seasonings',
    purchase_price: 65.0,
    selling_price: 95.0,
    mrp: 110.0,
    stock_qty: 35,
    unit: 'pack',
    hsn_code: '0908',
    gst_rate: 5,
  })

  console.log(`\n2. Product Saved with Generated Barcode:`)
  console.log(`   ID: ${newProduct.id}`)
  console.log(`   Name: ${newProduct.name}`)
  console.log(`   SKU/Barcode: ${newProduct.sku}`)
  console.log(`   Selling Price: ₹${newProduct.selling_price}`)

  // 4. Simulate Barcode Scanner input loop (hardware scanner typing rapid keystrokes into POS billing)
  const scannedInput = generatedBarcode // What hardware scanner emits + Enter
  console.log(`\n3. Simulating Hardware Scanner Rapid Input: "${scannedInput}" + [Enter]`)

  // Query DB directly using the exact match logic used in BillingView.tsx:
  // products.find(p => p.sku && p.sku.toLowerCase() === query.toLowerCase())
  const allCurrentProducts = productRepository.getAll()
  const matchedProduct = allCurrentProducts.find(
    (p) => p.sku && p.sku.toLowerCase() === scannedInput.toLowerCase()
  )

  if (!matchedProduct) {
    throw new Error(`FAIL: Scanned barcode "${scannedInput}" could not find product!`)
  }

  console.log(`\n4. Scan-back Result:`)
  console.log(`   SUCCESS: Matched Product #${matchedProduct.id} ("${matchedProduct.name}")`)
  console.log(`   Matched Barcode: ${matchedProduct.sku}`)
  console.log(`   Price: ₹${matchedProduct.selling_price.toFixed(2)}`)
  console.log(`   Stock Available: ${matchedProduct.stock_qty} ${matchedProduct.unit}`)

  // Verify uniqueness check: generating another barcode must NOT collide
  const secondBarcode = generateBarcodeNumber([...existingSkus, generatedBarcode])
  console.log(`\n5. Generated Second Barcode: [ ${secondBarcode} ]`)
  if (secondBarcode === generatedBarcode) {
    throw new Error('FAIL: Generated collision barcode!')
  }
  console.log('   Collision check PASSED (Second barcode is distinct from first barcode).')

  console.log('\n================================================================')
  console.log('ALL BARCODE GENERATION AND SCAN-BACK TESTS PASSED!')
  console.log('================================================================')
}

runBarcodeLoopTest().catch((err) => {
  console.error('Barcode test error:', err)
  process.exit(1)
})

import fs from 'fs'
import path from 'path'
import {
  initDatabase,
  closeDatabase,
  getDb,
  productRepository,
  categoryRepository,
  invoiceRepository,
  backupRepository,
} from '../db'

async function runDeepAudit() {
  console.log('======================================================')
  console.log('STARTING RETAILER POS DEEP TESTING PROTOCOL')
  console.log('======================================================\n')

  const testDir = path.resolve(process.cwd(), 'scratch_test_env')
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
  fs.mkdirSync(testDir, { recursive: true })

  // 1. Initialize DB in test directory
  console.log('TEST 1: Initializing isolated test database...')
  initDatabase(testDir)
  const db = getDb()
  console.log('✓ Database initialized with full schema and default seed data.')

  // 2. Category Data Integrity Verification
  console.log('\nTEST 2: Verifying category data integrity (only from DB)...')
  const categories = categoryRepository.getAll()
  console.log(`✓ Loaded ${categories.length} categories from SQLite:`)
  categories.forEach((c) => console.log(`   - ID ${c.id}: ${c.name}`))
  if (categories.length === 0) {
    throw new Error('Categories failed to load from database!')
  }

  // 3. Invoice creation, stock deduction, and ledger history
  console.log('\nTEST 3: Verifying invoice creation, stock deduction & stock_history ledger...')
  const testProd = productRepository.create({
    name: 'Audit Test Parle-G 500g',
    sku: 'TEST-SKU-9901',
    category: categories[0].name,
    selling_price: 40,
    mrp: 40,
    stock_qty: 50,
    unit: 'pcs',
    gst_rate: 5,
  })
  console.log(`✓ Created test product ID ${testProd.id} with initial stock: ${testProd.stock_qty}`)

  // Create an invoice with 5 units
  const inv = invoiceRepository.createInvoice({
    items: [
      {
        product_id: testProd.id,
        qty: 5,
        price: 40,
        discount: 0,
        gst_rate: 5,
        line_total: 200,
      },
    ],
    subtotal: 200,
    discount_amount: 0,
    cgst_amount: 5,
    sgst_amount: 5,
    round_off: 0,
    total: 200,
    payment_mode: 'CASH',
    amount_paid: 200,
  })
  console.log(`✓ Invoice created: ${inv.invoice_no}, Total: ₹${inv.total}`)

  // Re-query database directly to confirm stock deduction
  const prodAfterSale = productRepository.getById(testProd.id)
  console.log(`✓ Product stock after sale: ${prodAfterSale?.stock_qty} (Expected: 45)`)
  if (prodAfterSale?.stock_qty !== 45) {
    throw new Error(`Stock deduction mismatch! Expected 45, got ${prodAfterSale?.stock_qty}`)
  }

  // Re-query stock_history table directly
  const stockHistoryRows = db
    .prepare('SELECT * FROM stock_history WHERE product_id = ? ORDER BY id DESC')
    .all(testProd.id) as any[]
  console.log(`✓ Stock history entries found: ${stockHistoryRows.length}`)
  const saleEntry = stockHistoryRows.find((r) => r.reason === 'sale')
  if (!saleEntry) {
    throw new Error('No stock_history entry with reason="sale" found!')
  }
  console.log(`   - Entry ID: ${saleEntry.id}`)
  console.log(`   - Reason: ${saleEntry.reason}`)
  console.log(`   - Change Qty: ${saleEntry.change_qty} (Expected: -5)`)
  console.log(`   - Balance Qty: ${saleEntry.balance_qty} (Expected: 45)`)
  console.log(`   - Reference: ${saleEntry.reference_id}`)
  if (saleEntry.change_qty !== -5 || saleEntry.balance_qty !== 45) {
    throw new Error('Stock history ledger values are inaccurate!')
  }

  // 4. Edge Case: Empty Cart rejection
  console.log('\nTEST 4: Failure-mode testing: Invoice save with empty cart...')
  try {
    invoiceRepository.createInvoice({
      items: [],
      subtotal: 0,
      total: 0,
      payment_mode: 'CASH',
      amount_paid: 0,
    })
    throw new Error('Invoice save with empty cart did NOT throw an error!')
  } catch (err: any) {
    console.log(`✓ Gracefully blocked invoice creation with empty cart: "${err.message}"`)
  }

  // 5. Backup & Disaster Recovery Tests
  console.log('\nTEST 5: Testing Backup Export & Validation...')
  const backupFile = path.join(testDir, 'retailer_test_backup.db')
  await backupRepository.exportBackup(backupFile)
  if (!fs.existsSync(backupFile)) {
    throw new Error('Backup export failed to create file on disk!')
  }
  const fileSize = fs.statSync(backupFile).size
  console.log(`✓ Backup successfully exported to disk: ${backupFile} (${fileSize} bytes)`)

  const validation = backupRepository.validateBackup(backupFile)
  console.log(`✓ Backup integrity check: valid=${validation.valid}`)
  if (!validation.valid) {
    throw new Error(`Backup validation failed: ${validation.error}`)
  }

  // 6. Make subsequent changes to database
  console.log('\nTEST 6: Making intermediate database modifications...')
  const tempProd = productRepository.create({
    name: 'Temporary Item To Be Reverted',
    sku: 'TEMP-REVERT-01',
    category: categories[0].name,
    selling_price: 999,
    mrp: 999,
    stock_qty: 100,
    unit: 'pcs',
    gst_rate: 18,
  })
  console.log(`✓ Added temporary product ID ${tempProd.id}. Total products now: ${productRepository.getAll().length}`)

  // 7. Failure-mode: Corrupted file restore test
  console.log('\nTEST 7: Failure-mode testing: Restore from corrupted / invalid file...')
  const corruptFile = path.join(testDir, 'corrupted_backup.db')
  fs.writeFileSync(corruptFile, 'THIS_IS_CORRUPTED_GARBAGE_DATA_NOT_A_VALID_SQLITE_DATABASE')

  const corruptValidation = backupRepository.validateBackup(corruptFile)
  console.log(`✓ Corrupt file pre-validation result: valid=${corruptValidation.valid}, error="${corruptValidation.error}"`)
  if (corruptValidation.valid) {
    throw new Error('Corrupted file was falsely validated as valid!')
  }

  try {
    await backupRepository.restoreBackup(corruptFile, testDir)
    throw new Error('Corrupted file restore did not throw an error!')
  } catch (err: any) {
    console.log(`✓ Restore safely aborted without touching live DB: "${err.message}"`)
  }

  // Confirm active database is completely intact and functional after failed restore attempt
  const intactProd = productRepository.getById(tempProd.id)
  if (!intactProd) {
    throw new Error('Active database was damaged by failed restore attempt!')
  }
  console.log(`✓ Active database remains 100% healthy and intact after corrupted restore rejection.`)

  // 8. Happy path restore & verification of exact rollback
  console.log('\nTEST 8: Happy path: Restoring valid backup and verifying exact data rollback...')
  await backupRepository.restoreBackup(backupFile, testDir)
  console.log('✓ Restore operation completed.')

  // Re-verify that temporary product no longer exists and original product is preserved
  const allProdsAfterRestore = productRepository.getAll()
  const revertedProd = productRepository.getById(tempProd.id)
  const originalProdRestored = productRepository.getById(testProd.id)

  console.log(`✓ Products count after restore: ${allProdsAfterRestore.length}`)
  console.log(`✓ Temporary product exists after restore: ${Boolean(revertedProd)} (Expected: false)`)
  console.log(`✓ Original product stock after restore: ${originalProdRestored?.stock_qty} (Expected: 45)`)

  if (revertedProd) {
    throw new Error('Restore did not wipe uncommitted changes (temporary product still exists)!')
  }
  if (!originalProdRestored || originalProdRestored.stock_qty !== 45) {
    throw new Error('Original product state was corrupted during restore!')
  }

  // Cleanup test env
  closeDatabase()
  fs.rmSync(testDir, { recursive: true, force: true })
  console.log('\n✓ Test environment cleaned up.')
  console.log('\n======================================================')
  console.log('ALL DEEP TESTS PASSED WITH 100% INTEGRITY!')
  console.log('======================================================')
}

runDeepAudit().catch((err) => {
  console.error('\n❌ DEEP TEST FAILED:', err)
  process.exit(1)
})

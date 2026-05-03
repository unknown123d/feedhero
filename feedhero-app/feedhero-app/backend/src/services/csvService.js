import fs from 'fs'
import csvParser from 'csv-parser'

/**
 * Parse a CSV file into an array of product objects.
 * Maps common Merchant Center column names to a clean internal structure.
 * RULE: Never assign fake values. Missing fields stay empty.
 */
export async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const products = []

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        // Normalize column names: lowercase + trim
        const norm = {}
        for (const key of Object.keys(row)) {
          norm[key.toLowerCase().trim().replace(/\s+/g, '_')] = (row[key] || '').trim()
        }

        // Map to clean product shape
        // Support multiple common column name variants
        const product = {
          id:          norm.id || norm.product_id || norm.sku || '',
          title:       norm.title || norm.product_title || norm.name || '',
          description: norm.description || norm.desc || norm.product_description || '',
          brand:       norm.brand || norm.manufacturer || '',
          product_type: norm.product_type || norm.category || norm.google_product_category || '',
          colour:      norm.colour || norm.color || norm.product_colour || '',
          size:        norm.size || norm.product_size || '',
          material:    norm.material || '',
          gender:      norm.gender || '',
          age_group:   norm.age_group || '',
          condition:   norm.condition || '',
          // Keep raw row for reference
          _raw: norm,
        }

        // Only include rows that have at minimum an id or title
        if (product.id || product.title) {
          products.push(product)
        }
      })
      .on('end', () => resolve(products))
      .on('error', (err) => reject(err))
  })
}

/**
 * Clean up temp file after processing
 */
export function deleteTempFile(filePath) {
  try {
    fs.unlinkSync(filePath)
  } catch {
    // non-fatal
  }
}

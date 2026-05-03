import fs from 'fs'
import csvParser from 'csv-parser'

/**
 * Parse a CSV file into an array of plain row objects.
 * Column headers are normalised to lowercase_underscore.
 */
export function parseCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const rows = []
    fs.createReadStream(filePath)
      .pipe(csvParser({
        mapHeaders: ({ header }) =>
          header.trim().toLowerCase().replace(/\s+/g, '_')
      }))
      .on('data', (row) => {
        if (row.id || row.title) rows.push(row)
      })
      .on('end',   () => resolve(rows))
      .on('error', reject)
  })
}

/**
 * Map a raw CSV row → clean product object.
 * NEVER invent values. Missing fields stay blank strings.
 */
export function mapRowToProduct(row) {
  return {
    id:          (row.id   || row.sku  || '').trim(),
    title:       (row.title || '').trim(),
    description: (row.description || row.desc || '').trim(),
    brand:       (row.brand || '').trim(),
    // Use whatever category column exists — NEVER guess
    category:    (row.product_type || row.google_product_category || '').trim(),
    attributes: {
      colour:   (row.colour   || row.color    || '').trim(),
      size:     (row.size     || '').trim(),
      material: (row.material || '').trim(),
      gender:   (row.gender   || '').trim(),
    },
    _raw: row,
  }
}

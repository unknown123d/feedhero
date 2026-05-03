import { Parser } from 'json2csv'

/**
 * Generate a supplemental feed CSV from optimized results.
 * Output format: id, structured_title, title_type
 * This is what gets uploaded to Google Merchant Center as a supplemental feed.
 */
export function generateSupplementalFeed(results) {
  const fields = [
    { label: 'id', value: 'product_id' },
    { label: 'structured_title', value: 'optimized_title' },
    { label: 'title_type', value: () => 'trained_algorithmic_media' },
  ]

  const parser = new Parser({ fields })
  return parser.parse(results)
}

/**
 * Generate a full report CSV with before/after comparison.
 */
export function generateReportCSV(results) {
  const fields = [
    { label: 'product_id', value: 'product_id' },
    { label: 'original_title', value: 'original_title' },
    { label: 'optimized_title', value: 'optimized_title' },
    { label: 'brand', value: 'brand' },
    { label: 'product_type', value: 'product_type' },
    { label: 'status', value: 'status' },
  ]

  const parser = new Parser({ fields })
  return parser.parse(results)
}

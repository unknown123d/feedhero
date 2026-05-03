import { Parser } from 'json2csv'

/**
 * Generate a Google Merchant Center supplemental feed CSV.
 * Output columns: id, structured_title, title_type
 *
 * structured_title is Google's required attribute for AI-generated titles.
 * title_type = "trained_algorithmic_media" tells Google it was AI-generated.
 */
export function generateSupplementalFeed(results) {
  const parser = new Parser({
    fields: [
      { label: 'id',               value: 'id' },
      { label: 'structured_title', value: 'optimized_title' },
      { label: 'title_type',       value: () => 'trained_algorithmic_media' },
    ],
  })
  return parser.parse(results)
}

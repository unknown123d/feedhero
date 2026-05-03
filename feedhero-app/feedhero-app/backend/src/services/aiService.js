import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * Optimize a single product title using Claude.
 *
 * RULES enforced in the prompt:
 * - Use ONLY the data provided — never invent attributes
 * - High-intent keywords first
 * - Include product type, brand, key attributes in correct order
 * - Max 150 characters
 * - No promotional words (Best, Sale, Cheapest)
 * - UK English
 */
export async function optimizeTitle(product) {
  // Build a clean, honest description of what we actually know
  const knownAttributes = []
  if (product.brand)        knownAttributes.push(`Brand: ${product.brand}`)
  if (product.product_type) knownAttributes.push(`Product type: ${product.product_type}`)
  if (product.colour)       knownAttributes.push(`Colour: ${product.colour}`)
  if (product.size)         knownAttributes.push(`Size: ${product.size}`)
  if (product.material)     knownAttributes.push(`Material: ${product.material}`)
  if (product.gender)       knownAttributes.push(`Gender: ${product.gender}`)
  if (product.age_group)    knownAttributes.push(`Age group: ${product.age_group}`)

  const attributeBlock = knownAttributes.length > 0
    ? knownAttributes.join('\n')
    : 'No additional attributes available'

  const prompt = `You are an expert Google Shopping feed optimizer.

Your job is to rewrite a product title to maximize visibility and CTR in Google Shopping.

STRICT RULES:
1. Use ONLY the data I provide — do NOT invent or guess attributes
2. If a field is empty, do not include it in the title
3. Put the most-searched specific product term FIRST (e.g. "Ottoman Bed" not "Bed")
4. Keyword order: [Product Type] → [Size] → [Colour] → [Feature/Material] → [Brand]
5. Max 150 characters
6. No promotional words: Best, Sale, Cheapest, #1, Free Shipping, Buy Now
7. UK English spelling (Grey not Gray, Colour not Color)
8. Return ONLY the optimized title — no explanation, no quotes

PRODUCT DATA:
Current title: ${product.title || '(no title)'}
Description: ${product.description || '(none)'}
${attributeBlock}

OPTIMIZED TITLE:`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  })

  const optimized = response.content[0]?.text?.trim() || product.title
  return optimized
}

/**
 * Process products in batches with concurrency control.
 * This avoids hammering the API and handles async properly.
 *
 * @param {Array} products - parsed product array
 * @param {Function} onProgress - callback(processed, total)
 * @param {number} batchSize - how many to run in parallel
 */
export async function optimizeBatch(products, onProgress, batchSize = 5) {
  const results = []
  let processed = 0

  // Split into batches
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)

    // Run this batch in parallel
    const batchResults = await Promise.all(
      batch.map(async (product) => {
        try {
          const optimizedTitle = await optimizeTitle(product)
          return {
            product_id: product.id || '',
            original_title: product.title || '',
            optimized_title: optimizedTitle,
            brand: product.brand || '',
            product_type: product.product_type || '',
            colour: product.colour || '',
            size: product.size || '',
            status: 'success',
          }
        } catch (err) {
          console.error(`[AI Error] product ${product.id}:`, err.message)
          return {
            product_id: product.id || '',
            original_title: product.title || '',
            optimized_title: product.title || '', // fallback to original
            brand: product.brand || '',
            product_type: product.product_type || '',
            colour: product.colour || '',
            size: product.size || '',
            status: 'error',
            error: err.message,
          }
        }
      })
    )

    results.push(...batchResults)
    processed += batch.length
    onProgress(processed, products.length)

    // Small delay between batches to be a good API citizen
    if (i + batchSize < products.length) {
      await new Promise(r => setTimeout(r, 200))
    }
  }

  return results
}

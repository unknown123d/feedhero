import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * Build the Claude prompt.
 * Only includes fields that are actually present in the product data.
 * Never asks Claude to invent information.
 */
function buildPrompt(product) {
  const attrs = Object.entries(product.attributes)
    .filter(([, v]) => v)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n')

  return `You are a Google Shopping product title optimization expert.

Rewrite the product title below to maximize search visibility and CTR in Google Shopping.

KEYWORD ORDER RULES (strictly follow this sequence):
1. Specific product type FIRST — e.g. "Ottoman Bed" not "Bed", "Corner Sofa" not "Sofa", "iPhone 15 Case" not "Case"
2. Size / key spec second  — e.g. "King Size", "4 Seater", "14-inch"
3. Colour third            — e.g. "Grey", "Charcoal", "Navy"
4. Features fourth         — e.g. "With Storage", "Gas Lift", "Left Hand", "Noise Cancelling"
5. Material fifth          — e.g. "Fabric", "Velvet", "Leather"
6. Brand LAST              — e.g. "— Chesworth", "— Nike"

STRICT RULES:
- Use ONLY the data provided. Do NOT invent any attributes.
- If a field is missing, skip it. Do not guess.
- Max 150 characters
- UK English spelling (Grey, Colour, Organised)
- No promotional words: Best, Sale, Cheapest, Free Shipping, #1, Discount, Deal, Bargain
- Return ONLY the optimized title. No explanation, no quotes, no extra text.

PRODUCT DATA:
Title:       ${product.title || '(none)'}
Description: ${product.description || '(none)'}
Brand:       ${product.brand || '(none)'}
Category:    ${product.category || '(none)'}
${attrs ? `Attributes:\n${attrs}` : '(no additional attributes)'}
`
}

/**
 * Optimize a single product title using Claude.
 * Falls back to the original title if the API call fails.
 */
export async function optimizeTitle(product) {
  try {
    const response = await client.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [
        { role: 'user', content: buildPrompt(product) }
      ],
    })

    const raw = response.content[0]?.text?.trim() || ''
    // Strip any accidental surrounding quotes Claude might add
    return raw.replace(/^["'`]|["'`]$/g, '').trim() || product.title
  } catch (err) {
    console.error('[optimizeTitle error]', err.message)
    return product.title  // fallback to original
  }
}

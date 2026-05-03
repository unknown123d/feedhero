/**
 * Process an array in concurrent batches.
 * Mutates `job.processed` and `job.progress` as items complete.
 *
 * Key design:
 *  - Uses Promise.allSettled so one failure never kills the whole job
 *  - 300ms pause between batches to respect Claude API rate limits
 *  - Returns only successful results (failed items are logged + skipped)
 *
 * @param {Array}    items     Full list to process
 * @param {Function} fn        async (item) => result
 * @param {Object}   job       Shared job state (mutated in place)
 * @param {number}   batchSize Items per concurrent batch (default 5)
 */
export async function processBatches(items, fn, job, batchSize = 5) {
  const results = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)

    const settled = await Promise.allSettled(batch.map(fn))

    for (const outcome of settled) {
      if (outcome.status === 'fulfilled') {
        results.push(outcome.value)
      } else {
        console.error('[batch item failed]', outcome.reason?.message)
      }
      job.processed++
      job.progress = Math.round((job.processed / job.total) * 100)
    }

    // Rate-limit pause between batches
    if (i + batchSize < items.length) {
      await new Promise(r => setTimeout(r, 300))
    }
  }

  return results
}

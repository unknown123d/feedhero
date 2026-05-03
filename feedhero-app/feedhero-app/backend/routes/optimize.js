import express from 'express'
import { v4 as uuidv4 }         from 'uuid'
import { parseCSVFile, mapRowToProduct } from '../utils/csvParser.js'
import { optimizeTitle }         from '../services/aiOptimizer.js'
import { generateSupplementalFeed } from '../utils/csvWriter.js'
import { processBatches }        from '../utils/batcher.js'
import { createJob, getJob, updateJob } from '../services/jobStore.js'

export const optimizeRouter = express.Router()

/**
 * POST /api/optimize/start
 * Kicks off an async bulk optimization job.
 * Returns { jobId, total } immediately.
 * Client polls GET /api/jobs/:id for progress updates.
 */
optimizeRouter.post('/start', async (req, res) => {
  const { filePath, fileName } = req.body

  if (!filePath) {
    return res.status(400).json({ error: 'filePath is required' })
  }

  try {
    const rows     = await parseCSVFile(filePath)
    const products = rows.map(mapRowToProduct)

    if (!products.length) {
      return res.status(400).json({ error: 'No valid products found in this file' })
    }

    const jobId = uuidv4()
    const job   = createJob(jobId, products.length)
    job.fileName = fileName || 'feed.csv'

    // Start processing in the background — client polls for progress
    runJob(job, products).catch(err => {
      console.error('[job failed]', err)
      updateJob(jobId, { status: 'failed', error: err.message })
    })

    return res.json({ jobId, total: products.length })
  } catch (err) {
    console.error('[/optimize/start error]', err)
    return res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/optimize/download/:jobId
 * Stream the supplemental feed CSV for a completed job.
 */
optimizeRouter.get('/download/:jobId', (req, res) => {
  const job = getJob(req.params.jobId)

  if (!job)                  return res.status(404).json({ error: 'Job not found' })
  if (job.status !== 'done') return res.status(400).json({ error: 'Job is not complete yet' })

  const csv = generateSupplementalFeed(job.results)

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="feedhero_supplemental_feed.csv"')
  return res.send(csv)
})

// ─────────────────────────────────────────────────────────────
async function runJob(job, products) {
  updateJob(job.id, { status: 'processing' })

  const processOne = async (product) => {
    const optimized = await optimizeTitle(product)
    return {
      id:              product.id,
      original_title:  product.title,
      optimized_title: optimized,
      brand:           product.brand,
      category:        product.category,
    }
  }

  const results = await processBatches(products, processOne, job, 5)

  updateJob(job.id, {
    status:      'done',
    results,
    progress:    100,
    completedAt: new Date().toISOString(),
  })

  console.log(`[job ${job.id}] Done — ${results.length} titles optimized`)
}

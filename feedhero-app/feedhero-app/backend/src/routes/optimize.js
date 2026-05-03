import express from 'express'
import { optimizeBatch } from '../services/aiService.js'
import { deleteTempFile } from '../services/csvService.js'
import {
  createJob,
  getJob,
  updateJobProgress,
  completeJob,
  failJob,
} from '../services/jobStore.js'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()

/**
 * POST /api/optimize
 * Starts optimization job for a previously uploaded session.
 * Returns a jobId immediately, then processes in background.
 */
router.post('/', async (req, res, next) => {
  try {
    const { sessionId } = req.body

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' })
    }

    const session = global.uploadedFiles?.get(sessionId)
    if (!session) {
      return res.status(404).json({
        error: 'Session not found. Please upload your CSV again.',
      })
    }

    const { products, filePath } = session

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        error: 'ANTHROPIC_API_KEY not set. Check your .env file.',
      })
    }

    // Create a job and return the jobId immediately
    const jobId = uuidv4()
    createJob(jobId, products.length)

    res.json({
      jobId,
      total: products.length,
      message: 'Optimization started',
    })

    // Run in background — do NOT await here
    optimizeBatch(
      products,
      (processed, total) => {
        updateJobProgress(jobId, processed)
        console.log(`[Job ${jobId.slice(0, 8)}] ${processed}/${total}`)
      },
      5 // batch size
    )
      .then((results) => {
        completeJob(jobId, results)
        // Clean up temp file
        deleteTempFile(filePath)
        global.uploadedFiles?.delete(sessionId)
        console.log(`[Job ${jobId.slice(0, 8)}] Complete — ${results.length} products optimized`)
      })
      .catch((err) => {
        failJob(jobId, err.message)
        console.error(`[Job ${jobId.slice(0, 8)}] Failed:`, err.message)
      })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/optimize/status/:jobId
 * Poll this to get current progress.
 */
router.get('/status/:jobId', (req, res) => {
  const job = getJob(req.params.jobId)

  if (!job) {
    return res.status(404).json({ error: 'Job not found' })
  }

  res.json({
    jobId: job.id,
    status: job.status,
    total: job.total,
    processed: job.processed,
    progress: job.total > 0 ? Math.round((job.processed / job.total) * 100) : 0,
    // Only send preview results while processing (full results on download)
    preview: job.status === 'complete' ? job.results.slice(0, 10) : [],
    error: job.error,
  })
})

export default router

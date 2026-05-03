import express from 'express'
import { getJob, listJobs } from '../services/jobStore.js'

export const jobsRouter = express.Router()

// GET /api/jobs — list all jobs (for a future jobs history page)
jobsRouter.get('/', (_req, res) => {
  res.json(listJobs().map(j => ({
    id:          j.id,
    status:      j.status,
    total:       j.total,
    processed:   j.processed,
    progress:    j.progress,
    fileName:    j.fileName,
    createdAt:   j.createdAt,
    completedAt: j.completedAt,
    resultCount: j.results.length,
  })))
})

// GET /api/jobs/:id — poll a specific job
// Does NOT include the full results array while polling to keep payload small.
// Client fetches /api/optimize/download/:id for the actual CSV.
jobsRouter.get('/:id', (req, res) => {
  const job = getJob(req.params.id)
  if (!job) return res.status(404).json({ error: 'Job not found' })

  res.json({
    id:          job.id,
    status:      job.status,
    total:       job.total,
    processed:   job.processed,
    progress:    job.progress,
    error:       job.error,
    resultCount: job.results.length,
    completedAt: job.completedAt,
    // Small live preview while processing
    preview:     job.results.slice(0, 3),
  })
})

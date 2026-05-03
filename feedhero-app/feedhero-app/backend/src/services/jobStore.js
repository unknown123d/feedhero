/**
 * Simple in-memory store for tracking optimization jobs.
 * In production, replace with Redis or a database table.
 *
 * Each job:
 * {
 *   id: string,
 *   status: 'pending' | 'processing' | 'complete' | 'error',
 *   total: number,
 *   processed: number,
 *   results: Array,
 *   error: string | null,
 *   createdAt: Date,
 * }
 */

const jobs = new Map()

export function createJob(id, total) {
  jobs.set(id, {
    id,
    status: 'pending',
    total,
    processed: 0,
    results: [],
    error: null,
    createdAt: new Date(),
  })
}

export function getJob(id) {
  return jobs.get(id) || null
}

export function updateJobProgress(id, processed) {
  const job = jobs.get(id)
  if (job) {
    job.status = 'processing'
    job.processed = processed
  }
}

export function completeJob(id, results) {
  const job = jobs.get(id)
  if (job) {
    job.status = 'complete'
    job.processed = job.total
    job.results = results
  }
}

export function failJob(id, errorMessage) {
  const job = jobs.get(id)
  if (job) {
    job.status = 'error'
    job.error = errorMessage
  }
}

// Clean up jobs older than 1 hour to prevent memory leaks
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000
  for (const [id, job] of jobs.entries()) {
    if (job.createdAt.getTime() < oneHourAgo) {
      jobs.delete(id)
    }
  }
}, 600000) // run every 10 minutes

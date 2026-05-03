/**
 * In-memory job store.
 * Tracks status, progress, and results for each optimization job.
 * Replace with Redis or Supabase in production.
 */

const jobs = new Map()

export function createJob(id, total) {
  const job = {
    id,
    status:      'queued',   // queued | processing | done | failed
    total,
    processed:   0,
    progress:    0,          // 0–100
    results:     [],
    error:       null,
    fileName:    null,
    createdAt:   new Date().toISOString(),
    completedAt: null,
  }
  jobs.set(id, job)
  return job
}

export function getJob(id) {
  return jobs.get(id) || null
}

export function updateJob(id, patch) {
  const job = jobs.get(id)
  if (!job) return
  Object.assign(job, patch)
}

export function listJobs() {
  return [...jobs.values()].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )
}

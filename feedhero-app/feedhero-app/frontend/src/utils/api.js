const BASE = '/api'

export async function uploadCSV(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/upload`, { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(err.error || 'Upload failed')
  }
  return res.json()
}

export async function startOptimization(filePath, fileName) {
  const res = await fetch(`${BASE}/optimize/start`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ filePath, fileName }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Could not start' }))
    throw new Error(err.error || 'Could not start optimization')
  }
  return res.json()
}

export async function pollJob(jobId) {
  const res = await fetch(`${BASE}/jobs/${jobId}`)
  if (!res.ok) throw new Error('Failed to poll job')
  return res.json()
}

export function downloadFeedURL(jobId) {
  return `${BASE}/optimize/download/${jobId}`
}

import express from 'express'
import { getJob } from '../services/jobStore.js'
import { generateSupplementalFeed, generateReportCSV } from '../services/outputService.js'

const router = express.Router()

/**
 * GET /api/download/:jobId
 * Download the supplemental feed CSV (id + structured_title)
 * Ready to upload directly to Google Merchant Center.
 */
router.get('/:jobId', (req, res) => {
  const job = getJob(req.params.jobId)

  if (!job) {
    return res.status(404).json({ error: 'Job not found' })
  }

  if (job.status !== 'complete') {
    return res.status(400).json({
      error: `Job is not complete yet. Status: ${job.status}`,
    })
  }

  if (!job.results?.length) {
    return res.status(400).json({ error: 'No results to download' })
  }

  const type = req.query.type || 'feed' // 'feed' or 'report'
  const csv = type === 'report'
    ? generateReportCSV(job.results)
    : generateSupplementalFeed(job.results)

  const filename = type === 'report'
    ? `feedhero_report_${req.params.jobId.slice(0, 8)}.csv`
    : `feedhero_supplemental_feed_${req.params.jobId.slice(0, 8)}.csv`

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.send(csv)
})

export default router

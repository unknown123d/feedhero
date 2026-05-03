import { useEffect } from 'react'
import { useJob } from '../hooks/useJob.js'
import toast from 'react-hot-toast'

const STAGE_MESSAGES = [
  [0,  'Reading product types from every column...'],
  [15, 'Extracting size, colour, material, brand...'],
  [30, 'Sending products to Claude in batches of 5...'],
  [55, 'Claude ordering keywords by search priority...'],
  [70, 'Specific product type first — size — colour — brand last...'],
  [85, 'Generating supplemental feed CSV...'],
  [95, 'Finalising...'],
]

function getStageMessage(pct) {
  for (let i = STAGE_MESSAGES.length - 1; i >= 0; i--) {
    if (pct >= STAGE_MESSAGES[i][0]) return STAGE_MESSAGES[i][1]
  }
  return 'Starting...'
}

export default function OptimizingStep({ jobId, total, onDone }) {
  const { job, error } = useJob(jobId)

  useEffect(() => {
    if (job?.status === 'done')   { toast.success('All titles optimized!'); onDone(job) }
    if (job?.status === 'failed') toast.error(job.error || 'Job failed')
  }, [job?.status])

  const pct       = job?.progress  || 0
  const processed = job?.processed || 0

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-bg2 border border-border rounded-2xl p-10 text-center">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="#6c63ff" width="30" height="30" className="animate-pulse">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-text mb-2">Optimizing your titles</h2>
        <p className="text-sm text-text3 mb-8 min-h-[20px]">{getStageMessage(pct)}</p>

        {/* Progress bar */}
        <div className="w-full bg-bg4 rounded-full h-2 overflow-hidden mb-2">
          <div
            className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-text3 mb-8">
          <span>{processed} of {total} processed</span>
          <span>{pct}%</span>
        </div>

        {/* Live preview */}
        {job?.preview?.length > 0 && (
          <div className="text-left bg-bg3 rounded-xl p-4 border border-border">
            <p className="text-[10px] font-semibold text-text3 uppercase tracking-widest mb-3">
              Live results
            </p>
            {job.preview.map((r, i) => (
              <div key={i} className="mb-3 last:mb-0 pb-3 last:pb-0 border-b border-border last:border-0">
                <p className="text-[11px] text-text3 line-through mb-1">{r.original_title}</p>
                <p className="text-[12px] text-accent2 font-medium leading-relaxed">{r.optimized_title}</p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-6 p-3 bg-red/10 border border-red/20 rounded-xl text-sm text-red">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

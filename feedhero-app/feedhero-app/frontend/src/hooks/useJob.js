import { useState, useEffect, useRef } from 'react'
import { pollJob } from '../utils/api.js'

/**
 * Polls a job every 1.5 seconds until status is 'done' or 'failed'.
 * Automatically stops polling when the job completes.
 */
export function useJob(jobId) {
  const [job,   setJob]   = useState(null)
  const [error, setError] = useState(null)
  const timer = useRef(null)

  useEffect(() => {
    if (!jobId) return

    async function poll() {
      try {
        const data = await pollJob(jobId)
        setJob(data)
        if (data.status === 'done' || data.status === 'failed') {
          clearInterval(timer.current)
        }
      } catch (e) {
        setError(e.message)
        clearInterval(timer.current)
      }
    }

    poll()
    timer.current = setInterval(poll, 1500)
    return () => clearInterval(timer.current)
  }, [jobId])

  return { job, error }
}

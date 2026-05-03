import { useState } from 'react'
import StepIndicator  from './components/StepIndicator.jsx'
import UploadStep     from './components/UploadStep.jsx'
import PreviewStep    from './components/PreviewStep.jsx'
import OptimizingStep from './components/OptimizingStep.jsx'
import ResultsStep    from './components/ResultsStep.jsx'

// Step machine: 0=Upload → 1=Preview → 2=Optimizing → 3=Results
export default function App() {
  const [step,   setStep]   = useState(0)
  const [upload, setUpload] = useState(null)
  const [jobId,  setJobId]  = useState(null)
  const [total,  setTotal]  = useState(0)
  const [job,    setJob]    = useState(null)

  function onUploadDone(data)          { setUpload(data);              setStep(1) }
  function onOptimizeStart(id, total)  { setJobId(id); setTotal(total); setStep(2) }
  function onJobDone(j)               { setJob(j);                    setStep(3) }
  function reset()                     { setStep(0); setUpload(null); setJobId(null); setTotal(0); setJob(null) }

  return (
    <div className="min-h-screen bg-bg text-text font-sans">

      {/* Nav */}
      <nav className="bg-bg2 border-b border-border px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <div>
            <span className="text-[15px] font-semibold block leading-none">FeedHero</span>
            <span className="text-[10px] text-text3 font-mono">Google Shopping Title Optimizer</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-text3">Powered by Claude AI</span>
          {step > 0 && (
            <button
              onClick={reset}
              className="text-xs text-text2 border border-border2 px-3 py-1.5 rounded-lg hover:bg-bg3 transition-colors"
            >
              Start over
            </button>
          )}
        </div>
      </nav>

      {/* Content */}
      <main className="px-8 py-10">
        <StepIndicator current={step} />

        {step === 0 && (
          <UploadStep onUploadDone={onUploadDone} />
        )}
        {step === 1 && (
          <PreviewStep upload={upload} onOptimizeStart={onOptimizeStart} />
        )}
        {step === 2 && (
          <OptimizingStep jobId={jobId} total={total} onDone={onJobDone} />
        )}
        {step === 3 && (
          <ResultsStep job={job} jobId={jobId} onReset={reset} />
        )}
      </main>
    </div>
  )
}

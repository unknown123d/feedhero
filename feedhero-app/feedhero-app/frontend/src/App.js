import React, { useState, useEffect, useRef, useCallback } from 'react'
import { uploadCSV, startOptimize, pollStatus, getDownloadUrl } from './utils/api'

// ─── STYLES (inline for portability) ────────────────────────
const S = {
  // Layout
  page: { minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' },
  header: { background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoIcon: { width: 34, height: 34, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 18, fontWeight: 700, color: 'var(--text)' },
  logoSub: { fontSize: 11, color: 'var(--text3)', marginTop: 1 },
  main: { maxWidth: 900, margin: '0 auto', padding: '40px 24px' },

  // Cards
  card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 16 },
  cardTitle: { fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 },

  // Steps indicator
  steps: { display: 'flex', gap: 0, marginBottom: 32 },
  step: (active, done) => ({
    flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
    background: done ? 'rgba(34,197,94,0.08)' : active ? 'rgba(108,99,255,0.12)' : 'var(--bg2)',
    border: `1px solid ${done ? 'rgba(34,197,94,0.2)' : active ? 'rgba(108,99,255,0.3)' : 'var(--border)'}`,
    borderRadius: 10, marginRight: 8,
  }),
  stepNum: (active, done) => ({
    width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, flexShrink: 0,
    background: done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--bg4)',
    color: done || active ? 'white' : 'var(--text3)',
  }),
  stepLabel: (active, done) => ({ fontSize: 13, fontWeight: 500, color: done ? 'var(--green)' : active ? 'var(--accent2)' : 'var(--text3)' }),

  // Drop zone
  dropZone: (dragging) => ({
    border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border2)'}`,
    borderRadius: 12, padding: '44px 24px', textAlign: 'center', cursor: 'pointer',
    background: dragging ? 'rgba(108,99,255,0.08)' : 'transparent',
    transition: 'all 0.15s',
  }),

  // Buttons
  btnPrimary: { background: 'var(--accent)', color: 'white', border: 'none', padding: '11px 24px', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 },
  btnGhost: { background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', padding: '9px 18px', borderRadius: 9, fontSize: 13, cursor: 'pointer' },
  btnSuccess: { background: 'rgba(34,197,94,0.12)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.25)', padding: '10px 20px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 },

  // Progress
  progressBg: { background: 'var(--bg4)', borderRadius: 6, height: 8, overflow: 'hidden', margin: '12px 0' },
  progressFill: (pct) => ({ height: '100%', borderRadius: 6, background: 'var(--accent)', width: `${pct}%`, transition: 'width 0.5s ease' }),

  // Table
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '9px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' },
  td: { padding: '10px 12px', borderBottom: '1px solid var(--border)', color: 'var(--text2)', verticalAlign: 'top' },
  tdMain: { padding: '10px 12px', borderBottom: '1px solid var(--border)', color: 'var(--text)', verticalAlign: 'top' },

  // Badge
  badge: (color) => ({ display: 'inline-block', fontSize: 11, fontWeight: 500, padding: '2px 7px', borderRadius: 5, background: `color-mix(in srgb, ${color} 15%, transparent)`, color }),

  // Alert
  alert: (type) => ({
    padding: '12px 16px', borderRadius: 9, marginBottom: 16, fontSize: 13,
    background: type === 'error' ? 'rgba(239,68,68,0.1)' : type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(108,99,255,0.1)',
    border: `1px solid ${type === 'error' ? 'rgba(239,68,68,0.2)' : type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(108,99,255,0.2)'}`,
    color: type === 'error' ? 'var(--red)' : type === 'success' ? 'var(--green)' : 'var(--accent2)',
  }),
}

// ─── APP ────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState('upload')   // upload | preview | optimizing | done
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [uploadResult, setUploadResult] = useState(null)
  const [jobId, setJobId] = useState(null)
  const [jobStatus, setJobStatus] = useState(null)
  const [editedResults, setEditedResults] = useState([])
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [starting, setStarting] = useState(false)
  const pollRef = useRef(null)
  const fileRef = useRef(null)

  // ── POLLING ────────────────────────────────────────────────
  const startPolling = useCallback((jId) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const status = await pollStatus(jId)
        setJobStatus(status)
        if (status.status === 'complete') {
          clearInterval(pollRef.current)
          setEditedResults(status.preview || [])
          setPhase('done')
        } else if (status.status === 'error') {
          clearInterval(pollRef.current)
          setError(status.error || 'Optimization failed')
          setPhase('preview')
        }
      } catch {
        // network hiccup — keep polling
      }
    }, 1500)
  }, [])

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  // ── HANDLERS ──────────────────────────────────────────────
  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFileSelected(f)
  }

  async function handleFileSelected(f) {
    if (!f.name.match(/\.(csv|tsv|txt)$/i)) {
      setError('Please upload a CSV file')
      return
    }
    setFile(f)
    setError('')
    setUploading(true)
    try {
      const result = await uploadCSV(f)
      setUploadResult(result)
      setPhase('preview')
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed — check the file format')
    }
    setUploading(false)
  }

  async function handleStartOptimize() {
    if (!uploadResult?.sessionId) return
    setStarting(true)
    setError('')
    try {
      const { jobId: jId } = await startOptimize(uploadResult.sessionId)
      setJobId(jId)
      setPhase('optimizing')
      setJobStatus({ status: 'pending', total: uploadResult.total, processed: 0, progress: 0 })
      startPolling(jId)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start optimization')
    }
    setStarting(false)
  }

  function handleReset() {
    setPhase('upload')
    setFile(null)
    setUploadResult(null)
    setJobId(null)
    setJobStatus(null)
    setEditedResults([])
    setError('')
    if (pollRef.current) clearInterval(pollRef.current)
  }

  function handleEditTitle(idx, newTitle) {
    setEditedResults(prev => prev.map((r, i) => i === idx ? { ...r, optimized_title: newTitle } : r))
  }

  function downloadFeed() {
    window.open(getDownloadUrl(jobId, 'feed'), '_blank')
  }

  function downloadReport() {
    window.open(getDownloadUrl(jobId, 'report'), '_blank')
  }

  // ── DERIVED ───────────────────────────────────────────────
  const stepDefs = [
    { n: 1, label: 'Upload CSV' },
    { n: 2, label: 'Preview & confirm' },
    { n: 3, label: 'AI optimization' },
    { n: 4, label: 'Download feed' },
  ]
  const phaseIndex = { upload: 0, preview: 1, optimizing: 2, done: 3 }
  const currentStep = phaseIndex[phase]

  const progress = jobStatus?.progress || 0
  const isComplete = phase === 'done'

  return (
    <div style={S.page}>
      {/* HEADER */}
      <div style={S.header}>
        <div style={S.logo}>
          <div style={S.logoIcon}>
            <svg viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <div>
            <div style={S.logoText}>FeedHero</div>
            <div style={S.logoSub}>Google Shopping Title Optimizer</div>
          </div>
        </div>
        {phase !== 'upload' && (
          <button onClick={handleReset} style={S.btnGhost}>Start over</button>
        )}
      </div>

      {/* MAIN */}
      <div style={S.main}>

        {/* STEPS */}
        <div style={S.steps}>
          {stepDefs.map(step => {
            const done = currentStep > step.n - 1
            const active = currentStep === step.n - 1
            return (
              <div key={step.n} style={S.step(active, done)}>
                <div style={S.stepNum(active, done)}>
                  {done ? '✓' : step.n}
                </div>
                <div style={S.stepLabel(active, done)}>{step.label}</div>
              </div>
            )
          })}
        </div>

        {/* ERROR */}
        {error && <div style={S.alert('error')}>⚠ {error}</div>}

        {/* ── STEP 1: UPLOAD ── */}
        {phase === 'upload' && (
          <div style={S.card}>
            <div style={S.cardTitle}>Upload your Merchant Center CSV</div>
            <div
              style={S.dropZone(dragging)}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <div style={{ fontSize: 36, opacity: 0.25, marginBottom: 12 }}>📄</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                {uploading ? 'Uploading...' : 'Drop your CSV here or click to browse'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
                Google Merchant Center feed format · Max 50MB
              </div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['id', 'title', 'description', 'brand', 'product_type', 'colour', 'size', 'material'].map(c => (
                  <span key={c} style={{ background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 8px', fontSize: 11, color: 'var(--text2)' }}>{c}</span>
                ))}
              </div>
              {uploading && (
                <div style={{ marginTop: 16 }}>
                  <div style={S.progressBg}>
                    <div style={{ ...S.progressFill(100), animation: 'pulse 1.5s infinite alternate' }} />
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.tsv,.txt"
              style={{ display: 'none' }}
              onChange={e => e.target.files[0] && handleFileSelected(e.target.files[0])}
            />
            <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--bg3)', borderRadius: 9, fontSize: 13, color: 'var(--text2)' }}>
              <strong style={{ color: 'var(--accent2)' }}>How it works:</strong> FeedHero reads every column in your feed and uses Claude AI to rewrite each title — applying the correct keyword order for Google Shopping. Output is a supplemental feed CSV with <code style={{ fontFamily: 'monospace', color: 'var(--teal)' }}>structured_title</code> ready to upload to Merchant Center.
            </div>
          </div>
        )}

        {/* ── STEP 2: PREVIEW ── */}
        {phase === 'preview' && uploadResult && (
          <div>
            <div style={S.card}>
              <div style={S.cardTitle}>Feed preview — {uploadResult.total} products detected</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>ID</th>
                      <th style={S.th}>Current title</th>
                      <th style={S.th}>Brand</th>
                      <th style={S.th}>Product type</th>
                      <th style={S.th}>Colour</th>
                      <th style={S.th}>Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadResult.preview.map((p, i) => (
                      <tr key={i}>
                        <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 11 }}>{p.id || '—'}</td>
                        <td style={S.tdMain}>{p.title || '—'}</td>
                        <td style={S.td}>{p.brand || '—'}</td>
                        <td style={S.td}>{p.product_type || '—'}</td>
                        <td style={S.td}>{p.colour || '—'}</td>
                        <td style={S.td}>{p.size || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {uploadResult.total > 5 && (
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
                  Showing 5 of {uploadResult.total} products
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button onClick={handleStartOptimize} disabled={starting} style={{ ...S.btnPrimary, opacity: starting ? 0.7 : 1, cursor: starting ? 'not-allowed' : 'pointer' }}>
                <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                {starting ? 'Starting...' : `Optimize all ${uploadResult.total} products`}
              </button>
              <button onClick={handleReset} style={S.btnGhost}>Upload different file</button>
              <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>
                ~{Math.ceil(uploadResult.total / 5) * 2}s estimated
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: OPTIMIZING ── */}
        {phase === 'optimizing' && (
          <div style={S.card}>
            <div style={S.cardTitle}>AI optimization in progress</div>
            <div style={{ textAlign: 'center', padding: '20px 0 10px' }}>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                ))}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                {jobStatus?.processed || 0} / {jobStatus?.total || 0} products
              </div>
              <div style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 20 }}>
                Claude AI is rewriting each title using keyword-order formulas
              </div>
              <div style={{ maxWidth: 500, margin: '0 auto' }}>
                <div style={S.progressBg}>
                  <div style={S.progressFill(progress)} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--accent2)', fontWeight: 600 }}>{progress}% complete</div>
              </div>
            </div>
            <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[
                { label: 'Reading columns', done: true },
                { label: 'Detecting product types', done: (jobStatus?.processed || 0) > 0 },
                { label: 'Applying keyword order', done: (jobStatus?.processed || 0) > 2 },
              ].map(s => (
                <div key={s.label} style={{ padding: '10px 14px', background: 'var(--bg3)', borderRadius: 9, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ color: s.done ? 'var(--green)' : 'var(--text3)', fontSize: 14 }}>{s.done ? '✓' : '○'}</span>
                  <span style={{ color: s.done ? 'var(--text)' : 'var(--text3)' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 4: DONE ── */}
        {phase === 'done' && (
          <div>
            {/* Summary */}
            <div style={{ ...S.alert('success'), display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>✓</span>
              <span><strong>{jobStatus?.total} products optimized.</strong> Download your supplemental feed and upload it to Merchant Center.</span>
            </div>

            {/* Download buttons */}
            <div style={{ ...S.card, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={downloadFeed} style={S.btnSuccess}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download supplemental feed
              </button>
              <button onClick={downloadReport} style={S.btnGhost}>
                Download full report (before/after)
              </button>
              <div style={{ marginLeft: 'auto', padding: '8px 14px', background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--accent2)' }}>
                Uses <code style={{ fontFamily: 'monospace' }}>structured_title</code> — Google compliant
              </div>
            </div>

            {/* Preview table with inline editing */}
            <div style={S.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={S.cardTitle} >Preview (first 10 results)</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>Click any optimized title to edit it</div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>ID</th>
                      <th style={S.th}>Original title</th>
                      <th style={S.th}>Optimized title (editable)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editedResults.map((r, i) => (
                      <tr key={i}>
                        <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 11, whiteSpace: 'nowrap' }}>{r.product_id || '—'}</td>
                        <td style={{ ...S.td, color: 'var(--text3)', maxWidth: 240 }}>{r.original_title}</td>
                        <td style={{ ...S.tdMain, maxWidth: 300 }}>
                          <input
                            value={r.optimized_title}
                            onChange={e => handleEditTitle(i, e.target.value)}
                            style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text)', padding: '4px 0', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                            onFocus={e => { e.target.style.borderBottomColor = 'var(--accent)' }}
                            onBlur={e => { e.target.style.borderBottomColor = 'var(--border)' }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* How to upload */}
            <div style={S.card}>
              <div style={S.cardTitle}>How to upload to Merchant Center</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Download the supplemental feed CSV above',
                  'Go to Merchant Center → Products → Feeds → click + (Add feed)',
                  'Choose "Supplemental feed" and upload the CSV file',
                  'Your Shopping ad titles will update within 24 hours — website is unchanged',
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent2)', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{step}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button onClick={handleReset} style={S.btnGhost}>Optimize another feed</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes pulse {
          from { opacity: 0.5; }
          to { opacity: 1; }
        }
        input[type="file"] { display: none; }
      `}</style>
    </div>
  )
}

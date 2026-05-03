import { useState } from 'react'
import { downloadFeedURL } from '../utils/api.js'
import toast from 'react-hot-toast'

export default function ResultsStep({ job, jobId, onReset }) {
  const [results,  setResults]  = useState(job.preview || [])
  const [editIdx,  setEditIdx]  = useState(null)
  const [editVal,  setEditVal]  = useState('')
  const [search,   setSearch]   = useState('')

  const filtered = results.filter(r =>
    !search ||
    (r.original_title  || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.optimized_title || '').toLowerCase().includes(search.toLowerCase())
  )

  function startEdit(i, val) { setEditIdx(i); setEditVal(val) }
  function saveEdit(i) {
    setResults(rs => rs.map((r, j) => j === i ? { ...r, optimized_title: editVal } : r))
    setEditIdx(null)
    toast.success('Title updated')
  }

  function download() {
    window.location.href = downloadFeedURL(jobId)
    toast.success('Downloading supplemental feed...')
  }

  return (
    <div className="max-w-5xl mx-auto">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Products optimized',  value: job.resultCount || 0,  color: 'text-text' },
          { label: 'Completed at',        value: job.completedAt ? new Date(job.completedAt).toLocaleTimeString() : '—', color: 'text-text' },
          { label: 'AI titles generated', value: `${job.resultCount} / ${job.total}`, color: 'text-green' },
        ].map(s => (
          <div key={s.label} className="bg-bg2 border border-border rounded-2xl p-5">
            <p className="text-xs text-text3 mb-2">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div className="bg-bg2 border border-border rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold text-text mb-1">Your supplemental feed is ready</h2>
            <p className="text-sm text-text3">
              Upload this CSV to Merchant Center → Products → Feeds → + New supplemental feed.
              Uses <span className="text-accent2 font-mono text-xs">structured_title</span> — required by Google for AI-generated titles.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={onReset}
              className="border border-border2 text-text2 px-4 py-2 rounded-xl text-sm hover:bg-bg3 transition-colors"
            >
              Optimize another feed
            </button>
            <button
              onClick={download}
              className="flex items-center gap-2 bg-green/10 border border-green/20 text-green px-5 py-2 rounded-xl text-sm font-semibold hover:bg-green/20 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download supplemental feed CSV
            </button>
          </div>
        </div>
      </div>

      {/* Feed preview */}
      <div className="bg-bg2 border border-border rounded-2xl p-5 mb-4">
        <p className="text-xs font-semibold text-text3 uppercase tracking-widest mb-3">Feed preview</p>
        <div className="bg-bg font-mono text-[11px] text-teal rounded-xl p-4 leading-loose max-h-40 overflow-auto">
          <div>id,structured_title,title_type</div>
          {results.slice(0, 6).map((r, i) => (
            <div key={i}>{r.id},"{r.optimized_title}",trained_algorithmic_media</div>
          ))}
          {(job.resultCount || 0) > 6 && (
            <div className="text-text3">... and {job.resultCount - 6} more rows</div>
          )}
        </div>
      </div>

      {/* Results table */}
      <div className="bg-bg2 border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4 gap-3">
          <p className="text-xs font-semibold text-text3 uppercase tracking-widest">
            Preview — click any title to edit before downloading
          </p>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search titles..."
            className="bg-bg3 border border-border text-text text-xs rounded-lg px-3 py-1.5 outline-none focus:border-accent w-52 transition-colors"
          />
        </div>

        {results.length === 0 ? (
          <p className="text-sm text-text3 py-8 text-center">
            Download the CSV to see all {job.resultCount} results.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  {['ID', 'Original title', 'Optimized title — Claude output', ''].map(h => (
                    <th key={h} className="text-left py-2.5 px-3 text-[11px] text-text3 font-semibold uppercase tracking-wide border-b border-border">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-bg3 transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] text-text3 whitespace-nowrap">
                      {r.id || '—'}
                    </td>
                    <td className="py-3 px-3 text-text3 text-xs max-w-[180px] leading-relaxed">
                      {r.original_title}
                    </td>
                    <td className="py-3 px-3 text-accent2 text-xs max-w-[280px] leading-relaxed">
                      {editIdx === i ? (
                        <input
                          value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          onBlur={() => saveEdit(i)}
                          onKeyDown={e => e.key === 'Enter' && saveEdit(i)}
                          autoFocus
                          className="w-full bg-bg3 border border-accent text-text text-xs px-2 py-1 rounded outline-none"
                        />
                      ) : (
                        <span
                          onClick={() => startEdit(i, r.optimized_title)}
                          className="cursor-pointer hover:underline"
                          title="Click to edit"
                        >
                          {r.optimized_title}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => startEdit(i, r.optimized_title)}
                        className="text-[11px] text-text3 border border-border2 px-2 py-0.5 rounded hover:bg-bg3 transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

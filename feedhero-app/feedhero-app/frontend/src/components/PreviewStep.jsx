import { useState } from 'react'
import { startOptimization } from '../utils/api.js'
import toast from 'react-hot-toast'

export default function PreviewStep({ upload, onOptimizeStart }) {
  const [loading, setLoading] = useState(false)

  async function start() {
    setLoading(true)
    try {
      const { jobId, total } = await startOptimization(upload.filePath, upload.fileName)
      onOptimizeStart(jobId, total)
    } catch (e) {
      toast.error(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="bg-bg2 border border-border rounded-2xl p-6 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-text mb-1">
              <span className="text-accent2">{upload.totalRows}</span> products detected from{' '}
              <span className="font-mono text-sm text-text3">{upload.fileName}</span>
            </h2>
            <p className="text-sm text-text3">
              Columns found: <span className="text-text2">{upload.columns.join(', ')}</span>
            </p>
          </div>
          <button
            onClick={start}
            disabled={loading}
            className="flex items-center gap-2 bg-accent hover:bg-accent2 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors flex-shrink-0"
          >
            {loading ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            )}
            {loading ? 'Starting...' : `Optimize all ${upload.totalRows} titles`}
          </button>
        </div>
      </div>

      {/* Preview table */}
      <div className="bg-bg2 border border-border rounded-2xl p-6">
        <p className="text-xs font-semibold text-text3 uppercase tracking-widest mb-4">
          Preview — first 5 products from your feed
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {['ID', 'Current title', 'Category', 'Brand', 'Detected attributes'].map(h => (
                  <th key={h} className="text-left py-2.5 px-3 text-[11px] text-text3 font-semibold uppercase tracking-wide border-b border-border">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {upload.preview.map((p, i) => {
                const attrs = Object.entries(p.attributes || {})
                  .filter(([, v]) => v)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(' · ')
                return (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-bg3 transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] text-text3">{p.id || '—'}</td>
                    <td className="py-3 px-3 text-text max-w-[180px]">{p.title}</td>
                    <td className="py-3 px-3">
                      {p.category ? (
                        <span className="bg-teal/10 text-teal text-[10px] px-2 py-0.5 rounded font-medium">
                          {p.category.split('>').pop().trim()}
                        </span>
                      ) : (
                        <span className="text-text3 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-text2 text-xs">{p.brand || '—'}</td>
                    <td className="py-3 px-3 text-xs text-text3">{attrs || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {upload.totalRows > 5 && (
          <p className="text-xs text-text3 mt-4 text-center">
            + {upload.totalRows - 5} more products will be processed
          </p>
        )}
      </div>
    </div>
  )
}

import { useState, useRef } from 'react'
import { uploadCSV } from '../utils/api.js'
import toast from 'react-hot-toast'

const SAMPLE_CSV = `id,title,description,product_type,brand,colour,size,material,gender
BED-001,Grey King Bed,Large ottoman storage bed,Furniture > Beds > Ottoman,Chesworth,Grey,King Size,Fabric,
BED-002,Double Divan Charcoal,Divan bed with 4 drawers,Furniture > Beds > Divan,Silentnight,Charcoal,Double,Fabric,
SOF-001,Large Grey Corner Sofa,L-shape left hand corner sofa,Furniture > Sofas > Corner,Loft,Grey,4 Seater,Fabric,
SOF-002,Navy Sofa Bed Double,Pull-out sofa bed in navy fabric,Furniture > Sofas > Sofa Beds,Argos Home,Navy,Double,Fabric,
ELC-001,Black iPhone 15 Case,Military-grade drop protection case,Electronics > Phone Cases,Spigen,Black,,,
ELC-002,Sony Noise Cancelling Headphones,Over-ear wireless headphones,Electronics > Headphones,Sony,Black,,,
APP-001,Blue Running Shoes Men,Lightweight road running shoe,Apparel > Footwear > Running,Nike,Blue,UK 10,,male
APP-002,White Trainers Women,Casual everyday trainer,Apparel > Footwear > Trainers,Adidas,White,UK 6,,female`

export default function UploadStep({ onUploadDone }) {
  const [dragging,  setDragging]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef()

  async function handleFile(file) {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['csv', 'tsv', 'txt'].includes(ext)) {
      toast.error('Please upload a CSV file')
      return
    }
    setUploading(true)
    try {
      const data = await uploadCSV(file)
      onUploadDone(data)
      toast.success(`${data.totalRows} products detected`)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setUploading(false)
    }
  }

  function loadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    handleFile(new File([blob], 'sample_feed.csv', { type: 'text/csv' }))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-bg2 border border-border rounded-2xl p-8">

        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-text mb-1">
              Upload your Merchant Center feed
            </h2>
            <p className="text-sm text-text3 leading-relaxed">
              FeedHero reads <strong className="text-text2">every column</strong> — title, description,
              product_type, brand, colour, size, material, gender — and sends only your real data to Claude.
              Nothing is invented.
            </p>
          </div>
          <button
            onClick={loadSample}
            disabled={uploading}
            className="ml-4 text-xs text-text2 border border-border2 px-3 py-1.5 rounded-lg hover:bg-bg3 transition-colors whitespace-nowrap disabled:opacity-50"
          >
            Load sample CSV
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e  => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e      => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
          onClick={() => !uploading && inputRef.current?.click()}
          className={[
            'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200',
            dragging  ? 'border-accent bg-accent/5'                       : '',
            !dragging ? 'border-border2 hover:border-accent/40 hover:bg-bg3/40' : '',
            uploading ? 'pointer-events-none opacity-60'                  : '',
          ].join(' ')}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.tsv,.txt"
            className="hidden"
            onChange={e => handleFile(e.target.files[0])}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="animate-spin" style={{ animationDuration: '0.8s' }}>
                <circle cx="12" cy="12" r="10" stroke="#353545" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#6c63ff" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <p className="text-sm text-text2">Parsing your feed...</p>
            </div>
          ) : (
            <>
              <div className="text-5xl opacity-25 mb-4">📄</div>
              <p className="text-sm font-medium text-text2 mb-1">
                Drop your CSV here or click to browse
              </p>
              <p className="text-xs text-text3 mb-5">
                Supports Google Merchant Center feed format · max 20 MB
              </p>
              <div className="flex gap-1.5 justify-center flex-wrap">
                {['id','title','description','product_type','brand','colour','size','material','gender'].map(c => (
                  <span key={c} className="bg-bg4 border border-border text-text2 text-[10px] px-2 py-0.5 rounded font-mono">
                    {c}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Guarantees */}
        <div className="grid grid-cols-2 gap-2.5 mt-6">
          {[
            'Reads every column from your real feed',
            'Never invents attributes you did not provide',
            'Outputs id + structured_title (Google compliant)',
            'Supplemental feed — your website stays unchanged',
          ].map(t => (
            <div key={t} className="flex gap-2 text-xs text-text2">
              <span className="text-green flex-shrink-0">✓</span> {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

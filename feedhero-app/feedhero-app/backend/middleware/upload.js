import multer from 'multer'
import path from 'path'
import fs from 'fs'
import os from 'os'

const UPLOAD_DIR = path.join(os.tmpdir(), 'feedhero-uploads')

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const stamp = Date.now()
    const safe  = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    cb(null, `${stamp}_${safe}`)
  },
})

function fileFilter(_req, file, cb) {
  const ok = ['.csv', '.tsv', '.txt']
  if (ok.includes(path.extname(file.originalname).toLowerCase())) cb(null, true)
  else cb(new Error('Only CSV / TSV files are accepted'))
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
})

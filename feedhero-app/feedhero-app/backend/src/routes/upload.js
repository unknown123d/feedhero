import express from 'express'
import multer from 'multer'
import path from 'path'
import os from 'os'
import { v4 as uuidv4 } from 'uuid'
import { parseCSV } from '../services/csvService.js'

const router = express.Router()

// Store uploaded files in OS temp dir
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (['.csv', '.tsv', '.txt'].includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Only CSV files are accepted'))
    }
  },
})

/**
 * POST /api/upload
 * Accepts a CSV file, parses it, returns product list + a session ID
 */
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const products = await parseCSV(req.file.path)

    if (products.length === 0) {
      return res.status(400).json({
        error: 'No valid products found. Check your CSV has id and title columns.',
      })
    }

    // Generate a session ID to tie upload → optimize → download
    const sessionId = uuidv4()

    // Store file path in global map (keyed by sessionId)
    // so the optimize route can access it
    global.uploadedFiles = global.uploadedFiles || new Map()
    global.uploadedFiles.set(sessionId, {
      filePath: req.file.path,
      products,
      uploadedAt: new Date(),
    })

    // Return preview (first 5 rows) + stats
    res.json({
      sessionId,
      total: products.length,
      preview: products.slice(0, 5),
      columns: Object.keys(products[0]._raw || {}).filter(k => !k.startsWith('_')),
      message: `${products.length} products ready to optimize`,
    })
  } catch (err) {
    next(err)
  }
})

export default router

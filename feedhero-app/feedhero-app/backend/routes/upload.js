import express from 'express'
import { upload }               from '../middleware/upload.js'
import { parseCSVFile, mapRowToProduct } from '../utils/csvParser.js'

export const uploadRouter = express.Router()

/**
 * POST /api/upload
 * Accepts a CSV file, parses it, returns product count + column list + preview.
 */
uploadRouter.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }

  try {
    const rows     = await parseCSVFile(req.file.path)

    if (!rows.length) {
      return res.status(400).json({ error: 'CSV appears empty or could not be parsed' })
    }

    const products = rows.map(mapRowToProduct)

    return res.json({
      filePath:  req.file.path,
      fileName:  req.file.originalname,
      totalRows: products.length,
      columns:   Object.keys(rows[0]),
      preview:   products.slice(0, 5),
    })
  } catch (err) {
    console.error('[/upload error]', err)
    return res.status(500).json({ error: err.message })
  }
})

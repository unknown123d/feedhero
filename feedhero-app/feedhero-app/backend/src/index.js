import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import uploadRouter from './routes/upload.js'
import optimizeRouter from './routes/optimize.js'
import downloadRouter from './routes/download.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({ origin: 'http://localhost:3000' }))
app.use(express.json())

// Routes
app.use('/api/upload', uploadRouter)
app.use('/api/optimize', optimizeRouter)
app.use('/api/download', downloadRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  })
})

app.listen(PORT, () => {
  console.log(`✅ FeedHero backend running on http://localhost:${PORT}`)
})

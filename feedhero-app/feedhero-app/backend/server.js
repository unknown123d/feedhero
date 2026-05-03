import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { uploadRouter }   from './routes/upload.js'
import { optimizeRouter } from './routes/optimize.js'
import { jobsRouter }     from './routes/jobs.js'

const app  = express()
const PORT = process.env.PORT || 4000

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }))
app.use(express.json())

app.use('/api/upload',   uploadRouter)
app.use('/api/optimize', optimizeRouter)
app.use('/api/jobs',     jobsRouter)

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', ts: new Date().toISOString() })
)

app.listen(PORT, () =>
  console.log(`\n🚀 FeedHero backend → http://localhost:${PORT}\n`)
)

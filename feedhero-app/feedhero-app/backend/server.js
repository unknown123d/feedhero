import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { uploadRouter }   from './routes/upload.js'
import { optimizeRouter } from './routes/optimize.js'
import { jobsRouter }     from './routes/jobs.js'

const app  = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

app.use('/api/upload',   uploadRouter)
app.use('/api/optimize', optimizeRouter)
app.use('/api/jobs',     jobsRouter)

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', ts: new Date().toISOString() })
)

app.listen(PORT, () =>
  console.log(`FeedHero backend running on port ${PORT}`)
)

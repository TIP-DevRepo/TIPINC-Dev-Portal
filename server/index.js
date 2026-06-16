import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Security & middleware
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(morgan('dev'))
app.use(express.json())

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'TIPINC Dev Portal API is running',
    version: 'v0.0.01',
    environment: process.env.NODE_ENV || 'development'
  })
})

// 404 catch-all
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})
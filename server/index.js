import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'

import appsRouter from './routes/apps.js'
import clientsRouter from './routes/clients.js'
import requestsRouter from './routes/requests.js'
import changelogsRouter from './routes/changelogs.js'
import rolesRouter from './routes/roles.js'
import appAssignmentsRouter from './routes/appAssignments.js'
import deploymentsRouter from './routes/deployments.js'
import auditLogRouter from './routes/auditLog.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Security & middleware
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(morgan('dev'))
app.use(express.json())

// Force HTTPS in production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect('https://' + req.headers.host + req.url)
  }
  next()
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'TIPINC Dev Portal API is running',
    version: 'v0.0.03',
    environment: process.env.NODE_ENV || 'development'
  })
})

// Routes
app.use('/api/apps', appsRouter)
app.use('/api/clients', clientsRouter)
app.use('/api/requests', requestsRouter)
app.use('/api/changelogs', changelogsRouter)
app.use('/api/roles', rolesRouter)
app.use('/api/app-assignments', appAssignmentsRouter)
app.use('/api/deployments', deploymentsRouter)
app.use('/api/audit-log', auditLogRouter)

// 404 catch-all
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})
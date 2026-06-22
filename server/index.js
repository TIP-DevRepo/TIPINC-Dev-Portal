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
import notificationsRouter from './routes/notifications.js'
import analyticsRouter from './routes/analytics.js'
import notesRouter from './routes/notes.js'
import authRouter from './routes/auth.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// CORS must come first before anything else
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Handle preflight requests
app.options('*', cors())

// Security & middleware
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())

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
app.use('/api/notifications', notificationsRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/notes', notesRouter)
app.use('/api/auth', authRouter)

// 404 catch-all
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})
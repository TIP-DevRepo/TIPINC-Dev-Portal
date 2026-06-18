import express from 'express'
import { getAllApps, getAppById, createApp } from '../controllers/apps.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.get('/', getAllApps) // Auth added back when Entra is ready
router.get('/:id', getAppById) // Auth added back when Entra is ready
router.post('/', requireAuth, createApp)

export default router
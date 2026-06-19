import express from 'express'
import { getAuditLog } from '../controllers/auditLog.js'

const router = express.Router()

router.get('/', getAuditLog)

export default router
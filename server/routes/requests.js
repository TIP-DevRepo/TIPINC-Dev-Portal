import express from 'express'
import {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequestStatus,
  assignRequest,
  deleteRequest
} from '../controllers/requests.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.get('/', getAllRequests)
router.get('/:id', getRequestById)
router.post('/', createRequest)
router.patch('/:id/status', requireAuth, updateRequestStatus)
router.patch('/:id/assign', assignRequest)
router.delete('/:id', requireAuth, deleteRequest)

export default router
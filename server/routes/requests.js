import express from 'express'
import {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequestStatus,
  assignRequest,
  unassignRequest,
  deleteRequest
} from '../controllers/requests.js'

const router = express.Router()

router.get('/', getAllRequests)
router.get('/:id', getRequestById)
router.post('/', createRequest)
router.patch('/:id/status', updateRequestStatus)
router.patch('/:id/assign', assignRequest)
router.patch('/:id/unassign', unassignRequest)
router.delete('/:id', deleteRequest)

export default router
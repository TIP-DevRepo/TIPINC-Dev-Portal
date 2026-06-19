import express from 'express'
import {
  getAssignmentsByUser,
  getAllAssignments,
  assignUserToApp,
  removeUserFromApp
} from '../controllers/appAssignments.js'

const router = express.Router()

router.get('/all', getAllAssignments)
router.get('/:userId', getAssignmentsByUser)
router.post('/', assignUserToApp)
router.delete('/', removeUserFromApp)

export default router
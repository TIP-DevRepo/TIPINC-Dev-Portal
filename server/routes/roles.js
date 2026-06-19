import express from 'express'
import {
  getAllRoles,
  assignRole,
  removeRole
} from '../controllers/roles.js'

const router = express.Router()

router.get('/', getAllRoles)
router.post('/', assignRole)
router.delete('/:userId', removeRole)

export default router
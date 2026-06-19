import express from 'express'
import {
  createDeployment,
  getChangelogs,
  getVersionHistory
} from '../controllers/deployments.js'

const router = express.Router()

router.post('/', createDeployment)
router.get('/changelogs', getChangelogs)
router.get('/versions', getVersionHistory)

export default router
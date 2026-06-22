import express from 'express'
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../controllers/notifications.js'

const router = express.Router()

router.get('/:userId', getNotifications)
router.patch('/:id/read', markAsRead)
router.patch('/user/:userId/read-all', markAllAsRead)
router.delete('/:id', deleteNotification)

export default router
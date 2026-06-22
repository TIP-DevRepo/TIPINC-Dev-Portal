import express from 'express'
import { getNotes, addNote, deleteNote } from '../controllers/notes.js'

const router = express.Router()

router.get('/:requestId', getNotes)
router.post('/', addNote)
router.delete('/:id', deleteNote)

export default router
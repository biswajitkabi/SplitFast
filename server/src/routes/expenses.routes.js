import { Router } from 'express'
import {
  addExpense,
  getGroupExpenses,
  deleteExpense,
  recordSettlement
} from '../controllers/expenses.controller.js'

const router = Router()

router.post('/',                     addExpense)
router.get('/group/:groupId',        getGroupExpenses)
router.delete('/:id',                deleteExpense)
router.post('/settle',               recordSettlement)

export default router
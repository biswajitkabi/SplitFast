import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { io } from '../server.js'
import { emitToGroup } from '../socket/socket.handler.js'
import { getNetBalances } from '../services/debt.service.js'
import { pushActivity } from '../services/redis.service.js'
import { sendPushToGroup } from '../services/push.service.js'


const prisma = new PrismaClient()

// Zod validation schema
const expenseSchema = z.object({
  groupId:     z.string().min(1),
  description: z.string().min(1).max(100),
  amount:      z.number().positive(),
  category:    z.string().optional().default('general'),
  splitType:   z.enum(['equal', 'exact', 'percent']).default('equal'),
  splits:      z.array(z.object({
    userId:  z.string(),
    amount:  z.number().optional(),
    percent: z.number().optional()
  })).min(1)
})

// POST /api/expenses
export async function addExpense(req, res) {
  const parsed = expenseSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  const { groupId, description, amount, category, splitType, splits } = parsed.data

  // Verify user is in the group
  const member = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: req.user.id, groupId } }
  })
  if (!member) return res.status(403).json({ error: 'Not a group member' })

  // Compute split amounts
  let splitData = []

  if (splitType === 'equal') {
    const perPerson = Math.round((amount / splits.length) * 100) / 100
    splitData = splits.map(s => ({ userId: s.userId, amount: perPerson }))
  } else if (splitType === 'exact') {
    const total = splits.reduce((sum, s) => sum + (s.amount || 0), 0)
    if (Math.abs(total - amount) > 0.01) {
      return res.status(400).json({ error: 'Exact splits must sum to total amount' })
    }
    splitData = splits.map(s => ({ userId: s.userId, amount: s.amount }))
  } else if (splitType === 'percent') {
    const totalPct = splits.reduce((sum, s) => sum + (s.percent || 0), 0)
    if (Math.abs(totalPct - 100) > 0.01) {
      return res.status(400).json({ error: 'Percentages must sum to 100' })
    }
    splitData = splits.map(s => ({
      userId:  s.userId,
      amount:  Math.round((s.percent / 100) * amount * 100) / 100,
      percent: s.percent
    }))
  }

  const expense = await prisma.expense.create({
    data: {
      description,
      amount,
      category,
      splitType,
      paidById: req.user.id,
      groupId,
      splits: { create: splitData }
    },
    include: {
      paidBy: true,
      splits: { include: { user: true } }
    }
  })

  // Recompute balances after new expense
  const allExpenses = await prisma.expense.findMany({
    where:   { groupId },
    include: { splits: true }
  })
  const balances = getNetBalances(allExpenses)

  // Emit real-time update to all group members
  emitToGroup(io, groupId, 'expense:added', {
    expense,
    balances
  })

  await sendPushToGroup(groupId, {
  title: `${req.user.name} added an expense`,
  body:  `${description} — ₹${amount}`,
  data:  { groupId }
}, req.user.id)

await pushActivity(groupId, {
  type:   'expense_added',
  actor:  { id: req.user.id, name: req.user.name, avatar: req.user.avatar },
  text:   `added "${description}" for ₹${amount}`,
  groupId
})

  res.status(201).json({ expense })
}

// GET /api/expenses/group/:groupId
export async function getGroupExpenses(req, res) {
  const { groupId } = req.params
  const { page = 1, limit = 20 } = req.query

  const expenses = await prisma.expense.findMany({
    where:   { groupId },
    include: {
      paidBy: true,
      splits: { include: { user: true } }
    },
    orderBy: { createdAt: 'desc' },
    skip:    (page - 1) * limit,
    take:    parseInt(limit)
  })

  const total = await prisma.expense.count({ where: { groupId } })

  res.json({ expenses, total, page: parseInt(page), limit: parseInt(limit) })
}

// DELETE /api/expenses/:id
export async function deleteExpense(req, res) {
  const expense = await prisma.expense.findUnique({
    where: { id: req.params.id }
  })

  if (!expense) return res.status(404).json({ error: 'Expense not found' })
  if (expense.paidById !== req.user.id) {
    return res.status(403).json({ error: 'Only the payer can delete this expense' })
  }

  await prisma.expenseSplit.deleteMany({ where: { expenseId: expense.id } })
  await prisma.expense.delete({ where: { id: expense.id } })

  // Recompute + emit
  const allExpenses = await prisma.expense.findMany({
    where:   { groupId: expense.groupId },
    include: { splits: true }
  })
  const balances = getNetBalances(allExpenses)

  emitToGroup(io, expense.groupId, 'expense:deleted', {
    expenseId: expense.id,
    balances
  })

  res.json({ success: true })
}

// POST /api/expenses/settle
export async function recordSettlement(req, res) {
  const { groupId, toId, amount, upiRef } = req.body

  const settlement = await prisma.settlement.create({
    data: {
      fromId: req.user.id,
      toId,
      groupId,
      amount,
      upiRef
    }
  })

  emitToGroup(io, groupId, 'settlement:recorded', { settlement })

  res.status(201).json({ settlement })
}
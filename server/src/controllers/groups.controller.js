import { PrismaClient } from '@prisma/client'
import { simplifyDebts, getNetBalances } from '../services/debt.service.js'
import { io } from '../server.js'
import { emitToGroup } from '../socket/socket.handler.js'
import { pushActivity, getActivity } from '../services/redis.service.js'

const prisma = new PrismaClient()

// POST /api/groups

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no confusing chars like 0,O,1,I
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function createGroup(req, res) {
  const { name, description, emoji } = req.body
  if (!name) return res.status(400).json({ error: 'Group name is required' })

  // Generate unique 6-char code
  let inviteCode
  let exists = true
  while (exists) {
    inviteCode = generateInviteCode()
    exists = await prisma.group.findUnique({ where: { inviteCode } })
  }

  const group = await prisma.group.create({
    data: {
      name,
      description,
      emoji: emoji || '💸',
      inviteCode,
      members: {
        create: { userId: req.user.id, role: 'admin' }
      }
    },
    include: { members: { include: { user: true } } }
  })

  res.status(201).json({ group })
}


export async function deleteGroup(req, res) {
  const member = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: req.user.id, groupId: req.params.id } }
  })

  if (!member) return res.status(403).json({ error: 'Not a member' })

  // Delete all related data first
  const expenses = await prisma.expense.findMany({ where: { groupId: req.params.id } })
  for (const expense of expenses) {
    await prisma.expenseSplit.deleteMany({ where: { expenseId: expense.id } })
  }
  await prisma.expense.deleteMany({ where: { groupId: req.params.id } })
  await prisma.settlement.deleteMany({ where: { groupId: req.params.id } })
  await prisma.groupMember.deleteMany({ where: { groupId: req.params.id } })
  await prisma.group.delete({ where: { id: req.params.id } })

  res.json({ success: true })
}


// GET /api/groups
export async function getMyGroups(req, res) {
  const groups = await prisma.group.findMany({
    where: {
      members: { some: { userId: req.user.id } }
    },
    include: {
      members: { include: { user: true } },
      expenses: {
        include: { splits: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Attach net balance for current user in each group
  const groupsWithBalance = await Promise.all(groups.map(async group => {
    const balances = await getNetBalances(group.expenses)
    return {
      ...group,
      myBalance: balances[req.user.id] || 0
    }
  }))

  res.json({ groups: groupsWithBalance })
}

// GET /api/groups/:id
export async function getGroupById(req, res) {
  const group = await prisma.group.findFirst({
    where: {
      id: req.params.id,
      members: { some: { userId: req.user.id } }
    },
    include: {
      members: { include: { user: true } },
      expenses: {
        include: {
          paidBy: true,
          splits: { include: { user: true } }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!group) return res.status(404).json({ error: 'Group not found' })

  res.json({ group })
}

// GET /api/groups/:id/balances
export async function getGroupBalances(req, res) {
  const expenses = await prisma.expense.findMany({
    where: { groupId: req.params.id },
    include: { splits: true }
  })

  const balances = await getNetBalances(expenses)

  // Hydrate with user info
  const userIds = Object.keys(balances)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, avatar: true, upiId: true }
  })

  const result = users.map(user => ({
    ...user,
    balance: balances[user.id] || 0
  }))

  res.json({ balances: result })
}

// GET /api/groups/:id/settlements
export async function getGroupSettlements(req, res) {
  const expenses = await prisma.expense.findMany({
    where: { groupId: req.params.id },
    include: { splits: true }
  })

  const rawSettlements = simplifyDebts(expenses)

  // Hydrate with user info
  const userIds = [...new Set(rawSettlements.flatMap(s => [s.from, s.to]))]
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, avatar: true, upiId: true }
  })
  const userMap = Object.fromEntries(users.map(u => [u.id, u]))

  const settlements = rawSettlements.map(s => ({
    from:   userMap[s.from],
    to:     userMap[s.to],
    amount: s.amount
  }))

  res.json({ settlements })
}

// POST /api/groups/join/:inviteCode
export async function joinGroupByCode(req, res) {
  const group = await prisma.group.findUnique({
    where: { inviteCode: req.params.inviteCode }
  })
  if (!group) return res.status(404).json({ error: 'Invalid invite code' })

  const existing = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: req.user.id, groupId: group.id } }
  })
  if (existing) return res.status(400).json({ error: 'Already a member' })

  await prisma.groupMember.create({
    data: { userId: req.user.id, groupId: group.id }
  })

  emitToGroup(io, group.id, 'member:joined', {
    groupId: group.id,
    user: { id: req.user.id, name: req.user.name, avatar: req.user.avatar }
  })

  res.json({ group })
}

// PATCH /api/groups/:id
export async function updateGroup(req, res) {
  const { name, description, emoji } = req.body

  const member = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: req.user.id, groupId: req.params.id } }
  })
  if (!member || member.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can update the group' })
  }

  const group = await prisma.group.update({
    where: { id: req.params.id },
    data: { name, description, emoji }
  })

  res.json({ group })
}

export async function getGroupActivity(req, res) {
  const events = await getActivity(req.params.id)
  res.json({ events })
}

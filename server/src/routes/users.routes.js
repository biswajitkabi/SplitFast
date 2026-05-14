import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// GET /api/users/me
router.get("/me", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      upiId: true,
      createdAt: true,
      _count: {
        select: { groupMembers: true }, // ADD THIS
      },
    },
  });
  res.json({ user });
});

// PATCH /api/users/me — update UPI ID, name
router.patch("/me", async (req, res) => {
  const { upiId, name } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { upiId, name },
    select: { id: true, name: true, email: true, avatar: true, upiId: true },
  });
  res.json({ user });
});

// GET /api/users/search?q=email
router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 3) return res.json({ users: [] });

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, email: true, avatar: true },
    take: 5,
  });
  res.json({ users });
});

// GET /api/users/currencies — list of supported currencies
router.get('/currencies', async (req, res) => {
  const currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  ]
  res.json({ currencies })
});

export default router;

# ⚡ SplitFast

> Split expenses at the speed of UPI

**SplitFast** is a real-time expense splitting app built for Indian friend groups, roommates, and travel groups. Create a group, add expenses, and instantly see who owes whom — then settle up directly via GPay, PhonePe, or any UPI app in one tap.

🌐 **Live at [trysplitfast.vercel.app](https://trysplitfast.vercel.app)**

---

## 🚀 Features

- **Google Sign-In** — One-click login, no passwords
- **Group management** — Create groups with emoji, invite friends via WhatsApp
- **Expense splitting** — Equal, exact, or percentage splits
- **Debt simplification** — Graph-based algorithm that minimizes total transactions needed to settle a group
- **Real-time updates** — Balances update instantly across all devices via WebSockets
- **UPI payments** — Pay directly via GPay, PhonePe, Paytm or any UPI app in one tap
- **Mark as paid** — Confirm settlements after UPI payment
- **Activity feed** — WhatsApp-style event history per group
- **Push notifications** — Get notified when someone adds an expense to your group
- **Mobile-first** — Designed for phones, works on all screen sizes

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS |
| State management | Zustand |
| Backend | Node.js, Express |
| Database | PostgreSQL (via Prisma ORM) |
| Cache / Activity feed | Redis |
| Authentication | Google OAuth 2.0 + JWT |
| Real-time | Socket.io WebSockets |
| Payments | UPI deep links |
| Push notifications | Web Push (VAPID) |
| Deployment | Vercel (frontend) + Railway (backend + DB + Redis) |

---

## 📱 How to Use

### 1. Sign in
Visit [trysplitfast.vercel.app](https://trysplitfast.vercel.app) and click **Continue with Google**. No registration needed.

### 2. Set your UPI ID
Go to **Profile** → enter your UPI ID (e.g. `yourname@okaxis`). This allows your friends to pay you directly. Set it once and forget it.

### 3. Create a group
Click **+ New group** on the dashboard. Pick an emoji, give it a name (e.g. "Goa Trip", "Flat 4B", "Office Lunch"), and hit create.

### 4. Invite friends
Inside the group, tap **Invite** — this opens WhatsApp with a pre-filled message containing your group's invite code and a link to join.

### 5. Add an expense
Tap **+ Add expense**, enter what it was for, the amount, and who to split it with. The app handles the math automatically.

### 6. Track balances
Switch to the **Balances** tab to see a real-time breakdown of who owes how much in the group.

### 7. Settle up
Go to the **Settle** tab to see the minimum transactions needed to clear all debts. Tap **Pay via UPI** to open your UPI app directly with the amount pre-filled. After paying, tap **Mark as paid** to record the settlement.

---

## 🧮 The Debt Simplification Algorithm

At the core of SplitFast is a **graph-based debt simplification engine** that solves a classic problem:

> *Given N people with debts between them, find the minimum number of transactions to settle everything.*

**How it works:**
1. Compute the net balance for each person (positive = owed money, negative = owes money)
2. Separate into creditors and debtors
3. Greedily match the largest debtor with the largest creditor
4. Settle the minimum of the two amounts, repeat until all balances are zero

**Example:** In a group of 5 people with 10 different debts, the algorithm reduces it to as few as 4 transactions — instead of everyone paying everyone else.

This is equivalent to a greedy interval scheduling problem and runs in **O(n log n)** time.

---

## 💡 Why SplitFast over Splitwise?

| Feature | SplitFast | Splitwise |
|---|---|---|
| UPI deep-link payments | ✅ One tap | ❌ Not available |
| WhatsApp invite flow | ✅ Built-in | ❌ Manual |
| Real-time balance updates | ✅ WebSockets | ❌ Manual refresh |
| Indian UPI ecosystem | ✅ Native | ❌ Not supported |
| Free forever | ✅ Yes | ⚠️ Freemium |
| Sign in friction | ✅ Google one-tap | ❌ Email + password |

---

## 📸 Screenshots

| Dashboard | Group Detail | Settle Up |
|---|---|---|
| View all your groups and balances | Add expenses and track activity | Minimum transactions with UPI pay |

---

## 🔒 Privacy

- SplitFast does not store any payment information
- UPI payments happen directly between users via their UPI apps — SplitFast never touches the money
- Google login only accesses your name, email, and profile picture
- No ads, ever

---

## 🐛 Known Limitations

- UPI deep links work on **Android only** (iOS has limited UPI support)
- UPI payment success cannot be detected automatically — users must tap "Mark as paid" manually after paying
- Push notifications require browser permission and work on supported browsers only

---

## 👨‍💻 Built By

**Biswajit Kabi**  
Full-stack developer targeting SDE roles at product-based companies.

[![GitHub](https://img.shields.io/badge/GitHub-biswajitkabi-black?logo=github)](https://github.com/biswajitkabi)

---

## 📄 License

MIT License — free to use and modify.

---

*SplitFast — No credit card. No ads. Just split.* ⚡

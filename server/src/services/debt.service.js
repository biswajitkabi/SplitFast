/**
 * Debt Simplification Engine
 *
 * Problem: Given N people with messy debts between them,
 * find the MINIMUM number of transactions to settle all debts.
 *
 * Approach: Net balance reduction (greedy)
 * 1. Compute net balance for each person (positive = owed money, negative = owes money)
 * 2. Greedily match the person who owes the most with the person owed the most
 * 3. Settle the minimum of the two amounts, repeat until all balanced
 *
 * Time complexity: O(n log n) — sorting dominates
 * Space complexity: O(n)
 *
 * Interview talking point: This is equivalent to the "minimum number of arrows
 * to burst balloons" class of greedy problems on a number line.
 */

/**
 * Given a list of expenses + splits for a group,
 * returns the minimum set of transactions to settle all debts.
 *
 * @param {Array} expenses - raw expenses with splits from DB
 * @returns {Array} settlements - [{from, to, amount}]
 */

import { convertToINR } from "./currency.service.js";
export function simplifyDebts(expenses) {
  // Step 1: Build net balance map  { userId -> netAmount }
  // Positive = this person is owed money
  // Negative = this person owes money
  const balances = {};

  for (const expense of expenses) {
    const { paidById, splits } = expense;

    // Person who paid gets credit
    if (!balances[paidById]) balances[paidById] = 0;

    for (const split of splits) {
      if (!balances[split.userId]) balances[split.userId] = 0;

      if (split.userId === paidById) continue; // payer doesn't owe themselves

      // Payer is owed this split amount
      balances[paidById] += split.amount;
      // Split person owes this amount
      balances[split.userId] -= split.amount;
    }
  }

  // Step 2: Separate into creditors (positive) and debtors (negative)
  const creditors = []; // people who are owed money
  const debtors = []; // people who owe money

  for (const [userId, amount] of Object.entries(balances)) {
    const rounded = Math.round(amount * 100) / 100;
    if (rounded > 0) creditors.push({ userId, amount: rounded });
    if (rounded < 0) debtors.push({ userId, amount: Math.abs(rounded) });
  }

  // Sort descending — greedy: settle largest amounts first
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Step 3: Greedy matching
  const settlements = [];
  let i = 0,
    j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    let settleAmount = Math.min(creditor.amount, debtor.amount);
    settleAmount = Math.round(settleAmount * 100) / 100;

    settlements.push({
      from: debtor.userId, // this person pays
      to: creditor.userId, // this person receives
      amount: settleAmount,
    });

    creditor.amount -= settleAmount;
    debtor.amount -= settleAmount;

    // If fully settled, move pointer
    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return settlements;
}

export async function getNetBalances(expenses) {
  const balances = {};

  for (const expense of expenses) {
    const { paidById, splits, currency } = expense;

    if (!balances[paidById]) balances[paidById] = 0;

    for (const split of splits) {
      if (!balances[split.userId]) balances[split.userId] = 0;
      if (split.userId === paidById) continue;

      // Convert split amount to INR
      const amountInINR = await convertToINR(split.amount, currency || "INR");

      balances[paidById] += amountInINR;
      balances[split.userId] -= amountInINR;
    }
  }

  for (const key of Object.keys(balances)) {
    balances[key] = Math.round(balances[key] * 100) / 100;
  }

  return balances;
}

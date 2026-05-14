import { useState } from "react";
import { useGroupStore } from "../store/groupStore";
import { useAuthStore } from "../store/authStore";

export default function AddExpense({ group, onClose }) {
  const { user } = useAuthStore();
  const { addExpense } = useGroupStore();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [splitType, setSplitType] = useState("equal");
  const [selectedMembers, setSelected] = useState(
    group.members.map((m) => m.user.id),
  );
  const [submitting, setSubmitting] = useState(false);

  const members = group.members.map((m) => m.user);

  const toggleMember = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !amount || selectedMembers.length === 0) return;

    setSubmitting(true);
    try {
      await addExpense({
        groupId: group.id,
        description,
        amount: parseFloat(amount),
        currency,
        splitType: "equal",
        splits: selectedMembers.map((userId) => ({ userId })),
      });
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add expense");
    } finally {
      setSubmitting(false);
    }
  };

  const perPerson =
    amount && selectedMembers.length
      ? (parseFloat(amount) / selectedMembers.length).toFixed(2)
      : null;

  const categories = [
    { id: "food", label: "🍕 Food" },
    { id: "transport", label: "🚗 Travel" },
    { id: "grocery", label: "🛒 Grocery" },
    { id: "general", label: "💸 General" },
  ];
  const [category, setCategory] = useState("general");

  const currencies = [
    { code: "INR", symbol: "₹" },
    { code: "USD", symbol: "$" },
    { code: "EUR", symbol: "€" },
    { code: "GBP", symbol: "£" },
    { code: "AED", symbol: "د.إ" },
    { code: "SGD", symbol: "S$" },
    { code: "THB", symbol: "฿" },
    { code: "JPY", symbol: "¥" },
  ];
  const [currency, setCurrency] = useState("INR");

  return (
    <div className="bg-gray-900 border border-violet-800 rounded-2xl p-5 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white font-semibold">Add expense</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-white">
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`text-sm px-3 py-1.5 rounded-lg transition-all ${
                category === c.id
                  ? "bg-violet-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Description */}
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this for?"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3
                     text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
        />

        {/* Amount */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
            ₹
          </span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-4 py-3
                       text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 text-lg"
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm mb-1 block">Currency</label>
          <div className="flex gap-2 flex-wrap">
            {currencies.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setCurrency(c.code)}
                className={`text-sm px-3 py-1.5 rounded-lg transition-all ${
                  currency === c.code
                    ? "bg-violet-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {c.symbol} {c.code}
              </button>
            ))}
          </div>
        </div>

        {/* Split among */}
        <div>
          <p className="text-gray-400 text-sm mb-2">Split among</p>
          <div className="space-y-2">
            {members.map((m) => (
              <label
                key={m.id}
                className="flex items-center justify-between bg-gray-800 
                           rounded-xl px-4 py-2.5 cursor-pointer hover:bg-gray-750"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={m.avatar}
                    alt={m.name}
                    className="w-7 h-7 rounded-full"
                  />
                  <span className="text-white text-sm">
                    {m.id === user.id ? "You" : m.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {selectedMembers.includes(m.id) && perPerson && (
                    <span className="text-gray-400 text-sm">₹{perPerson}</span>
                  )}
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(m.id)}
                    onChange={() => toggleMember(m.id)}
                    className="accent-violet-500 w-4 h-4"
                  />
                </div>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !description || !amount}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium
                     py-3 rounded-xl transition-all disabled:opacity-50 active:scale-95"
        >
          {submitting ? "Adding..." : `Add ₹${amount || "0"} expense`}
        </button>
      </form>
    </div>
  );
}

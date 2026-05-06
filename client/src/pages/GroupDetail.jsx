import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGroupStore } from "../store/groupStore";
import { useSocketStore } from "../store/socketStore";
import { useAuthStore } from "../store/authStore";
import AddExpense from "./AddExpense";
import { buildUpiLink, isMobile } from "../lib/upi";
import ActivityFeed from "../components/ActivityFeed";
import api from "../lib/api";

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { joinRoom, leaveRoom } = useSocketStore();
  const {
    activeGroup,
    balances,
    settlements,
    fetchGroup,
    deleteExpense,
    isLoading,
  } = useGroupStore();

  const [tab, setTab] = useState("expenses");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchGroup(id);
    joinRoom(id);
    return () => leaveRoom(id);
  }, [id]);

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(activeGroup.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppInvite = () => {
    const message = `Hey! I'm using SplitFast to split expenses. Join my group *${activeGroup.name}* 💸\n\n*Invite Code:* ${activeGroup.inviteCode}\n\n*Join here:* https://trysplitfast.vercel.app\n\n1. Open the link\n2. Sign in with Google\n3. Click "Join group"\n4. Enter code: *${activeGroup.inviteCode}*`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const handleDeleteGroup = async () => {
    if (!window.confirm("Delete this group? This cannot be undone.")) return;
    try {
      await api.delete(`/groups/${id}`);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete group");
    }
  };

  if (isLoading || !activeGroup) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 py-4">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <span className="text-2xl">{activeGroup.emoji}</span>
          <h1 className="text-white font-bold text-xl flex-1">
            {activeGroup.name}
          </h1>

          {/* WhatsApp Invite */}
          <button
            onClick={handleWhatsAppInvite}
            className="text-xs bg-emerald-900 hover:bg-emerald-800 text-emerald-400 
                       px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Invite
          </button>

          {/* Copy code */}
          <button
            onClick={handleCopyInvite}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 
                       px-3 py-1.5 rounded-lg transition-all"
          >
            {copied ? "✓ Copied!" : "Copy code"}
          </button>

          {/* Delete */}
          <button
            onClick={handleDeleteGroup}
            className="text-xs bg-red-950 hover:bg-red-900 text-red-400 
                       px-3 py-1.5 rounded-lg transition-all"
          >
            Delete
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 p-1 rounded-xl">
          {["expenses", "balances", "settle"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
                tab === t
                  ? "bg-violet-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {/* Expenses tab */}
        {tab === "expenses" && (
          <div>
            <button
              onClick={() => setShowAddExpense(true)}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium
                         py-3 rounded-xl mb-4 transition-all active:scale-95"
            >
              + Add expense
            </button>

            {showAddExpense && (
              <AddExpense
                group={activeGroup}
                onClose={() => setShowAddExpense(false)}
              />
            )}

            <div className="space-y-3">
              {activeGroup.expenses?.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No expenses yet. Add one!</p>
                </div>
              )}
              {activeGroup.expenses?.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  currentUserId={user.id}
                  onDelete={() => deleteExpense(expense.id)}
                />
              ))}
            </div>
            <ActivityFeed groupId={id} />
          </div>
        )}

        {/* Balances tab */}
        {tab === "balances" && (
          <div className="space-y-3">
            {balances.map((b) => (
              <div
                key={b.id}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-4 
                           flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={b.avatar}
                    alt={b.name}
                    className="w-9 h-9 rounded-full border border-gray-700"
                  />
                  <div>
                    <p className="text-white text-sm font-medium">{b.name}</p>
                    <p className="text-gray-500 text-xs">
                      {b.balance > 0
                        ? "gets back"
                        : b.balance < 0
                          ? "owes"
                          : "settled"}
                    </p>
                  </div>
                </div>
                <BalancePill amount={b.balance} />
              </div>
            ))}
          </div>
        )}

        {/* Settle tab */}
        {tab === "settle" && (
          <div className="space-y-3">
            {settlements.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🎉</div>
                <p className="text-white font-medium">All settled up!</p>
                <p className="text-gray-500 text-sm mt-1">
                  No outstanding debts
                </p>
              </div>
            ) : (
              settlements.map((s, i) => (
                <SettlementCard
                  key={i}
                  settlement={s}
                  currentUserId={user.id}
                  groupId={id}
                />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function ExpenseCard({ expense, currentUserId, onDelete }) {
  const isPayer = expense.paidById === currentUserId;
  const myShare = expense.splits?.find((s) => s.userId === currentUserId);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-white font-medium">{expense.description}</p>
          <p className="text-gray-500 text-xs mt-0.5">
            Paid by {isPayer ? "you" : expense.paidBy?.name} •{" "}
            {new Date(expense.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
        <div className="text-right ml-4">
          <p className="text-white font-semibold">
            ₹{expense.amount.toFixed(2)}
          </p>
          {myShare && (
            <p
              className={`text-xs mt-0.5 ${isPayer ? "text-emerald-400" : "text-red-400"}`}
            >
              {isPayer
                ? `you get back ₹${(expense.amount - myShare.amount).toFixed(2)}`
                : `your share ₹${myShare.amount.toFixed(2)}`}
            </p>
          )}
        </div>
      </div>
      {isPayer && (
        <button
          onClick={onDelete}
          className="mt-2 text-xs text-gray-600 hover:text-red-400 transition-colors"
        >
          Delete
        </button>
      )}
    </div>
  );
}

function SettlementCard({ settlement, currentUserId, groupId }) {
  const isDebtor = settlement.from?.id === currentUserId;
  const mobile = isMobile();
  const [paid, setPaid] = useState(false);
  const [marking, setMarking] = useState(false);
  const [showMarkPaid, setShowMarkPaid] = useState(false);

  const handleUpiPay = () => {
    if (!settlement.to?.upiId) {
      alert(`${settlement.to?.name} hasn't set their UPI ID yet`);
      return;
    }
    const link = buildUpiLink({
      upiId: settlement.to.upiId,
      name: settlement.to.name,
      amount: settlement.amount,
      note: "SplitFast settlement",
    });
    window.location.href = link;
    setTimeout(() => setShowMarkPaid(true), 2000);
  };

  const handleMarkPaid = async () => {
    setMarking(true);
    try {
      await api.post("/expenses/settle", {
        groupId,
        toId: settlement.to?.id,
        amount: settlement.amount,
        upiRef: `upi_${Date.now()}`,
      });
      setPaid(true);
    } catch (err) {
      alert("Failed to record settlement");
    } finally {
      setMarking(false);
    }
  };

  if (paid) {
    return (
      <div className="bg-gray-900 border border-emerald-800/50 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 text-2xl">✓</span>
          <div>
            <p className="text-emerald-400 font-medium">Payment recorded!</p>
            <p className="text-gray-500 text-xs mt-0.5">
              ₹{settlement.amount.toFixed(2)} paid to {settlement.to?.name}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-sm">
            <span
              className={isDebtor ? "text-red-400 font-medium" : "text-white"}
            >
              {isDebtor ? "You" : settlement.from?.name}
            </span>
            <span className="text-gray-500"> owe </span>
            <span
              className={
                !isDebtor ? "text-emerald-400 font-medium" : "text-white"
              }
            >
              {!isDebtor ? "you" : settlement.to?.name}
            </span>
          </p>
          <p className="text-white font-bold text-lg mt-0.5">
            ₹{settlement.amount.toFixed(2)}
          </p>
        </div>

        {isDebtor && (
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleUpiPay}
              disabled={!mobile}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40
                         disabled:cursor-not-allowed text-white text-sm font-medium
                         px-4 py-2 rounded-xl transition-all active:scale-95"
              title={!mobile ? "UPI payments work on mobile only" : ""}
            >
              Pay via UPI
            </button>

            {(showMarkPaid || !mobile) && (
              <button
                onClick={handleMarkPaid}
                disabled={marking}
                className="text-xs text-violet-400 hover:text-violet-300
                           border border-violet-800 hover:border-violet-600
                           px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
              >
                {marking ? "Recording..." : "✓ Mark as paid"}
              </button>
            )}
          </div>
        )}
      </div>

      {isDebtor && !mobile && (
        <p className="text-gray-600 text-xs mt-2">
          Open on your phone to pay via GPay / PhonePe, then mark as paid.
        </p>
      )}
    </div>
  );
}

function BalancePill({ amount }) {
  if (Math.abs(amount) < 0.01)
    return <span className="text-gray-500 text-sm">settled</span>;
  if (amount > 0)
    return (
      <span className="text-emerald-400 font-semibold">
        +₹{amount.toFixed(2)}
      </span>
    );
  return (
    <span className="text-red-400 font-semibold">
      -₹{Math.abs(amount).toFixed(2)}
    </span>
  );
}
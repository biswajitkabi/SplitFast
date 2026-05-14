import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const CATEGORY_COLORS = {
  food:      '#8b5cf6',
  transport: '#06b6d4',
  grocery:   '#10b981',
  general:   '#f59e0b',
  rent:      '#ef4444',
  utilities: '#3b82f6',
  other:     '#6b7280',
}

const CATEGORY_LABELS = {
  food:      '🍕 Food',
  transport: '🚗 Travel',
  grocery:   '🛒 Grocery',
  general:   '💸 General',
  rent:      '🏠 Rent',
  utilities: '💡 Utilities',
  other:     '📦 Other',
}

export default function SpendingCharts({ expenses }) {
  if (!expenses || expenses.length === 0) return null

  // Aggregate by category
  const categoryTotals = {}
  expenses.forEach(exp => {
    const cat = exp.category || 'general'
    categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.amount
  })

  const pieData = Object.entries(categoryTotals).map(([cat, amount]) => ({
    name:  CATEGORY_LABELS[cat] || cat,
    value: Math.round(amount * 100) / 100,
    color: CATEGORY_COLORS[cat] || '#6b7280'
  }))

  // Monthly spending trend
  const monthlyTotals = {}
  expenses.forEach(exp => {
    const month = new Date(exp.createdAt).toLocaleDateString('en-IN', {
      month: 'short', year: '2-digit'
    })
    monthlyTotals[month] = (monthlyTotals[month] || 0) + exp.amount
  })

  const barData = Object.entries(monthlyTotals)
    .slice(-6) // last 6 months
    .map(([month, amount]) => ({ month, amount: Math.round(amount) }))

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="space-y-6 mt-4">
      {/* Total */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <p className="text-gray-400 text-sm">Total group spending</p>
        <p className="text-white text-3xl font-bold mt-1">
          ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </p>
        <p className="text-gray-500 text-xs mt-1">
          across {expenses.length} expenses
        </p>
      </div>

      {/* Pie chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <p className="text-white font-medium mb-4">Spending by category</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`₹${value}`, 'Amount']}
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend
              formatter={(value) => (
                <span style={{ color: '#9ca3af', fontSize: '12px' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Bar chart — monthly trend */}
      {barData.length > 1 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-white font-medium mb-4">Monthly spending trend</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData}>
              <XAxis
                dataKey="month"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${v}`}
              />
              <Tooltip
                formatter={(value) => [`₹${value}`, 'Spent']}
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="amount" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category breakdown list */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <p className="text-white font-medium mb-3">Category breakdown</p>
        <div className="space-y-3">
          {pieData
            .sort((a, b) => b.value - a.value)
            .map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-300 text-sm">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-white text-sm font-medium">
                    ₹{item.value.toLocaleString('en-IN')}
                  </span>
                  <span className="text-gray-500 text-xs ml-2">
                    {Math.round((item.value / total) * 100)}%
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
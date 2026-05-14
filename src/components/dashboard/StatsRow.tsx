interface PaySummary { paid: number; pending: number; cash: number; total: number }

interface Props { summary: PaySummary }

export default function StatsRow({ summary }: Props) {
  const stats = [
    {
      label: 'Paid Today',
      value: `PKR ${summary.paid.toLocaleString()}`,
      icon: '✅',
      accent: 'stat-card-green',
      valueClass: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Pending Payment',
      value: `PKR ${summary.pending.toLocaleString()}`,
      icon: '⏳',
      accent: 'stat-card-amber',
      valueClass: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Cash @ Venue',
      value: `PKR ${summary.cash.toLocaleString()}`,
      icon: '💵',
      accent: 'stat-card-blue',
      valueClass: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Total Revenue',
      value: `PKR ${summary.total.toLocaleString()}`,
      icon: '📊',
      accent: 'stat-card-white',
      valueClass: 'text-slate-900 dark:text-white',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {stats.map(s => (
        <div key={s.label} className={`card-dark rounded-xl p-4 ${s.accent}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">{s.label}</span>
            <span className="text-base">{s.icon}</span>
          </div>
          <div className={`text-xl font-black ${s.valueClass}`}>{s.value}</div>
        </div>
      ))}
    </div>
  )
}

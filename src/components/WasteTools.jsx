import { useState } from 'react'

export const isIndianMobile = value => /^[6-9]\d{9}$/.test(String(value).replace(/[\s-]/g, ''))

export function TabBar({ tabs, value, onChange, accent = 'bg-leaf-500', label }) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-1">
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
            value === tab.id ? `${accent} text-emerald-950` : 'opacity-75 hover:bg-white/10 hover:opacity-100'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold">{label}</span>
      {children}
      {hint && <span className="block text-xs opacity-60">{hint}</span>}
    </label>
  )
}

export function Checklist({ items, barClass = 'bg-leaf-500' }) {
  const [done, setDone] = useState({})
  const count = items.filter(item => done[item.id]).length
  const percent = Math.round((count / items.length) * 100)
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-semibold">{count} of {items.length} done</span>
          <span className="font-mono tabular-nums opacity-70">{percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className={`h-full rounded-full transition-all ${barClass}`} style={{ width: `${percent}%` }} />
        </div>
      </div>
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item.id}>
            <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${done[item.id] ? 'border-leaf-400/50 bg-leaf-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
              <input
                type="checkbox"
                checked={Boolean(done[item.id])}
                onChange={e => setDone(prev => ({ ...prev, [item.id]: e.target.checked }))}
                className="mt-1 h-4 w-4 shrink-0 accent-green-500"
              />
              <span className="min-w-0">
                <span className={`block text-sm font-medium ${done[item.id] ? 'line-through opacity-70' : ''}`}>{item.title}</span>
                {item.detail && <span className="mt-0.5 block text-xs opacity-70">{item.detail}</span>}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {count === items.length && <p className="text-sm font-semibold text-leaf-400">All steps done.</p>}
    </div>
  )
}

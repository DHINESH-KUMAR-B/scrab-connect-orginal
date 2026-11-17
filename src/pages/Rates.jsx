import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus, Plus, Search, Trash2 } from 'lucide-react'
import { Glass, Skeleton, useToast } from '../components/ui'
import { api } from '../lib/api'
import { CATEGORIES, impact, predictPrices } from '../lib/ai'
import { useAuth } from '../context/AuthContext'
import AiProductDetector from '../components/AiProductDetector'

const GROUPS = ['All', 'Metals', 'Paper & Card', 'Plastics', 'E-Waste & Appliances', 'Other']

const FALLBACK_RATES = Object.entries(CATEGORIES).map(([category, pricePerKg]) => ({
  category,
  group: /paper|book|cardboard|tetra/i.test(category)
    ? 'Paper & Card'
    : /plastic|pet|hdpe/i.test(category)
      ? 'Plastics'
      : /aluminum|iron|copper|brass|cable/i.test(category)
        ? 'Metals'
        : /waste|phone|electronic|batter|appliance/i.test(category)
          ? 'E-Waste & Appliances'
          : 'Other',
  pricePerKg,
  prevPrice: pricePerKg,
  trend: 'steady',
  changePct: 0,
  demand: 'Normal',
  note: 'Standard sorted household recyclable',
}))

export default function Rates() {
  const { user } = useAuth()
  const nav = useNavigate()
  const toast = useToast()

  const [rates, setRates] = useState([])
  const [loading, setLoading] = useState(true)
  const [group, setGroup] = useState('All')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState('Copper')
  const [bundle, setBundle] = useState([
    { category: 'Newspaper', weight: 6 },
    { category: 'PET bottles', weight: 4 },
  ])

  useEffect(() => {
    let active = true
    api.getRates()
      .then(data => {
        if (active && Array.isArray(data.rates)) {
          setRates(data.rates)
        }
      })
      .catch(() => {
        if (active) setRates(FALLBACK_RATES)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return rates.filter(r => {
      const matchGroup = group === 'All' || r.group === group
      const matchSearch = !q || r.category.toLowerCase().includes(q) || r.note.toLowerCase().includes(q)
      return matchGroup && matchSearch
    })
  }, [rates, group, search])

  const activeRate = useMemo(
    () => rates.find(r => r.category === selected) || rates[0] || null,
    [rates, selected]
  )

  const forecast = useMemo(
    () => (activeRate ? predictPrices(activeRate.pricePerKg, 6) : []),
    [activeRate]
  )

  const addToBundle = category => {
    setBundle(prev => {
      const existing = prev.find(item => item.category === category)
      if (existing) {
        return prev.map(item => item.category === category ? { ...item, weight: item.weight + 2 } : item)
      }
      return [...prev, { category, weight: 5 }]
    })
    toast(`Added ${category} to estimator`)
  }

  const updateBundleWeight = (category, weight) => {
    const val = Math.max(1, Math.min(200, Number(weight) || 1))
    setBundle(prev => prev.map(item => item.category === category ? { ...item, weight: val } : item))
  }

  const removeFromBundle = category => {
    setBundle(prev => prev.filter(item => item.category !== category))
  }

  const rateLookup = useMemo(() => {
    const map = {}
    rates.forEach(r => { map[r.category] = r.pricePerKg })
    return map
  }, [rates])

  const bundleSummary = useMemo(() => {
    const totalKg = bundle.reduce((sum, item) => sum + Number(item.weight || 0), 0)
    const totalPayout = Math.round(
      bundle.reduce((sum, item) => sum + Number(item.weight || 0) * (rateLookup[item.category] ?? CATEGORIES[item.category] ?? 5), 0)
    )
    return { totalKg, totalPayout, eco: impact(totalKg) }
  }, [bundle, rateLookup])

  const bookBundle = () => {
    if (!bundle.length) return
    const payload = bundle.map(item => ({
      category: item.category,
      weight: item.weight,
      pricePerKg: rateLookup[item.category] ?? CATEGORIES[item.category] ?? 5,
    }))
    if (!user) {
      toast('Sign in as a user to schedule this pickup bundle.')
      nav('/login')
      return
    }
    if (user.role !== 'user') {
      toast('Switch to a customer account to book a pickup.')
      return
    }
    nav('/pickup', { state: { bundle: payload } })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Live scrap market & bundle estimator</h1>
          <p className="mt-1 text-sm opacity-70">Compare transparent per-kg rates, inspect 6-month price forecasts, and build a multi-item pickup quote.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" aria-hidden="true" />
          <input
            className="input pl-9"
            placeholder="Search material or grade"
            aria-label="Search scrap categories"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <AiProductDetector
        ratesMap={rateLookup}
        compact
        onApplyCategory={cat => {
          setSelected(cat)
          setGroup('All')
        }}
        onApplyBundle={items => {
          setBundle(prev => {
            const next = [...prev]
            items.forEach(item => {
              const idx = next.findIndex(x => x.category === item.category)
              if (idx >= 0) {
                next[idx] = { ...next[idx], weight: next[idx].weight + item.weight }
              } else {
                next.push(item)
              }
            })
            return next
          })
        }}
      />

      <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/5 p-1" role="tablist" aria-label="Material groups">
        {GROUPS.map(g => (
          <button
            key={g}
            type="button"
            role="tab"
            aria-selected={group === g}
            onClick={() => setGroup(g)}
            className={`whitespace-nowrap shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              group === g ? 'bg-leaf-500 text-emerald-950' : 'opacity-75 hover:bg-white/10 hover:opacity-100'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Glass className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-semibold">Today&apos;s verified rates ({filtered.length})</h2>
            <span className="text-xs opacity-60">Click a row to view 6-month forecast</span>
          </div>
          {filtered.length ? (
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full min-w-[540px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs opacity-60">
                    <th className="py-2 pr-3 font-medium">Material</th>
                    <th className="py-2 pr-3 font-medium">Group</th>
                    <th className="py-2 pr-3 text-right font-medium">Rate / kg</th>
                    <th className="py-2 pr-3 text-right font-medium">Change</th>
                    <th className="py-2 text-right font-medium">Estimator</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => {
                    const isSelected = activeRate?.category === item.category
                    return (
                      <tr
                        key={item.category}
                        onClick={() => setSelected(item.category)}
                        className={`cursor-pointer border-b border-white/10 transition ${
                          isSelected ? 'bg-leaf-500/10' : 'hover:bg-white/5'
                        }`}
                      >
                        <td className="py-3 pr-3">
                          <p className="font-semibold">{item.category}</p>
                          <p className="text-xs opacity-65">{item.note}</p>
                        </td>
                        <td className="py-3 pr-3 text-xs opacity-75">{item.group}</td>
                        <td className="py-3 pr-3 text-right font-mono font-bold tabular-nums">₹{item.pricePerKg}</td>
                        <td className="py-3 pr-3 text-right font-mono text-xs tabular-nums">
                          {item.trend === 'up' ? (
                            <span className="inline-flex items-center gap-0.5 text-leaf-400">
                              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />+{item.changePct}%
                            </span>
                          ) : item.trend === 'down' ? (
                            <span className="inline-flex items-center gap-0.5 text-amber-400">
                              <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />{item.changePct}%
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 opacity-60">
                              <Minus className="h-3.5 w-3.5" aria-hidden="true" />0%
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              addToBundle(item.category)
                            }}
                            className="inline-flex items-center gap-1 whitespace-nowrap shrink-0 rounded-lg border border-white/15 px-2.5 py-1 text-xs font-medium hover:border-leaf-400 hover:bg-leaf-500/15"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-6 text-sm opacity-70">No materials match your search. Clear filters to see all 25 categories.</p>
          )}
        </Glass>

        <div className="space-y-6">
          {activeRate && (
            <Glass>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <div>
                  <p className="text-xs opacity-65">6-month price outlook</p>
                  <h2 className="text-lg font-bold">{activeRate.category}</h2>
                </div>
                <span className="font-mono text-lg font-extrabold tabular-nums text-leaf-400">₹{activeRate.pricePerKg}/kg</span>
              </div>
              <p className="mb-3 text-xs opacity-70">{activeRate.group} · Demand: {activeRate.demand}</p>
              <div className="h-44">
                <ResponsiveContainer>
                  <LineChart data={forecast}>
                    <XAxis dataKey="month" />
                    <YAxis domain={['auto', 'auto']} />
                    <Tooltip />
                    <Line dataKey="price" stroke="#4ade80" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs opacity-65">Preparation tip: {activeRate.note}.</p>
            </Glass>
          )}

          <Glass>
            <h2 className="font-semibold">Bundle payout estimator</h2>
            <p className="mt-1 text-xs opacity-70">Mix multiple scrap types to estimate total earnings and environmental impact.</p>

            {bundle.length ? (
              <div className="mt-4 space-y-3">
                {bundle.map(item => {
                  const unitRate = rateLookup[item.category] ?? CATEGORIES[item.category] ?? 5
                  return (
                    <div key={item.category} className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.category}</p>
                        <p className="text-xs font-mono tabular-nums opacity-65">₹{unitRate}/kg</p>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        aria-label={`${item.category} weight in kg`}
                        value={item.weight}
                        onChange={e => updateBundleWeight(item.category, e.target.value)}
                        className="input !w-20 !py-1 text-right font-mono tabular-nums"
                      />
                      <span className="w-14 text-right font-mono text-xs font-semibold tabular-nums">
                        ₹{Math.round(item.weight * unitRate)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${item.category}`}
                        onClick={() => removeFromBundle(item.category)}
                        className="rounded-lg p-1 opacity-60 hover:bg-white/10 hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  )
                })}

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div>
                    <p className="opacity-65">Total weight</p>
                    <p className="font-mono text-base font-bold tabular-nums">{bundleSummary.totalKg} kg</p>
                  </div>
                  <div className="text-right">
                    <p className="opacity-65">Estimated payout</p>
                    <p className="font-mono text-base font-extrabold tabular-nums text-leaf-400">₹{bundleSummary.totalPayout}</p>
                  </div>
                </div>

                <p className="text-xs tabular-nums opacity-70">
                  Eco-impact: {bundleSummary.eco.co2} kg CO₂ cut · {bundleSummary.eco.water} L water saved · {bundleSummary.eco.energy} kWh preserved
                </p>

                <button
                  type="button"
                  onClick={bookBundle}
                  className="btn flex w-full items-center justify-center gap-2 whitespace-nowrap"
                >
                  Book this bundle <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <p className="mt-4 text-sm opacity-70">Your bundle is empty. Click &ldquo;Add&rdquo; next to any material in the table to build a quote.</p>
            )}
          </Glass>
        </div>
      </div>
    </div>
  )
}

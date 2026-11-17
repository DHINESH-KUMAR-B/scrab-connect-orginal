import { useCallback, useEffect, useState } from 'react'
import { Download, Headphones, Heart, Send, Star } from 'lucide-react'
import { Glass, StatCard, Grid, Skeleton, useToast } from '../components/ui'
import { users as sampleUsers, collectors as sampleCollectors, pickups as samplePickups, monthly as sampleMonthly } from '../data/mock'
import { predictPrices } from '../lib/ai'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area, BarChart, Bar } from 'recharts'
import { api } from '../lib/api'

export default function Admin() {
  const toast = useToast()
  const [q, setQ] = useState('')
  const [st, setSt] = useState('all')
  const [cols, setCols] = useState(sampleCollectors)
  const [allPickups, setAllPickups] = useState(samplePickups)
  const [allUsers, setAllUsers] = useState(sampleUsers)
  const [rates, setRates] = useState([])
  const [monthly, setMonthly] = useState(sampleMonthly)
  const [byGroup, setByGroup] = useState([])
  const [userQuery, setUserQuery] = useState('')
  const [rateDrafts, setRateDrafts] = useState({})
  const [recentReviews, setRecentReviews] = useState([])
  const [tickets, setTickets] = useState([])
  const [activeTicketId, setActiveTicketId] = useState('')
  const [adminReply, setAdminReply] = useState('')
  const [loaded, setLoaded] = useState(false)

  const loadAll = useCallback(async () => {
    try {
      const [pRes, cRes, uRes, rRes, aRes, engRes, tRes] = await Promise.all([
        api.getPickups(),
        api.getCollectors(),
        api.getUsers(),
        api.getRates(),
        api.getAnalytics(),
        api.getEngagement(),
        api.getSupportTickets(),
      ])
      if (Array.isArray(pRes.pickups)) setAllPickups(pRes.pickups)
      if (Array.isArray(cRes.collectors)) setCols(cRes.collectors)
      if (Array.isArray(uRes.users)) setAllUsers(uRes.users)
      if (Array.isArray(rRes.rates)) setRates(rRes.rates)
      if (Array.isArray(aRes.monthly)) setMonthly(aRes.monthly)
      if (Array.isArray(aRes.byGroup)) setByGroup(aRes.byGroup)
      if (Array.isArray(engRes?.reviews)) setRecentReviews(engRes.reviews)
      if (Array.isArray(tRes?.tickets)) {
        setTickets(tRes.tickets)
        setActiveTicketId(prev => prev || tRes.tickets[0]?.id || '')
      }
    } catch {
      // Fallback to sample data if offline
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const verify = async (id, verified) => {
    try {
      await api.verifyCollector(id, verified)
      setCols(prev => prev.map(c => c.id === id ? { ...c, verified } : c))
      toast(verified ? 'Collector verified' : 'Collector verification revoked')
    } catch (error) {
      toast(error.message || 'Unable to update collector status.')
    }
  }

  const assignCollector = async (pickupId, collectorId) => {
    try {
      await api.updatePickup(pickupId, { collectorId: collectorId || null })
      toast(collectorId ? 'Collector assigned' : 'Pickup unassigned')
      loadAll()
    } catch (error) {
      toast(error.message || 'Unable to assign collector.')
    }
  }

  const saveRate = async category => {
    const nextPrice = Number(rateDrafts[category])
    if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
      toast('Enter a valid positive rate.')
      return
    }
    try {
      const res = await api.updateRate(category, nextPrice)
      setRates(prev => prev.map(r => r.category === category ? res.rate : r))
      setRateDrafts(prev => {
        const next = { ...prev }
        delete next[category]
        return next
      })
      toast(`Updated ${category} rate to ₹${res.rate.pricePerKg}/kg`)
    } catch (error) {
      toast(error.message || 'Unable to update rate.')
    }
  }

  const sendAdminReply = async e => {
    e.preventDefault()
    if (!activeTicketId || !adminReply.trim()) return
    try {
      const res = await api.replySupportTicket(activeTicketId, {
        sender: 'support',
        senderName: 'Scrap Connect Admin Care',
        text: adminReply.trim(),
      })
      if (res.ticket) {
        setTickets(prev => prev.map(t => t.id === activeTicketId ? res.ticket : t))
      }
      setAdminReply('')
      toast('Support response sent to member')
    } catch (err) {
      toast(err.message || 'Unable to send support reply.')
    }
  }

  const changeTicketStatus = async (id, status) => {
    try {
      const res = await api.updateSupportTicket(id, status)
      if (res.ticket) {
        setTickets(prev => prev.map(t => t.id === id ? res.ticket : t))
        toast(`Ticket ${id} marked ${status.replace('_', ' ')}`)
      }
    } catch {
      toast('Unable to update ticket status.')
    }
  }

  if (!loaded) return <Grid>{[...Array(4)].map((_, i) => <Skeleton key={i}/>)}</Grid>

  const shown = allPickups.filter(p =>
    (st === 'all' || p.status === st) &&
    `${p.area || ''} ${p.address || ''} ${p.scrapType || ''} ${p.id || ''}`.toLowerCase().includes(q.toLowerCase())
  )
  const verifiedCollectors = cols.filter(c => c.verified)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Admin operations</h1>
          <p className="mt-1 text-sm opacity-70">Verify collectors, dispatch unassigned pickups, manage live market rates, and export logs.</p>
        </div>
        <a
          href={api.getExportCsvUrl()}
          className="btn inline-flex items-center gap-2 whitespace-nowrap text-sm"
        >
          <Download className="h-4 w-4" aria-hidden="true" /> Export all pickups (CSV)
        </a>
      </div>

      <Grid>
        <StatCard label="Users" value={allUsers.length}/>
        <StatCard label="Collectors" value={cols.length}/>
        <StatCard label="Pending verification" value={cols.filter(c => !c.verified).length}/>
        <StatCard label="Revenue (Nov)" value={`₹${monthly[monthly.length - 1]?.revenue ?? 13000}`}/>
      </Grid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Glass>
          <h2 className="mb-2 font-semibold">Monthly revenue</h2>
          <div className="h-48"><ResponsiveContainer><AreaChart data={monthly}><XAxis dataKey="month"/><YAxis/><Tooltip/><Area dataKey="revenue" stroke="#22c55e" fill="#22c55e55"/></AreaChart></ResponsiveContainer></div>
        </Glass>
        <Glass>
          <h2 className="mb-2 font-semibold">Predicted metal price (₹/kg)</h2>
          <div className="h-48"><ResponsiveContainer><LineChart data={predictPrices(35)}><XAxis dataKey="month"/><YAxis domain={['auto', 'auto']}/><Tooltip/><Line dataKey="price" stroke="#4ade80" strokeWidth={3}/></LineChart></ResponsiveContainer></div>
        </Glass>
        <Glass>
          <h2 className="mb-2 font-semibold">Recycled volume by material (kg)</h2>
          <div className="h-48"><ResponsiveContainer><BarChart data={byGroup.length ? byGroup : [{ group: 'Metals', kg: 14 }, { group: 'Paper', kg: 11 }]}><XAxis dataKey="group"/><YAxis/><Tooltip/><Bar dataKey="kg" fill="#4ade80" radius={6}/></BarChart></ResponsiveContainer></div>
        </Glass>
      </div>

      <Glass>
        <h2 className="mb-2 font-semibold">Collector verification</h2>
        <div className="divide-y divide-white/10">
          {cols.map(c => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
              <div>
                <p className="font-medium">{c.name} · {c.vehicle}</p>
                <p className="flex flex-wrap items-center gap-2 text-xs opacity-65">
                  <span>{(c.areas || []).join(', ')} · {c.completedCount ?? 0} completed</span>
                  <span className="inline-flex items-center gap-1 text-amber-300 tabular-nums">
                    <Star className="h-3 w-3 fill-amber-300" aria-hidden="true" /> {c.rating || '0.0'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-rose-300 tabular-nums">
                    <Heart className="h-3 w-3 fill-rose-400 text-rose-400" aria-hidden="true" /> {c.likesCount ?? 0}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold ${c.verified ? 'text-leaf-400' : 'text-amber-300'}`}>
                  {c.verified ? 'Verified' : 'Pending review'}
                </span>
                {c.verified ? (
                  <button type="button" className="rounded-lg border border-white/15 px-2.5 py-1 text-xs hover:bg-white/10" onClick={() => verify(c.id, false)}>
                    Revoke
                  </button>
                ) : (
                  <button type="button" className="btn !py-1 !px-3 text-xs" onClick={() => verify(c.id, true)}>
                    Verify
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Glass>

      <Glass>
        <h2 className="mb-2 font-semibold">Pickups &amp; dispatch</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          <input className="input w-full sm:flex-1" placeholder="Search area, category, ID" aria-label="Search pickups" value={q} onChange={e => setQ(e.target.value)}/>
          <select className="input w-full sm:!w-40" aria-label="Status" value={st} onChange={e => setSt(e.target.value)}>
            <option value="all">All</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="divide-y divide-white/10">
          {shown.map(p => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
              <div>
                <p className="font-medium">{p.id} · {p.address || p.area}</p>
                <p className="text-xs opacity-65">{p.scrapType} · <span className="font-mono tabular-nums">{p.weight} kg</span> · <span className="font-mono tabular-nums">₹{p.price}</span> · {p.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs capitalize opacity-75">{p.status}</span>
                {p.status === 'scheduled' && (
                  <select
                    aria-label={`Assign collector for ${p.id}`}
                    value={p.collectorId || ''}
                    onChange={e => assignCollector(p.id, e.target.value)}
                    className="input !w-44 !py-1 text-xs"
                  >
                    <option value="">Unassigned</option>
                    {verifiedCollectors.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
        {!shown.length && <p className="text-sm opacity-70">No pickups match. Clear the search or change the status filter.</p>}
      </Glass>

      {rates.length > 0 && (
        <Glass>
          <h2 className="mb-1 font-semibold">Live scrap rate controls</h2>
          <p className="mb-3 text-xs opacity-70">Adjust market rates per kg; changes update the live rate board and booking estimator immediately.</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {rates.slice(0, 9).map(r => (
              <div key={r.category} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 p-2.5 text-xs">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{r.category}</p>
                  <p className="font-mono tabular-nums opacity-65">Current: ₹{r.pricePerKg}/kg</p>
                </div>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  aria-label={`New rate for ${r.category}`}
                  placeholder={String(r.pricePerKg)}
                  value={rateDrafts[r.category] ?? ''}
                  onChange={e => setRateDrafts(prev => ({ ...prev, [r.category]: e.target.value }))}
                  className="input !w-20 !py-1 text-right font-mono tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => saveRate(r.category)}
                  className="rounded-lg border border-leaf-400/40 px-2.5 py-1 font-medium text-leaf-400 hover:bg-leaf-500/15"
                >
                  Save
                </button>
              </div>
            ))}
          </div>
        </Glass>
      )}

      <Glass>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">User management ({allUsers.length})</h2>
          <input
            className="input w-full sm:!w-64 !py-1.5 text-xs"
            placeholder="Search user name or email"
            aria-label="Search users"
            value={userQuery}
            onChange={e => setUserQuery(e.target.value)}
          />
        </div>
        <div className="divide-y divide-white/10">
          {allUsers
            .filter(u => `${u.name} ${u.email}`.toLowerCase().includes(userQuery.toLowerCase()))
            .map(u => (
              <div key={u.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm tabular-nums">
                <span className="font-medium">{u.name}</span>
                <span className="opacity-70">{u.email}</span>
                <span className="font-mono text-leaf-400">{u.greenPoints} pts</span>
              </div>
            ))}
        </div>
      </Glass>

      {recentReviews.length > 0 && (
        <Glass>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-semibold">Recent ratings &amp; reviews across platform ({recentReviews.length})</h2>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 tabular-nums">
              <Star className="h-3.5 w-3.5 fill-amber-300" aria-hidden="true" />
              {(recentReviews.reduce((s, r) => s + r.rating, 0) / recentReviews.length).toFixed(1)} avg
            </span>
          </div>
          <div className="divide-y divide-white/10">
            {recentReviews.slice(0, 6).map(rev => (
              <div key={rev.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium">{rev.targetName} · <span className="text-xs opacity-70">{rev.targetType}</span></p>
                  <p className="text-xs opacity-75">“{rev.comment}” — {rev.userName}</p>
                </div>
                <span className="inline-flex items-center gap-1 font-mono text-xs text-amber-300 tabular-nums">
                  <Star className="h-3.5 w-3.5 fill-amber-300" aria-hidden="true" /> {rev.rating}/5
                </span>
              </div>
            ))}
          </div>
        </Glass>
      )}
      {tickets.length > 0 && (() => {
        const currentTicket = tickets.find(t => t.id === activeTicketId) || tickets[0]
        return (
          <Glass className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Headphones className="h-5 w-5 text-leaf-400" aria-hidden="true" />
                <h2 className="font-semibold">Customer support desk ({tickets.filter(t => t.status !== 'resolved').length} active)</h2>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tickets.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTicketId(t.id)}
                    className={`rounded-lg border px-2.5 py-1 font-mono text-xs whitespace-nowrap transition ${
                      currentTicket?.id === t.id
                        ? 'border-leaf-400 bg-leaf-500/20 text-leaf-300'
                        : 'border-white/15 opacity-75 hover:bg-white/10'
                    }`}
                  >
                    {t.id} · {t.status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {currentTicket && (
              <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">{currentTicket.subject}</p>
                    <p className="opacity-70">{currentTicket.userName} ({currentTicket.email}) · {currentTicket.category} · Priority: {currentTicket.priority}</p>
                  </div>
                  <select
                    aria-label={`Ticket ${currentTicket.id} status`}
                    value={currentTicket.status}
                    onChange={e => changeTicketStatus(currentTicket.id, e.target.value)}
                    className="input !w-36 !py-1 text-xs"
                  >
                    <option value="open">Open</option>
                    <option value="in_review">In review</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {currentTicket.messages.map(m => (
                    <div key={m.id} className={`rounded-lg border p-2.5 ${m.sender === 'support' ? 'border-leaf-400/30 bg-leaf-500/10' : 'border-white/10 bg-white/5'}`}>
                      <p className="font-semibold opacity-80">{m.senderName}</p>
                      <p className="mt-0.5 text-sm">{m.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={sendAdminReply} className="flex flex-wrap gap-2">
                  <input
                    className="input w-full sm:flex-1 text-xs"
                    placeholder="Reply as Scrap Connect Support…"
                    aria-label="Admin support reply"
                    value={adminReply}
                    onChange={e => setAdminReply(e.target.value)}
                  />
                  <button type="submit" className="btn w-full sm:w-auto inline-flex items-center justify-center gap-1.5 whitespace-nowrap !py-1.5 !px-3.5 text-xs">
                    <Send className="h-3.5 w-3.5" aria-hidden="true" /> Send reply
                  </button>
                </form>
              </div>
            )}
          </Glass>
        )
      })()}
    </div>
  )
}

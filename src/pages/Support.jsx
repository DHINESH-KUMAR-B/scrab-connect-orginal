import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Clock, Headphones, HelpCircle, MessageSquare, PhoneCall, Search, Send, ShieldCheck } from 'lucide-react'
import { Glass, Grid, Skeleton, StatCard, useToast } from '../components/ui'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const TICKET_CATEGORIES = [
  'Pickup delay',
  'Weighbridge & rate check',
  'Online UPI / payout',
  'Collector safety',
  'Account & rewards',
  'Other',
]

const FAQS = [
  {
    q: 'How fast does instant online UPI settlement arrive after weighing?',
    a: 'As soon as your collector confirms the digital scale weight and verifies your 4-digit handoff PIN, UPI payouts credit in under 30 seconds with a receipt inside your Online Wallet.',
  },
  {
    q: 'What if a weighbridge or collector quote differs from live rates?',
    a: 'All 25 material grades use published ₹/kg prices. Raise a "Weighbridge & rate check" ticket with your pickup ID and any photo proof—verified differences are credited straight to your wallet.',
  },
  {
    q: 'How do I earn the +5% to +10% drop-off hub bonus?',
    a: 'Pre-sort recyclables cleanly by grade and drop them off at any of the 20,526 verified Indian Scrap Connect hubs. The bonus is automatically added at weighbridge settlement.',
  },
  {
    q: 'Is my old laptop or phone data safe during e-waste recycling?',
    a: 'We recommend backing up and factory-resetting devices before collection. Guindy and Tier-1 certified yards also issue data-safe intake receipts.',
  },
  {
    q: 'Can I pay online for Express Priority Slots or Sorting Kits?',
    a: 'Yes! You can pay online via UPI QR/VPA, Debit/Credit Card, NetBanking, or Eco-Wallet credits directly during pickup booking or from the Online Wallet center.',
  },
]

export default function Support() {
  const { user } = useAuth()
  const toast = useToast()

  const [tickets, setTickets] = useState([])
  const [pickups, setPickups] = useState([])
  const [loading, setLoading] = useState(true)
  const [faqSearch, setFaqSearch] = useState('')
  const [openFaq, setOpenFaq] = useState(0)
  const [activeTicketId, setActiveTicketId] = useState('')
  const [replyDraft, setReplyDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    category: 'Pickup delay',
    priority: 'normal',
    pickupId: '',
    subject: '',
    message: '',
    name: user?.name || '',
    email: user?.email || '',
  })

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
      }))
    }
  }, [user])

  const loadData = useCallback(async () => {
    const uid = user?.id || 'u1'
    try {
      const [tRes, pRes] = await Promise.all([
        api.getSupportTickets(uid),
        api.getPickups({ userId: uid }).catch(() => ({ pickups: [] })),
      ])
      const list = Array.isArray(tRes.tickets) ? tRes.tickets : []
      setTickets(list)
      if (list.length && !activeTicketId) setActiveTicketId(list[0].id)
      setPickups(Array.isArray(pRes.pickups) ? pRes.pickups : [])
    } catch {
      toast('Unable to load support tickets right now.')
    } finally {
      setLoading(false)
    }
  }, [user?.id, activeTicketId, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const submitTicket = async e => {
    e.preventDefault()
    if (!form.subject.trim() || !form.message.trim()) {
      toast('Enter both a subject and message details.')
      return
    }
    setSubmitting(true)
    try {
      const res = await api.createSupportTicket({
        userId: user?.id || 'u1',
        userName: form.name || user?.name || 'Member',
        email: form.email || user?.email || 'member@scrapconnect.local',
        category: form.category,
        priority: form.priority,
        pickupId: form.pickupId || undefined,
        subject: form.subject.trim(),
        message: form.message.trim(),
      })
      if (res.ticket) {
        setTickets(prev => [res.ticket, ...prev])
        setActiveTicketId(res.ticket.id)
      }
      setForm(prev => ({ ...prev, subject: '', message: '', pickupId: '' }))
      toast(`Ticket ${res.ticket?.id || ''} created — care desk notified`)
    } catch (err) {
      toast(err.message || 'Unable to submit support ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  const sendReply = async e => {
    e.preventDefault()
    if (!activeTicketId || !replyDraft.trim()) return
    try {
      const res = await api.replySupportTicket(activeTicketId, {
        sender: 'user',
        senderName: user?.name || form.name || 'Member',
        text: replyDraft.trim(),
      })
      if (res.ticket) {
        setTickets(prev => prev.map(t => t.id === activeTicketId ? res.ticket : t))
      }
      setReplyDraft('')
      toast('Reply added to ticket thread')
    } catch (err) {
      toast(err.message || 'Unable to send reply.')
    }
  }

  const markResolved = async id => {
    try {
      const res = await api.updateSupportTicket(id, 'resolved')
      if (res.ticket) {
        setTickets(prev => prev.map(t => t.id === id ? res.ticket : t))
        toast('Ticket marked resolved')
      }
    } catch {
      toast('Unable to update ticket status.')
    }
  }

  const activeTicket = tickets.find(t => t.id === activeTicketId) || tickets[0] || null
  const visibleFaqs = FAQS.filter(item =>
    !faqSearch.trim() ||
    `${item.q} ${item.a}`.toLowerCase().includes(faqSearch.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Grid>{[...Array(4)].map((_, i) => <Skeleton key={i} />)}</Grid>
        <Skeleton className="h-80" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">24/7 Customer Support &amp; Help Desk</h1>
          <p className="mt-1 text-sm opacity-75">
            Track support tickets, resolve weighbridge or UPI settlement queries, or reach our India operations helpline.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="glass inline-flex items-center gap-2 px-3.5 py-2 font-mono font-semibold tabular-nums text-leaf-400">
            <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" /> Toll-Free: 1800-120-7272
          </span>
        </div>
      </div>

      <Grid>
        <StatCard label="Avg response time" value="< 15" unit="mins" />
        <StatCard label="Open / active tickets" value={tickets.filter(t => t.status !== 'resolved').length} />
        <StatCard label="Resolved tickets" value={tickets.filter(t => t.status === 'resolved').length} />
        <StatCard label="Rate guarantee" value="100%" />
      </Grid>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Raise Ticket Form */}
        <form onSubmit={submitTicket} className="glass space-y-3.5 p-5 lg:col-span-5">
          <div className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-leaf-400" aria-hidden="true" />
            <h2 className="text-lg font-bold">Raise a support request</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="sup-cat" className="mb-1 block text-xs opacity-70">Issue category</label>
              <select
                id="sup-cat"
                className="input text-xs"
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
              >
                {TICKET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="sup-pri" className="mb-1 block text-xs opacity-70">Urgency</label>
              <select
                id="sup-pri"
                className="input text-xs"
                value={form.priority}
                onChange={e => setForm(prev => ({ ...prev, priority: e.target.value }))}
              >
                <option value="normal">Normal (4h SLA)</option>
                <option value="high">High (1h SLA)</option>
                <option value="urgent">Urgent (15m Dispatch)</option>
              </select>
            </div>
          </div>

          {pickups.length > 0 && (
            <div>
              <label htmlFor="sup-pickup" className="mb-1 block text-xs opacity-70">Related pickup (optional)</label>
              <select
                id="sup-pickup"
                className="input text-xs"
                value={form.pickupId}
                onChange={e => setForm(prev => ({ ...prev, pickupId: e.target.value }))}
              >
                <option value="">General question (no specific booking)</option>
                {pickups.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.id} · {p.scrapType} ({p.weight} kg · {p.date})
                  </option>
                ))}
              </select>
            </div>
          )}

          {!user && (
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                className="input text-xs"
                placeholder="Your name"
                aria-label="Your name"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              />
              <input
                type="email"
                className="input text-xs"
                placeholder="Your email"
                aria-label="Your email"
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          )}

          <div>
            <label htmlFor="sup-subj" className="mb-1 block text-xs opacity-70">Subject</label>
            <input
              id="sup-subj"
              required
              className="input text-xs"
              placeholder="e.g. Need digital GST invoice or gate timing update"
              value={form.subject}
              onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="sup-msg" className="mb-1 block text-xs opacity-70">Describe how we can help</label>
            <textarea
              id="sup-msg"
              required
              rows={3}
              className="input text-xs"
              placeholder="Share booking ID, collector details, or UPI transaction reference…"
              value={form.message}
              onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
            />
          </div>

          <button type="submit" disabled={submitting} className="btn w-full text-xs disabled:opacity-55">
            {submitting ? 'Submitting ticket…' : 'Submit support ticket'}
          </button>
        </form>

        {/* Live Ticket Inbox & Thread */}
        <Glass className="flex flex-col justify-between space-y-4 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <MessageSquare className="h-5 w-5 text-leaf-400" aria-hidden="true" />
              Your ticket thread ({tickets.length})
            </h2>
            {tickets.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tickets.slice(0, 4).map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTicketId(t.id)}
                    className={`rounded-lg border px-2.5 py-1 font-mono text-xs whitespace-nowrap transition ${
                      activeTicket?.id === t.id
                        ? 'border-leaf-400 bg-leaf-500/20 text-leaf-300'
                        : 'border-white/15 opacity-75 hover:bg-white/10'
                    }`}
                  >
                    {t.id} · {t.status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeTicket ? (
            <div className="flex flex-1 flex-col justify-between space-y-4">
              <div className="space-y-2 border-b border-white/10 pb-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold">{activeTicket.subject}</p>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold capitalize ${
                      activeTicket.status === 'resolved'
                        ? 'text-leaf-400'
                        : activeTicket.status === 'in_review'
                          ? 'text-amber-300'
                          : 'text-sky-300'
                    }`}>
                      {activeTicket.status === 'resolved'
                        ? <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Resolved</span>
                        : <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" /> {activeTicket.status.replace('_', ' ')}</span>}
                    </span>
                    {activeTicket.status !== 'resolved' && (
                      <button
                        type="button"
                        onClick={() => markResolved(activeTicket.id)}
                        className="rounded-lg border border-leaf-400/40 px-2.5 py-0.5 text-xs font-medium text-leaf-400 hover:bg-leaf-500/15"
                      >
                        Mark resolved
                      </button>
                    )}
                  </div>
                </div>
                <p className="opacity-65">
                  {activeTicket.id} · {activeTicket.category} · Priority: {activeTicket.priority}
                  {activeTicket.pickupId ? ` · Pickup ${activeTicket.pickupId}` : ''}
                </p>
              </div>

              <div className="max-h-64 space-y-2.5 overflow-y-auto pr-1">
                {activeTicket.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`rounded-xl border p-3 text-xs ${
                      msg.sender === 'support'
                        ? 'border-leaf-400/30 bg-leaf-500/10'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 opacity-75">
                      <strong>{msg.senderName}</strong>
                      <span className="font-mono tabular-nums">
                        {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={sendReply} className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
                <input
                  className="input w-full sm:flex-1 text-xs"
                  placeholder="Write a follow-up message to Scrap Connect Care…"
                  aria-label="Reply to ticket"
                  value={replyDraft}
                  onChange={e => setReplyDraft(e.target.value)}
                />
                <button type="submit" className="btn w-full sm:w-auto inline-flex items-center justify-center gap-1.5 whitespace-nowrap !py-2 !px-4 text-xs">
                  <Send className="h-3.5 w-3.5" aria-hidden="true" /> Send
                </button>
              </form>
            </div>
          ) : (
            <p className="py-8 text-sm opacity-70">No tickets yet. Use the form on the left to reach our support desk.</p>
          )}
        </Glass>
      </div>

      {/* Instant FAQ Center */}
      <Glass className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-leaf-400" aria-hidden="true" />
            <h2 className="text-lg font-bold">Quick Help &amp; SLA Policies</h2>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-50" aria-hidden="true" />
            <input
              type="search"
              className="input !py-1.5 pl-8 text-xs"
              placeholder="Search help articles…"
              aria-label="Search FAQs"
              value={faqSearch}
              onChange={e => setFaqSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="divide-y divide-white/10">
          {visibleFaqs.map((item, idx) => {
            const isOpen = openFaq === idx
            return (
              <div key={item.q} className="py-3">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold hover:text-leaf-400"
                >
                  <span>{item.q}</span>
                  <span className="font-mono text-xs opacity-60">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && <p className="mt-2 text-xs leading-relaxed opacity-80">{item.a}</p>}
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-white/10 pt-3 text-xs opacity-75">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-leaf-400" aria-hidden="true" /> Verified Scale Guarantee</span>
          <span>·</span>
          <span>Zero hidden pickup charges above 5 kg</span>
          <span>·</span>
          <span>Email: care@scrapconnect.in</span>
        </div>
      </Glass>
    </div>
  )
}

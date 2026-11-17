import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, ShieldCheck, Trash2, Zap } from 'lucide-react'
import { Glass, useToast } from '../components/ui'
import AiProductDetector from '../components/AiProductDetector'
import OnlinePaymentModal from '../components/OnlinePaymentModal'
import { CATEGORIES } from '../lib/ai'
import { configured, db } from '../lib/firebase'
import { addDoc, collection } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { saveDemoPickup } from '../data/mock'
import { MapPicker } from '../components/MapWidgets'
import { api } from '../lib/api'
import { REWARD_CATALOG, calculateVoucherBonus } from '../lib/rewards'

const today = new Date()
const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
const CORE_CATEGORIES = ['Paper', 'Plastic bottles', 'Iron and steel', 'E-Waste', 'Cardboard', 'Appliances']

function getUnlockedVouchers(userId) {
  try {
    const month = new Date().toISOString().slice(0, 7)
    const raw = localStorage.getItem(`scrap-reward-claims:${userId}:${month}`)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Object.values(parsed || {})
  } catch {
    return []
  }
}

export default function Pickup() {
  const { user } = useAuth()
  const toast = useToast()
  const routerLocation = useLocation()
  const incomingBundle = routerLocation.state?.bundle
  const incomingVoucher = routerLocation.state?.voucherCode || ''

  const [ratesMap, setRatesMap] = useState(CATEGORIES)
  const [bundleMode, setBundleMode] = useState(Boolean(Array.isArray(incomingBundle) && incomingBundle.length))
  const [bundleItems, setBundleItems] = useState(
    Array.isArray(incomingBundle) && incomingBundle.length
      ? incomingBundle
      : [{ category: 'Paper', weight: 5 }]
  )
  const [f, setF] = useState({ type: 'Paper', weight: 5, address: user?.address || '', date: minDate, time: '10:00', notes: '', voucherCode: incomingVoucher })
  const [payoutPreference, setPayoutPreference] = useState('cash')
  const [upiId, setUpiId] = useState(user?.upiId || 'priya@okicici')
  const [expressSlotPaid, setExpressSlotPaid] = useState(false)
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [prepOptions, setPrepOptions] = useState([])
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)
  const [showAllGrades, setShowAllGrades] = useState(false)
  const [location, setLocation] = useState(
    Number.isFinite(user?.lat) && Number.isFinite(user?.lng) ? [user.lat, user.lng] : null
  )

  const vouchers = useMemo(() => getUnlockedVouchers(user.id), [user.id])

  useEffect(() => {
    let active = true
    api.getRates()
      .then(data => {
        if (active && Array.isArray(data.rates)) {
          const next = { ...CATEGORIES }
          data.rates.forEach(r => { next[r.category] = r.pricePerKg })
          setRatesMap(next)
        }
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  const baseEstimate = useMemo(() => {
    const base = bundleMode
      ? bundleItems.reduce((sum, item) => sum + Number(item.weight || 0) * (ratesMap[item.category] ?? 5), 0)
      : Number(f.weight) * (ratesMap[f.type] ?? 5)
    return Math.round(base)
  }, [bundleMode, bundleItems, f.type, f.weight, ratesMap])

  const voucherBonus = useMemo(
    () => calculateVoucherBonus(f.voucherCode, baseEstimate, f.type, bundleMode ? bundleItems : undefined),
    [f.voucherCode, baseEstimate, f.type, bundleMode, bundleItems]
  )

  const sortedBonus = prepOptions.includes('sorted') ? Math.round(baseEstimate * 0.05) : 0
  const creditBonus = payoutPreference === 'eco_credit' ? Math.round(baseEstimate * 0.12) : 0
  const est = baseEstimate + voucherBonus + sortedBonus + creditBonus

  const totalWeight = useMemo(() => (
    bundleMode
      ? bundleItems.reduce((sum, item) => sum + Number(item.weight || 0), 0)
      : Number(f.weight)
  ), [bundleMode, bundleItems, f.weight])

  const estPoints = useMemo(() => {
    const basePts = Math.round(totalWeight * 12)
    if (payoutPreference === 'points_3x') return basePts * 3
    if (payoutPreference === 'cash_tree_split') return basePts * 2
    return basePts
  }, [totalWeight, payoutPreference])

  const applyDetectedCategory = category => {
    setF(value => ({ ...value, type: category }))
    if (bundleMode) {
      setBundleItems(prev => {
        const exists = prev.find(i => i.category === category)
        return exists ? prev : [...prev, { category, weight: 5 }]
      })
    }
  }

  const applyDetectedBundle = (items, profile) => {
    setBundleMode(true)
    setBundleItems(prev => {
      const merged = [...prev]
      items.forEach(item => {
        const idx = merged.findIndex(x => x.category === item.category)
        if (idx >= 0) {
          merged[idx] = { ...merged[idx], weight: merged[idx].weight + item.weight }
        } else {
          merged.push(item)
        }
      })
      return merged
    })
    if (profile?.productName && !f.notes) {
      setF(prev => ({ ...prev, notes: `AI product estimate: ${profile.productName}` }))
    }
  }

  const addBundleRow = () => {
    const unused = Object.keys(ratesMap).find(cat => !bundleItems.some(i => i.category === cat)) || 'Other'
    setBundleItems(prev => [...prev, { category: unused, weight: 3 }])
  }

  const submit = async e => {
    e.preventDefault()
    if (!location) {
      toast('Select the pickup point on the map or use your current location.')
      return
    }
    if (bundleMode && !bundleItems.length) {
      toast('Add at least one scrap item to your bundle.')
      return
    }
    setBusy(true)
    const primaryType = bundleMode
      ? (bundleItems.length > 1 ? `${bundleItems[0].category} +${bundleItems.length - 1} more` : bundleItems[0].category)
      : f.type
    const pickup = {
      userId: user.id,
      userName: user.name || user.email,
      collectorId: null,
      scrapType: primaryType,
      items: bundleMode ? bundleItems.map(i => ({ ...i, pricePerKg: ratesMap[i.category] ?? 5 })) : undefined,
      weight: totalWeight,
      status: 'scheduled',
      price: est,
      voucherCode: f.voucherCode || undefined,
      payoutPreference,
      upiId: upiId.trim() || undefined,
      expressPaidOnline: expressSlotPaid,
      prepOptions: prepOptions.length ? prepOptions : undefined,
      address: f.address.trim(),
      area: f.address.trim(),
      date: f.date,
      time: f.time,
      notes: [f.notes.trim(), expressSlotPaid ? '2-Hr Express Priority Pass (Paid Online)' : ''].filter(Boolean).join(' · ') || undefined,
      lat: location[0],
      lng: location[1],
      createdAt: new Date().toISOString()
    }
    try {
      if (configured) {
        const reference = await addDoc(collection(db, 'pickups'), pickup)
        setDone({ ...pickup, id: reference.id })
      } else {
        try {
          const res = await api.createPickup(pickup)
          setDone(res.pickup)
        } catch {
          const saved = saveDemoPickup({ ...pickup, id: `P-${Date.now()}` })
          setDone(saved)
        }
      }
      toast('Pickup booked')
    } catch (error) {
      console.error('Unable to book the pickup.', error)
      toast(error.message || 'Unable to book your pickup. Please try again.')
    } finally { setBusy(false) }
  }

  if (done) {
    return (
      <motion.div initial={{ scale: .95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Glass className="mx-auto max-w-md text-center space-y-3">
          <h1 className="text-2xl font-bold">Pickup confirmed</h1>
          <p className="text-xs font-mono text-leaf-400 tabular-nums">Booking {done.id} · {done.date} at {done.time}</p>
          <p>{done.scrapType}, about <span className="font-mono tabular-nums">{done.weight} kg</span>.</p>
          <p className="text-xs opacity-75">{done.address}</p>
          <p className="text-sm opacity-80">
            Estimated payout <strong className="font-mono tabular-nums text-leaf-400">₹{done.price}</strong>
            {done.voucherCode ? ` (includes ${done.voucherCode} bonus)` : ''}.
            {done.upiId ? <> Settlement UPI: <strong className="font-mono">{done.upiId}</strong>.</> : ''}
            {done.handoffPin ? <> Your handoff PIN: <strong className="font-mono text-leaf-400">{done.handoffPin}</strong>.</> : ''}
            {' '}A verified collector can now claim your stop.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link className="btn text-sm" to="/dashboard">View dashboard</Link>
            <button type="button" className="glass px-4 py-2 text-sm" onClick={() => setDone(null)}>Book another</button>
          </div>
        </Glass>
      </motion.div>
    )
  }

  return (
    <Glass className="mx-auto max-w-2xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Book a pickup</h1>
        <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 text-xs" role="group" aria-label="Booking mode">
          <button
            type="button"
            onClick={() => setBundleMode(false)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 font-semibold transition ${!bundleMode ? 'bg-leaf-500 text-emerald-950' : 'opacity-75'}`}
          >
            Single item
          </button>
          <button
            type="button"
            onClick={() => setBundleMode(true)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 font-semibold transition ${bundleMode ? 'bg-leaf-500 text-emerald-950' : 'opacity-75'}`}
          >
            Multi-item bundle
          </button>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {!bundleMode ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Select scrap category</span>
              <button
                type="button"
                onClick={() => setShowAllGrades(v => !v)}
                className="text-xs underline opacity-80 hover:opacity-100"
              >
                {showAllGrades ? 'Show core 6 categories' : 'Show all 25 specialized grades'}
              </button>
            </div>
            <div role="radiogroup" aria-label="Scrap category" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(ratesMap)
                .filter(([c]) => showAllGrades || CORE_CATEGORIES.includes(c) || f.type === c)
                .map(([c, p]) => (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={f.type === c}
                    key={c}
                    onClick={() => setF({ ...f, type: c })}
                    className={`rounded-xl border px-3 py-2 text-left text-sm transition ${f.type === c ? 'border-leaf-400 bg-leaf-500/20' : 'border-white/10 hover:bg-white/5'}`}
                  >
                    <span className="block font-medium">{c}</span>
                    <span className="font-mono text-xs tabular-nums opacity-65">₹{p}/kg est.</span>
                  </button>
                ))}
            </div>
            <label className="block text-sm">
              Approx. weight: <span className="font-mono font-semibold tabular-nums">{f.weight} kg</span>
              <input type="range" min="1" max="100" value={f.weight} onChange={e => setF({ ...f, weight: e.target.value })} className="mt-1 w-full accent-green-500"/>
            </label>
          </>
        ) : (
          <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Bundle items ({bundleItems.length})</p>
              <button type="button" onClick={addBundleRow} className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1 text-xs font-medium hover:bg-white/10">
                <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add material
              </button>
            </div>
            {bundleItems.map((item, idx) => (
              <div key={`${item.category}-${idx}`} className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Material category"
                  value={item.category}
                  onChange={e => setBundleItems(prev => prev.map((row, i) => i === idx ? { ...row, category: e.target.value } : row))}
                  className="input w-full sm:w-auto sm:flex-1 sm:min-w-40"
                >
                  {Object.entries(ratesMap).map(([cat, rate]) => (
                    <option key={cat} value={cat}>{cat} (₹{rate}/kg)</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  max="200"
                  aria-label="Weight in kg"
                  value={item.weight}
                  onChange={e => setBundleItems(prev => prev.map((row, i) => i === idx ? { ...row, weight: Math.max(1, Number(e.target.value) || 1) } : row))}
                  className="input !w-24 text-right font-mono tabular-nums"
                />
                <span className="w-16 text-right font-mono text-xs tabular-nums opacity-75">
                  ₹{Math.round(item.weight * (ratesMap[item.category] ?? 5))}
                </span>
                {bundleItems.length > 1 && (
                  <button
                    type="button"
                    aria-label="Remove item"
                    onClick={() => setBundleItems(prev => prev.filter((_, i) => i !== idx))}
                    className="rounded-lg p-2 opacity-60 hover:bg-white/10 hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <AiProductDetector
          ratesMap={ratesMap}
          compact
          onApplyCategory={applyDetectedCategory}
          onApplyBundle={applyDetectedBundle}
        />

        <input required className="input" placeholder="Pickup address (street, landmark, area)" aria-label="Address" value={f.address} onChange={e => setF({ ...f, address: e.target.value })}/>
        <input className="input" placeholder="Pickup notes (optional — e.g. call at gate, 2nd floor)" aria-label="Pickup notes" value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })}/>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-sm font-medium" htmlFor="pickup-map">Pickup point</label>
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
              <button type="button" className="underline" onClick={() => {
                if (!navigator.geolocation) { toast('Location is not available in this browser. Select a point on the map.'); return }
                navigator.geolocation.getCurrentPosition(
                  position => setLocation([position.coords.latitude, position.coords.longitude]),
                  error => toast(error.code === error.PERMISSION_DENIED
                    ? 'Location permission was denied. Click Quick pin area or select a point on the map.'
                    : 'Unable to get your location. Click Quick pin area or select a point on the map.')
                )
              }}>Use my location</button>
              <button
                type="button"
                className="text-leaf-400 underline"
                onClick={() => {
                  setLocation([13.0067, 80.2572])
                  toast('Pinned Adyar, Chennai pickup zone (drag map or click to adjust)')
                }}
              >
                Quick pin area
              </button>
            </div>
          </div>
          <div id="pickup-map"><MapPicker location={location} onSelect={setLocation}/></div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input required type="date" min={minDate} className="input" aria-label="Date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })}/>
          <input required type="time" className="input" aria-label="Time" value={f.time} onChange={e => setF({ ...f, time: e.target.value })}/>
        </div>

        {vouchers.length > 0 && (
          <div>
            <label className="mb-1 block text-xs opacity-70" htmlFor="voucher-select">Apply unlocked reward voucher</label>
            <select id="voucher-select" className="input" value={f.voucherCode} onChange={e => setF({ ...f, voucherCode: e.target.value })}>
              <option value="">No voucher applied</option>
              {vouchers.map(code => {
                const info = REWARD_CATALOG.find(r => r.code === code)
                return (
                  <option key={code} value={code}>
                    {code} ({info?.benefitLabel || 'Spin / Bonus voucher'})
                  </option>
                )
              })}
            </select>
          </div>
        )}

        {/* Creative Settlement & Prep Options */}
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <div>
            <span className="block text-sm font-semibold">Choose payout style</span>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {[
                { key: 'cash', label: '100% Instant Cash / UPI', desc: 'Standard doorstep settlement' },
                { key: 'cash_tree_split', label: '80% Cash + 20% Plant Trees', desc: 'Earns 2× Green Points' },
                { key: 'eco_credit', label: 'Eco-Store / Solar Credit (+12%)', desc: 'Adds +12% extra credit value' },
                { key: 'points_3x', label: '100% Green Points (3× boost)', desc: 'Fast-tracks milestone rewards' },
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setPayoutPreference(opt.key)}
                  className={`rounded-xl border px-3 py-2 text-left text-xs transition ${
                    payoutPreference === opt.key ? 'border-leaf-400 bg-leaf-500/20' : 'border-white/10 hover:bg-white/5'
                  }`}
                >
                  <p className="font-semibold">{opt.label}</p>
                  <p className="opacity-70">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium opacity-75">Creative handoff &amp; sorting options</span>
            <div className="mt-1.5 flex flex-wrap gap-2 text-xs">
              {[
                { key: 'sorted', label: 'Pre-sorted by grade (+5%)' },
                { key: 'contact_free', label: 'Contact-free porch pickup' },
                { key: 'live_weigh', label: 'Live digital scale verification' },
                { key: 'school_drive', label: 'Support local school drive' },
              ].map(tag => {
                const active = prepOptions.includes(tag.key)
                return (
                  <button
                    key={tag.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setPrepOptions(prev => prev.includes(tag.key) ? prev.filter(x => x !== tag.key) : [...prev, tag.key])
                    }
                    className={`rounded-lg border px-2.5 py-1.5 font-medium transition ${
                      active ? 'border-leaf-400 bg-leaf-500/20 text-leaf-300' : 'border-white/15 opacity-75 hover:bg-white/10'
                    }`}
                  >
                    {tag.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid gap-3 border-t border-white/10 pt-3 sm:grid-cols-2 sm:items-end">
            <div>
              <label htmlFor="pickup-upi" className="mb-1 block text-xs font-medium opacity-75">
                Instant online payout UPI ID (optional)
              </label>
              <input
                id="pickup-upi"
                className="input font-mono text-xs"
                placeholder="name@okicici"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs">
              <div>
                <p className="font-semibold flex items-center gap-1 text-leaf-400">
                  <Zap className="h-3.5 w-3.5" aria-hidden="true" /> 2-Hr Express Slot
                </p>
                <p className="opacity-70">{expressSlotPaid ? 'Paid online · Priority enabled' : 'Optional priority dispatch (₹29)'}</p>
              </div>
              {expressSlotPaid ? (
                <span className="inline-flex items-center gap-1 font-semibold text-leaf-400">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Paid
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setPayModalOpen(true)}
                  className="rounded-lg border border-leaf-400/45 px-2.5 py-1.5 font-semibold text-leaf-400 whitespace-nowrap hover:bg-leaf-500/15"
                >
                  Pay ₹29 online
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
          <p className="text-sm opacity-75">
            Total weight: <span className="font-mono font-semibold tabular-nums">{totalWeight} kg</span> · Est. points: <span className="font-mono font-semibold tabular-nums text-leaf-400">+{estPoints} pts</span>
          </p>
          <p className="text-lg font-semibold">Estimated payout: <span className="font-mono tabular-nums text-leaf-400">₹{est}</span></p>
        </div>
        <button disabled={busy} className="btn w-full disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Please wait…' : 'Confirm pickup'}</button>
      </form>

      <OnlinePaymentModal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        amount={29}
        title="2-Hr Express Priority Slot"
        description="Priority doorstep collector dispatch within 120 minutes"
        type="online_payment"
        defaultUpi={upiId}
        onSuccess={() => setExpressSlotPaid(true)}
      />
    </Glass>
  )
}

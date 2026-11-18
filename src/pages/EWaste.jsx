import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calculator, ClipboardCheck, MapPin, ShieldCheck, Truck } from 'lucide-react'
import { Glass, useToast } from '../components/ui'
import { Checklist, Field, TabBar, isIndianMobile } from '../components/WasteTools'

// Indicative rates in ₹ per unit. Replace with your live rate data when it is available.
const DEVICES = [
  { id: 'phone', label: 'Smartphone', unit: 'per phone', rates: { working: 800, notWorking: 250, damaged: 100 } },
  { id: 'laptop', label: 'Laptop', unit: 'per laptop', rates: { working: 2500, notWorking: 800, damaged: 300 } },
  { id: 'tablet', label: 'Tablet', unit: 'per tablet', rates: { working: 1200, notWorking: 400, damaged: 150 } },
  { id: 'cpu', label: 'Desktop CPU', unit: 'per unit', rates: { working: 600, notWorking: 250, damaged: 100 } },
  { id: 'screen', label: 'LED monitor / TV', unit: 'per unit', rates: { working: 700, notWorking: 250, damaged: 100 } },
  { id: 'printer', label: 'Printer / router', unit: 'per unit', rates: { working: 300, notWorking: 100, damaged: 40 } },
  { id: 'powerbank', label: 'Power bank', unit: 'per piece', rates: { working: 60, notWorking: 30, damaged: 10 } },
  { id: 'cables', label: 'Cables & chargers', unit: 'per kg', rates: { working: 90, notWorking: 60, damaged: 40 } },
]

const CONDITIONS = [
  { id: 'working', label: 'Working' },
  { id: 'notWorking', label: 'Not working' },
  { id: 'damaged', label: 'Broken / damaged' },
]

const WIPE_STEPS = [
  { id: 'backup', title: 'Back up photos, contacts and files', detail: 'Copy anything you want to keep to another device or cloud storage.' },
  { id: 'signout', title: 'Sign out of your accounts', detail: 'Google, Apple ID / iCloud and Microsoft. Turn off Find My / device protection so the device can be reset.' },
  { id: 'cards', title: 'Remove SIM, memory card and external drives' },
  { id: 'unpair', title: 'Unpair watches, earbuds and other Bluetooth devices' },
  { id: 'reset', title: 'Factory reset the device', detail: 'Phones and tablets: encrypt first if it is an option, then reset. Computers: use the reset option that fully wipes the drive.' },
  { id: 'battery', title: 'Check the battery', detail: 'If it is swollen, leaking or hot, do not charge it. Mention it when you book.' },
]

const ACCEPTED = [
  'Phones, tablets, laptops and desktop computers',
  'Chargers, cables, keyboards and mice',
  'LED monitors and flat-screen TVs',
  'Printers, routers and set-top boxes',
  'Sealed batteries and power banks (cover the terminals with tape)',
]

const SPECIAL = [
  'Swollen, leaking or very hot batteries',
  'Old CRT TVs and monitors, fridges and ACs (pickup only)',
  'Devices with broken glass (wrap them before handing over)',
  'Medical or lab equipment',
  'Ionisation smoke detectors',
]

const TABS = [
  { id: 'estimate', label: 'Value estimator' },
  { id: 'wipe', label: 'Data wipe checklist' },
  { id: 'guide', label: 'What we accept' },
  { id: 'bulk', label: 'Bulk & office pickup' },
]

const inr = value => `₹${Math.round(value).toLocaleString('en-IN')}`

function Estimator() {
  const [lines, setLines] = useState(() =>
    Object.fromEntries(DEVICES.map(d => [d.id, { qty: '', cond: 'working' }])),
  )
  const update = (id, patch) => setLines(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }))

  const total = DEVICES.reduce((sum, d) => {
    const qty = Number(lines[d.id].qty) || 0
    return sum + qty * d.rates[lines[d.id].cond]
  }, 0)
  const items = DEVICES.reduce((sum, d) => sum + (Number(lines[d.id].qty) > 0 ? 1 : 0), 0)

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
      <div className="space-y-2">
        {DEVICES.map(d => (
          <div key={d.id} className="grid grid-cols-[1fr_6rem] items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 sm:grid-cols-[1fr_10rem_6rem]">
            <div className="col-span-2 min-w-0 sm:col-span-1">
              <p className="text-sm font-semibold">{d.label}</p>
              <p className="text-xs opacity-60">{inr(d.rates[lines[d.id].cond])} {d.unit}</p>
            </div>
            <select
              aria-label={`Condition of ${d.label}`}
              className="input text-sm"
              value={lines[d.id].cond}
              onChange={e => update(d.id, { cond: e.target.value })}
            >
              {CONDITIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <input
              type="number"
              min="0"
              inputMode="decimal"
              aria-label={`Quantity of ${d.label}`}
              placeholder="Qty"
              className="input text-sm"
              value={lines[d.id].qty}
              onChange={e => update(d.id, { qty: e.target.value })}
            />
          </div>
        ))}
      </div>

      <div className="h-fit space-y-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 lg:sticky lg:top-24">
        <p className="text-xs font-semibold">Estimated value</p>
        <p className="text-3xl font-extrabold tabular-nums">{inr(total * 0.85)} – {inr(total * 1.15)}</p>
        <p className="text-xs opacity-75">
          {items ? `${items} type${items > 1 ? 's' : ''} of device selected.` : 'Add quantities to see an estimate.'}
        </p>
        <p className="text-xs opacity-75">
          Dropping off at a hub adds a +5–10% bonus. Rates are indicative; the final amount is set after inspection and weighing.
        </p>
        <Link to="/centers?material=E-Waste" className="btn flex items-center justify-center gap-2 text-center text-sm">
          <MapPin className="h-4 w-4" aria-hidden="true" /> Find E-waste hubs
        </Link>
      </div>
    </div>
  )
}

function Guide() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 rounded-xl border border-leaf-400/40 bg-leaf-500/10 p-4">
        <h3 className="font-semibold">We accept</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm">
          {ACCEPTED.map(item => <li key={item}>{item}</li>)}
        </ul>
      </div>
      <div className="space-y-2 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4">
        <h3 className="font-semibold">Needs special handling</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm">
          {SPECIAL.map(item => <li key={item}>{item}</li>)}
        </ul>
        <p className="pt-1 text-xs opacity-75">
          Not sure about an item? <Link to="/support" className="font-semibold text-leaf-400 underline">Ask support</Link> before you bring it.
        </p>
      </div>
    </div>
  )
}

function BulkRequest() {
  const toast = useToast()
  const empty = { name: '', org: '', phone: '', city: '', items: '', date: '', notes: '' }
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const submit = e => {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Enter your name'
    if (!isIndianMobile(form.phone)) next.phone = 'Enter a 10-digit mobile number'
    if (!form.city.trim()) next.city = 'Enter your city'
    if (!(Number(form.items) > 0)) next.items = 'Enter the approximate number of items'
    setErrors(next)
    if (Object.keys(next).length) return

    // TODO: send `form` to your backend (for example an api.createBulkPickup call).
    console.info('E-waste bulk pickup request', form)
    toast('Bulk pickup request submitted')
    setForm(empty)
  }

  const error = key => errors[key] && <span className="block text-xs text-red-400">{errors[key]}</span>

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2" noValidate>
      <Field label="Your name"><input className="input text-sm" value={form.name} onChange={e => set('name', e.target.value)} />{error('name')}</Field>
      <Field label="Company or institution (optional)"><input className="input text-sm" value={form.org} onChange={e => set('org', e.target.value)} /></Field>
      <Field label="Mobile number"><input className="input text-sm" inputMode="numeric" value={form.phone} onChange={e => set('phone', e.target.value)} />{error('phone')}</Field>
      <Field label="City"><input className="input text-sm" value={form.city} onChange={e => set('city', e.target.value)} />{error('city')}</Field>
      <Field label="Approximate number of items"><input type="number" min="1" className="input text-sm" value={form.items} onChange={e => set('items', e.target.value)} />{error('items')}</Field>
      <Field label="Preferred pickup date (optional)"><input type="date" className="input text-sm" value={form.date} onChange={e => set('date', e.target.value)} /></Field>
      <div className="sm:col-span-2">
        <Field label="What are you recycling? (optional)" hint="For example: 40 old laptops, 15 monitors, a box of cables.">
          <textarea rows="3" className="input text-sm" value={form.notes} onChange={e => set('notes', e.target.value)} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <button type="submit" className="btn text-sm">Request bulk pickup</button>
      </div>
    </form>
  )
}

export default function EWaste() {
  const [tab, setTab] = useState('estimate')
  const icons = { estimate: Calculator, wipe: ShieldCheck, guide: ClipboardCheck, bulk: Truck }
  const ActiveIcon = icons[tab]

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-5 sm:p-6">
        <h1 className="text-2xl font-bold sm:text-3xl">E-waste</h1>
        <p className="mt-1 max-w-2xl text-sm opacity-80">
          Recycle old phones, laptops, batteries and cables safely. Estimate what they are worth, wipe your data, and book a pickup for offices and schools.
        </p>
        <Link to="/centers?material=E-Waste" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-300 underline">
          <MapPin className="h-4 w-4" aria-hidden="true" /> Find E-waste drop-off hubs
        </Link>
      </div>

      <TabBar tabs={TABS} value={tab} onChange={setTab} accent="bg-amber-400" label="E-waste tools" />

      <Glass className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <ActiveIcon className="h-5 w-5 text-amber-300" aria-hidden="true" />
          {TABS.find(t => t.id === tab).label}
        </h2>
        {tab === 'estimate' && <Estimator />}
        {tab === 'wipe' && <Checklist items={WIPE_STEPS} barClass="bg-amber-400" />}
        {tab === 'guide' && <Guide />}
        {tab === 'bulk' && <BulkRequest />}
      </Glass>
    </div>
  )
}

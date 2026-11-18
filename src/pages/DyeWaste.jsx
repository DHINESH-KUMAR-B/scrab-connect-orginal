import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ClipboardCheck, Download, Droplets, FileText, FlaskConical, MapPin, Trash2, Truck } from 'lucide-react'
import { Glass, useToast } from '../components/ui'
import { Checklist, Field, TabBar, isIndianMobile } from '../components/WasteTools'

const SOURCES = [
  {
    id: 'textile',
    name: 'Textile dyeing',
    waste: ['Spent dye baths', 'Salt and alkali', 'Rinse water with colour', 'Sizing and finishing chemicals'],
    risks: ['Strong colour that blocks light in water', 'High salt and chemical oxygen demand', 'Some dyes break down into harmful compounds'],
    handling: ['Keep concentrated dye baths separate from rinse water', 'Never pour spent dye into drains or open land', 'Send to treatment or a licensed handler'],
  },
  {
    id: 'printing',
    name: 'Printing (screen, block, digital)',
    waste: ['Leftover pigment pastes', 'Screen-wash water', 'Thickeners and binders', 'Solvent-based inks'],
    risks: ['Solvents are flammable and harmful to breathe', 'Pastes can clog and contaminate drains'],
    handling: ['Scrape screens and pots before washing', 'Collect solvent waste separately in closed containers', 'Do not mix water-based and solvent-based waste'],
  },
  {
    id: 'leather',
    name: 'Leather and tanning',
    waste: ['Chromium-containing liquor', 'Dyeing and fat-liquoring waste', 'Chromium sludge'],
    risks: ['Chromium sludge is hazardous waste', 'Contaminates soil and groundwater if dumped'],
    handling: ['Keep chromium streams apart from other effluent', 'Store sludge in covered, labelled containers', 'Hand over only to an authorised handler'],
  },
  {
    id: 'small',
    name: 'Small units, labs and craft',
    waste: ['Small volumes of dyes and inks', 'Cleaning solvents', 'Contaminated cloth and containers'],
    risks: ['Small amounts add up when poured into drains', 'Mixed chemicals can react'],
    handling: ['Collect in a closed, labelled container', 'Label the contents and date', 'Arrange a pickup instead of discarding with household trash'],
  },
]

const STORAGE_STEPS = [
  { id: 'containers', title: 'Use closed containers made for chemicals', detail: 'HDPE drums or carboys. Never food or drink bottles.' },
  { id: 'label', title: 'Label every container', detail: 'Write the contents, the date and "Hazardous waste – dye".' },
  { id: 'separate', title: 'Keep different wastes apart', detail: 'Acids, alkalis, oxidisers and solvents are stored separately. Do not mix wastes unless a handler tells you to.' },
  { id: 'area', title: 'Store in a covered, spill-proof area', detail: 'Away from drains, direct sun and heat, ideally on a raised bund or tray.' },
  { id: 'headspace', title: 'Do not overfill', detail: 'Leave some space at the top of each container.' },
  { id: 'spill', title: 'Keep a spill kit nearby', detail: 'Absorbent material, gloves and goggles.' },
  { id: 'record', title: 'Record each batch in the Waste log', detail: 'Date, type and quantity before every handover.' },
]

const TABS = [
  { id: 'know', label: 'Know your dye waste' },
  { id: 'check', label: 'Effluent checker' },
  { id: 'storage', label: 'Safe storage' },
  { id: 'log', label: 'Waste log' },
  { id: 'pickup', label: 'Request pickup' },
]

const LOG_KEY = 'scrap-dye-waste-log'
const today = () => new Date().toISOString().slice(0, 10)

function KnowYourWaste() {
  const [id, setId] = useState(SOURCES[0].id)
  const source = SOURCES.find(s => s.id === id)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Choose your source of dye waste">
        {SOURCES.map(s => (
          <button
            key={s.id}
            type="button"
            aria-pressed={id === s.id}
            onClick={() => setId(s.id)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
              id === s.id ? 'border-fuchsia-300 bg-fuchsia-400 text-emerald-950' : 'border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300 hover:bg-fuchsia-400/20'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {[['What you will find', source.waste], ['Why it is a problem', source.risks], ['How to handle it', source.handling]].map(([title, list]) => (
          <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-2 text-sm font-semibold">{title}</h3>
            <ul className="list-disc space-y-1.5 pl-5 text-sm">
              {list.map(item => <li key={item}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function EffluentChecker() {
  const [reading, setReading] = useState({ volume: '', ph: '', cod: '', bod: '', tss: '' })
  const [limits, setLimits] = useState({ phMin: '5.5', phMax: '9', cod: '250', bod: '30', tss: '100' })
  const setR = (k, v) => setReading(prev => ({ ...prev, [k]: v }))
  const setL = (k, v) => setLimits(prev => ({ ...prev, [k]: v }))
  const has = v => v !== '' && !Number.isNaN(Number(v))

  const rows = []
  if (has(reading.ph)) {
    const ph = Number(reading.ph)
    rows.push({ name: 'pH', value: ph, limit: `${limits.phMin} – ${limits.phMax}`, ok: ph >= Number(limits.phMin) && ph <= Number(limits.phMax) })
  }
  ;[['cod', 'COD'], ['bod', 'BOD'], ['tss', 'Suspended solids']].forEach(([key, name]) => {
    if (has(reading[key])) {
      const value = Number(reading[key])
      const load = has(reading.volume) ? (value * Number(reading.volume)) / 1e6 : null
      rows.push({ name, value: `${value} mg/L`, limit: `${limits[key]} mg/L`, ok: value <= Number(limits[key]), load })
    }
  })
  const failing = rows.filter(r => !r.ok).length

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Field label="Effluent per day (litres)"><input type="number" min="0" className="input text-sm" value={reading.volume} onChange={e => setR('volume', e.target.value)} /></Field>
        <Field label="pH"><input type="number" step="0.1" className="input text-sm" value={reading.ph} onChange={e => setR('ph', e.target.value)} /></Field>
        <Field label="COD (mg/L)"><input type="number" min="0" className="input text-sm" value={reading.cod} onChange={e => setR('cod', e.target.value)} /></Field>
        <Field label="BOD (mg/L)"><input type="number" min="0" className="input text-sm" value={reading.bod} onChange={e => setR('bod', e.target.value)} /></Field>
        <Field label="Suspended solids (mg/L)"><input type="number" min="0" className="input text-sm" value={reading.tss} onChange={e => setR('tss', e.target.value)} /></Field>
      </div>

      <details className="rounded-xl border border-white/10 bg-white/5 p-4">
        <summary className="cursor-pointer text-sm font-semibold">Discharge limits used for this check</summary>
        <p className="mt-2 text-xs opacity-75">
          These are example values only. Replace them with the limits in your State Pollution Control Board consent order.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Field label="pH min"><input type="number" step="0.1" className="input text-sm" value={limits.phMin} onChange={e => setL('phMin', e.target.value)} /></Field>
          <Field label="pH max"><input type="number" step="0.1" className="input text-sm" value={limits.phMax} onChange={e => setL('phMax', e.target.value)} /></Field>
          <Field label="COD max (mg/L)"><input type="number" className="input text-sm" value={limits.cod} onChange={e => setL('cod', e.target.value)} /></Field>
          <Field label="BOD max (mg/L)"><input type="number" className="input text-sm" value={limits.bod} onChange={e => setL('bod', e.target.value)} /></Field>
          <Field label="Solids max (mg/L)"><input type="number" className="input text-sm" value={limits.tss} onChange={e => setL('tss', e.target.value)} /></Field>
        </div>
      </details>

      {rows.length ? (
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="text-xs opacity-70">
                <tr>
                  <th className="py-2 pr-3 font-semibold">Parameter</th>
                  <th className="py-2 pr-3 font-semibold">Your reading</th>
                  <th className="py-2 pr-3 font-semibold">Limit</th>
                  <th className="py-2 pr-3 font-semibold">Load per day</th>
                  <th className="py-2 font-semibold">Result</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.name} className="border-t border-white/10">
                    <td className="py-2 pr-3 font-medium">{r.name}</td>
                    <td className="py-2 pr-3 font-mono tabular-nums">{r.value}</td>
                    <td className="py-2 pr-3 font-mono tabular-nums">{r.limit}</td>
                    <td className="py-2 pr-3 font-mono tabular-nums">{r.load != null ? `${r.load.toFixed(2)} kg` : '–'}</td>
                    <td className={`py-2 font-semibold ${r.ok ? 'text-leaf-400' : 'text-red-400'}`}>{r.ok ? 'Within limit' : 'Over limit'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${failing ? 'border-red-400/50 bg-red-400/10' : 'border-leaf-400/40 bg-leaf-500/10'}`}>
            {failing > 0 && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />}
            <span>
              {failing
                ? `${failing} reading${failing > 1 ? 's are' : ' is'} over the limit. Do not discharge this effluent untreated. Treat it further or request a pickup.`
                : 'All the readings you entered are within the limits you set. Keep testing regularly.'}
            </span>
          </p>
        </div>
      ) : (
        <p className="text-sm opacity-70">Enter at least one reading to see how it compares with the limits.</p>
      )}
    </div>
  )
}

function WasteLog() {
  const toast = useToast()
  const [entries, setEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LOG_KEY)) || [] } catch { return [] }
  })
  const [form, setForm] = useState({ date: today(), source: SOURCES[0].name, form: 'Liquid', qty: '', unit: 'L' })
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  useEffect(() => {
    try { localStorage.setItem(LOG_KEY, JSON.stringify(entries)) } catch { /* storage unavailable */ }
  }, [entries])

  const add = e => {
    e.preventDefault()
    if (!(Number(form.qty) > 0)) { toast('Enter a quantity greater than 0'); return }
    setEntries(prev => [{ id: Date.now(), ...form, qty: Number(form.qty) }, ...prev])
    setForm(prev => ({ ...prev, qty: '' }))
  }

  const totals = entries.reduce((acc, e) => ({ ...acc, [e.unit]: (acc[e.unit] || 0) + e.qty }), {})

  const exportCsv = () => {
    const header = ['Date', 'Source', 'Form', 'Quantity', 'Unit']
    const rows = entries.map(e => [e.date, e.source, e.form, e.qty, e.unit])
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'dye-waste-log.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <form onSubmit={add} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Date"><input type="date" className="input text-sm" value={form.date} onChange={e => set('date', e.target.value)} /></Field>
        <Field label="Source">
          <select className="input text-sm" value={form.source} onChange={e => set('source', e.target.value)}>
            {SOURCES.map(s => <option key={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Form">
          <select className="input text-sm" value={form.form} onChange={e => set('form', e.target.value)}>
            <option>Liquid</option><option>Sludge</option><option>Solid or powder</option>
          </select>
        </Field>
        <Field label="Quantity"><input type="number" min="0" step="any" className="input text-sm" value={form.qty} onChange={e => set('qty', e.target.value)} /></Field>
        <Field label="Unit">
          <div className="flex gap-2">
            <select className="input text-sm" value={form.unit} onChange={e => set('unit', e.target.value)}>
              <option>L</option><option>kg</option>
            </select>
            <button type="submit" className="btn whitespace-nowrap text-sm">Add</button>
          </div>
        </Field>
      </form>

      {entries.length ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              <span className="font-semibold">Total recorded: </span>
              {Object.entries(totals).map(([unit, qty]) => `${qty.toLocaleString('en-IN')} ${unit}`).join(' · ')}
              <span className="opacity-60"> ({entries.length} entries)</span>
            </p>
            <button type="button" onClick={exportCsv} className="glass inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold hover:bg-white/10">
              <Download className="h-4 w-4" aria-hidden="true" /> Download CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[30rem] text-left text-sm">
              <thead className="text-xs opacity-70">
                <tr>
                  <th className="py-2 pr-3 font-semibold">Date</th>
                  <th className="py-2 pr-3 font-semibold">Source</th>
                  <th className="py-2 pr-3 font-semibold">Form</th>
                  <th className="py-2 pr-3 font-semibold">Quantity</th>
                  <th className="py-2"><span className="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} className="border-t border-white/10">
                    <td className="py-2 pr-3 font-mono tabular-nums">{e.date}</td>
                    <td className="py-2 pr-3">{e.source}</td>
                    <td className="py-2 pr-3">{e.form}</td>
                    <td className="py-2 pr-3 font-mono tabular-nums">{e.qty} {e.unit}</td>
                    <td className="py-2 text-right">
                      <button type="button" aria-label="Remove entry" onClick={() => setEntries(prev => prev.filter(x => x.id !== e.id))} className="rounded-lg p-1.5 opacity-70 hover:bg-white/10 hover:opacity-100">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-sm opacity-70">No entries yet. Record each batch of dye waste you set aside. The log is saved in this browser.</p>
      )}
    </div>
  )
}

function PickupRequest() {
  const toast = useToast()
  const empty = { name: '', business: '', phone: '', city: '', form: 'Liquid', qty: '', unit: 'L', notes: '', stored: false }
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const submit = e => {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Enter your name'
    if (!isIndianMobile(form.phone)) next.phone = 'Enter a 10-digit mobile number'
    if (!form.city.trim()) next.city = 'Enter your city'
    if (!(Number(form.qty) > 0)) next.qty = 'Enter the approximate quantity'
    if (!form.stored) next.stored = 'Please confirm how the waste is stored'
    setErrors(next)
    if (Object.keys(next).length) return

    // TODO: send `form` to your backend (for example an api.createHazardousPickup call).
    console.info('Dye waste pickup request', form)
    toast('Dye waste pickup request submitted')
    setForm(empty)
  }
  const error = key => errors[key] && <span className="block text-xs text-red-400">{errors[key]}</span>

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2" noValidate>
      <Field label="Your name"><input className="input text-sm" value={form.name} onChange={e => set('name', e.target.value)} />{error('name')}</Field>
      <Field label="Business or unit (optional)"><input className="input text-sm" value={form.business} onChange={e => set('business', e.target.value)} /></Field>
      <Field label="Mobile number"><input className="input text-sm" inputMode="numeric" value={form.phone} onChange={e => set('phone', e.target.value)} />{error('phone')}</Field>
      <Field label="City"><input className="input text-sm" value={form.city} onChange={e => set('city', e.target.value)} />{error('city')}</Field>
      <Field label="Form of waste">
        <select className="input text-sm" value={form.form} onChange={e => set('form', e.target.value)}>
          <option>Liquid</option><option>Sludge</option><option>Solid or powder</option>
        </select>
      </Field>
      <Field label="Approximate quantity">
        <div className="flex gap-2">
          <input type="number" min="0" step="any" className="input text-sm" value={form.qty} onChange={e => set('qty', e.target.value)} />
          <select aria-label="Unit" className="input w-24 text-sm" value={form.unit} onChange={e => set('unit', e.target.value)}>
            <option>L</option><option>kg</option>
          </select>
        </div>
        {error('qty')}
      </Field>
      <div className="sm:col-span-2">
        <Field label="Details (optional)" hint="Type of dye, colours, and whether solvents are present.">
          <textarea rows="3" className="input text-sm" value={form.notes} onChange={e => set('notes', e.target.value)} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={form.stored} onChange={e => set('stored', e.target.checked)} className="mt-1 h-4 w-4 accent-green-500" />
          <span>The waste is in closed, labelled containers and not mixed with other chemicals.</span>
        </label>
        {error('stored')}
      </div>
      <div className="sm:col-span-2">
        <button type="submit" className="btn text-sm">Request pickup</button>
      </div>
    </form>
  )
}

export default function DyeWaste() {
  const [tab, setTab] = useState('know')
  const icons = { know: FlaskConical, check: Droplets, storage: ClipboardCheck, log: FileText, pickup: Truck }
  const ActiveIcon = icons[tab]

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-fuchsia-400/40 bg-fuchsia-400/10 p-5 sm:p-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Dye waste</h1>
        <p className="mt-1 max-w-2xl text-sm opacity-80">
          Handle textile, printing and tannery dye waste safely. Check your effluent, store it correctly, keep a record, and arrange a pickup.
        </p>
        <Link to="/centers?material=Dye%20waste" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-fuchsia-300 underline">
          <MapPin className="h-4 w-4" aria-hidden="true" /> Find hubs that take dye waste
        </Link>
      </div>

      <TabBar tabs={TABS} value={tab} onChange={setTab} accent="bg-fuchsia-400" label="Dye waste tools" />

      <Glass className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <ActiveIcon className="h-5 w-5 text-fuchsia-300" aria-hidden="true" />
          {TABS.find(t => t.id === tab).label}
        </h2>
        {tab === 'know' && <KnowYourWaste />}
        {tab === 'check' && <EffluentChecker />}
        {tab === 'storage' && <Checklist items={STORAGE_STEPS} barClass="bg-fuchsia-400" />}
        {tab === 'log' && <WasteLog />}
        {tab === 'pickup' && <PickupRequest />}
      </Glass>
    </div>
  )
}

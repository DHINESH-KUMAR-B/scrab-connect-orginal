import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { animate, motion, useInView, useReducedMotion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Compass, Cpu, IndianRupee, Leaf, Truck } from 'lucide-react'
import { Glass } from './ui'
import { CATEGORIES, impact } from '../lib/ai'
import { useAuth } from '../context/AuthContext'

const PRESET_SCENARIOS = [
  {
    key: 'tech',
    label: 'Old tech drawer',
    category: 'E-Waste',
    weight: 6,
    note: 'Broken router, old laptop, chargers & cables',
  },
  {
    key: 'copper',
    label: 'Copper & brass repair',
    category: 'Copper',
    weight: 3,
    note: 'Stripped copper coils, pipes & brass taps',
  },
  {
    key: 'paper',
    label: 'Monthly newspapers & boxes',
    category: 'Newspaper',
    weight: 18,
    note: 'Tied paper bundles & flattened shipping cartons',
  },
  {
    key: 'plastic',
    label: 'Kitchen bottles & cans',
    category: 'Aluminum cans',
    weight: 8,
    note: 'Crushed cans & rinsed clear PET bottles',
  },
]

const FLOW_STEPS = [
  {
    step: '01',
    title: 'Snap or weigh in 10 seconds',
    detail: 'Use AI scrap detection or pick from 25 transparent grades to preview exact payouts upfront.',
    metric: '25 live grades',
    icon: Cpu,
  },
  {
    step: '02',
    title: 'Pick payout & slot style',
    detail: 'Choose Instant UPI, 20% Tree Split, Eco-Store Credit (+12%), or 3× Green Points.',
    metric: '4 payout modes',
    icon: IndianRupee,
  },
  {
    step: '03',
    title: 'Track buyer live with PIN',
    detail: 'Follow your collector moving live on the map with ETA, gate notes, and 4-digit handoff PIN.',
    metric: 'Live GPS + PIN',
    icon: Truck,
  },
  {
    step: '04',
    title: 'Drop off at 20,500+ India hubs',
    detail: 'Prefer walking in? Visit any verified neighborhood hub across 36 States & UTs for +5–10% extra.',
    metric: '20,526 hubs',
    icon: Compass,
  },
  {
    step: '05',
    title: 'Unlock goal & wheel rewards',
    detail: 'Hit monthly kg milestones to spin the bonus wheel, claim vouchers, and plant trees.',
    metric: 'Up to ₹500 perks',
    icon: Leaf,
  },
]

const RATE_STREAM = [
  { category: 'Copper', rate: 620, delta: '+2.5%' },
  { category: 'Brass', rate: 410, delta: '+1.4%' },
  { category: 'Mobile phones', rate: 120, delta: '+4.3%' },
  { category: 'Aluminum cans', rate: 110, delta: '+4.8%' },
  { category: 'Cables & wires', rate: 95, delta: '+5.6%' },
  { category: 'E-Waste', rate: 60, delta: '+3.4%' },
  { category: 'Iron and steel', rate: 32, delta: '+3.2%' },
  { category: 'PET bottles', rate: 22, delta: '+4.8%' },
  { category: 'Newspaper', rate: 14, delta: '+3.7%' },
  { category: 'Cardboard', rate: 9, delta: '+5.9%' },
]

export function AnimatedNumber({ value, prefix = '', suffix = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const prefersReduced = useReducedMotion()
  const [display, setDisplay] = useState(prefersReduced ? value : 0)

  useEffect(() => {
    if (prefersReduced) {
      setDisplay(value)
      return undefined
    }
    if (!inView) return undefined
    const controls = animate(display, value, {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: latest => setDisplay(Math.round(latest)),
    })
    return () => controls.stop()
  }, [value, inView, prefersReduced])

  return (
    <span ref={ref} className="font-mono tabular-nums">
      {prefix}{display.toLocaleString('en-IN')}{suffix}
    </span>
  )
}

export function RateMarqueeBand() {
  const prefersReduced = useReducedMotion()
  const items = prefersReduced ? RATE_STREAM.slice(0, 6) : [...RATE_STREAM, ...RATE_STREAM]

  return (
    <section aria-label="Live market rates across India" className="overflow-hidden border-y border-white/10 py-3">
      {prefersReduced ? (
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs">
          {items.map(item => (
            <Link key={item.category} to="/rates" className="inline-flex items-center gap-2 opacity-85 hover:text-leaf-400 hover:opacity-100">
              <span className="font-medium">{item.category}</span>
              <span className="font-mono font-bold tabular-nums text-leaf-400">₹{item.rate}/kg</span>
            </Link>
          ))}
        </div>
      ) : (
        <motion.div
          className="flex w-max items-center gap-8"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 28, ease: 'linear', repeat: Infinity }}
          whileHover={{ transition: { duration: 60 } }}
        >
          {items.map((item, idx) => (
            <Link
              key={`${item.category}-${idx}`}
              to="/rates"
              className="inline-flex items-center gap-2 whitespace-nowrap text-xs opacity-85 transition hover:text-leaf-400 hover:opacity-100"
            >
              <span className="font-medium">{item.category}</span>
              <span className="font-mono font-bold tabular-nums text-leaf-400">₹{item.rate}/kg</span>
              <span className="font-mono text-[11px] tabular-nums opacity-65">{item.delta}</span>
            </Link>
          ))}
        </motion.div>
      )}
    </section>
  )
}

export function InteractiveValuePlayground() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [presetKey, setPresetKey] = useState('copper')
  const [category, setCategory] = useState('Copper')
  const [weight, setWeight] = useState(5)

  const rate = CATEGORIES[category] ?? 14
  const payout = Math.round(weight * rate)
  const eco = impact(weight)
  const points = Math.round(weight * 12)
  const circleProgress = Math.min(1, weight / 50)

  const pickPreset = preset => {
    setPresetKey(preset.key)
    setCategory(preset.category)
    setWeight(preset.weight)
  }

  const handleBook = () => {
    if (user?.role === 'user') {
      nav('/pickup', { state: { bundle: [{ category, weight }] } })
    } else {
      nav('/login')
    }
  }

  return (
    <section aria-labelledby="playground-heading">
      <Glass className="overflow-hidden">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="space-y-5 lg:col-span-7">
            <div>
              <h2 id="playground-heading" className="text-2xl font-bold sm:text-3xl">
                Estimate your scrap value live
              </h2>
              <p className="mt-1 text-sm opacity-75">
                Pick a household bundle or slide the weight to watch payouts, CO₂ avoided, and green points update in real time.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Quick scrap presets">
              {PRESET_SCENARIOS.map(item => {
                const active = presetKey === item.key && category === item.category
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => pickPreset(item)}
                    className={`rounded-xl border p-3 text-left transition ${
                      active ? 'border-leaf-400 bg-leaf-500/15' : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold">{item.label}</span>
                      <span className="font-mono font-bold tabular-nums text-leaf-400">
                        ₹{CATEGORIES[item.category]}/kg
                      </span>
                    </div>
                    <p className="mt-1 text-xs opacity-65">{item.note}</p>
                  </button>
                )
              })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="home-calc-cat" className="mb-1.5 block text-xs font-medium opacity-75">
                  Material grade
                </label>
                <select
                  id="home-calc-cat"
                  value={category}
                  onChange={e => {
                    setCategory(e.target.value)
                    setPresetKey('')
                  }}
                  className="input text-sm"
                >
                  {Object.entries(CATEGORIES).map(([cat, p]) => (
                    <option key={cat} value={cat}>{cat} (₹{p}/kg)</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <label htmlFor="home-calc-kg" className="font-medium opacity-75">Approx. load weight</label>
                  <strong className="font-mono tabular-nums text-leaf-400">{weight} kg</strong>
                </div>
                <input
                  id="home-calc-kg"
                  type="range"
                  min="1"
                  max="80"
                  value={weight}
                  onChange={e => setWeight(Number(e.target.value))}
                  className="mt-2 w-full accent-green-500"
                />
                <div className="flex justify-between text-[11px] tabular-nums opacity-55">
                  <span>1 kg</span>
                  <span>40 kg</span>
                  <span>80 kg</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-5 rounded-2xl border border-white/10 bg-white/5 p-6 text-center lg:col-span-5">
            <div className="relative flex h-44 w-44 items-center justify-center">
              <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                <motion.circle
                  cx="70"
                  cy="70"
                  r="58"
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth="10"
                  strokeLinecap="round"
                  initial={{ pathLength: 0.2 }}
                  animate={{ pathLength: Math.max(0.08, circleProgress) }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs opacity-65">Estimated payout</span>
                <span className="mt-0.5 text-3xl font-extrabold text-leaf-400">
                  <AnimatedNumber value={payout} prefix="₹" />
                </span>
                <span className="mt-0.5 font-mono text-xs tabular-nums opacity-75">
                  +{points} Green Points
                </span>
              </div>
            </div>

            <div className="grid w-full grid-cols-3 gap-2 text-xs tabular-nums">
              <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                <p className="opacity-65">CO₂ cut</p>
                <p className="mt-0.5 font-mono font-bold">{eco.co2} kg</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                <p className="opacity-65">Water saved</p>
                <p className="mt-0.5 font-mono font-bold">{eco.water} L</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                <p className="opacity-65">Energy</p>
                <p className="mt-0.5 font-mono font-bold">{eco.energy} kWh</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBook}
              className="btn flex w-full items-center justify-center gap-2 whitespace-nowrap text-sm"
            >
              Lock ₹{payout} rate &amp; schedule <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </Glass>
    </section>
  )
}

export function InteractiveJourneySteps() {
  const [activeStep, setActiveStep] = useState(0)
  const current = FLOW_STEPS[activeStep]

  return (
    <section aria-labelledby="journey-heading" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="journey-heading" className="text-2xl font-bold sm:text-3xl">How Scrap Connect works</h2>
          <p className="mt-1 text-sm opacity-75">Select any stage to inspect transparent pricing, live GPS tracking, and rewards.</p>
        </div>
        <Link to="/creative" className="inline-flex items-center gap-1.5 text-sm font-semibold text-leaf-400 underline whitespace-nowrap">
          Open creative studio <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {FLOW_STEPS.map((item, idx) => {
          const Icon = item.icon
          const selected = idx === activeStep
          return (
            <motion.button
              key={item.step}
              type="button"
              onClick={() => setActiveStep(idx)}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={`glass flex flex-col justify-between text-left transition ${
                selected ? 'border-leaf-400 bg-leaf-500/15' : 'opacity-80 hover:bg-white/10 hover:opacity-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-extrabold tabular-nums text-leaf-400">{item.step}</span>
                  <Icon className={`h-4 w-4 ${selected ? 'text-leaf-400' : 'opacity-65'}`} aria-hidden="true" />
                </div>
                <h3 className="mt-2 font-semibold leading-snug">{item.title}</h3>
              </div>
              <p className="mt-3 font-mono text-xs tabular-nums opacity-70">{item.metric}</p>
            </motion.button>
          )
        })}
      </div>

      <motion.div
        key={current.step}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        <Glass className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-leaf-400" aria-hidden="true" />
            <div>
              <p className="font-semibold">{current.step}. {current.title}</p>
              <p className="mt-0.5 text-sm opacity-75">{current.detail}</p>
            </div>
          </div>
          <Link to={activeStep === 3 ? '/centers' : activeStep === 0 ? '/rates' : '/login'} className="btn whitespace-nowrap shrink-0 text-xs">
            Explore stage
          </Link>
        </Glass>
      </motion.div>
    </section>
  )
}

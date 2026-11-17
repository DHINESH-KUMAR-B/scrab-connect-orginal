import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarClock, Check, Hammer, Home, MessageSquare, Recycle, Users } from 'lucide-react'
import { Glass, useToast } from '../components/ui'
import { LikeButton, TargetReviewPanel } from '../components/CommunityFeedback'
import { CATEGORIES, impact } from '../lib/ai'
import { api } from '../lib/api'
import { configured } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import copperImg from '../assets/images/scrap_copper_metals_1794940072638.jpg'
import ewasteImg from '../assets/images/scrap_ewaste_recovery_1794940072199.jpg'
import paperImg from '../assets/images/scrap_paper_bundles_1794940072851.jpg'
import plasticsImg from '../assets/images/reward_sorted_recyclables_1794939033364.jpg'
import canopyImg from '../assets/images/reward_green_canopy_1794939033353.jpg'
import heroImg from '../assets/images/scrap_hero_pickup_1794940071713.jpg'

const ROOM_PRESETS = [
  {
    key: 'office',
    label: 'Home office & electronics',
    items: [
      { id: 'laptops', name: 'Old laptop or monitor', category: 'E-Waste', defaultKg: 4 },
      { id: 'cables', name: 'Tangled chargers & power strips', category: 'Cables & wires', defaultKg: 2 },
      { id: 'phones', name: 'Drawer smartphones (wiped)', category: 'Mobile phones', defaultKg: 1 },
      { id: 'office-paper', name: 'Printed files & notebooks', category: 'Paper', defaultKg: 6 },
    ],
  },
  {
    key: 'kitchen',
    label: 'Kitchen & pantry',
    items: [
      { id: 'pet', name: 'Rinsed water & beverage bottles', category: 'PET bottles', defaultKg: 4 },
      { id: 'cans', name: 'Crushed aluminum beverage cans', category: 'Aluminum cans', defaultKg: 2 },
      { id: 'glass', name: 'Sauce & pickle glass jars', category: 'Glass bottles', defaultKg: 5 },
      { id: 'oil', name: 'Filtered used cooking oil', category: 'Used cooking oil', defaultKg: 3 },
    ],
  },
  {
    key: 'living',
    label: 'Living room & books',
    items: [
      { id: 'news', name: 'Stacked monthly newspapers', category: 'Newspaper', defaultKg: 10 },
      { id: 'books', name: 'Old textbooks & paperbacks', category: 'Books', defaultKg: 7 },
      { id: 'cartons', name: 'Flattened delivery cartons', category: 'Cardboard', defaultKg: 8 },
      { id: 'textiles', name: 'Sorted cotton linens & denim', category: 'Textiles', defaultKg: 4 },
    ],
  },
  {
    key: 'garage',
    label: 'Garage & metals',
    items: [
      { id: 'copper', name: 'AC copper piping & motor coils', category: 'Copper', defaultKg: 3 },
      { id: 'brass', name: 'Old brass taps & hardware', category: 'Brass', defaultKg: 2 },
      { id: 'iron', name: 'Spare iron rods, racks & tools', category: 'Iron and steel', defaultKg: 12 },
      { id: 'batteries', name: 'Dead UPS or inverter battery', category: 'Batteries', defaultKg: 6 },
    ],
  },
]

const UPCYCLE_PROJECTS = [
  {
    id: 'up-jars',
    title: 'Self-watering glass jar herb planters',
    material: 'Glass bottles',
    scrapKg: 3,
    scrapValue: 9,
    upcycleValue: 450,
    duration: '15 min quick craft',
    difficulty: 'Easy',
    steps: 'Cut cotton twine wick, fill bottom reservoir with water, and plant mint or basil in coco peat above.',
    image: plasticsImg,
    alt: 'Sorted household glass bottles and crates ready for reuse',
  },
  {
    id: 'up-cardboard',
    title: 'Modular desk cable & stationery organizer',
    material: 'Cardboard',
    scrapKg: 4,
    scrapValue: 36,
    upcycleValue: 600,
    duration: '15 min quick craft',
    difficulty: 'Easy',
    steps: 'Score double-wall corrugated sheets into angled compartments and wrap edges with kraft tape.',
    image: paperImg,
    alt: 'Clean stacked cardboard cartons ready for craft or baling',
  },
  {
    id: 'up-copper',
    title: 'Minimalist copper-wire plant trellis',
    material: 'Copper',
    scrapKg: 1,
    scrapValue: 620,
    upcycleValue: 850,
    duration: 'Weekend build',
    difficulty: 'Medium',
    steps: 'Shape thick gauge stripped copper wire around bottle forms into geometric climbing rings for indoor vines.',
    image: copperImg,
    alt: 'Spools of bright bare copper wire coils',
  },
  {
    id: 'up-ewaste',
    title: 'Router / Pi local media & Pi-hole server',
    material: 'Small electronics',
    scrapKg: 2,
    scrapValue: 90,
    upcycleValue: 1800,
    duration: 'Weekend build',
    difficulty: 'Medium',
    steps: 'Flash OpenWrt or Linux onto an idle router or thin client instead of scrapping working circuit boards.',
    image: ewasteImg,
    alt: 'Electronics workbench with circuit boards and laptops',
  },
  {
    id: 'up-crates',
    title: 'Vertical balcony compost & herb rack',
    material: 'Wood',
    scrapKg: 8,
    scrapValue: 32,
    upcycleValue: 1400,
    duration: 'Weekend build',
    difficulty: 'Medium',
    steps: 'Sand dry shipping slats, bolt two vertical frames together, and mount aerated kitchen compost trays.',
    image: canopyImg,
    alt: 'Lush urban greenery nourished by backyard composting',
  },
  {
    id: 'up-denim',
    title: 'Heavy-duty tool apron & tote from old denim',
    material: 'Textiles',
    scrapKg: 3,
    scrapValue: 45,
    upcycleValue: 750,
    duration: '15 min quick craft',
    difficulty: 'Easy',
    steps: 'Cut intact back pockets onto the front panel of worn denim legs to build a durable workshop tote.',
    image: heroImg,
    alt: 'Organized doorstep recycling and reusable cloth totes',
  },
]

export default function CreativeStudio() {
  const { user } = useAuth()
  const nav = useNavigate()
  const toast = useToast()

  const [activeRoom, setActiveRoom] = useState('office')
  const [selectedWeights, setSelectedWeights] = useState({
    laptops: 4,
    'office-paper': 6,
    news: 10,
  })

  const [craftFilter, setCraftFilter] = useState('All')
  const [craftLikes, setCraftLikes] = useState({})
  const [reviewCraftId, setReviewCraftId] = useState('')
  const [loggedCrafts, setLoggedCrafts] = useState(() => {
    try {
      const raw = localStorage.getItem(`scrap-diy-crafts:${user?.id || 'guest'}`)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    api.getEngagement({ targetType: 'project', userId: user?.id || 'guest' })
      .then(res => {
        if (res.likes) setCraftLikes(res.likes)
      })
      .catch(() => {})
  }, [user?.id])

  const [autopilot, setAutopilot] = useState(() => {
    try {
      const raw = localStorage.getItem(`scrap-autopilot:${user?.id || 'guest'}`)
      return raw ? JSON.parse(raw) : {
        enabled: false,
        cadence: 'Bi-weekly (every 14 days)',
        day: 'Saturday morning (09:00–11:00)',
        streams: ['Paper', 'Cardboard', 'PET bottles'],
        neighborhoodPool: true,
      }
    } catch {
      return {
        enabled: false,
        cadence: 'Bi-weekly (every 14 days)',
        day: 'Saturday morning (09:00–11:00)',
        streams: ['Paper', 'Cardboard', 'PET bottles'],
        neighborhoodPool: true,
      }
    }
  })

  const roomObj = ROOM_PRESETS.find(r => r.key === activeRoom) || ROOM_PRESETS[0]

  const toggleRoomItem = item => {
    setSelectedWeights(prev => {
      if (prev[item.id]) {
        const next = { ...prev }
        delete next[item.id]
        return next
      }
      return { ...prev, [item.id]: item.defaultKg }
    })
  }

  const allItemsFlat = useMemo(() => ROOM_PRESETS.flatMap(r => r.items), [])

  const declutterBundle = useMemo(() => {
    const grouped = {}
    Object.entries(selectedWeights).forEach(([id, kg]) => {
      const def = allItemsFlat.find(i => i.id === id)
      if (!def || kg <= 0) return
      grouped[def.category] = (grouped[def.category] || 0) + Number(kg)
    })
    return Object.entries(grouped).map(([category, weight]) => ({
      category,
      weight,
      pricePerKg: CATEGORIES[category] ?? 5,
    }))
  }, [selectedWeights, allItemsFlat])

  const declutterStats = useMemo(() => {
    const totalKg = declutterBundle.reduce((s, i) => s + i.weight, 0)
    const totalPayout = Math.round(declutterBundle.reduce((s, i) => s + i.weight * i.pricePerKg, 0))
    return { totalKg, totalPayout, eco: impact(totalKg), points: Math.round(totalKg * 12) }
  }, [declutterBundle])

  const bookDeclutterBundle = () => {
    if (!declutterBundle.length) {
      toast('Select at least one room item to build a pickup.')
      return
    }
    if (user?.role && user.role !== 'user') {
      toast('Switch to a customer account to book a doorstep pickup.')
      return
    }
    nav('/pickup', { state: { bundle: declutterBundle } })
  }

  const logDiyCraft = async project => {
    if (loggedCrafts[project.id]) return
    const next = { ...loggedCrafts, [project.id]: true }
    setLoggedCrafts(next)
    try {
      localStorage.setItem(`scrap-diy-crafts:${user?.id || 'guest'}`, JSON.stringify(next))
    } catch {
      // ignore storage failure
    }
    if (!configured && user?.id) {
      try {
        await api.claimReward({
          userId: user.id,
          rewardId: project.id,
          code: `DIY-${project.id.toUpperCase()}`,
          title: `Upcycled: ${project.title}`,
          bonusPoints: 40,
        })
      } catch {
        // ignore network error
      }
    }
    toast(`Logged DIY craft (+40 Green Points): ${project.title}`)
  }

  const saveAutopilot = next => {
    setAutopilot(next)
    try {
      localStorage.setItem(`scrap-autopilot:${user?.id || 'guest'}`, JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  const visibleProjects = UPCYCLE_PROJECTS.filter(p => craftFilter === 'All' || p.duration === craftFilter)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Creative recycling studio</h1>
          <p className="mt-1 text-sm opacity-75">
            Declutter room-by-room for instant pickup quotes, explore DIY upcycle builds, or automate neighborhood eco-collections.
          </p>
        </div>
        <button
          type="button"
          onClick={bookDeclutterBundle}
          className="btn inline-flex items-center gap-2 whitespace-nowrap"
        >
          Book selected ({declutterStats.totalKg} kg) <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* 1. Room-by-Room Declutter & Value Builder */}
      <section className="space-y-4" aria-labelledby="declutter-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-leaf-400" aria-hidden="true" />
            <h2 id="declutter-heading" className="text-xl font-bold">Room-by-room value builder</h2>
          </div>
          <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/5 p-1 text-xs" role="tablist" aria-label="Select room">
            {ROOM_PRESETS.map(r => (
              <button
                key={r.key}
                type="button"
                role="tab"
                aria-selected={activeRoom === r.key}
                onClick={() => setActiveRoom(r.key)}
                className={`whitespace-nowrap shrink-0 rounded-lg px-3 py-1.5 font-medium transition ${
                  activeRoom === r.key ? 'bg-leaf-500 text-emerald-950' : 'opacity-75 hover:bg-white/10'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Glass className="lg:col-span-2">
            <p className="mb-3 text-xs opacity-70">Tap any household item to include it in your multi-room scrap quote and adjust weight.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {roomObj.items.map(item => {
                const activeKg = selectedWeights[item.id] || 0
                const isSelected = activeKg > 0
                const rate = CATEGORIES[item.category] ?? 5
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-3.5 transition ${
                      isSelected ? 'border-leaf-400 bg-leaf-500/15' : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => toggleRoomItem(item)}
                        className="text-left"
                      >
                        <p className="text-sm font-semibold">{item.name}</p>
                        <p className="mt-0.5 text-xs opacity-70">{item.category} · <span className="font-mono tabular-nums">₹{rate}/kg</span></p>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleRoomItem(item)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                          isSelected ? 'border-leaf-400 bg-leaf-500 text-emerald-950' : 'border-white/15 hover:bg-white/10'
                        }`}
                      >
                        {isSelected ? 'Added' : 'Include'}
                      </button>
                    </div>
                    {isSelected && (
                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-2.5 text-xs">
                        <label htmlFor={`room-kg-${item.id}`} className="opacity-75">Weight (kg):</label>
                        <div className="flex items-center gap-2">
                          <input
                            id={`room-kg-${item.id}`}
                            type="number"
                            min="1"
                            max="150"
                            value={activeKg}
                            onChange={e => setSelectedWeights(prev => ({
                              ...prev,
                              [item.id]: Math.max(1, Number(e.target.value) || 1),
                            }))}
                            className="input !w-20 !py-1 text-right font-mono tabular-nums"
                          />
                          <span className="font-mono font-bold tabular-nums text-leaf-400">
                            ₹{Math.round(activeKg * rate)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Glass>

          <Glass className="flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-semibold">Combined cleanout quote</h3>
              <p className="mt-1 text-xs opacity-70">Aggregated across all rooms you selected.</p>
              {declutterBundle.length ? (
                <ul className="mt-3 divide-y divide-white/10 text-xs">
                  {declutterBundle.map(row => (
                    <li key={row.category} className="flex items-center justify-between py-2 tabular-nums">
                      <span>{row.category} ({row.weight} kg)</span>
                      <span className="font-mono font-semibold">₹{Math.round(row.weight * row.pricePerKg)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm opacity-65">No items selected yet.</p>
              )}
            </div>

            <div className="space-y-3 border-t border-white/10 pt-3">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-white/5 p-2">
                  <p className="opacity-65">Weight</p>
                  <p className="font-mono font-bold tabular-nums">{declutterStats.totalKg} kg</p>
                </div>
                <div className="rounded-lg bg-white/5 p-2">
                  <p className="opacity-65">Payout</p>
                  <p className="font-mono font-bold tabular-nums text-leaf-400">₹{declutterStats.totalPayout}</p>
                </div>
                <div className="rounded-lg bg-white/5 p-2">
                  <p className="opacity-65">CO₂ cut</p>
                  <p className="font-mono font-bold tabular-nums">{declutterStats.eco.co2} kg</p>
                </div>
              </div>
              <button
                type="button"
                onClick={bookDeclutterBundle}
                className="btn w-full whitespace-nowrap text-sm"
              >
                Send {declutterBundle.length} categories to pickup
              </button>
            </div>
          </Glass>
        </div>
      </section>

      {/* 2. Upcycle vs Sell Creative Blueprints */}
      <section className="space-y-4" aria-labelledby="upcycle-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Hammer className="h-5 w-5 text-leaf-400" aria-hidden="true" />
            <div>
              <h2 id="upcycle-heading" className="text-xl font-bold">Upcycle vs. sell explorer</h2>
              <p className="text-xs opacity-70">Turn everyday recyclables into functional home projects for +40 Green Points, or sell them directly.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/5 p-1 text-xs" role="tablist" aria-label="Filter craft duration">
            {['All', '15 min quick craft', 'Weekend build'].map(tab => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={craftFilter === tab}
                onClick={() => setCraftFilter(tab)}
                className={`whitespace-nowrap shrink-0 rounded-lg px-3 py-1.5 font-medium transition ${
                  craftFilter === tab ? 'bg-leaf-500 text-emerald-950' : 'opacity-75 hover:bg-white/10'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleProjects.map(project => {
            const done = Boolean(loggedCrafts[project.id])
            return (
              <article key={project.id} className="glass flex flex-col overflow-hidden !p-0">
                <div className="relative h-44 bg-gradient-to-br from-emerald-900 to-emerald-950">
                  <img
                    src={project.image}
                    alt={project.alt}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/25 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <p className="text-xs font-medium text-leaf-300">{project.duration} · {project.difficulty}</p>
                    <h3 className="text-base font-bold leading-snug">{project.title}</h3>
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between gap-3 p-4 text-sm">
                  <div className="space-y-2">
                    <p className="text-xs leading-relaxed opacity-80">{project.steps}</p>
                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs tabular-nums">
                      <div>
                        <p className="opacity-60">Scrap value ({project.scrapKg} kg)</p>
                        <p className="font-mono font-bold">₹{project.scrapValue}</p>
                      </div>
                      <div className="text-right">
                        <p className="opacity-60">DIY item savings</p>
                        <p className="font-mono font-bold text-leaf-400">~₹{project.upcycleValue}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={done}
                      onClick={() => logDiyCraft(project)}
                      className="btn flex-1 whitespace-nowrap !py-1.5 !px-3 text-xs disabled:opacity-60"
                    >
                      {done ? (
                        <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5" aria-hidden="true" /> Crafted (+40 pts)</span>
                      ) : (
                        'Log DIY (+40 pts)'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => nav('/pickup', { state: { bundle: [{ category: project.material, weight: project.scrapKg }] } })}
                      className="rounded-xl border border-white/15 px-3 py-1.5 text-xs font-medium whitespace-nowrap hover:bg-white/10"
                    >
                      Sell as scrap
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2.5">
                    <LikeButton
                      targetType="project"
                      targetId={project.id}
                      initialCount={craftLikes[`project:${project.id}`]?.count ?? 45}
                      initialLiked={craftLikes[`project:${project.id}`]?.liked ?? false}
                      onChange={res => setCraftLikes(prev => ({ ...prev, [res.key]: { count: res.count, liked: res.liked } }))}
                    />
                    <button
                      type="button"
                      onClick={() => setReviewCraftId(reviewCraftId === project.id ? '' : project.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-leaf-400 hover:underline whitespace-nowrap"
                    >
                      <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                      {reviewCraftId === project.id ? 'Hide reviews' : 'Rate & review craft'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        {reviewCraftId && (
          <Glass className="mt-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-bold">
                Craft reviews: {UPCYCLE_PROJECTS.find(p => p.id === reviewCraftId)?.title}
              </h3>
              <button type="button" onClick={() => setReviewCraftId('')} className="text-xs underline opacity-75">
                Close
              </button>
            </div>
            <TargetReviewPanel
              targetType="project"
              targetId={reviewCraftId}
              targetName={UPCYCLE_PROJECTS.find(p => p.id === reviewCraftId)?.title || 'DIY Craft'}
              compact
            />
          </Glass>
        )}
      </section>

      {/* 3. Auto-Pilot Recurring Subscriptions & Neighborhood Pool */}
      <Glass>
        <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-leaf-400" aria-hidden="true" />
              <h2 className="text-xl font-bold">Auto-pilot recurring pickups &amp; neighborhood pool</h2>
            </div>
            <p className="text-sm opacity-75">
              Never let boxes pile up. Set a recurring schedule and pair with nearby households on the same street to unlock a +10% collective batch bonus.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
              <span className="inline-flex items-center gap-1.5 font-medium text-leaf-400">
                <Users className="h-4 w-4" aria-hidden="true" /> 14 active neighbors in your zone
              </span>
              <span className="inline-flex items-center gap-1.5 opacity-80">
                <Recycle className="h-4 w-4 text-leaf-400" aria-hidden="true" /> +10% payout when neighborhood pool &gt; 30 kg
              </span>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="auto-cadence" className="mb-1 block text-xs opacity-70">Repeat schedule</label>
                <select
                  id="auto-cadence"
                  value={autopilot.cadence}
                  onChange={e => saveAutopilot({ ...autopilot, cadence: e.target.value })}
                  className="input text-xs"
                >
                  <option>Weekly (cafes &amp; offices)</option>
                  <option>Bi-weekly (every 14 days)</option>
                  <option>Monthly cleanout</option>
                  <option>Quarterly festive sweep</option>
                </select>
              </div>
              <div>
                <label htmlFor="auto-slot" className="mb-1 block text-xs opacity-70">Preferred arrival window</label>
                <select
                  id="auto-slot"
                  value={autopilot.day}
                  onChange={e => saveAutopilot({ ...autopilot, day: e.target.value })}
                  className="input text-xs"
                >
                  <option>Saturday morning (09:00–11:00)</option>
                  <option>Sunday afternoon (15:00–17:00)</option>
                  <option>Wednesday morning (08:30–10:30)</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={autopilot.neighborhoodPool}
                onChange={e => saveAutopilot({ ...autopilot, neighborhoodPool: e.target.checked })}
                className="accent-green-500"
              />
              Join shared neighborhood batch route (+10% group bonus &amp; lower vehicle emissions)
            </label>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  const next = { ...autopilot, enabled: !autopilot.enabled }
                  saveAutopilot(next)
                  toast(next.enabled ? `Auto-pilot active: ${next.cadence}` : 'Auto-pilot schedule paused')
                }}
                className="btn whitespace-nowrap !py-2 !px-4 text-xs"
              >
                {autopilot.enabled ? 'Auto-pilot active (click to pause)' : 'Activate auto-pilot plan'}
              </button>
              <button
                type="button"
                onClick={() => nav('/pickup', {
                  state: {
                    bundle: [
                      { category: 'Paper', weight: 6 },
                      { category: 'Cardboard', weight: 5 },
                      { category: 'PET bottles', weight: 4 },
                    ],
                  },
                })}
                className="text-xs font-semibold text-leaf-400 underline"
              >
                Book first cycle now
              </button>
            </div>
          </div>
        </div>
      </Glass>
    </div>
  )
}

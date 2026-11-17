import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import heroImg from '../assets/images/scrap_hero_pickup_1794940071713.jpg'
import copperImg from '../assets/images/scrap_copper_metals_1794940072638.jpg'
import ewasteImg from '../assets/images/scrap_ewaste_recovery_1794940072199.jpg'
import paperImg from '../assets/images/scrap_paper_bundles_1794940072851.jpg'
import canopyImg from '../assets/images/reward_green_canopy_1794939033353.jpg'
import hubImg from '../assets/images/hub_urban_dropcenter_1794941629425.jpg'

const SCENES = [
  {
    id: 'scan',
    step: '01',
    title: 'Snap & AI classify in seconds',
    subtitle: 'On-device MobileNet vision identifies scrap categories and locks upfront per-kg pricing before booking.',
    metricLabel: 'Detected rate',
    metricValue: '₹620 / kg',
    image: copperImg,
    alt: 'Coiled copper wire, brass fittings, and crushed aluminum cans on a steel inspection table',
    pan: { initial: { scale: 1.02, x: 0, y: 0 }, animate: { scale: 1.1, x: -16, y: -8 } },
    ctaLabel: 'Try AI estimator',
    ctaTo: '/rates',
  },
  {
    id: 'dispatch',
    step: '02',
    title: 'Smart neighborhood route batching',
    subtitle: 'Nearby 5 kg+ pickups are grouped automatically so electric fleet vans cut deadhead fuel and arrive on time.',
    metricLabel: 'Route batch savings',
    metricValue: '3 stops · -28% fuel',
    image: heroImg,
    alt: 'Verified eco-collector loading sorted cardboard and crates into an electric cargo van',
    pan: { initial: { scale: 1.08, x: -14, y: 0 }, animate: { scale: 1.02, x: 14, y: -6 } },
    ctaLabel: 'Book a pickup',
    ctaTo: '/login',
  },
  {
    id: 'ewaste',
    step: '03',
    title: 'Certified e-waste & cable recovery',
    subtitle: 'Laptops, smartphones, and circuit boards are weighed digitally and routed to verified recycling hubs.',
    metricLabel: 'E-waste bonus',
    metricValue: '+10% hub payout',
    image: ewasteImg,
    alt: 'Sorted laptops, smartphones, circuit boards, and stripped copper cables at an e-waste workbench',
    pan: { initial: { scale: 1.02, x: 12, y: 6 }, animate: { scale: 1.1, x: -10, y: -8 } },
    ctaLabel: 'Explore drop-off hubs',
    ctaTo: '/centers',
  },
  {
    id: 'paper',
    step: '04',
    title: 'Paper, cardboard & instant UPI payout',
    subtitle: 'Verified collectors weigh dry bundles at your doorstep and settle instantly via UPI, bank transfer, or cash.',
    metricLabel: 'Avg pickup time',
    metricValue: '12 mins · Instant UPI',
    image: paperImg,
    alt: 'Neatly tied stacks of newspapers, flattened cardboard boxes, and office paper inside a recovery hub',
    pan: { initial: { scale: 1.09, x: 0, y: -8 }, animate: { scale: 1.02, x: -12, y: 6 } },
    ctaLabel: 'View paper rates',
    ctaTo: '/rates',
  },
  {
    id: 'impact',
    step: '05',
    title: 'Track trees, CO₂ & green rewards',
    subtitle: 'Every completed kilogram unlocks green points, badges, and monthly cashback vouchers.',
    metricLabel: 'Verified impact',
    metricValue: '820+ trees saved',
    image: canopyImg,
    alt: 'Sunlit green forest canopy viewed from below',
    pan: { initial: { scale: 1.02, x: 0, y: 8 }, animate: { scale: 1.11, x: 0, y: -10 } },
    ctaLabel: 'Open dashboard',
    ctaTo: '/login',
  },
  {
    id: 'hubs',
    step: '06',
    title: 'Walk in across 20,500+ Indian hubs',
    subtitle: 'Drop sorted scrap at solar-roofed community weighbridges across 36 States & UTs for +5–10% bonus rates.',
    metricLabel: 'National network',
    metricValue: '20,526 verified hubs',
    image: hubImg,
    alt: 'Solar-roofed urban recycling drop-off hub in India with digital weighbridge and sorting bins',
    pan: { initial: { scale: 1.07, x: -12, y: 0 }, animate: { scale: 1.01, x: 10, y: -4 } },
    ctaLabel: 'Browse India hubs',
    ctaTo: '/centers',
  },
]

export default function InteractiveRecycleReel() {
  const containerRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [manualLock, setManualLock] = useState(false)
  const [imgErrors, setImgErrors] = useState({})

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'end center'],
  })

  useMotionValueEvent(scrollYProgress, 'change', latest => {
    if (manualLock) return
    const next = Math.min(SCENES.length - 1, Math.max(0, Math.floor(latest * SCENES.length)))
    setActiveIndex(prev => (prev === next ? prev : next))
  })

  useEffect(() => {
    if (!playing) return
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % SCENES.length)
    }, 4200)
    return () => clearInterval(timer)
  }, [playing])

  const selectScene = idx => {
    setManualLock(true)
    setActiveIndex(idx)
    setTimeout(() => setManualLock(false), 2500)
  }

  const scene = SCENES[activeIndex]
  const progressPct = Math.round(((activeIndex + 1) / SCENES.length) * 100)

  return (
    <section ref={containerRef} aria-labelledby="reel-heading" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="reel-heading" className="text-2xl font-bold sm:text-3xl">Interactive pickup reel</h2>
          <p className="mt-1 text-sm opacity-75">Scroll through the workflow or scrub chapters below to preview each stage in motion.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => selectScene((activeIndex - 1 + SCENES.length) % SCENES.length)}
            aria-label="Previous reel scene"
            className="glass flex h-9 w-9 items-center justify-center !p-0 hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true"/>
          </button>
          <button
            type="button"
            onClick={() => setPlaying(p => !p)}
            aria-label={playing ? 'Pause animated reel' : 'Play animated reel'}
            className="glass inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 text-xs font-semibold hover:bg-white/10"
          >
            {playing ? <><Pause className="h-3.5 w-3.5" aria-hidden="true"/> Pause reel</> : <><Play className="h-3.5 w-3.5" aria-hidden="true"/> Play reel</>}
          </button>
          <button
            type="button"
            onClick={() => selectScene((activeIndex + 1) % SCENES.length)}
            aria-label="Next reel scene"
            className="glass flex h-9 w-9 items-center justify-center !p-0 hover:bg-white/10"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true"/>
          </button>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="lg:sticky lg:top-24 lg:col-span-7">
          <div className="glass relative h-80 overflow-hidden !p-0 sm:h-96 bg-gradient-to-br from-emerald-900 to-emerald-950">
            <AnimatePresence mode="wait">
              <motion.div
                key={scene.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45 }}
                className="absolute inset-0"
              >
                {!imgErrors[scene.id] && (
                  <motion.img
                    src={scene.image}
                    alt={scene.alt}
                    referrerPolicy="no-referrer"
                    onError={() => setImgErrors(e => ({ ...e, [scene.id]: true }))}
                    initial={scene.pan.initial}
                    animate={scene.pan.animate}
                    transition={{ duration: 4.5, ease: 'linear' }}
                    className="h-full w-full object-cover"
                  />
                )}
              </motion.div>
            </AnimatePresence>

            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/95 via-emerald-950/30 to-emerald-950/20"/>

            <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-2 text-xs text-white">
              <span className="font-mono font-semibold tabular-nums">Scene {scene.step} / 0{SCENES.length}</span>
              <span className="font-mono font-semibold tabular-nums text-leaf-400">{scene.metricLabel}: {scene.metricValue}</span>
            </div>

            <div className="absolute bottom-4 left-5 right-5 text-white">
              <AnimatePresence mode="wait">
                <motion.div
                  key={scene.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-xl font-bold sm:text-2xl">{scene.title}</h3>
                  <p className="mt-1.5 max-w-xl text-sm text-emerald-50/85">{scene.subtitle}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <Link to={scene.ctaTo} className="btn inline-flex items-center gap-1.5 whitespace-nowrap !py-1.5 !px-3.5 text-xs">
                      {scene.ctaLabel} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true"/>
                    </Link>
                    <span className="font-mono text-xs tabular-nums opacity-75">{progressPct}%</span>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/20">
                <motion.div
                  className="h-full origin-left bg-leaf-400"
                  animate={{ scaleX: progressPct / 100 }}
                  transition={{ duration: 0.35 }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 lg:col-span-5">
          {SCENES.map((item, idx) => {
            const isActive = idx === activeIndex
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectScene(idx)}
                className={`glass block w-full text-left transition ${
                  isActive ? 'border-leaf-400 bg-leaf-500/15' : 'opacity-75 hover:bg-white/10 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono font-bold tabular-nums text-leaf-400">{item.step}. {item.metricValue}</span>
                  {isActive && <span className="text-xs font-semibold text-leaf-400">Active</span>}
                </div>
                <p className="mt-1 font-semibold">{item.title}</p>
                <p className="mt-1 text-xs opacity-75">{item.subtitle}</p>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, MessageSquarePlus, ThumbsUp } from 'lucide-react'
import { Glass, useToast } from '../components/ui'
import BrandLogo from '../components/BrandLogo'
import { LikeButton, StarSummary, TargetReviewPanel } from '../components/CommunityFeedback'
import InteractiveRecycleReel from '../components/InteractiveRecycleReel'
import {
  AnimatedNumber,
  InteractiveJourneySteps,
  InteractiveValuePlayground,
  RateMarqueeBand,
} from '../components/LandingPlayground'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import heroImg from '../assets/images/scrap_hero_pickup_1794940071713.jpg'
import copperImg from '../assets/images/scrap_copper_metals_1794940072638.jpg'
import ewasteImg from '../assets/images/scrap_ewaste_recovery_1794940072199.jpg'
import paperImg from '../assets/images/scrap_paper_bundles_1794940072851.jpg'
import plasticsImg from '../assets/images/reward_sorted_recyclables_1794939033364.jpg'
import canopyImg from '../assets/images/reward_green_canopy_1794939033353.jpg'
import hubUrbanImg from '../assets/images/hub_urban_dropcenter_1794941629425.jpg'
import hubMetalImg from '../assets/images/hub_metal_weighyard_1794941629927.jpg'
import hubEcoImg from '../assets/images/hub_community_ecopoint_1794941630243.jpg'

const HERO_SPOTLIGHTS = [
  { item: 'Stripped Copper', price: '₹620 / kg', note: 'Digital floor scale at your door' },
  { item: 'Mobile & E-Waste', price: '₹120 / kg', note: 'Certified data-safe recovery' },
  { item: 'Aluminum Cans', price: '₹110 / kg', note: '+10% bonus at 20,500+ hubs' },
  { item: 'Paper & Cartons', price: '₹14 / kg', note: 'Smart neighborhood batch pickups' },
]

const photoCards = [
  {
    id: 'metals',
    group: 'Metals',
    title: 'Copper, Brass & Aluminum',
    meta: 'Metals · Up to ₹620/kg',
    detail: 'Stripped copper coils, brass hardware, and crushed cans weighed transparently at your door.',
    prepTip: 'Keep copper wire stripped and separated from steel hardware for the highest grade rate.',
    accepted: ['Copper coils & pipes', 'Brass fittings', 'Aluminum cans', 'Iron & steel'],
    image: copperImg,
    alt: 'Coiled bright copper wire, brass fittings, and crushed aluminum cans on a steel sorting table',
    to: '/rates',
    cta: 'Check metal rates',
    span: 'lg:col-span-2',
  },
  {
    id: 'ewaste',
    group: 'E-Waste',
    title: 'E-Waste & Electronics',
    meta: 'Electronics · Up to ₹120/kg',
    detail: 'Certified recovery for old laptops, smartphones, circuit boards, and insulated cables.',
    prepTip: 'Back up and factory-reset phones or laptops before handing them to a verified hub.',
    accepted: ['Mobile phones', 'Laptops & monitors', 'Cables & chargers', 'UPS batteries'],
    image: ewasteImg,
    alt: 'Sorted laptops, smartphones, circuit boards, and stripped copper cables at an e-waste facility',
    to: '/centers',
    cta: 'Find e-waste hubs',
    span: '',
  },
  {
    id: 'india-hubs',
    group: 'India Hubs',
    title: '20,526+ Solar Drop-Off Hubs',
    meta: '36 States & UTs · +5–10% bonus',
    detail: 'Walk into any neighborhood Scrap Connect center across India for instant weighbridge settlement.',
    prepTip: 'Sort dry recyclables before arriving to earn up to 10% walk-in drop-off bonus.',
    accepted: ['Chennai & Bengaluru', 'Mumbai & Pune', 'Delhi NCR & Jaipur', '72+ Indian cities'],
    image: hubUrbanImg,
    alt: 'Solar-roofed urban recycling drop-off hub in India with digital weighbridge',
    to: '/centers',
    cta: 'Explore 20,500+ hubs',
    span: '',
  },
  {
    id: 'paper',
    group: 'Paper & Card',
    title: 'Paper & Cardboard Bales',
    meta: 'Paper & Card · ₹9–₹14/kg',
    detail: 'Dry newspapers, textbooks, office paper, and flattened cartons bundled cleanly.',
    prepTip: 'Flatten shipping cartons and keep paper stacks dry away from food residue.',
    accepted: ['Newspapers', 'Books & notebooks', 'Office paper', 'Corrugated boxes'],
    image: paperImg,
    alt: 'Tied stacks of newspapers, flattened cardboard boxes, and office paper inside a recovery hub',
    to: '/pickup',
    cta: 'Schedule pickup',
    span: '',
  },
  {
    id: 'plastics',
    group: 'Plastics',
    title: 'Sorted Household Recyclables',
    meta: 'Plastics & Mixed · ₹16–₹22/kg',
    detail: 'Clear PET bottles, HDPE containers, and mixed dry recyclables routed in neighborhood batches.',
    prepTip: 'Rinse and crush PET bottles to save space and qualify for clean-grade rates.',
    accepted: ['PET water bottles', 'HDPE detergent jugs', 'Clean plastic film', 'Tetra packs'],
    image: plasticsImg,
    alt: 'Neatly sorted cardboard, aluminum cans, and PET plastic bottles in labeled wooden crates',
    to: '/rates',
    cta: 'Estimate bundle',
    span: '',
  },
  {
    id: 'metal-yard',
    group: 'India Hubs',
    title: 'Certified Alloy & Weighbridge Yards',
    meta: 'Bulk Metals · Verified Scales',
    detail: 'Commercial-grade warehouse weighbridges built for workshops, apartments, and offices.',
    prepTip: 'Schedule bi-weekly recurring auto-pilot pickups in our Creative Studio.',
    accepted: ['Commercial cardboard', 'Industrial scrap', 'Copper windings', 'EV batteries'],
    image: hubMetalImg,
    alt: 'Sorted metal coils and baled cardboard beside an electronic warehouse weighbridge',
    to: '/creative',
    cta: 'Open creative studio',
    span: '',
  },
  {
    id: 'ecopoint',
    group: 'India Hubs',
    title: 'Neighborhood Eco-Point Kiosks',
    meta: 'EV Feeder Vans · Daily 7:30 AM+',
    detail: 'Residential green kiosks with electric cargo trikes picking up small 5 kg household loads.',
    prepTip: 'Pair with neighbors on your street for +10% pooled route bonuses.',
    accepted: ['Used cooking oil', 'Glass jars', 'Newspaper bundles', 'PET bottles'],
    image: hubEcoImg,
    alt: 'Neighborhood eco-collection kiosk in India with sorted PET bottle crates and electric cargo trike',
    to: '/centers',
    cta: 'Find nearest kiosk',
    span: '',
  },
  {
    id: 'impact',
    group: 'Impact',
    title: 'Measurable Forest & Carbon Impact',
    meta: 'Eco Tracking · Every kg counted',
    detail: 'Every pickup logs trees saved, CO₂ avoided, water conserved, and energy preserved.',
    prepTip: 'Set a monthly kg goal in your dashboard to spin the bonus wheel and unlock ₹500 eco-credits.',
    accepted: ['Trees saved tracking', 'CO₂ footprint cut', 'Water conserved', 'Goal spin rewards'],
    image: canopyImg,
    alt: 'Sunlit green forest canopy viewed from below',
    to: '/login',
    cta: 'Track your impact',
    span: 'lg:col-span-2',
  },
]

const CARD_FILTERS = ['All', 'Metals', 'E-Waste', 'India Hubs', 'Paper & Card', 'Plastics', 'Impact']

const features = [
  ['01. Transparent upfront rates', 'Compare live per-kg prices across 25 material grades before booking. Zero doorstep haggling.'],
  ['02. Bidirectional GPS & PIN tracking', 'Watch your verified buyer travel toward your doorstep pin with live ETA, notes, and a 4-digit security PIN.'],
  ['03. 20,526+ verified India hubs', 'Drop off recyclables at solar community hubs across 36 States & UTs for instant weighbridge payouts and +5–10% bonuses.'],
  ['04. AI product type detector', 'Snap a photo or type any household appliance (Split AC, phone, copper pipe) to decode material shares and ₹ payout value.'],
  ['05. Goal rewards & bonus wheel', 'Set a custom monthly target, cross 25%–100% milestones to spin the reward wheel, and claim cashback or tree plantings.'],
  ['06. Online UPI wallet & 24/7 support', 'Withdraw payouts to UPI or Bank IMPS, buy eco passes online, and resolve any query with our 24/7 Care Desk.'],
]

const quotes = [
  ['Priya Sundaram', 'Household Member, Adyar Chennai', 'Upfront rate was ₹620/kg for copper and matched our UPI settlement to the rupee with 4-digit PIN handoff.'],
  ['Arjun Mehta', 'Operations Lead, GreenBean Cafe Mumbai', 'Our weekly cardboard auto-pilot route saves staff hours and funds native tree plantings with our reward split.'],
  ['Ravi Kumar', 'Verified Fleet Collector, TN-09-4521', 'Live GPS dispatch and neighborhood batching cut daily fuel costs by nearly a third while raising completed stops.'],
]

const easeCurve = [0.16, 1, 0.3, 1]

export default function Landing() {
  const { user } = useAuth()
  const toast = useToast()
  const [imgErrors, setImgErrors] = useState({})
  const [cardFilter, setCardFilter] = useState('All')
  const [expandedCardId, setExpandedCardId] = useState('')
  const [spotlightIdx, setSpotlightIdx] = useState(0)
  const [showcaseLikes, setShowcaseLikes] = useState({})
  const [liveReviews, setLiveReviews] = useState([])
  const [showReviewComposer, setShowReviewComposer] = useState(false)

  const heroVisualRef = useRef(null)
  const { scrollYProgress } = useScroll()
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroVisualRef,
    offset: ['start end', 'end start'],
  })
  const heroScale = useTransform(heroProgress, [0, 0.5, 1], [0.97, 1, 0.98])
  const heroY = useTransform(heroProgress, [0, 1], [16, -20])
  const insetY = useTransform(heroProgress, [0, 1], [-12, 22])

  useEffect(() => {
    const timer = setInterval(() => {
      setSpotlightIdx(prev => (prev + 1) % HERO_SPOTLIGHTS.length)
    }, 3200)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    api.getEngagement({ userId: user?.id || 'guest' })
      .then(res => {
        if (res.likes) setShowcaseLikes(res.likes)
        if (Array.isArray(res.reviews)) setLiveReviews(res.reviews)
      })
      .catch(() => {})
  }, [user?.id])

  const voteHelpful = async reviewId => {
    try {
      const res = await api.toggleReviewHelpful(reviewId, user?.id || 'guest')
      setLiveReviews(prev =>
        prev.map(r => r.id === reviewId ? { ...r, helpfulCount: res.helpfulCount, helpfulByMe: res.helpfulByMe } : r)
      )
    } catch {
      toast('Unable to save helpful vote.')
    }
  }

  const visibleCards = photoCards.filter(card => cardFilter === 'All' || card.group === cardFilter)
  const activeSpotlight = HERO_SPOTLIGHTS[spotlightIdx]

  return (
    <div className="space-y-20">
      <motion.div
        aria-hidden="true"
        style={{ scaleX: scrollYProgress }}
        className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-leaf-400"
      />

      {/* Animated Hero Split */}
      <section className="pt-6">
        <div className="grid items-stretch gap-8 lg:grid-cols-12">
          <div className="flex flex-col justify-center lg:col-span-6">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: easeCurve }}
              className="text-xs font-semibold text-leaf-400"
            >
              Circular doorstep collection · 20,526 Indian hubs · Live GPS tracking
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05, ease: easeCurve }}
              className="mt-3 max-w-xl text-balance text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl"
            >
              Turn everyday scrap into instant value across India.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.12, ease: easeCurve }}
              className="mt-4 max-w-xl opacity-80"
            >
              Lock transparent per-kg rates before pickup, track verified collectors live with 4-digit PIN security, and spin goal rewards as you recycle.
            </motion.p>

            {/* Kinetic Live Spotlight Strip */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.18, ease: easeCurve }}
              className="mt-6 glass flex flex-wrap items-center justify-between gap-3 !p-3.5"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSpotlight.item}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: easeCurve }}
                  className="min-w-0"
                >
                  <p className="text-xs opacity-65">{activeSpotlight.note}</p>
                  <p className="text-sm font-bold">
                    {activeSpotlight.item} · <span className="font-mono tabular-nums text-leaf-400">{activeSpotlight.price}</span>
                  </p>
                </motion.div>
              </AnimatePresence>
              <div className="flex items-center gap-1" role="tablist" aria-label="Cycle spotlight categories">
                {HERO_SPOTLIGHTS.map((s, idx) => (
                  <button
                    key={s.item}
                    type="button"
                    aria-label={`Preview ${s.item} rate`}
                    onClick={() => setSpotlightIdx(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === spotlightIdx ? 'w-6 bg-leaf-400' : 'w-2 bg-white/25 hover:bg-white/45'
                    }`}
                  />
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.24, ease: easeCurve }}
              className="mt-6 flex flex-wrap gap-3"
            >
              <Link className="btn whitespace-nowrap shrink-0" to="/login">Book a pickup</Link>
              <Link className="glass whitespace-nowrap shrink-0 px-5 py-2.5 font-medium hover:bg-white/10" to="/centers">Browse 20,500+ hubs</Link>
              <Link className="glass whitespace-nowrap shrink-0 px-5 py-2.5 font-medium hover:bg-white/10" to="/creative">Creative studio</Link>
            </motion.div>
          </div>

          <div ref={heroVisualRef} className="relative lg:col-span-6">
            <motion.div
              style={{ scale: heroScale, y: heroY }}
              className="glass relative h-80 overflow-hidden !p-0 sm:h-96 lg:h-full lg:min-h-96 bg-gradient-to-br from-emerald-900 to-emerald-950"
            >
              {!imgErrors.hero && (
                <img
                  src={heroImg}
                  alt="Verified eco-collector loading sorted cardboard and recyclables into an electric cargo van"
                  referrerPolicy="no-referrer"
                  onError={() => setImgErrors(e => ({ ...e, hero: true }))}
                  className="h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/20 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <p className="text-xs font-medium opacity-85">Verified electric fleet · Instant UPI payout</p>
                <p className="mt-1 text-lg font-bold">Live User &amp; Buyer GPS with 4-digit doorstep PIN verification</p>
              </div>
            </motion.div>

            {/* Parallax Inset Photo Card */}
            <motion.div
              style={{ y: insetY }}
              className="glass absolute -bottom-4 -right-2 hidden w-56 overflow-hidden !p-0 shadow-2xl md:block"
            >
              <div className="relative h-28 bg-emerald-950">
                <img
                  src={hubUrbanImg}
                  alt="Solar recycling hub bay across India"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-3 right-3 text-white">
                  <p className="font-mono text-xs font-bold tabular-nums text-leaf-300">20,526+ India hubs</p>
                  <p className="text-[11px] opacity-85">36 States &amp; UTs covered</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Smooth Kinetic Market Rate Stream */}
      <RateMarqueeBand />

      {/* Interactive Home Value & Eco-Impact Playground */}
      <InteractiveValuePlayground />

      {/* 6-Scene Animated Workflow Reel */}
      <InteractiveRecycleReel />

      {/* Asymmetric Photo Showcase with India Hubs & Recycling Categories */}
      <section aria-labelledby="gallery-heading">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45, ease: easeCurve }}
          className="mb-5 flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <h2 id="gallery-heading" className="text-2xl font-bold sm:text-3xl">Material streams &amp; Indian hub network</h2>
            <p className="mt-1 text-sm opacity-75">Filter categories or click any facility photo card to inspect accepted items and prep tips.</p>
          </div>
          <Link to="/rates" className="inline-flex items-center gap-1.5 text-sm font-semibold text-leaf-400 underline whitespace-nowrap">
            View all 25 categories <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </motion.div>

        <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/5 p-1" role="tablist" aria-label="Filter recycling photo cards">
          {CARD_FILTERS.map(filter => (
            <button
              key={filter}
              type="button"
              role="tab"
              aria-selected={cardFilter === filter}
              onClick={() => { setCardFilter(filter); setExpandedCardId('') }}
              className={`whitespace-nowrap shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                cardFilter === filter ? 'bg-leaf-500 text-emerald-950' : 'opacity-75 hover:bg-white/10 hover:opacity-100'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {visibleCards.map((card, index) => {
              const isExpanded = expandedCardId === card.id
              return (
                <motion.article
                  layout
                  key={card.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  whileHover={{ y: -5 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.38, delay: index * 0.04, ease: easeCurve }}
                  className={`glass group overflow-hidden !p-0 flex flex-col ${cardFilter === 'All' ? card.span : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedCardId(isExpanded ? '' : card.id)}
                    aria-expanded={isExpanded}
                    className="relative h-52 w-full overflow-hidden text-left bg-gradient-to-br from-emerald-800/50 to-emerald-950/80"
                  >
                    {!imgErrors[card.id] && (
                      <img
                        src={card.image}
                        alt={card.alt}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={() => setImgErrors(e => ({ ...e, [card.id]: true }))}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/25 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <p className="text-xs font-medium text-leaf-400 tabular-nums">{card.meta}</p>
                      <h3 className="text-lg font-bold">{card.title}</h3>
                    </div>
                  </button>
                  <div className="flex flex-1 flex-col justify-between gap-4 p-5">
                    <div className="space-y-2">
                      <p className="text-sm opacity-75">{card.detail}</p>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2 border-t border-white/10 pt-3 text-xs"
                        >
                          <p><strong className="text-leaf-400">Accepted:</strong> {card.accepted.join(' · ')}</p>
                          <p className="opacity-75"><strong>Prep tip:</strong> {card.prepTip}</p>
                        </motion.div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link to={card.to} className="inline-flex items-center gap-1.5 text-sm font-semibold text-leaf-400 hover:underline whitespace-nowrap">
                        {card.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </Link>
                      <div className="flex items-center gap-2">
                        <LikeButton
                          targetType="showcase"
                          targetId={card.id}
                          initialCount={showcaseLikes[`showcase:${card.id}`]?.count ?? 140}
                          initialLiked={showcaseLikes[`showcase:${card.id}`]?.liked ?? false}
                        />
                        <button
                          type="button"
                          onClick={() => setExpandedCardId(isExpanded ? '' : card.id)}
                          className="text-xs underline opacity-70 hover:opacity-100 whitespace-nowrap"
                        >
                          {isExpanded ? 'Hide' : 'Specs'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Interactive 5-Stage Circular Journey */}
      <InteractiveJourneySteps />

      {/* Capabilities Grid */}
      <section aria-labelledby="f">
        <motion.h2
          id="f"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, ease: easeCurve }}
          className="mb-6 text-2xl font-bold"
        >
          Built to fix what scrap apps get wrong
        </motion.h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([t, d], index) => (
            <motion.div
              key={t}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: index * 0.04, ease: easeCurve }}
            >
              <Glass className="h-full">
                <h3 className="font-semibold text-leaf-400">{t}</h3>
                <p className="mt-2 text-sm opacity-75">{d}</p>
              </Glass>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Animated Count-Up Community Proof Strip */}
      <section className="grid grid-cols-2 gap-4 text-center lg:grid-cols-4" aria-label="Platform recycling impact metrics">
        {[
          { num: 48000, suffix: ' kg', label: 'scrap recycled' },
          { num: 3200, suffix: '+', label: 'households active' },
          { num: 20526, suffix: '', label: 'India drop-off hubs' },
          { num: 820, suffix: '', label: 'trees saved' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, delay: index * 0.06, ease: easeCurve }}
          >
            <Glass>
              <p className="text-3xl font-extrabold text-leaf-400">
                <AnimatedNumber value={stat.num} suffix={stat.suffix} />
              </p>
              <p className="mt-1 text-sm opacity-70">{stat.label}</p>
            </Glass>
          </motion.div>
        ))}
      </section>

      {/* Attributable Testimonials & Interactive Reviews */}
      <section aria-labelledby="testimonials-heading" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, ease: easeCurve }}
          >
            <h2 id="testimonials-heading" className="text-2xl font-bold">
              What members &amp; collectors rate us
            </h2>
            <p className="mt-1 text-sm opacity-75">
              Verified 5-star reviews across pickups, hubs, and payouts. Rate your experience or upvote helpful feedback.
            </p>
          </motion.div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowReviewComposer(v => !v)}
              className="btn inline-flex items-center gap-1.5 whitespace-nowrap !py-2 !px-3.5 text-xs"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden="true" />
              {showReviewComposer ? 'Hide review box' : 'Rate & review us'}
            </button>
            <Link to="/reviews" className="glass whitespace-nowrap px-3.5 py-2 text-xs font-semibold hover:bg-white/10">
              All community reviews
            </Link>
          </div>
        </div>

        {showReviewComposer && (
          <TargetReviewPanel
            targetType="platform"
            targetId="scrap-connect"
            targetName="Scrap Connect Platform"
            compact
            onSubmitted={rev => {
              if (rev) setLiveReviews(prev => [rev, ...prev.filter(r => r.id !== rev.id)])
            }}
          />
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {quotes.map(([name, role, quote], index) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: index * 0.07, ease: easeCurve }}
            >
              <Glass className="flex h-full flex-col justify-between">
                <div>
                  <StarSummary rating={5} />
                  <p className="mt-2 text-sm leading-relaxed">“{quote}”</p>
                </div>
                <div className="mt-4 border-t border-white/10 pt-3">
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs opacity-65">{role}</p>
                </div>
              </Glass>
            </motion.div>
          ))}
        </div>

        {liveReviews.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {liveReviews.slice(0, 4).map(rev => (
              <Glass key={rev.id} className="space-y-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{rev.targetName}</p>
                    <p className="text-xs opacity-65">by {rev.userName}</p>
                  </div>
                  <StarSummary rating={rev.rating} />
                </div>
                <p className="text-xs leading-relaxed opacity-85">“{rev.comment}”</p>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-xs text-leaf-400">
                    {rev.tags?.length ? rev.tags.join(' · ') : 'Verified member'}
                  </span>
                  <button
                    type="button"
                    onClick={() => voteHelpful(rev.id)}
                    aria-pressed={Boolean(rev.helpfulByMe)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition ${
                      rev.helpfulByMe ? 'border-leaf-400 bg-leaf-500/20 text-leaf-300' : 'border-white/15 opacity-75 hover:bg-white/10'
                    }`}
                  >
                    <ThumbsUp className="h-3 w-3" aria-hidden="true" />
                    Helpful ({rev.helpfulCount || 0})
                  </button>
                </div>
              </Glass>
            ))}
          </div>
        )}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm opacity-75">
        <div className="flex flex-wrap items-center gap-3">
          <BrandLogo size={24} withWordmark wordmarkClass="text-sm font-bold" />
          <span className="text-xs opacity-70">· © 2026 Nationwide recycling &amp; doorstep pickup platform.</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs sm:text-sm">
          <Link to="/rates" className="hover:underline">Rates &amp; AI detector</Link>
          <Link to="/centers" className="hover:underline">20,500+ India hubs</Link>
          <Link to="/wallet" className="hover:underline">Online wallet</Link>
          <Link to="/support" className="hover:underline">Customer support</Link>
          <Link to="/creative" className="hover:underline">Creative studio</Link>
          <Link to="/reviews" className="hover:underline">Reviews</Link>
          <Link to="/login" className="hover:underline">Sign in</Link>
        </div>
      </footer>
    </div>
  )
}

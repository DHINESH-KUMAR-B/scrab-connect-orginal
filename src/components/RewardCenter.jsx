import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Award, Check, Copy, Gift, HeartHandshake, RotateCw } from 'lucide-react'
import { Glass, useToast } from './ui'
import { ECO_DONATION_CAUSES, REWARD_CATALOG, WHEEL_PRIZES } from '../lib/rewards'
import { api } from '../lib/api'
import { configured } from '../lib/firebase'
import CANOPY_IMG from '../assets/images/reward_green_canopy_1794939033353.jpg'

const CATEGORIES = [
  { key: 'all', label: 'All rewards' },
  { key: 'cashback', label: 'Cashback' },
  { key: 'boost', label: 'Rate boosts' },
  { key: 'eco', label: 'Eco impact' },
  { key: 'perks', label: 'Partner perks' },
  { key: 'unlocked', label: 'Unlocked' },
]

const MILESTONES = [25, 50, 75, 100]

function readStoredValue(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value === null ? fallback : value
  } catch (error) {
    console.error('Unable to read saved reward settings.', error)
    return fallback
  }
}

export default function RewardCenter({ userId, monthlyKg, onRewardClaimed }) {
  const toast = useToast()
  const month = new Date().toISOString().slice(0, 7)
  const goalKey = `scrap-monthly-goal:${userId}:${month}`
  const claimsKey = `scrap-reward-claims:${userId}:${month}`
  const spinsKey = `scrap-wheel-spins:${userId}:${month}`

  const [goal, setGoal] = useState(() => {
    const saved = Number(readStoredValue(goalKey, 50))
    return Number.isFinite(saved) && saved >= 10 && saved <= 200 ? saved : 50
  })

  const [claimed, setClaimed] = useState(() => {
    try {
      const saved = readStoredValue(claimsKey, '{}')
      const parsed = JSON.parse(saved)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  })

  const [spinsUsed, setSpinsUsed] = useState(() => {
    const saved = Number(readStoredValue(spinsKey, 0))
    return Number.isFinite(saved) && saved >= 0 ? saved : 0
  })

  const [wheelAngle, setWheelAngle] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [lastWon, setLastWon] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [copiedCode, setCopiedCode] = useState('')
  const [storageError, setStorageError] = useState('')
  const [imgErrors, setImgErrors] = useState({})

  useEffect(() => {
    if (configured || !userId) return
    let active = true
    api.getRewards(userId)
      .then(res => {
        if (!active || !Array.isArray(res.claims) || !res.claims.length) return
        setClaimed(prev => {
          const merged = { ...prev }
          res.claims.forEach(c => {
            merged[c.rewardId] = c.code
          })
          try {
            localStorage.setItem(claimsKey, JSON.stringify(merged))
          } catch {
            // ignore storage errors
          }
          return merged
        })
      })
      .catch(() => {})
    return () => { active = false }
  }, [userId, claimsKey])

  const progress = Math.min(100, Math.round((monthlyKg / goal) * 100))
  const earnedSpins = (monthlyKg >= 5 ? 1 : 0) + MILESTONES.filter(pct => progress >= pct).length
  const spinsRemaining = Math.max(0, earnedSpins - spinsUsed)

  const getRequirement = offer => (offer.goalBased ? goal : offer.requirement)
  const isEligible = offer => monthlyKg >= getRequirement(offer)

  const unlockedCount = REWARD_CATALOG.filter(offer => isEligible(offer)).length

  const walletItems = useMemo(() => {
    const allCatalog = [
      ...REWARD_CATALOG.map(r => ({ id: r.id, title: r.title, benefitLabel: r.benefitLabel, isVoucher: true })),
      ...WHEEL_PRIZES.map(w => ({ id: w.id, title: `Bonus wheel: ${w.label}`, benefitLabel: `+${w.bonusPoints} pts`, isVoucher: w.bonusRupees > 0 || Boolean(w.bonusPctAll) })),
      ...ECO_DONATION_CAUSES.map(d => ({ id: d.id, title: `Eco pledge: ${d.title}`, benefitLabel: `+${d.bonusPoints} pts`, isVoucher: false })),
    ]
    return allCatalog
      .filter(entry => Boolean(claimed[entry.id]))
      .map(entry => ({ ...entry, code: claimed[entry.id] }))
  }, [claimed])

  const visibleOffers = REWARD_CATALOG.filter(offer => {
    if (categoryFilter === 'unlocked') return isEligible(offer) || Boolean(claimed[offer.id])
    if (categoryFilter === 'all') return true
    return offer.category === categoryFilter
  })

  const updateGoal = event => {
    const nextGoal = Number(event.target.value)
    try {
      localStorage.setItem(goalKey, String(nextGoal))
      setGoal(nextGoal)
      setStorageError('')
    } catch (error) {
      console.error('Unable to save the monthly recycling goal.', error)
      setStorageError('Could not save your goal in this browser. Check storage settings and try again.')
    }
  }

  const persistClaim = async (rewardId, code, title, bonusPoints = 0) => {
    const nextClaims = { ...claimed, [rewardId]: code }
    try {
      localStorage.setItem(claimsKey, JSON.stringify(nextClaims))
      setClaimed(nextClaims)
      setStorageError('')
    } catch (error) {
      console.error('Unable to save this reward claim.', error)
      setStorageError('Could not save your reward. Check storage settings and try again.')
      return false
    }

    if (!configured) {
      try {
        const res = await api.claimReward({
          userId,
          rewardId,
          code,
          title,
          bonusPoints,
        })
        if (typeof res.greenPoints === 'number') {
          onRewardClaimed?.(res.greenPoints)
        }
      } catch {
        // local claim already saved
      }
    }
    return true
  }

  const claim = async offer => {
    if (!isEligible(offer) || claimed[offer.id]) return
    const ok = await persistClaim(offer.id, offer.code, offer.title, offer.bonusPoints || 0)
    if (ok) {
      toast(`Reward unlocked: ${offer.code} (+${offer.bonusPoints || 0} Green Points)`)
    }
  }

  const pledgeCause = async cause => {
    if (claimed[cause.id] || monthlyKg < 5) return
    const ok = await persistClaim(cause.id, cause.code, `Eco pledge: ${cause.title}`, cause.bonusPoints)
    if (ok) {
      toast(`Pledged to ${cause.title} (+${cause.bonusPoints} Green Points)`)
    }
  }

  const spinWheel = () => {
    if (spinning || spinsRemaining <= 0) return
    const sliceDeg = 360 / WHEEL_PRIZES.length
    const targetIdx = Math.floor(Math.random() * WHEEL_PRIZES.length)
    const prize = WHEEL_PRIZES[targetIdx]
    const sliceCenter = targetIdx * sliceDeg + sliceDeg / 2
    const nextSpinsUsed = spinsUsed + 1
    const baseRotation = wheelAngle - (wheelAngle % 360)
    const targetAngle = baseRotation + 360 * 4 + (360 - sliceCenter)

    setSpinning(true)
    setWheelAngle(targetAngle)

    try {
      localStorage.setItem(spinsKey, String(nextSpinsUsed))
      setSpinsUsed(nextSpinsUsed)
    } catch {
      // ignore storage errors
    }

    setTimeout(async () => {
      setSpinning(false)
      setLastWon(prize)
      await persistClaim(prize.id, prize.code, `Bonus wheel: ${prize.label}`, prize.bonusPoints)
      toast(`Wheel prize unlocked: ${prize.label} (${prize.code})`)
    }, 1600)
  }

  const copyVoucher = async code => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      toast(`Copied voucher ${code}`)
      setTimeout(() => setCopiedCode(''), 1800)
    } catch {
      toast(`Voucher code: ${code}`)
    }
  }

  return (
    <section className="space-y-4" aria-labelledby="rewards-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="rewards-heading" className="text-xl font-bold">Monthly goals &amp; reward catalog</h2>
          <p className="mt-1 text-sm opacity-70">
            Hit recycling milestones or reach 100% of your monthly goal to unlock cashback, spin-wheel bonuses, tree plantings, and community pledges.
          </p>
        </div>
        <p className="font-mono text-xs tabular-nums opacity-75">
          {unlockedCount} / {REWARD_CATALOG.length} rewards unlocked · {walletItems.length} in wallet
        </p>
      </div>

      {storageError && <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm">{storageError}</p>}

      <Glass>
        <div className="grid gap-5 md:grid-cols-[1fr_1.35fr] md:items-center">
          <div className="relative min-h-52 overflow-hidden rounded-xl bg-gradient-to-br from-emerald-900 to-emerald-950">
            {!imgErrors.banner && (
              <img
                className="absolute inset-0 h-full w-full object-cover"
                src={CANOPY_IMG}
                alt="Green forest canopy representing this month's recycling goal"
                referrerPolicy="no-referrer"
                onError={() => setImgErrors(e => ({ ...e, banner: true }))}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/35 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <p className="text-xs font-semibold text-leaf-300">Monthly goal challenge</p>
              <p className="mt-0.5 text-2xl font-extrabold tabular-nums">{monthlyKg} / {goal} kg</p>
              <p className="mt-1 text-xs opacity-85">
                {monthlyKg >= goal
                  ? '100% Goal Reached! Claim your Goal Crusher ₹300 jackpot below.'
                  : `${Math.max(0, goal - monthlyKg)} kg remaining to unlock the Goal Crusher ₹300 jackpot.`}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Recycle {goal} kg this month</h3>
              <span className="font-mono text-sm font-bold tabular-nums text-leaf-400">{progress}%</span>
            </div>

            <div
              className="h-3 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-label="Monthly recycling goal progress"
              aria-valuenow={Math.min(monthlyKg, goal)}
              aria-valuemin={0}
              aria-valuemax={goal}
            >
              <div className="h-full rounded-full bg-leaf-500 transition-all" style={{ width: `${progress}%` }} />
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {MILESTONES.map(pct => {
                const targetKg = Math.round((goal * pct) / 100)
                const reached = progress >= pct
                return (
                  <div
                    key={pct}
                    className={`rounded-lg border px-2 py-1.5 tabular-nums ${
                      reached ? 'border-leaf-400/40 bg-leaf-500/15 text-leaf-300' : 'border-white/10 bg-white/5 opacity-60'
                    }`}
                  >
                    <p className="font-mono font-bold">{pct}%</p>
                    <p className="text-[11px]">{targetKg} kg</p>
                  </div>
                )
              })}
            </div>

            <div>
              <label className="block text-sm" htmlFor="monthly-goal">
                Customize monthly target: <strong className="font-mono tabular-nums">{goal} kg</strong>
              </label>
              <input
                id="monthly-goal"
                className="mt-2 w-full accent-green-500"
                type="range"
                min="10"
                max="200"
                step="5"
                value={goal}
                onChange={updateGoal}
              />
              <div className="flex justify-between text-xs tabular-nums opacity-60">
                <span>10 kg starter</span>
                <span>100 kg hero</span>
                <span>200 kg pro</span>
              </div>
            </div>
          </div>
        </div>
      </Glass>

      {/* Milestone Bonus Spin Wheel */}
      <Glass>
        <div className="grid gap-6 md:grid-cols-[200px_1fr] md:items-center">
          <div className="relative mx-auto flex h-44 w-44 items-center justify-center">
            <div
              className="absolute -top-1.5 z-10 h-0 w-0 border-x-[8px] border-t-[14px] border-x-transparent border-t-white drop-shadow"
              aria-hidden="true"
            />
            <motion.svg
              viewBox="0 0 200 200"
              className="h-44 w-44 rounded-full border-4 border-white/25 shadow-lg"
              animate={{ rotate: wheelAngle }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              aria-label="Milestone bonus reward wheel"
            >
              {WHEEL_PRIZES.map((slice, idx) => {
                const total = WHEEL_PRIZES.length
                const angle = 360 / total
                const startRad = ((idx * angle - 90) * Math.PI) / 180
                const endRad = (((idx + 1) * angle - 90) * Math.PI) / 180
                const x1 = 100 + 98 * Math.cos(startRad)
                const y1 = 100 + 98 * Math.sin(startRad)
                const x2 = 100 + 98 * Math.cos(endRad)
                const y2 = 100 + 98 * Math.sin(endRad)
                const midAngle = idx * angle + angle / 2
                return (
                  <g key={slice.id}>
                    <path d={`M100,100 L${x1},${y1} A98,98 0 0,1 ${x2},${y2} Z`} fill={slice.color} stroke="#052e16" strokeWidth="1.5" />
                    <text
                      x="100"
                      y="30"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="700"
                      textAnchor="middle"
                      transform={`rotate(${midAngle} 100 100)`}
                    >
                      {slice.short}
                    </text>
                  </g>
                )
              })}
              <circle cx="100" cy="100" r="18" fill="#064e3b" stroke="#ffffff" strokeWidth="2.5" />
            </motion.svg>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold">Milestone bonus wheel</h3>
              <span className="font-mono text-xs font-semibold tabular-nums text-leaf-400">
                {spinsRemaining} spin{spinsRemaining === 1 ? '' : 's'} available ({earnedSpins} earned)
              </span>
            </div>
            <p className="text-sm opacity-75">
              Unlock 1 bonus spin at 5 kg recycled, plus 1 extra spin every time you cross 25%, 50%, 75%, and 100% of your monthly target.
            </p>
            {lastWon && (
              <p className="rounded-xl border border-leaf-400/40 bg-leaf-500/15 px-3 py-2 text-sm">
                Latest spin win: <strong>{lastWon.label}</strong> · Code: <strong className="select-all font-mono">{lastWon.code}</strong>
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={spinning || spinsRemaining <= 0}
                onClick={spinWheel}
                className="btn inline-flex items-center gap-2 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCw className={`h-4 w-4 ${spinning ? 'animate-spin' : ''}`} aria-hidden="true" />
                {spinning ? 'Spinning…' : spinsRemaining > 0 ? 'Spin bonus wheel' : 'Recycle 5+ kg or hit next milestone'}
              </button>
              <span className="text-xs opacity-65">Prizes are added directly to your wallet below.</span>
            </div>
          </div>
        </div>
      </Glass>

      {/* Reward Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/5 p-1 text-xs" role="tablist" aria-label="Filter rewards">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              type="button"
              role="tab"
              aria-selected={categoryFilter === cat.key}
              onClick={() => setCategoryFilter(cat.key)}
              className={`whitespace-nowrap shrink-0 rounded-lg px-3 py-1.5 font-medium transition ${
                categoryFilter === cat.key ? 'bg-leaf-500 text-emerald-950' : 'opacity-75 hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expanded Reward Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {visibleOffers.map(offer => {
          const req = getRequirement(offer)
          const eligible = monthlyKg >= req
          const code = claimed[offer.id]
          const remaining = Math.max(0, req - monthlyKg)

          return (
            <article key={offer.id} className={`glass flex flex-col overflow-hidden ${offer.goalBased ? 'border-leaf-400/40' : ''}`}>
              <div className="relative h-36 bg-gradient-to-br from-emerald-800/40 to-emerald-950/70">
                {!imgErrors[offer.id] && (
                  <img
                    className="h-full w-full object-cover"
                    src={offer.image}
                    alt={offer.alt}
                    referrerPolicy="no-referrer"
                    onError={() => setImgErrors(e => ({ ...e, [offer.id]: true }))}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/25 to-transparent" />
                <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between gap-2 text-white">
                  <span className="font-mono text-xs font-bold tabular-nums">
                    {offer.goalBased ? `${req}+ kg (100% goal)` : `${req}+ kg/mo`}
                  </span>
                  <span className="text-[11px] font-semibold text-leaf-300">{offer.benefitLabel}</span>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <h3 className="font-bold leading-snug">{offer.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed opacity-75">{offer.detail}</p>
                </div>

                <div className="mt-4">
                  {code ? (
                    <div className="space-y-2 rounded-lg border border-leaf-400/30 bg-leaf-500/15 p-2.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="select-all font-mono text-sm tracking-wide text-leaf-300">{code}</strong>
                        <button
                          type="button"
                          onClick={() => copyVoucher(code)}
                          className="inline-flex items-center gap-1 rounded border border-white/15 px-2 py-0.5 text-[11px] hover:bg-white/10"
                        >
                          {copiedCode === code ? <Check className="h-3 w-3" aria-hidden="true" /> : <Copy className="h-3 w-3" aria-hidden="true" />}
                          {copiedCode === code ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <Link
                        to="/pickup"
                        state={{ voucherCode: code }}
                        className="block text-center font-semibold text-leaf-400 underline"
                      >
                        Apply at pickup booking
                      </Link>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn w-full whitespace-nowrap !py-2 !px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!eligible}
                      onClick={() => claim(offer)}
                    >
                      {eligible ? 'Claim reward' : `${remaining} kg more to unlock`}
                    </button>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* Creative Community Eco-Donation Pledges */}
      <Glass>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-leaf-400" aria-hidden="true" />
            <h3 className="font-semibold">Community eco-donation pledges</h3>
          </div>
          <span className="text-xs opacity-70">Unlocks at 5+ kg/month · Grants bonus Green Points</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {ECO_DONATION_CAUSES.map(cause => {
            const pledged = Boolean(claimed[cause.id])
            return (
              <div key={cause.id} className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/5 p-3.5 text-sm">
                <div>
                  <p className="font-semibold">{cause.title}</p>
                  <p className="mt-1 text-xs text-leaf-400">{cause.impact}</p>
                  <p className="mt-1 text-xs opacity-70">{cause.detail}</p>
                </div>
                <button
                  type="button"
                  disabled={pledged || monthlyKg < 5}
                  onClick={() => pledgeCause(cause)}
                  className="mt-3 w-full whitespace-nowrap rounded-lg border border-leaf-400/40 px-3 py-1.5 text-xs font-semibold text-leaf-400 transition hover:bg-leaf-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pledged ? `Pledged (+${cause.bonusPoints} pts)` : monthlyKg >= 5 ? `Pledge & earn +${cause.bonusPoints} pts` : 'Recycle 5+ kg to unlock'}
                </button>
              </div>
            )
          })}
        </div>
      </Glass>

      {/* Claimed Rewards Wallet */}
      {walletItems.length > 0 && (
        <Glass>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-leaf-400" aria-hidden="true" />
              <h3 className="font-semibold">My claimed rewards wallet ({walletItems.length})</h3>
            </div>
            <span className="inline-flex items-center gap-1 text-xs opacity-70">
              <Award className="h-3.5 w-3.5 text-leaf-400" aria-hidden="true" /> Active vouchers &amp; pledges
            </span>
          </div>
          <div className="divide-y divide-white/10 text-sm">
            {walletItems.map(item => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs opacity-70">{item.benefitLabel}</p>
                </div>
                <div className="flex items-center gap-3">
                  <strong className="select-all font-mono text-xs tracking-wider text-leaf-400">{item.code}</strong>
                  <button
                    type="button"
                    onClick={() => copyVoucher(item.code)}
                    className="rounded-lg border border-white/15 px-2.5 py-1 text-xs hover:bg-white/10"
                  >
                    {copiedCode === item.code ? 'Copied' : 'Copy'}
                  </button>
                  {item.isVoucher && (
                    <Link
                      to="/pickup"
                      state={{ voucherCode: item.code }}
                      className="btn whitespace-nowrap !py-1 !px-3 text-xs"
                    >
                      Use now
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Glass>
      )}
    </section>
  )
}

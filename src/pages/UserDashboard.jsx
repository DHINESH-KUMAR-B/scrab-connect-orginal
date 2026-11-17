import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Star } from 'lucide-react'
import { Glass, StatCard, Grid, Skeleton, useToast } from '../components/ui'
import { LikeButton, StarPicker, TARGET_TAGS } from '../components/CommunityFeedback'
import { pickups as samplePickups, levels, users as sampleUsers, getDemoPickups } from '../data/mock'
import { impact } from '../lib/ai'
import { useAuth } from '../context/AuthContext'
import { configured, db } from '../lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { PickupMap } from '../components/MapWidgets'
import RewardCenter from '../components/RewardCenter'
import LiveTracker from '../components/LiveTracker'
import { api } from '../lib/api'

export default function UserDashboard() {
  const { user } = useAuth()
  const toast = useToast()
  const [mine, setMine] = useState([])
  const [leaderboard, setLeaderboard] = useState(sampleUsers)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [trackedId, setTrackedId] = useState('')
  const [editingId, setEditingId] = useState('')
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '10:00' })
  const [ratingId, setRatingId] = useState('')
  const [ratingForm, setRatingForm] = useState({ rating: 5, review: '', tags: ['On-time arrival'] })
  const [collectorLikes, setCollectorLikes] = useState({})

  const loadPickups = useCallback(async () => {
    try {
      if (configured) {
        const result = await getDocs(query(collection(db, 'pickups'), where('userId', '==', user.id)))
        setMine(result.docs.map(snapshot => ({ ...snapshot.data(), id: snapshot.id })))
      } else {
        try {
          const [pickupRes, usersRes, engRes] = await Promise.all([
            api.getPickups({ userId: user.id }),
            api.getUsers(),
            api.getEngagement({ targetType: 'collector', userId: user.id }),
          ])
          setMine(pickupRes.pickups || [])
          if (Array.isArray(usersRes.users) && usersRes.users.length) {
            setLeaderboard(usersRes.users)
          }
          if (engRes?.likes) setCollectorLikes(engRes.likes)
        } catch {
          const sample = user.id.startsWith('demo-') ? samplePickups.filter(pickup => pickup.userId === 'u1') : []
          setMine([...sample, ...getDemoPickups().filter(pickup => pickup.userId === user.id)])
        }
      }
      setLoadError('')
    } catch (error) {
      console.error('Unable to load your pickups.', error)
      setLoadError(error.message || 'Unable to load your pickups.')
    } finally {
      setLoaded(true)
    }
  }, [user])

  useEffect(() => {
    if (user) loadPickups()
  }, [user, loadPickups])

  const cancelPickup = async id => {
    try {
      await api.updatePickup(id, { status: 'cancelled' })
      toast('Pickup cancelled')
      loadPickups()
    } catch (error) {
      toast(error.message || 'Unable to cancel this pickup.')
    }
  }

  const saveReschedule = async id => {
    if (!rescheduleForm.date) {
      toast('Select a new date first.')
      return
    }
    try {
      await api.updatePickup(id, { date: rescheduleForm.date, time: rescheduleForm.time })
      setEditingId('')
      toast('Pickup rescheduled')
      loadPickups()
    } catch (error) {
      toast(error.message || 'Unable to reschedule this pickup.')
    }
  }

  const submitRating = async id => {
    try {
      await api.updatePickup(id, {
        rating: ratingForm.rating,
        review: ratingForm.review,
        tags: ratingForm.tags,
      })
      setRatingId('')
      setRatingForm({ rating: 5, review: '', tags: ['On-time arrival'] })
      toast('Thanks for rating and reviewing your collector')
      loadPickups()
    } catch (error) {
      toast(error.message || 'Unable to save rating.')
    }
  }

  const togglePraiseTag = tag => {
    setRatingForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag].slice(0, 4),
    }))
  }

  if (!loaded) return <Grid>{[...Array(8)].map((_, i) => <Skeleton key={i}/>)}</Grid>

  const completed = mine.filter(pickup => pickup.status === 'completed')
  const kg = completed.reduce((sum, pickup) => sum + Number(pickup.weight || 0), 0)
  const earned = completed.reduce((sum, pickup) => sum + Number(pickup.price || 0), 0)
  const serverProfile = leaderboard.find(u => u.id === user.id || (user.id === 'demo-user' && u.id === 'u1'))
  const pts = serverProfile?.greenPoints ?? user.greenPoints ?? (user.id.startsWith('demo-') ? 1240 : 0)
  const im = impact(kg)
  const date = new Date()
  const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  const monthlyKg = completed
    .filter(pickup => String(pickup.date || '').startsWith(month))
    .reduce((sum, pickup) => sum + Number(pickup.weight || 0), 0)
  const lvl = [...levels].reverse().find(level => pts >= level.min) || levels[0]
  const next = levels[levels.indexOf(lvl) + 1]
  const upcoming = mine.filter(pickup => pickup.status === 'scheduled' && Number.isFinite(pickup.lat) && Number.isFinite(pickup.lng))
  const activeTrackId = upcoming.some(p => p.id === trackedId) ? trackedId : (upcoming[0]?.id || '')
  const visibleHistory = mine.filter(pickup => statusFilter === 'all' || pickup.status === statusFilter)

  const dynamicBadges = [
    { n: 'First pickup', on: completed.length >= 1 },
    { n: '50 kg club', on: kg >= 50 || pts >= 1200 },
    { n: 'E-waste hero', on: completed.some(p => /e-waste|mobile|batter|appliance/i.test(p.scrapType)) },
    { n: '10 pickups', on: completed.length >= 10 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Your impact</h1>
          <p className="mt-1 text-sm opacity-70">Track your pickups, manage bookings, and monitor your environmental footprint.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!configured && (
            <a
              href={api.getExportCsvUrl(user.id)}
              className="glass inline-flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium hover:bg-white/10"
            >
              <Download className="h-4 w-4" aria-hidden="true" /> Export CSV
            </a>
          )}
          <Link className="glass whitespace-nowrap px-4 py-2.5 text-sm font-medium hover:bg-white/10" to="/wallet">Online wallet</Link>
          <Link className="glass whitespace-nowrap px-4 py-2.5 text-sm font-medium hover:bg-white/10" to="/support">24/7 support</Link>
          <Link className="glass whitespace-nowrap px-4 py-2.5 text-sm font-medium hover:bg-white/10" to="/creative">Creative studio</Link>
          <Link className="btn whitespace-nowrap" to="/pickup">Book a pickup</Link>
        </div>
      </div>

      {loadError && <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm">{loadError}</p>}

      {!user.profileCompleted && (
        <Glass className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Complete your profile setup</p>
            <p className="text-xs opacity-75">Save your default pickup address, map pin, and preferred payout method for one-tap booking.</p>
          </div>
          <Link to="/profile" className="btn whitespace-nowrap !py-2 !px-4 text-xs">Set up profile</Link>
        </Glass>
      )}

      <Grid>
        <StatCard label="Scrap recycled" value={kg} unit="kg"/>
        <StatCard label="Money earned" value={`₹${earned}`}/>
        <StatCard label="Green points" value={pts}/>
        <StatCard label="Trees saved" value={im.trees}/>
        <StatCard label="CO₂ reduced" value={im.co2} unit="kg"/>
        <StatCard label="Water conserved" value={im.water} unit="L"/>
        <StatCard label="Energy preserved" value={im.energy} unit="kWh"/>
        <StatCard label="Kept from landfill" value={im.landfill} unit="kg"/>
      </Grid>

      {!configured && activeTrackId && (
        <section id="live-tracker-panel" className="space-y-3" aria-labelledby="live-tracking-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="live-tracking-heading" className="text-xl font-bold">Live tracking — User &amp; Buyer</h2>
              <p className="mt-0.5 text-sm opacity-70">Watch your assigned collector move live toward your pin, view distance &amp; ETA, or share your live GPS.</p>
            </div>
            {upcoming.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {upcoming.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setTrackedId(p.id)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition ${
                      activeTrackId === p.id ? 'border-leaf-400 bg-leaf-500/20 text-leaf-300' : 'border-white/15 hover:bg-white/10'
                    }`}
                  >
                    {p.scrapType} · {p.date}
                  </button>
                ))}
              </div>
            )}
          </div>
          <LiveTracker pickupId={activeTrackId} role="user" onStatusSync={loadPickups} />
        </section>
      )}

      <RewardCenter
        key={user.id}
        userId={user.id}
        monthlyKg={monthlyKg}
        onRewardClaimed={() => loadPickups()}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Glass className="lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Upcoming pickup map</h2>
            <span className="text-xs tabular-nums opacity-70">{upcoming.length} scheduled stop{upcoming.length === 1 ? '' : 's'}</span>
          </div>
          {upcoming.length
            ? <PickupMap pickups={upcoming}/>
            : <p className="rounded-xl bg-white/5 p-4 text-sm opacity-75">No scheduled pickup locations yet. Book a pickup and pin its location on the map.</p>}
        </Glass>
        <Glass>
          <h2 className="font-semibold">Level: {lvl.n}</h2>
          <div className="my-2 h-2 rounded bg-white/10">
            <div className="h-2 rounded bg-leaf-500" style={{ width: next ? `${Math.min(100, ((pts - lvl.min) / (next.min - lvl.min)) * 100)}%` : '100%' }}/>
          </div>
          <p className="text-xs tabular-nums opacity-70">{next ? `${Math.max(0, next.min - pts)} points to ${next.n}` : 'Top level reached'}</p>
          <h3 className="mt-4 font-semibold">Achievements</h3>
          <ul className="mt-2 space-y-1.5 text-xs">
            {dynamicBadges.map(badge => (
              <li key={badge.n} className="flex items-center justify-between border-b border-white/10 py-1">
                <span className={badge.on ? 'font-semibold text-leaf-400' : 'opacity-55'}>{badge.n}</span>
                <span className="opacity-65">{badge.on ? 'Unlocked' : 'Locked'}</span>
              </li>
            ))}
          </ul>
          <h3 className="mt-4 font-semibold">Community leaderboard</h3>
          <ol className="mt-2 space-y-1 text-sm">
            {[...leaderboard].sort((a, b) => b.greenPoints - a.greenPoints).slice(0, 5).map((person, i) => (
              <li key={person.id} className="flex justify-between py-0.5 tabular-nums">
                <span>{i + 1}. {person.name}</span>
                <span className="font-mono text-xs">{person.greenPoints} pts</span>
              </li>
            ))}
          </ol>
        </Glass>
      </div>

      <Glass>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Pickup history</h2>
          <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/5 p-1 text-xs" role="tablist" aria-label="Filter pickup history">
            {['all', 'scheduled', 'completed', 'cancelled'].map(st => (
              <button
                key={st}
                type="button"
                role="tab"
                aria-selected={statusFilter === st}
                onClick={() => setStatusFilter(st)}
                className={`capitalize whitespace-nowrap rounded-lg px-2.5 py-1 font-medium transition ${statusFilter === st ? 'bg-leaf-500 text-emerald-950' : 'opacity-75 hover:bg-white/10'}`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {visibleHistory.length ? (
          <div className="divide-y divide-white/10">
            {visibleHistory.map(pickup => (
              <div key={pickup.id} className="py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{pickup.scrapType} · <span className="font-mono tabular-nums">{pickup.weight} kg</span></p>
                    <p className="text-xs opacity-70">
                      {pickup.address || pickup.area} · {pickup.date}{pickup.time ? ` at ${pickup.time}` : ''} · <span className="capitalize">{pickup.status}</span>
                    </p>
                    {pickup.notes && <p className="mt-0.5 text-xs opacity-60">Note: {pickup.notes}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono font-bold tabular-nums">₹{pickup.price}</span>
                    {Number.isFinite(pickup.lat) && Number.isFinite(pickup.lng) && (
                      <a className="text-xs underline" href={`https://www.openstreetmap.org/?mlat=${pickup.lat}&mlon=${pickup.lng}#map=16/${pickup.lat}/${pickup.lng}`} target="_blank" rel="noreferrer">Map</a>
                    )}
                    {!configured && pickup.status === 'scheduled' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setTrackedId(pickup.id)
                            document.getElementById('live-tracker-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }}
                          className="rounded-lg border border-leaf-400/40 px-2.5 py-1 text-xs font-medium text-leaf-400 hover:bg-leaf-500/15"
                        >
                          Track live
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(editingId === pickup.id ? '' : pickup.id)
                            setRescheduleForm({ date: pickup.date, time: pickup.time || '10:00' })
                          }}
                          className="rounded-lg border border-white/15 px-2.5 py-1 text-xs hover:bg-white/10"
                        >
                          Reschedule
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelPickup(pickup.id)}
                          className="rounded-lg border border-red-400/30 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/15"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {!configured && pickup.status === 'completed' && (
                      <>
                        {pickup.collectorId && (
                          <LikeButton
                            targetType="collector"
                            targetId={pickup.collectorId}
                            label="Collector"
                            initialCount={collectorLikes[`collector:${pickup.collectorId}`]?.count ?? 64}
                            initialLiked={collectorLikes[`collector:${pickup.collectorId}`]?.liked ?? false}
                            onChange={res => setCollectorLikes(prev => ({ ...prev, [res.key]: { count: res.count, liked: res.liked } }))}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setRatingId(ratingId === pickup.id ? '' : pickup.id)
                            setRatingForm({
                              rating: pickup.rating || 5,
                              review: pickup.review || '',
                              tags: ['On-time arrival'],
                            })
                          }}
                          className="rounded-lg border border-leaf-400/40 px-2.5 py-1 text-xs text-leaf-400 whitespace-nowrap hover:bg-leaf-500/15"
                        >
                          {pickup.rating ? 'Edit review' : 'Rate & review'}
                        </button>
                      </>
                    )}
                    {typeof pickup.rating === 'number' && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-300 tabular-nums">
                        <Star className="h-3.5 w-3.5 fill-amber-300" aria-hidden="true" /> {pickup.rating}/5
                      </span>
                    )}
                  </div>
                </div>

                {pickup.review && ratingId !== pickup.id && (
                  <p className="mt-1.5 text-xs italic opacity-75">Your review: “{pickup.review}”</p>
                )}

                {editingId === pickup.id && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
                    <input
                      type="date"
                      aria-label="New date"
                      value={rescheduleForm.date}
                      onChange={e => setRescheduleForm(prev => ({ ...prev, date: e.target.value }))}
                      className="input !w-auto text-xs"
                    />
                    <input
                      type="time"
                      aria-label="New time"
                      value={rescheduleForm.time}
                      onChange={e => setRescheduleForm(prev => ({ ...prev, time: e.target.value }))}
                      className="input !w-auto text-xs"
                    />
                    <button type="button" onClick={() => saveReschedule(pickup.id)} className="btn !py-1.5 !px-3 text-xs">Save slot</button>
                    <button type="button" onClick={() => setEditingId('')} className="text-xs underline opacity-70">Dismiss</button>
                  </div>
                )}

                {ratingId === pickup.id && (
                  <div className="mt-3 space-y-3 rounded-xl border border-white/10 bg-white/5 p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold">Rate pickup {pickup.id}</span>
                      <StarPicker
                        value={ratingForm.rating}
                        onChange={val => setRatingForm(prev => ({ ...prev, rating: val }))}
                        size="sm"
                        label={`Rate pickup ${pickup.id}`}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {TARGET_TAGS.pickup.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => togglePraiseTag(tag)}
                          className={`rounded-lg border px-2 py-0.5 text-xs whitespace-nowrap transition ${
                            ratingForm.tags.includes(tag)
                              ? 'border-leaf-400 bg-leaf-500/20 text-leaf-300'
                              : 'border-white/15 opacity-75 hover:bg-white/10'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        placeholder="Share feedback on punctuality, scale honesty, or payout speed…"
                        aria-label="Feedback"
                        value={ratingForm.review}
                        onChange={e => setRatingForm(prev => ({ ...prev, review: e.target.value }))}
                        className="input flex-1 min-w-48 !py-1.5 text-xs"
                      />
                      <button type="button" onClick={() => submitRating(pickup.id)} className="btn !py-1.5 !px-3.5 text-xs whitespace-nowrap">
                        Save review
                      </button>
                      <button type="button" onClick={() => setRatingId('')} className="text-xs underline opacity-70">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm opacity-70">No pickups match this filter.</p>
        )}
      </Glass>
    </div>
  )
}

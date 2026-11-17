import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Heart, PlusCircle, Star } from 'lucide-react'
import { Glass, StatCard, Grid, Skeleton, useToast } from '../components/ui'
import { pickups as samplePickups, monthly as sampleMonthly, getDemoPickups } from '../data/mock'
import { batchPickups, optimizeRoute } from '../lib/ai'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { PickupMap } from '../components/MapWidgets'
import LiveTracker from '../components/LiveTracker'
import { useAuth } from '../context/AuthContext'
import { configured, db } from '../lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { api } from '../lib/api'

const START = { lat: 13.0475, lng: 80.209 }

export default function Collector() {
  const { user } = useAuth()
  const toast = useToast()
  const [jobs, setJobs] = useState([])
  const [openPool, setOpenPool] = useState([])
  const [monthly, setMonthly] = useState(sampleMonthly)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [tab, setTab] = useState('route')
  const [search, setSearch] = useState('')
  const [start, setStart] = useState(START)
  const [selectedId, setSelectedId] = useState('')
  const [completingId, setCompletingId] = useState('')
  const [actualKg, setActualKg] = useState('')
  const [colReviews, setColReviews] = useState([])
  const [collectorLikeCount, setCollectorLikeCount] = useState(84)

  const loadJobs = useCallback(async () => {
    try {
      if (configured) {
        const result = await getDocs(query(collection(db, 'pickups'), where('collectorId', '==', user.id)))
        setJobs(result.docs.map(snapshot => ({ ...snapshot.data(), id: snapshot.id })))
      } else {
        try {
          const colId = user.id === 'demo-collector' ? 'c1' : user.id
          const [assignedRes, openRes, analyticsRes, engRes] = await Promise.all([
            api.getPickups({ collectorId: user.id }),
            api.getPickups({ unassigned: true, status: 'scheduled' }),
            api.getAnalytics(),
            api.getEngagement({ targetType: 'collector', targetId: colId, userId: colId }),
          ])
          setJobs(assignedRes.pickups || [])
          setOpenPool(openRes.pickups || [])
          if (Array.isArray(analyticsRes.monthly)) setMonthly(analyticsRes.monthly)
          if (Array.isArray(engRes?.reviews)) setColReviews(engRes.reviews)
          if (engRes?.likes?.[`collector:${colId}`]?.count !== undefined) {
            setCollectorLikeCount(engRes.likes[`collector:${colId}`].count)
          }
        } catch {
          const demoJobs = [...samplePickups.filter(pickup => pickup.status === 'scheduled'), ...getDemoPickups()]
          setJobs(demoJobs)
          setOpenPool([])
        }
      }
      setLoadError('')
    } catch (error) {
      console.error('Unable to load collector pickups.', error)
      setLoadError(error.message || 'Unable to load collector pickups.')
    } finally {
      setLoaded(true)
    }
  }, [user])

  useEffect(() => {
    if (user) loadJobs()
  }, [user, loadJobs])

  const claimPickup = async id => {
    const collectorId = user.id === 'demo-collector' ? 'c1' : user.id
    try {
      await api.updatePickup(id, { collectorId })
      toast('Pickup added to your route')
      loadJobs()
    } catch (error) {
      toast(error.message || 'Unable to claim pickup.')
    }
  }

  const completePickup = async pickup => {
    const weighed = Number(actualKg || pickup.weight)
    if (!Number.isFinite(weighed) || weighed <= 0) {
      toast('Enter a valid weighed kg value.')
      return
    }
    try {
      await api.updatePickup(pickup.id, { status: 'completed', actualWeight: weighed })
      setCompletingId('')
      setActualKg('')
      toast('Pickup marked completed and payout recorded')
      loadJobs()
    } catch (error) {
      toast(error.message || 'Unable to complete pickup.')
    }
  }

  const toggleThankCustomer = async reviewId => {
    try {
      const res = await api.toggleReviewThank(reviewId)
      setColReviews(prev =>
        prev.map(r => r.id === reviewId ? { ...r, collectorThanked: res.collectorThanked } : r)
      )
      toast(res.collectorThanked ? 'Sent thank-you appreciation' : 'Updated thank-you note')
    } catch {
      toast('Unable to update acknowledgment.')
    }
  }

  const scheduled = useMemo(
    () => jobs.filter(pickup => pickup.status === 'scheduled' && Number.isFinite(pickup.lat) && Number.isFinite(pickup.lng)),
    [jobs]
  )
  const matching = useMemo(
    () => scheduled.filter(pickup => `${pickup.address || pickup.area || ''} ${pickup.scrapType || ''} ${pickup.id || ''}`.toLowerCase().includes(search.toLowerCase())),
    [scheduled, search]
  )
  const route = useMemo(() => optimizeRoute(matching, start), [matching, start])
  const batches = batchPickups(matching)
  const completed = jobs.filter(pickup => pickup.status === 'completed')
  const ratedPickups = completed.filter(pickup => typeof pickup.rating === 'number')
  const avgRating = ratedPickups.length
    ? (ratedPickups.reduce((sum, pickup) => sum + pickup.rating, 0) / ratedPickups.length).toFixed(1)
    : '4.8'
  const earned = completed.reduce((sum, pickup) => sum + Number(pickup.price || 0), 0)
  const selected = matching.find(pickup => pickup.id === selectedId)
  const activeTrackId = selected?.id || route[0]?.id || ''
  const mapStops = selected ? [selected, ...route.filter(pickup => pickup.id !== selected.id)] : route

  if (!loaded) return <Grid>{[...Array(4)].map((_, i) => <Skeleton key={i}/>)}</Grid>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Collector route</h1>
          <p className="mt-1 text-sm opacity-70">Follow your optimized route, claim open neighborhood pickups, and record verified weights.</p>
        </div>
        {!configured && (
          <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 text-xs" role="tablist" aria-label="Collector job views">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'route'}
              onClick={() => setTab('route')}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 font-semibold transition ${tab === 'route' ? 'bg-leaf-500 text-emerald-950' : 'opacity-75'}`}
            >
              My route ({scheduled.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'pool'}
              onClick={() => setTab('pool')}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 font-semibold transition ${tab === 'pool' ? 'bg-leaf-500 text-emerald-950' : 'opacity-75'}`}
            >
              Available pool ({openPool.length})
            </button>
          </div>
        )}
      </div>

      {loadError && <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm">{loadError}</p>}

      {!user.profileCompleted && (
        <Glass className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Finish your collector profile</p>
            <p className="text-xs opacity-75">Add your vehicle plate, load capacity, and coverage neighborhoods to speed up verification.</p>
          </div>
          <Link to="/profile" className="btn whitespace-nowrap !py-2 !px-4 text-xs">Set up profile</Link>
        </Glass>
      )}

      <Grid>
        <StatCard label="Scheduled pickups" value={scheduled.length}/>
        <StatCard label="Completed payout value" value={`₹${earned}`}/>
        <StatCard label="Customer rating" value={avgRating} unit="/5"/>
        <StatCard label="Trips saved by batching" value={batches.reduce((sum, batch) => sum + batch.list.length - 1, 0)}/>
      </Grid>

      {tab === 'route' && !configured && activeTrackId && (
        <section className="space-y-2" aria-labelledby="collector-live-heading">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 id="collector-live-heading" className="text-lg font-bold">Live buyer &amp; user GPS dispatch</h2>
              <p className="text-xs opacity-70">Select any stop below to stream your live vehicle location and arrival status to the customer.</p>
            </div>
          </div>
          <LiveTracker pickupId={activeTrackId} role="collector" onStatusSync={loadJobs} />
        </section>
      )}

      {tab === 'pool' && !configured ? (
        <Glass>
          <h2 className="mb-1 font-semibold">Unassigned customer pickups</h2>
          <p className="mb-4 text-xs opacity-70">Claim nearby bookings to add them directly to your route.</p>
          {openPool.length ? (
            <div className="divide-y divide-white/10">
              {openPool.map(pickup => (
                <div key={pickup.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-semibold">{pickup.scrapType} · <span className="font-mono tabular-nums">{pickup.weight} kg</span></p>
                    <p className="text-xs opacity-70">{pickup.address || pickup.area} · {pickup.date} {pickup.time || ''}</p>
                    {pickup.notes && <p className="text-xs opacity-60">Note: {pickup.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold tabular-nums">₹{pickup.price}</span>
                    <button
                      type="button"
                      onClick={() => claimPickup(pickup.id)}
                      className="btn inline-flex items-center gap-1.5 whitespace-nowrap !py-1.5 !px-3 text-xs"
                    >
                      <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" /> Accept pickup
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm opacity-70">All current customer requests have been assigned.</p>
          )}
        </Glass>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Glass className="lg:col-span-2">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Pickup map</h2>
                <p className="text-xs opacity-70">Pins show the scheduled stops in nearest-neighbor order.</p>
              </div>
              <button type="button" className="text-sm underline" onClick={() => {
                if (!navigator.geolocation) { setLoadError('Location is not available in this browser. The route will start from Chennai.'); return }
                navigator.geolocation.getCurrentPosition(
                  position => {
                    setStart({ lat: position.coords.latitude, lng: position.coords.longitude })
                    setLoadError('')
                  },
                  error => setLoadError(error.code === error.PERMISSION_DENIED
                    ? 'Location permission was denied. The route will start from Chennai.'
                    : 'Unable to get your location. The route will start from Chennai.')
                )
              }}>Start route from my location</button>
            </div>
            {route.length
              ? <PickupMap pickups={mapStops} route onSelect={pickup => setSelectedId(pickup.id)}/>
              : <p className="rounded-xl bg-white/5 p-4 text-sm opacity-75">No scheduled pickup locations found for this route.</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <input className="input w-full sm:flex-1" placeholder="Search address, scrap or ID" aria-label="Search pickup stops" value={search} onChange={event => setSearch(event.target.value)}/>
              {selected && <button className="text-sm underline" onClick={() => setSelectedId('')}>Clear selected stop</button>}
            </div>
            <ol className="mt-3 space-y-2">
              {route.map((pickup, index) => (
                <li key={pickup.id} className={`rounded-xl border p-3 text-sm ${selectedId === pickup.id ? 'border-leaf-400 bg-leaf-500/10' : 'border-white/10'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button type="button" className="text-left" onClick={() => setSelectedId(pickup.id)}>
                      <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-leaf-500 text-xs font-bold tabular-nums text-emerald-950">{index + 1}</span>
                      {pickup.address || pickup.area || 'Pickup'} · {pickup.scrapType} · <span className="font-mono tabular-nums">{pickup.weight} kg</span> · {pickup.date}
                    </button>
                    <div className="flex items-center gap-3">
                      <a className="text-xs underline" href={`https://www.openstreetmap.org/?mlat=${pickup.lat}&mlon=${pickup.lng}#map=16/${pickup.lat}/${pickup.lng}`} target="_blank" rel="noreferrer">Directions</a>
                      {!configured && (
                        <button
                          type="button"
                          onClick={() => {
                            setCompletingId(completingId === pickup.id ? '' : pickup.id)
                            setActualKg(String(pickup.weight))
                          }}
                          className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-leaf-400/40 px-2.5 py-1 text-xs font-medium text-leaf-400 hover:bg-leaf-500/15"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Complete &amp; weigh
                        </button>
                      )}
                    </div>
                  </div>
                  {completingId === pickup.id && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                      <label className="text-xs" htmlFor={`kg-${pickup.id}`}>Actual weighed kg:</label>
                      <input
                        id={`kg-${pickup.id}`}
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={actualKg}
                        onChange={e => setActualKg(e.target.value)}
                        className="input !w-24 !py-1 text-right font-mono text-xs tabular-nums"
                      />
                      <button type="button" onClick={() => completePickup(pickup)} className="btn !py-1.5 !px-3 text-xs">Confirm completion</button>
                      <button type="button" onClick={() => setCompletingId('')} className="text-xs underline opacity-70">Cancel</button>
                    </div>
                  )}
                </li>
              ))}
              {!route.length && <li className="text-sm opacity-70">No stops match this search.</li>}
            </ol>
            {batches.map(batch => <p key={batch.area} className="mt-3 rounded-xl bg-leaf-500/15 p-3 text-sm tabular-nums">Batch opportunity: {batch.list.length} pickups in {batch.area} ({batch.kg} kg). Saves about ₹{batch.saved} in transport.</p>)}
          </Glass>
          <Glass>
            <h2 className="mb-2 font-semibold">Monthly earnings</h2>
            <div className="h-48"><ResponsiveContainer><BarChart data={monthly}><XAxis dataKey="month"/><YAxis/><Tooltip/><Bar dataKey="revenue" fill="#22c55e" radius={6}/></BarChart></ResponsiveContainer></div>
            <p className="mt-2 text-xs opacity-70">Monthly revenue trend across completed routes.</p>
          </Glass>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Glass>
          <h2 className="mb-2 font-semibold">Completed pickups ({completed.length})</h2>
          {completed.length
            ? completed.map(pickup => (
              <div key={pickup.id} className="flex flex-wrap justify-between gap-2 border-b border-white/10 py-2 text-sm">
                <span>{pickup.date} · {pickup.address || pickup.area}</span>
                <span className="tabular-nums">{pickup.scrapType} · {pickup.weight} kg</span>
                <span className="font-mono font-semibold tabular-nums">₹{pickup.price}</span>
              </div>
            ))
            : <p className="text-sm opacity-70">Completed collections will appear here.</p>}
        </Glass>

        <Glass>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Customer ratings &amp; likes ({colReviews.length || ratedPickups.length})</h2>
            <div className="flex items-center gap-3 text-xs font-semibold tabular-nums">
              <span className="inline-flex items-center gap-1 text-rose-300">
                <Heart className="h-3.5 w-3.5 fill-rose-400 text-rose-400" aria-hidden="true"/> {collectorLikeCount} likes
              </span>
              <span className="inline-flex items-center gap-1 text-amber-300">
                <Star className="h-3.5 w-3.5 fill-amber-300" aria-hidden="true"/> {avgRating} avg
              </span>
            </div>
          </div>
          {colReviews.length > 0 ? (
            <div className="divide-y divide-white/10">
              {colReviews.map(rev => (
                <div key={rev.id} className="space-y-1.5 py-2.5 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{rev.userName}</span>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-amber-300 tabular-nums">
                        <Star className="h-3.5 w-3.5 fill-amber-300" aria-hidden="true"/> {rev.rating}/5
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleThankCustomer(rev.id)}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs transition ${
                          rev.collectorThanked
                            ? 'border-rose-400/50 bg-rose-500/20 text-rose-300'
                            : 'border-white/15 opacity-75 hover:bg-white/10'
                        }`}
                      >
                        <Heart className={`h-3 w-3 ${rev.collectorThanked ? 'fill-rose-400 text-rose-400' : ''}`} aria-hidden="true"/>
                        {rev.collectorThanked ? 'Thanked' : 'Send thanks'}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs opacity-75">“{rev.comment}”</p>
                  {rev.tags?.length > 0 && (
                    <p className="text-[11px] text-leaf-400">{rev.tags.join(' · ')}</p>
                  )}
                </div>
              ))}
            </div>
          ) : ratedPickups.length ? (
            <div className="divide-y divide-white/10">
              {ratedPickups.map(pickup => (
                <div key={pickup.id} className="py-2.5 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{pickup.userName || 'Customer'} · {pickup.area}</span>
                    <span className="inline-flex items-center gap-1 font-mono text-xs text-amber-300 tabular-nums">
                      <Star className="h-3.5 w-3.5 fill-amber-300" aria-hidden="true"/> {pickup.rating}/5
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs opacity-70">
                    {pickup.review || `${pickup.scrapType} pickup completed smoothly.`}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm opacity-70">Ratings left by customers after completed pickups will appear here.</p>
          )}
        </Glass>
      </div>
    </div>
  )
}

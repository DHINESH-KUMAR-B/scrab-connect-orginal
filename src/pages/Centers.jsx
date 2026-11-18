import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, Expand, MapPin, MessageSquare, Navigation, Phone, Search, Star, X } from 'lucide-react'
import { Glass, Grid, Skeleton, StatCard, useToast } from '../components/ui'
import { LikeButton, TargetReviewPanel } from '../components/CommunityFeedback'
import { PickupMap } from '../components/MapWidgets'
import { api } from '../lib/api'
import { getHubPhoto } from '../lib/hubPhotos'
import { useAuth } from '../context/AuthContext'

const MATERIAL_FILTERS = ['All', 'E-Waste', 'Copper', 'Aluminum cans', 'Paper', 'PET bottles', 'Batteries', 'Used cooking oil']

// Sample customers used until your backend sends real data.
// To use real data, return `regularCustomers: [{ name, type, visits }]` on each hub from api.getCenters.
const SAMPLE_CUSTOMERS = [
  { name: 'Metro Tech Services', type: 'IT company', ewaste: true },
  { name: 'Kumar Electronics Repair', type: 'Repair shop', ewaste: true },
  { name: 'Anand Hospital', type: 'Hospital', ewaste: true },
  { name: 'City Public School', type: 'School computer lab', ewaste: true },
  { name: 'Sharma Kabadi Traders', type: 'Scrap dealer' },
  { name: 'GreenNest Apartments RWA', type: 'Housing society' },
  { name: 'Lakshmi Bakery & Cafe', type: 'Restaurant' },
  { name: 'Patel Auto Garage', type: 'Workshop' },
  { name: 'Sunrise Hotel', type: 'Hotel' },
  { name: 'Bright Print House', type: 'Printing press' },
]

const isEwasteCustomer = c => Boolean(c.ewaste) || (c.materials || []).some(m => /e-?waste/i.test(m))
const hubAcceptsEwaste = hub => (hub.materials || []).some(m => /e-?waste/i.test(m))

function hashString(value) {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0
  return h
}

function getRegularCustomers(hub) {
  const list =
    Array.isArray(hub.regularCustomers) && hub.regularCustomers.length
      ? hub.regularCustomers
      : (() => {
          const seed = hashString(String(hub.id))
          const count = 4 + (seed % 3)
          return Array.from({ length: count }, (_, i) => ({
            ...SAMPLE_CUSTOMERS[(seed + i * 3) % SAMPLE_CUSTOMERS.length],
            visits: 2 + ((seed >> i) % 9),
          }))
        })()
  // E-waste customers always come first
  return [...list].sort((a, b) => Number(isEwasteCustomer(b)) - Number(isEwasteCustomer(a)))
}

function getInitials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function Centers() {
  const { user } = useAuth()
  const toast = useToast()
  const [data, setData] = useState({
    total: 0,
    totalAll: 20526,
    page: 1,
    totalPages: 1,
    states: [],
    cities: [],
    centers: [],
    mapPoints: [],
  })
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [stateFilter, setStateFilter] = useState('All')
  const [cityFilter, setCityFilter] = useState('All')
  const [material, setMaterial] = useState('All')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [page, setPage] = useState(1)
  const [userCoords, setUserCoords] = useState(null)
  const [selectedId, setSelectedId] = useState('')
  const [lightboxHub, setLightboxHub] = useState(null)
  const [imgErrors, setImgErrors] = useState({})
  const [hubLikes, setHubLikes] = useState({})

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim())
      setPage(1)
    }, 240)
    return () => clearTimeout(timer)
  }, [searchInput])

  const loadHubs = useCallback(async () => {
    setFetching(true)
    try {
      const res = await api.getCenters({
        state: stateFilter,
        city: cityFilter,
        material,
        q: debouncedQuery,
        lat: userCoords?.[0],
        lng: userCoords?.[1],
        page,
        limit: 18,
      })
      setData(res)
    } catch (error) {
      console.error('Unable to load drop-off hubs.', error)
      toast('Unable to load drop-off hubs right now.')
    } finally {
      setLoading(false)
      setFetching(false)
    }
  }, [stateFilter, cityFilter, material, debouncedQuery, userCoords, page, toast])

  useEffect(() => {
    loadHubs()
  }, [loadHubs])

  useEffect(() => {
    api.getEngagement({ targetType: 'hub', userId: user?.id || 'guest' })
      .then(res => {
        if (res.likes) setHubLikes(res.likes)
      })
      .catch(() => {})
  }, [user?.id])

  useEffect(() => {
    if (!lightboxHub) return undefined
    const onKey = e => {
      if (e.key === 'Escape') setLightboxHub(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxHub])

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast('Geolocation is not supported in this browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserCoords([pos.coords.latitude, pos.coords.longitude])
        setPage(1)
        setSelectedId('')
        toast('Sorted all 20,000+ India hubs by distance from you')
      },
      () => toast('Location access denied. Filter by state, city, or PIN code instead.')
    )
  }

  const handleStateChange = nextState => {
    setStateFilter(nextState)
    setCityFilter('All')
    setPage(1)
    setSelectedId('')
  }

  const handleCityChange = nextCity => {
    setCityFilter(nextCity)
    setPage(1)
    setSelectedId('')
  }

  const handleMaterialChange = nextMat => {
    setMaterial(nextMat)
    setPage(1)
    setSelectedId('')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Grid>{[...Array(4)].map((_, i) => <Skeleton key={i} />)}</Grid>
        <Skeleton className="h-80" />
      </div>
    )
  }

  const mapCenters = selectedId
    ? data.centers.filter(c => c.id === selectedId).length
      ? data.centers.filter(c => c.id === selectedId)
      : data.mapPoints.filter(c => c.id === selectedId)
    : data.mapPoints

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">All-India verified drop-off hubs</h1>
          <p className="mt-1 text-sm opacity-75">
            Search over 20,000 verified recycling and scrap drop-off hubs across India with facility photos, instant weighbridges, and +5%–10% bonus payouts.
          </p>
        </div>
        <button
          type="button"
          onClick={detectLocation}
          className="btn flex items-center gap-2 whitespace-nowrap shrink-0 text-sm"
        >
          <Navigation className="h-4 w-4" aria-hidden="true" /> Nearest hubs to me
        </button>
      </div>

      <Grid>
        <StatCard label="Verified India hubs" value={data.totalAll.toLocaleString('en-IN')} />
        <StatCard label="States & UTs covered" value={data.states.length || 36} />
        <StatCard label="Matching this filter" value={data.total.toLocaleString('en-IN')} />
        <StatCard label="Drop-off rate bonus" value="+5–10%" />
      </Grid>

      {/* Search & Geographic Filters */}
      <Glass className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" aria-hidden="true" />
            <input
              type="search"
              className="input pl-9 text-sm"
              aria-label="Search hub by city, state, neighborhood, PIN code or ID"
              placeholder="Search city, PIN code, area, or hub…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>

          <div>
            <select
              aria-label="Filter by Indian state or Union Territory"
              className="input text-sm"
              value={stateFilter}
              onChange={e => handleStateChange(e.target.value)}
            >
              <option value="All">All States &amp; UTs ({data.totalAll.toLocaleString('en-IN')})</option>
              {data.states.map(st => (
                <option key={st.name} value={st.name}>
                  {st.name} ({st.count.toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              aria-label="Filter by city"
              className="input text-sm"
              value={cityFilter}
              onChange={e => handleCityChange(e.target.value)}
            >
              <option value="All">All Cities ({data.cities.length})</option>
              {data.cities.map(ct => (
                <option key={ct.name} value={ct.name}>
                  {ct.name} ({ct.count.toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/5 p-1" role="tablist" aria-label="Filter hubs by accepted material">
          {MATERIAL_FILTERS.map(item => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={material === item}
              onClick={() => handleMaterialChange(item)}
              className={`whitespace-nowrap shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                material === item ? 'bg-leaf-500 text-emerald-950' : 'opacity-75 hover:bg-white/10 hover:opacity-100'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </Glass>

      {/* Interactive All-India Map */}
      <Glass>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">
              India hub map · <span className="font-mono tabular-nums">{data.total.toLocaleString('en-IN')}</span> matching facilities
            </h2>
            <p className="text-xs opacity-65">
              Showing {mapCenters.length} map markers across {stateFilter === 'All' ? 'India' : stateFilter}. Select any hub card below to focus it.
            </p>
          </div>
          {selectedId && (
            <button type="button" className="text-xs font-semibold text-leaf-400 underline" onClick={() => setSelectedId('')}>
              Show regional cluster
            </button>
          )}
        </div>
        {mapCenters.length ? (
          <PickupMap
            pickups={mapCenters}
            onSelect={hub => setSelectedId(hub.id)}
          />
        ) : (
          <p className="py-6 text-sm opacity-70">No drop-off hubs match this search combination. Try clearing filters.</p>
        )}
      </Glass>

      {/* Hub Photo Cards Grid */}
      <section className="space-y-4" aria-labelledby="hub-directory-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="hub-directory-heading" className="text-xl font-bold">
            Facility directory with photos
          </h2>
          <p className="font-mono text-xs tabular-nums opacity-75">
            {fetching ? 'Updating…' : `Showing page ${data.page} of ${data.totalPages.toLocaleString('en-IN')} (${data.total.toLocaleString('en-IN')} hubs)`}
          </p>
        </div>

        {data.centers.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.centers.map(hub => {
              const photo = getHubPhoto(hub.photoType)
              const hasImgError = Boolean(imgErrors[hub.photoType])
              const isSelected = selectedId === hub.id
              const customers = getRegularCustomers(hub)
              return (
                <article
                  key={hub.id}
                  className={`glass flex flex-col overflow-hidden !p-0 transition ${isSelected ? 'border-leaf-400' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => setLightboxHub(hub)}
                    aria-label={`Inspect facility photo for ${hub.name}`}
                    className="group relative h-44 w-full overflow-hidden text-left bg-gradient-to-br from-emerald-800/40 to-emerald-950/80"
                  >
                    {!hasImgError && (
                      <img
                        src={photo.src}
                        alt={`${hub.name} — ${photo.alt}`}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={() => setImgErrors(prev => ({ ...prev, [hub.photoType]: true }))}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/25 to-transparent" />
                    {hubAcceptsEwaste(hub) && (
                      <div className="absolute top-2.5 left-2.5 rounded-lg bg-amber-400 px-2 py-1 text-[11px] font-bold text-emerald-950">
                        Accepts E-waste
                      </div>
                    )}
                    <div className="absolute top-2.5 right-2.5 rounded-lg bg-black/55 p-1.5 text-white opacity-85 backdrop-blur-sm transition group-hover:opacity-100">
                      <Expand className="h-3.5 w-3.5" aria-hidden="true" />
                    </div>
                    <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                      <p className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-mono font-semibold text-leaf-300 tabular-nums">{hub.hubCode || hub.id} · PIN {hub.pinCode || '600001'}</span>
                        <span className="inline-flex items-center gap-1 font-mono font-semibold text-amber-300 tabular-nums">
                          <Star className="h-3 w-3 fill-amber-300" aria-hidden="true" /> {hub.rating || '4.8'}
                        </span>
                      </p>
                      <h3 className="mt-0.5 line-clamp-1 text-base font-bold">{hub.name}</h3>
                    </div>
                  </button>

                  <div className="flex flex-1 flex-col justify-between gap-3 p-4 text-sm">
                    <div className="space-y-2">
                      <p className="text-xs opacity-75">
                        {hub.city}, {hub.state}
                        {typeof hub.distance === 'number' && <> · <strong className="font-mono tabular-nums">{hub.distance} km away</strong></>}
                        {' '}· <strong className="text-leaf-400">+{hub.bonusPct}% payout bonus</strong>
                      </p>

                      <div className="space-y-1 text-xs opacity-85">
                        <p className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" />
                          <span>{hub.address}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" />
                          <span>{hub.hours}</span>
                        </p>
                        <p className="flex items-center gap-2 font-mono tabular-nums">
                          <Phone className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" />
                          <span>{hub.phone}</span>
                        </p>
                      </div>

                      <p className="text-xs opacity-70">Accepts: {hub.materials.join(' · ')}</p>

                      <div className="space-y-1.5 border-t border-white/10 pt-2">
                        <p className="text-xs font-semibold">Regular customers</p>
                        <div className="flex flex-wrap gap-1.5">
                          {customers.slice(0, 3).map(c => (
                            <span
                              key={c.name}
                              title={`${c.name} · ${c.type}`}
                              className={`inline-flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2.5 text-[11px] ${
                                isEwasteCustomer(c) ? 'border-amber-400/50 bg-amber-400/10' : 'border-white/10 bg-white/5'
                              }`}
                            >
                              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-leaf-500/25 text-[10px] font-bold text-leaf-300">
                                {getInitials(c.name)}
                              </span>
                              <span className="max-w-[8.5rem] truncate">{c.name}</span>
                              {isEwasteCustomer(c) && <span className="font-semibold text-amber-300">E-waste</span>}
                            </span>
                          ))}
                          {customers.length > 3 && (
                            <button
                              type="button"
                              onClick={() => setLightboxHub(hub)}
                              className="rounded-full border border-leaf-400/35 px-2.5 py-0.5 text-[11px] font-medium text-leaf-400 hover:bg-leaf-500/15"
                            >
                              +{customers.length - 3} more
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <LikeButton
                          targetType="hub"
                          targetId={hub.id}
                          initialCount={hubLikes[`hub:${hub.id}`]?.count ?? 42 + ((hub.pinCode?.charCodeAt(4) || 5) % 45)}
                          initialLiked={hubLikes[`hub:${hub.id}`]?.liked ?? false}
                          onChange={res => setHubLikes(prev => ({ ...prev, [res.key]: { count: res.count, liked: res.liked } }))}
                        />
                        <button
                          type="button"
                          onClick={() => setLightboxHub(hub)}
                          className="inline-flex items-center gap-1 rounded-lg border border-leaf-400/35 px-2.5 py-1 font-medium text-leaf-400 whitespace-nowrap hover:bg-leaf-500/15"
                        >
                          <MessageSquare className="h-3 w-3" aria-hidden="true" /> Rate &amp; review
                        </button>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setSelectedId(isSelected ? '' : hub.id)}
                          className="underline opacity-80 hover:opacity-100 whitespace-nowrap"
                        >
                          {isSelected ? 'Cluster' : 'Focus'}
                        </button>
                        <a
                          className="font-semibold text-leaf-400 underline whitespace-nowrap"
                          href={`https://www.openstreetmap.org/?mlat=${hub.lat}&mlon=${hub.lng}#map=16/${hub.lat}/${hub.lng}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Directions
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <Glass>
            <p className="text-sm opacity-75">No verified Indian hubs matched your filters. Reset state or search criteria to explore all 20,526 facilities.</p>
          </Glass>
        )}

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => {
                setPage(p => Math.max(1, p - 1))
                window.scrollTo({ top: 420, behavior: 'smooth' })
              }}
              className="glass inline-flex items-center gap-1.5 whitespace-nowrap px-4 py-2 text-xs font-semibold hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous
            </button>

            <span className="font-mono text-xs tabular-nums opacity-75">
              Page {data.page.toLocaleString('en-IN')} of {data.totalPages.toLocaleString('en-IN')} · {data.total.toLocaleString('en-IN')} hubs
            </span>

            <button
              type="button"
              disabled={page >= data.totalPages}
              onClick={() => {
                setPage(p => Math.min(data.totalPages, p + 1))
                window.scrollTo({ top: 420, behavior: 'smooth' })
              }}
              className="glass inline-flex items-center gap-1.5 whitespace-nowrap px-4 py-2 text-xs font-semibold hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </section>

      {/* Facility Photo, Ratings & Reviews Modal */}
      {lightboxHub && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="hub-photo-title"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setLightboxHub(null)}
        >
          <div
            className="glass my-auto max-h-[90vh] max-w-2xl w-full overflow-y-auto !p-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative h-64 sm:h-72 bg-emerald-950">
              <img
                src={getHubPhoto(lightboxHub.photoType).src}
                alt={lightboxHub.name}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-transparent to-black/30" />
              <button
                type="button"
                aria-label="Close facility photo"
                onClick={() => setLightboxHub(null)}
                className="absolute top-3 right-3 rounded-lg bg-black/60 p-2 text-white hover:bg-black/80"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="absolute bottom-4 left-5 right-5 text-white">
                <p className="font-mono text-xs text-leaf-300">
                  {getHubPhoto(lightboxHub.photoType).caption} · {lightboxHub.hubCode || lightboxHub.id}
                </p>
                <h3 id="hub-photo-title" className="mt-0.5 text-xl font-bold">{lightboxHub.name}</h3>
              </div>
            </div>
            <div className="space-y-4 p-5 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p>{lightboxHub.address}</p>
                  <p className="text-xs opacity-75">
                    Hours: {lightboxHub.hours} · Phone: <span className="font-mono tabular-nums">{lightboxHub.phone}</span> · Bonus: <strong className="text-leaf-400">+{lightboxHub.bonusPct}%</strong>
                  </p>
                  <p className="text-xs opacity-75">Accepted materials: {lightboxHub.materials.join(' · ')}</p>
                </div>
                <LikeButton
                  targetType="hub"
                  targetId={lightboxHub.id}
                  label={lightboxHub.name}
                  initialCount={hubLikes[`hub:${lightboxHub.id}`]?.count ?? 42 + ((lightboxHub.pinCode?.charCodeAt(4) || 5) % 45)}
                  initialLiked={hubLikes[`hub:${lightboxHub.id}`]?.liked ?? false}
                  onChange={res => setHubLikes(prev => ({ ...prev, [res.key]: { count: res.count, liked: res.liked } }))}
                />
              </div>

              <div className="border-t border-white/10 pt-4">
                <h4 className="mb-2 text-sm font-semibold">Regular customers</h4>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {getRegularCustomers(lightboxHub).map(c => (
                    <li
                      key={c.name}
                      className={`flex items-center gap-3 rounded-xl border p-2.5 ${
                        isEwasteCustomer(c) ? 'border-amber-400/50 bg-amber-400/10' : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-leaf-500/25 text-xs font-bold text-leaf-300">
                        {getInitials(c.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {c.name}
                          {isEwasteCustomer(c) && <span className="ml-2 text-xs font-semibold text-amber-300">E-waste</span>}
                        </span>
                        <span className="block text-xs opacity-70">
                          {c.type}{c.visits ? ` · ${c.visits} drop-offs/month` : ''}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-white/10 pt-4">
                <TargetReviewPanel
                  targetType="hub"
                  targetId={lightboxHub.id}
                  targetName={lightboxHub.name}
                  initialBaseRating={lightboxHub.rating || 4.8}
                  compact
                  onSubmitted={() => loadHubs()}
                />
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <a
                  className="btn text-xs"
                  href={`https://www.openstreetmap.org/?mlat=${lightboxHub.lat}&mlon=${lightboxHub.lng}#map=16/${lightboxHub.lat}/${lightboxHub.lng}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open directions
                </a>
                <button type="button" onClick={() => setLightboxHub(null)} className="glass px-4 py-2 text-xs">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
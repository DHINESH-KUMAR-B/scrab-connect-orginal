import { useCallback, useEffect, useMemo, useState } from 'react'
import { Heart, MessageSquarePlus, Search, Star, ThumbsUp } from 'lucide-react'
import { Glass, Grid, Skeleton, StatCard, useToast } from '../components/ui'
import { LikeButton, StarPicker, StarSummary, TARGET_TAGS } from '../components/CommunityFeedback'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const TYPE_TABS = [
  { id: 'all', label: 'All reviews' },
  { id: 'collector', label: 'Collectors' },
  { id: 'hub', label: 'India hubs' },
  { id: 'project', label: 'DIY crafts' },
  { id: 'platform', label: 'Platform' },
]

export default function Reviews() {
  const { user } = useAuth()
  const toast = useToast()

  const [reviews, setReviews] = useState([])
  const [likes, setLikes] = useState({})
  const [collectors, setCollectors] = useState([])
  const [hubs, setHubs] = useState([])
  const [loading, setLoading] = useState(true)

  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [ratingFilter, setRatingFilter] = useState('all')

  const [targetType, setTargetType] = useState('collector')
  const [targetId, setTargetId] = useState('c1')
  const [rating, setRating] = useState(5)
  const [tags, setTags] = useState([])
  const [comment, setComment] = useState('')
  const [guestName, setGuestName] = useState(user?.name || '')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user?.name && !guestName) setGuestName(user.name)
  }, [user?.name, guestName])

  const loadAll = useCallback(async () => {
    try {
      const [engRes, colRes, hubRes] = await Promise.all([
        api.getEngagement({ userId: user?.id || 'guest' }),
        api.getCollectors(),
        api.getCenters({ limit: 12, page: 1 }),
      ])
      setReviews(Array.isArray(engRes.reviews) ? engRes.reviews : [])
      setLikes(engRes.likes || {})
      setCollectors(Array.isArray(colRes.collectors) ? colRes.collectors : [])
      setHubs(Array.isArray(hubRes.centers) ? hubRes.centers : [])
    } catch {
      toast('Unable to load community reviews right now.')
    } finally {
      setLoading(false)
    }
  }, [user?.id, toast])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const targetChoices = useMemo(() => {
    if (targetType === 'collector') {
      return collectors.map(c => ({ id: c.id, name: `${c.name} (${c.vehicle})` }))
    }
    if (targetType === 'hub') {
      return hubs.map(h => ({ id: h.id, name: `${h.name} · ${h.city}` }))
    }
    if (targetType === 'project') {
      return [
        { id: 'up-jars', name: 'Self-watering glass jar herb planters' },
        { id: 'up-cardboard', name: 'Modular desk cable & stationery organizer' },
        { id: 'up-copper', name: 'Minimalist copper-wire plant trellis' },
        { id: 'up-ewaste', name: 'Router / Pi local media server' },
      ]
    }
    return [{ id: 'scrap-connect', name: 'Scrap Connect Doorstep & Hub Platform' }]
  }, [targetType, collectors, hubs])

  useEffect(() => {
    if (targetChoices.length && !targetChoices.some(t => t.id === targetId)) {
      setTargetId(targetChoices[0].id)
    }
  }, [targetChoices, targetId])

  const toggleTag = t => {
    setTags(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t].slice(0, 4)))
  }

  const handlePublish = async e => {
    e.preventDefault()
    if (submitting) return
    const choice = targetChoices.find(c => c.id === targetId) || { id: targetId, name: targetId }
    setSubmitting(true)
    try {
      const res = await api.submitReview({
        targetType,
        targetId: choice.id,
        targetName: choice.name,
        userId: user?.id || 'guest',
        userName: (guestName || user?.name || 'Community Member').trim(),
        rating,
        comment: comment.trim(),
        tags,
      })
      if (res.review) {
        setReviews(prev => [res.review, ...prev.filter(r => r.id !== res.review.id)])
      }
      setComment('')
      setTags([])
      toast(`Published ${rating}/5 review for ${choice.name}`)
    } catch (err) {
      toast(err.message || 'Unable to publish review.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleHelpful = async reviewId => {
    try {
      const res = await api.toggleReviewHelpful(reviewId, user?.id || 'guest')
      setReviews(prev =>
        prev.map(r =>
          r.id === reviewId ? { ...r, helpfulCount: res.helpfulCount, helpfulByMe: res.helpfulByMe } : r
        )
      )
    } catch {
      toast('Unable to update helpful vote.')
    }
  }

  const visibleReviews = useMemo(() => {
    const q = query.toLowerCase().trim()
    return reviews.filter(r => {
      if (tab !== 'all' && r.targetType !== tab) return false
      if (ratingFilter !== 'all' && Math.round(r.rating) !== Number(ratingFilter)) return false
      if (q && !`${r.targetName} ${r.userName} ${r.comment} ${(r.tags || []).join(' ')}`.toLowerCase().includes(q)) {
        return false
      }
      return true
    })
  }, [reviews, tab, ratingFilter, query])

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '4.9'
  const totalLikes = Object.values(likes).reduce((s, item) => s + (item.count || 0), 0)
  const totalHelpful = reviews.reduce((s, r) => s + (r.helpfulCount || 0), 0)

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Grid>{[...Array(4)].map((_, i) => <Skeleton key={i} />)}</Grid>
        <Skeleton className="h-80" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Ratings, reviews &amp; community likes</h1>
        <p className="mt-1 text-sm opacity-75">
          Rate collectors, endorse verified India drop-off hubs, like DIY blueprints, and explore verified member reviews.
        </p>
      </div>

      <Grid>
        <StatCard label="Average rating" value={avgRating} unit="/ 5" />
        <StatCard label="Published reviews" value={reviews.length} />
        <StatCard label="Community likes" value={totalLikes.toLocaleString('en-IN')} />
        <StatCard label="Helpful votes" value={totalHelpful} />
      </Grid>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Universal Review Composer */}
        <form onSubmit={handlePublish} className="glass space-y-4 p-5 lg:col-span-5">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-leaf-400" aria-hidden="true" />
            <h2 className="text-lg font-bold">Write a rating &amp; review</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="rev-type" className="mb-1 block text-xs opacity-70">Category</label>
              <select
                id="rev-type"
                className="input text-xs"
                value={targetType}
                onChange={e => {
                  setTargetType(e.target.value)
                  setTags([])
                }}
              >
                <option value="collector">Fleet Collector</option>
                <option value="hub">India Drop-Off Hub</option>
                <option value="project">DIY Upcycle Blueprint</option>
                <option value="platform">Scrap Connect Experience</option>
              </select>
            </div>
            <div>
              <label htmlFor="rev-target" className="mb-1 block text-xs opacity-70">Select target</label>
              <select
                id="rev-target"
                className="input text-xs"
                value={targetId}
                onChange={e => setTargetId(e.target.value)}
              >
                {targetChoices.map(choice => (
                  <option key={choice.id} value={choice.id}>{choice.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs opacity-70">Your rating</p>
            <StarPicker value={rating} onChange={setRating} label="Overall rating" />
          </div>

          <div>
            <p className="mb-1.5 text-xs opacity-70">Quick highlights (optional)</p>
            <div className="flex flex-wrap gap-1.5">
              {(TARGET_TAGS[targetType] || TARGET_TAGS.platform).map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition ${
                    tags.includes(tag)
                      ? 'border-leaf-400 bg-leaf-500/20 text-leaf-300'
                      : 'border-white/15 opacity-75 hover:bg-white/10'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {!user && (
            <div>
              <label htmlFor="rev-name" className="mb-1 block text-xs opacity-70">Your name</label>
              <input
                id="rev-name"
                className="input text-xs"
                placeholder="e.g. Priya S"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label htmlFor="rev-comment" className="mb-1 block text-xs opacity-70">Detailed review</label>
            <textarea
              id="rev-comment"
              rows={3}
              className="input text-xs"
              placeholder="Mention punctuality, weighbridge honesty, instant UPI payout, or walk-in bonus…"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn w-full whitespace-nowrap text-xs disabled:opacity-55"
          >
            {submitting ? 'Publishing…' : 'Publish review'}
          </button>
        </form>

        {/* Top-Rated & Most-Liked Collectors + Hubs */}
        <div className="space-y-4 lg:col-span-7">
          <Glass>
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <Heart className="h-4 w-4 text-rose-400" aria-hidden="true" /> Top-liked verified collectors
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {collectors.map(col => {
                const likeEntry = likes[`collector:${col.id}`] || { count: col.likesCount || 24, liked: false }
                return (
                  <div key={col.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{col.name}</p>
                      <p className="truncate text-xs opacity-65">{col.vehicle}</p>
                      <p className="mt-1 flex items-center gap-2 text-xs">
                        <StarSummary rating={col.rating || 4.8} />
                        <span className="opacity-55 tabular-nums">· {col.completedCount} pickups</span>
                      </p>
                    </div>
                    <LikeButton
                      targetType="collector"
                      targetId={col.id}
                      label={col.name}
                      initialCount={likeEntry.count}
                      initialLiked={likeEntry.liked}
                    />
                  </div>
                )
              })}
            </div>
          </Glass>

          <Glass>
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <Star className="h-4 w-4 text-amber-300" aria-hidden="true" /> Popular India hubs
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {hubs.slice(0, 4).map(hub => {
                const likeEntry = likes[`hub:${hub.id}`] || { count: 60, liked: false }
                return (
                  <div key={hub.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{hub.name}</p>
                      <p className="truncate text-xs opacity-65">{hub.city}, {hub.state} · +{hub.bonusPct}%</p>
                      <p className="mt-1">
                        <StarSummary rating={hub.rating || 4.8} />
                      </p>
                    </div>
                    <LikeButton
                      targetType="hub"
                      targetId={hub.id}
                      label={hub.name}
                      initialCount={likeEntry.count}
                      initialLiked={likeEntry.liked}
                    />
                  </div>
                )
              })}
            </div>
          </Glass>
        </div>
      </div>

      {/* Filterable Community Review Stream */}
      <Glass className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/5 p-1 text-xs" role="tablist" aria-label="Filter reviews by category">
            {TYPE_TABS.map(item => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={`whitespace-nowrap shrink-0 rounded-lg px-3 py-1.5 font-semibold transition ${
                  tab === item.id ? 'bg-leaf-500 text-emerald-950' : 'opacity-75 hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-50" aria-hidden="true" />
              <input
                type="search"
                className="input !py-1.5 pl-8 text-xs w-full sm:w-52"
                placeholder="Search reviews…"
                aria-label="Search community reviews"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <select
              className="input w-full sm:!w-36 !py-1.5 text-xs"
              aria-label="Filter by star rating"
              value={ratingFilter}
              onChange={e => setRatingFilter(e.target.value)}
            >
              <option value="all">All stars</option>
              <option value="5">5 stars only</option>
              <option value="4">4 stars</option>
              <option value="3">3 stars</option>
            </select>
          </div>
        </div>

        {visibleReviews.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {visibleReviews.map(rev => (
              <article key={rev.id} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{rev.targetName}</p>
                    <p className="text-xs opacity-65">
                      by {rev.userName} · {rev.targetType} ·{' '}
                      <span className="font-mono tabular-nums">
                        {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </p>
                  </div>
                  <StarSummary rating={rev.rating} />
                </div>

                <p className="text-sm leading-relaxed opacity-85">“{rev.comment}”</p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-xs text-leaf-400">
                    {rev.tags?.length ? rev.tags.join(' · ') : 'Verified feedback'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleHelpful(rev.id)}
                    aria-pressed={Boolean(rev.helpfulByMe)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition ${
                      rev.helpfulByMe
                        ? 'border-leaf-400 bg-leaf-500/20 text-leaf-300'
                        : 'border-white/15 opacity-75 hover:bg-white/10 hover:opacity-100'
                    }`}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                    Helpful <span className="font-mono tabular-nums">({rev.helpfulCount || 0})</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="py-6 text-sm opacity-70">No reviews match this filter. Try switching categories or write the first one above.</p>
        )}
      </Glass>
    </div>
  )
}

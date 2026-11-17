import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, MessageSquarePlus, Star, ThumbsUp } from 'lucide-react'
import { Glass, useToast } from './ui'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const RATING_LABELS = {
  1: 'Needs work',
  2: 'Fair',
  3: 'Good',
  4: 'Very good',
  5: 'Outstanding',
}

export const TARGET_TAGS = {
  pickup: ['On-time arrival', 'Verified scale', 'Instant UPI', 'Polite service', 'No haggling'],
  collector: ['On-time arrival', 'Verified scale', 'Instant UPI', 'Polite service', 'Clean pickup'],
  hub: ['Fast weighbridge', 'Walk-in bonus', 'Clean yard', 'Data-safe e-waste', 'Transparent pricing'],
  project: ['Beginner friendly', 'Zero waste', 'Low cost', 'Weekend fun', 'Durable result'],
  platform: ['Live GPS tracking', '4-digit PIN safety', 'Instant UPI', 'Fair scrap rates', '20,500+ hubs'],
}

export function StarPicker({ value = 5, onChange, size = 'md', label = 'Select rating' }) {
  const [hover, setHover] = useState(0)
  const active = hover || value
  const iconCls = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6'

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center gap-1" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map(star => {
          const filled = star <= active
          return (
            <motion.button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} star${star === 1 ? '' : 's'} — ${RATING_LABELS[star]}`}
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.12 }}
              transition={{ duration: 0.14 }}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => onChange?.(star)}
              className="rounded-md p-0.5 focus-visible:outline-2 focus-visible:outline-leaf-400"
            >
              <Star
                className={`${iconCls} transition-colors ${
                  filled ? 'fill-amber-300 text-amber-300' : 'text-white/30 hover:text-amber-200'
                }`}
                aria-hidden="true"
              />
            </motion.button>
          )
        })}
      </div>
      <span className="font-mono text-xs font-semibold tabular-nums text-amber-300">
        {active}/5 · {RATING_LABELS[active]}
      </span>
    </div>
  )
}

export function StarSummary({ rating = 4.8, count = 0 }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold tabular-nums text-amber-300">
      <Star className="h-3.5 w-3.5 fill-amber-300" aria-hidden="true" />
      <span>{Number(rating || 0).toFixed(1)}</span>
      {count > 0 && <span className="opacity-75">({count})</span>}
    </span>
  )
}

export function LikeButton({
  targetType,
  targetId,
  initialCount = 0,
  initialLiked = false,
  label = '',
  className = '',
  onChange,
  stopPropagation = false,
}) {
  const { user } = useAuth()
  const toast = useToast()
  const [liked, setLiked] = useState(Boolean(initialLiked))
  const [count, setCount] = useState(Number(initialCount || 0))
  const [pending, setPending] = useState(false)

  useEffect(() => {
    setLiked(Boolean(initialLiked))
    setCount(Number(initialCount || 0))
  }, [initialLiked, initialCount])

  const handleToggle = async e => {
    if (stopPropagation) e.stopPropagation()
    if (pending) return

    const nextLiked = !liked
    const nextCount = Math.max(0, count + (nextLiked ? 1 : -1))
    setLiked(nextLiked)
    setCount(nextCount)
    setPending(true)

    try {
      const res = await api.toggleLike({
        targetType,
        targetId,
        userId: user?.id || 'guest',
      })
      setLiked(Boolean(res.liked))
      setCount(Number(res.count))
      onChange?.(res)
    } catch {
      // Keep responsive local state cleanly even if offline
    } finally {
      setPending(false)
      if (nextLiked && label) {
        toast(`Liked ${label}`)
      }
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handleToggle}
      whileTap={{ scale: 0.92 }}
      aria-pressed={liked}
      aria-label={`${liked ? 'Unlike' : 'Like'} ${label || targetId} (${count} likes)`}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold whitespace-nowrap shrink-0 transition ${
        liked
          ? 'border-rose-400/50 bg-rose-500/20 text-rose-300'
          : 'border-white/15 bg-white/5 opacity-80 hover:border-rose-400/40 hover:bg-rose-500/10 hover:opacity-100'
      } ${className}`}
    >
      <Heart
        className={`h-3.5 w-3.5 transition-transform ${liked ? 'fill-rose-400 text-rose-400 scale-110' : ''}`}
        aria-hidden="true"
      />
      <span className="font-mono tabular-nums">{count}</span>
      {label && <span className="hidden sm:inline">{liked ? 'Liked' : 'Like'}</span>}
    </motion.button>
  )
}

export function TargetReviewPanel({
  targetType,
  targetId,
  targetName,
  initialBaseRating = 4.8,
  compact = false,
  onSubmitted,
}) {
  const { user } = useAuth()
  const toast = useToast()

  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('recent')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewerName, setReviewerName] = useState(user?.name || '')
  const [selectedTags, setSelectedTags] = useState([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user?.name && !reviewerName) {
      setReviewerName(user.name)
    }
  }, [user?.name, reviewerName])

  const loadReviews = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getEngagement({
        targetType,
        targetId,
        userId: user?.id || 'guest',
      })
      setReviews(Array.isArray(res.reviews) ? res.reviews : [])
    } catch {
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [targetType, targetId, user?.id])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  const tagOptions = TARGET_TAGS[targetType] || TARGET_TAGS.platform

  const toggleTag = tag => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag].slice(0, 4)
    )
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await api.submitReview({
        targetType,
        targetId,
        targetName,
        userId: user?.id || 'guest',
        userName: (reviewerName || user?.name || 'Community Member').trim(),
        rating,
        comment: comment.trim(),
        tags: selectedTags,
      })
      if (res.review) {
        setReviews(prev => [res.review, ...prev.filter(r => r.id !== res.review.id)])
      }
      setComment('')
      setSelectedTags([])
      toast(`Submitted ${rating}/5 review for ${targetName}`)
      onSubmitted?.(res.review)
    } catch (error) {
      toast(error.message || 'Unable to submit review.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleHelpful = async reviewId => {
    try {
      const res = await api.toggleReviewHelpful(reviewId, user?.id || 'guest')
      setReviews(prev =>
        prev.map(r =>
          r.id === reviewId
            ? { ...r, helpfulCount: res.helpfulCount, helpfulByMe: res.helpfulByMe }
            : r
        )
      )
    } catch {
      toast('Unable to update helpful vote.')
    }
  }

  const summary = useMemo(() => {
    if (!reviews.length) {
      return {
        avg: Number(initialBaseRating || 4.8).toFixed(1),
        total: 0,
        dist: [5, 4, 3, 2, 1].map(star => ({ star, count: 0, pct: 0 })),
      }
    }
    const sum = reviews.reduce((s, r) => s + Number(r.rating || 0), 0)
    const total = reviews.length
    const dist = [5, 4, 3, 2, 1].map(star => {
      const count = reviews.filter(r => Math.round(r.rating) === star).length
      return { star, count, pct: Math.round((count / total) * 100) }
    })
    return {
      avg: (sum / total).toFixed(1),
      total,
      dist,
    }
  }, [reviews, initialBaseRating])

  const sortedReviews = useMemo(() => {
    const copy = [...reviews]
    if (sortBy === 'helpful') {
      return copy.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0))
    }
    if (sortBy === 'highest') {
      return copy.sort((a, b) => b.rating - a.rating)
    }
    return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [reviews, sortBy])

  return (
    <div className="space-y-4">
      <div className={`grid gap-4 ${compact ? '' : 'lg:grid-cols-12'}`}>
        {/* Rating Histogram */}
        <Glass className={compact ? '' : 'lg:col-span-5'}>
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="text-xs opacity-70">Verified rating</p>
              <p className="mt-1 flex items-center gap-2 text-3xl font-extrabold font-mono tabular-nums text-amber-300">
                {summary.avg}
                <Star className="h-6 w-6 fill-amber-300" aria-hidden="true" />
              </p>
            </div>
            <p className="font-mono text-xs tabular-nums opacity-70">
              {summary.total} review{summary.total === 1 ? '' : 's'}
            </p>
          </div>

          <div className="mt-4 space-y-1.5">
            {summary.dist.map(row => (
              <div key={row.star} className="flex items-center gap-2 text-xs tabular-nums">
                <span className="w-7 font-mono font-medium opacity-75">{row.star}★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: row.pct / 100 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full origin-left bg-amber-300"
                  />
                </div>
                <span className="w-7 text-right font-mono opacity-65">{row.count}</span>
              </div>
            ))}
          </div>
        </Glass>

        {/* Review Composer */}
        <form onSubmit={handleSubmit} className={`glass space-y-3 p-5 ${compact ? '' : 'lg:col-span-7'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <MessageSquarePlus className="h-4 w-4 text-leaf-400" aria-hidden="true" />
              Rate &amp; review {targetName}
            </h3>
            <StarPicker value={rating} onChange={setRating} size="sm" label={`Rate ${targetName}`} />
          </div>

          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Highlight tags">
            {tagOptions.map(tag => {
              const active = selectedTags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition ${
                    active ? 'border-leaf-400 bg-leaf-500/20 text-leaf-300' : 'border-white/15 opacity-75 hover:bg-white/10'
                  }`}
                >
                  {tag}
                </button>
              )
            })}
          </div>

          {!user && (
            <div>
              <input
                className="input !py-2 text-xs"
                placeholder="Your name (e.g. Priya S)"
                aria-label="Your name"
                value={reviewerName}
                onChange={e => setReviewerName(e.target.value)}
              />
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <textarea
              rows={2}
              className="input flex-1 text-xs"
              placeholder="Share weighbridge accuracy, punctuality, bonus rate, or tips…"
              aria-label="Review comment"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
            <button
              type="submit"
              disabled={submitting}
              className="btn self-end whitespace-nowrap shrink-0 !py-2 !px-4 text-xs disabled:opacity-55"
            >
              {submitting ? 'Saving…' : 'Post review'}
            </button>
          </div>
        </form>
      </div>

      {/* Review List */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold opacity-75">
            Member reviews ({sortedReviews.length})
          </p>
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1 text-xs" role="tablist" aria-label="Sort reviews">
            {[
              { id: 'recent', label: 'Recent' },
              { id: 'helpful', label: 'Most helpful' },
              { id: 'highest', label: 'Highest' },
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={sortBy === opt.id}
                onClick={() => setSortBy(opt.id)}
                className={`rounded-lg px-2.5 py-1 font-medium whitespace-nowrap transition ${
                  sortBy === opt.id ? 'bg-leaf-500 text-emerald-950' : 'opacity-75 hover:bg-white/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-xs opacity-65">Loading verified reviews…</p>
        ) : sortedReviews.length ? (
          <div className="divide-y divide-white/10 rounded-xl border border-white/10 bg-white/5 px-4">
            {sortedReviews.map(rev => (
              <article key={rev.id} className="space-y-2 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <strong className="text-sm">{rev.userName}</strong>
                    <span aria-hidden="true" className="opacity-45">·</span>
                    <StarSummary rating={rev.rating} />
                    <span aria-hidden="true" className="opacity-45">·</span>
                    <span className="font-mono opacity-60 tabular-nums">
                      {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
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

                <p className="text-sm leading-relaxed opacity-85">{rev.comment}</p>

                {rev.tags?.length > 0 && (
                  <p className="text-xs text-leaf-400">
                    {rev.tags.join(' · ')}
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs opacity-70">
            No reviews yet for {targetName}. Share your rating above to help fellow recyclers.
          </p>
        )}
      </div>
    </div>
  )
}

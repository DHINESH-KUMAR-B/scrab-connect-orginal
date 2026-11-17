import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  store,
  createPickup,
  updatePickup,
  updateRate,
  buildPickupsCsv,
  ensureUser,
  upsertUserProfile,
  getPickupTracking,
  updatePickupTracking,
  getUserRewards,
  claimReward,
  getCommunityEngagement,
  toggleEntityLike,
  submitCommunityReview,
  toggleReviewHelpful,
  toggleReviewThank,
  getSupportTickets,
  createSupportTicket,
  replySupportTicket,
  updateSupportTicketStatus,
  getWalletOverview,
  processOnlineCheckout,
  withdrawWalletToOnline,
} from './server/store.ts'
import { queryIndiaHubs } from './server/indiaHubs.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 3000

async function startServer() {
  const app = express()
  app.use(express.json({ limit: '5mb' }))

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() })
  })

  // Live scrap rates
  app.get('/api/rates', (req, res) => {
    const group = String(req.query.group || '')
    const search = String(req.query.q || '').toLowerCase().trim()
    const items = store.rates.filter(rate => {
      const matchGroup = !group || group === 'All' || rate.group === group
      const matchSearch = !search || rate.category.toLowerCase().includes(search) || rate.note.toLowerCase().includes(search)
      return matchGroup && matchSearch
    })
    res.json({ rates: items, updatedAt: new Date().toISOString() })
  })

  app.patch('/api/rates/:category', (req, res) => {
    const category = decodeURIComponent(req.params.category)
    const pricePerKg = Number(req.body?.pricePerKg)
    const updated = updateRate(category, pricePerKg)
    if (!updated) {
      res.status(400).json({ error: 'Invalid category or pricePerKg value.' })
      return
    }
    res.json({ rate: updated })
  })

  // Pickups CRUD & lifecycle
  app.get('/api/pickups', (req, res) => {
    const userId = req.query.userId ? String(req.query.userId) : ''
    const collectorId = req.query.collectorId ? String(req.query.collectorId) : ''
    const status = req.query.status ? String(req.query.status) : ''
    const unassigned = req.query.unassigned === 'true'

    const list = store.pickups.filter(p => {
      if (userId) {
        if (userId === 'demo-user') {
          if (p.userId !== 'u1' && p.userId !== 'demo-user') return false
        } else if (p.userId !== userId) {
          return false
        }
      }
      if (collectorId) {
        if (collectorId === 'demo-collector') {
          if (p.collectorId !== 'c1' && p.collectorId !== 'demo-collector') return false
        } else if (p.collectorId !== collectorId) {
          return false
        }
      }
      if (unassigned && p.collectorId !== null) return false
      if (status && status !== 'all' && p.status !== status) return false
      return true
    })
    res.json({ pickups: list })
  })

  app.post('/api/pickups', (req, res) => {
    const { userId, userName, scrapType, items, weight, address, area, date, time, notes, lat, lng, voucherCode, payoutPreference, prepOptions, upiId, expressPaidOnline } = req.body || {}
    if (!userId || !address || !date || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
      res.status(400).json({ error: 'Missing required pickup fields (userId, address, date, lat, lng).' })
      return
    }
    ensureUser(String(userId), userName)
    const pickup = createPickup({
      userId: String(userId),
      userName,
      scrapType: scrapType || 'Other',
      items,
      weight: Number(weight || 1),
      address: String(address),
      area,
      date: String(date),
      time,
      notes,
      lat: Number(lat),
      lng: Number(lng),
      voucherCode,
      payoutPreference,
      upiId: upiId ? String(upiId) : undefined,
      expressPaidOnline: Boolean(expressPaidOnline),
      prepOptions,
    })
    res.status(201).json({ pickup })
  })

  app.patch('/api/pickups/:id', (req, res) => {
    const updated = updatePickup(req.params.id, req.body || {})
    if (!updated) {
      res.status(404).json({ error: 'Pickup not found.' })
      return
    }
    res.json({ pickup: updated })
  })

  // Live bidirectional tracking (User & Buyer/Collector)
  app.get('/api/pickups/:id/tracking', (req, res) => {
    const tracking = getPickupTracking(req.params.id)
    if (!tracking) {
      res.status(404).json({ error: 'Pickup tracking not found.' })
      return
    }
    res.json({ tracking })
  })

  app.post('/api/pickups/:id/tracking', (req, res) => {
    const tracking = updatePickupTracking(req.params.id, req.body || {})
    if (!tracking) {
      res.status(404).json({ error: 'Pickup tracking not found.' })
      return
    }
    res.json({ tracking })
  })

  // Multi-tier Goal Rewards
  app.get('/api/rewards/:userId', (req, res) => {
    res.json({ claims: getUserRewards(req.params.userId) })
  })

  app.post('/api/rewards/claim', (req, res) => {
    const { userId, rewardId, code, title, bonusPoints } = req.body || {}
    if (!userId || !rewardId || !code || !title) {
      res.status(400).json({ error: 'Missing required reward claim fields.' })
      return
    }
    const result = claimReward({ userId, rewardId, code, title, bonusPoints: Number(bonusPoints || 0) })
    res.status(201).json(result)
  })

  // Community Ratings, Reviews & Likes across Hubs, Collectors, Pickups, Projects & Platform
  app.get('/api/community/engagement', (req, res) => {
    const result = getCommunityEngagement({
      targetType: req.query.targetType ? String(req.query.targetType) : '',
      targetId: req.query.targetId ? String(req.query.targetId) : '',
      userId: req.query.userId ? String(req.query.userId) : 'guest',
    })
    res.json(result)
  })

  app.post('/api/community/like', (req, res) => {
    const { targetType, targetId, userId } = req.body || {}
    if (!targetType || !targetId) {
      res.status(400).json({ error: 'Missing targetType or targetId.' })
      return
    }
    const result = toggleEntityLike({
      targetType: String(targetType) as any,
      targetId: String(targetId),
      userId: userId ? String(userId) : 'guest',
    })
    res.json(result)
  })

  app.post('/api/community/reviews', (req, res) => {
    const { targetType, targetId, targetName, pickupId, userId, userName, rating, comment, tags } = req.body || {}
    if (!targetType || !targetId || !Number.isFinite(Number(rating))) {
      res.status(400).json({ error: 'Missing targetType, targetId, or numeric rating.' })
      return
    }
    const result = submitCommunityReview({
      targetType: String(targetType) as any,
      targetId: String(targetId),
      targetName: targetName ? String(targetName) : String(targetId),
      pickupId: pickupId ? String(pickupId) : undefined,
      userId: userId ? String(userId) : 'guest',
      userName: userName ? String(userName) : 'Community Member',
      rating: Number(rating),
      comment: comment ? String(comment) : '',
      tags: Array.isArray(tags) ? tags.map((t: unknown) => String(t)) : [],
    })
    res.status(201).json(result)
  })

  app.post('/api/community/reviews/:id/helpful', (req, res) => {
    const result = toggleReviewHelpful(req.params.id, req.body?.userId ? String(req.body.userId) : 'guest')
    if (!result) {
      res.status(404).json({ error: 'Review not found.' })
      return
    }
    res.json(result)
  })

  app.post('/api/community/reviews/:id/thank', (req, res) => {
    const result = toggleReviewThank(req.params.id)
    if (!result) {
      res.status(404).json({ error: 'Review not found.' })
      return
    }
    res.json(result)
  })

  // Customer Support Desk & Tickets
  app.get('/api/support/tickets', (req, res) => {
    const userId = req.query.userId ? String(req.query.userId) : undefined
    res.json({ tickets: getSupportTickets(userId) })
  })

  app.post('/api/support/tickets', (req, res) => {
    const { userId, userName, email, category, priority, pickupId, subject, message } = req.body || {}
    if (!userId || !subject || !message) {
      res.status(400).json({ error: 'Missing required support fields (userId, subject, message).' })
      return
    }
    const ticket = createSupportTicket({
      userId: String(userId),
      userName: userName ? String(userName) : 'Member',
      email: email ? String(email) : undefined,
      category: category ? String(category) as any : 'Other',
      priority: priority ? String(priority) as any : 'normal',
      pickupId: pickupId ? String(pickupId) : undefined,
      subject: String(subject),
      message: String(message),
    })
    res.status(201).json({ ticket })
  })

  app.post('/api/support/tickets/:id/reply', (req, res) => {
    const { sender, senderName, text } = req.body || {}
    if (!text || !String(text).trim()) {
      res.status(400).json({ error: 'Reply message text cannot be empty.' })
      return
    }
    const ticket = replySupportTicket(req.params.id, {
      sender: sender === 'support' ? 'support' : 'user',
      senderName: senderName ? String(senderName) : 'Member',
      text: String(text),
    })
    if (!ticket) {
      res.status(404).json({ error: 'Support ticket not found.' })
      return
    }
    res.json({ ticket })
  })

  app.patch('/api/support/tickets/:id', (req, res) => {
    const status = req.body?.status
    if (!['open', 'in_review', 'resolved'].includes(status)) {
      res.status(400).json({ error: 'Invalid ticket status.' })
      return
    }
    const ticket = updateSupportTicketStatus(req.params.id, status)
    if (!ticket) {
      res.status(404).json({ error: 'Support ticket not found.' })
      return
    }
    res.json({ ticket })
  })

  // Online Payments, UPI Checkout & Wallet Settlements
  app.get('/api/payments/:userId', (req, res) => {
    res.json(getWalletOverview(req.params.userId))
  })

  app.post('/api/payments/checkout', (req, res) => {
    const { userId, amount, method, upiOrRef, description, type, pickupId } = req.body || {}
    if (!userId || !Number.isFinite(Number(amount)) || Number(amount) <= 0 || !description) {
      res.status(400).json({ error: 'Missing valid payment checkout details.' })
      return
    }
    const result = processOnlineCheckout({
      userId: String(userId),
      amount: Number(amount),
      method: method || 'UPI',
      upiOrRef: upiOrRef ? String(upiOrRef) : undefined,
      description: String(description),
      type,
      pickupId: pickupId ? String(pickupId) : undefined,
    })
    res.status(201).json(result)
  })

  app.post('/api/payments/withdraw', (req, res) => {
    const { userId, amount, method, upiOrRef } = req.body || {}
    if (!userId || !upiOrRef) {
      res.status(400).json({ error: 'Provide UPI ID or bank account reference.' })
      return
    }
    const result = withdrawWalletToOnline({
      userId: String(userId),
      amount: Number(amount),
      method: method === 'Bank Transfer' ? 'Bank Transfer' : 'UPI',
      upiOrRef: String(upiOrRef),
    })
    if ('error' in result) {
      res.status(400).json({ error: result.error })
      return
    }
    res.status(201).json(result)
  })

  // Collectors
  app.get('/api/collectors', (_req, res) => {
    res.json({ collectors: store.collectors })
  })

  app.patch('/api/collectors/:id', (req, res) => {
    const collector = store.collectors.find(c => c.id === req.params.id)
    if (!collector) {
      res.status(404).json({ error: 'Collector not found.' })
      return
    }
    if (typeof req.body?.verified === 'boolean') {
      collector.verified = req.body.verified
    }
    if (typeof req.body?.name === 'string' && req.body.name.trim()) collector.name = req.body.name.trim()
    if (typeof req.body?.vehicle === 'string') collector.vehicle = req.body.vehicle.trim()
    if (typeof req.body?.phone === 'string') collector.phone = req.body.phone.trim()
    if (Array.isArray(req.body?.areas)) collector.areas = req.body.areas.map((a: unknown) => String(a).trim()).filter(Boolean)
    res.json({ collector })
  })

  // Users & Leaderboard
  app.get('/api/users', (_req, res) => {
    const sorted = [...store.users].sort((a, b) => b.greenPoints - a.greenPoints)
    res.json({ users: sorted })
  })

  app.get('/api/users/:id', (req, res) => {
    const id = req.params.id
    const mappedId = id === 'demo-user' ? 'u1' : id
    const found = store.users.find(u => u.id === mappedId || u.id === id)
    if (!found) {
      res.status(404).json({ error: 'User profile not found.' })
      return
    }
    res.json({ user: found })
  })

  app.patch('/api/users/:id', (req, res) => {
    const updated = upsertUserProfile(req.params.id, req.body || {})
    res.json({ user: updated })
  })

  // Drop-off recycling hubs (20,000+ All-India directory with pagination & distance sorting)
  app.get('/api/centers', (req, res) => {
    const lat = req.query.lat !== undefined ? Number(req.query.lat) : undefined
    const lng = req.query.lng !== undefined ? Number(req.query.lng) : undefined
    const result = queryIndiaHubs(store.centers, {
      state: req.query.state ? String(req.query.state) : '',
      city: req.query.city ? String(req.query.city) : '',
      material: req.query.material ? String(req.query.material) : '',
      q: req.query.q ? String(req.query.q) : '',
      lat: Number.isFinite(lat) ? lat : undefined,
      lng: Number.isFinite(lng) ? lng : undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 18,
    })
    res.json(result)
  })

  // Analytics overview
  app.get('/api/analytics', (_req, res) => {
    const completed = store.pickups.filter(p => p.status === 'completed')
    const totalKg = completed.reduce((sum, p) => sum + Number(p.weight || 0), 0)
    const totalPayout = completed.reduce((sum, p) => sum + Number(p.price || 0), 0)
    const scheduledCount = store.pickups.filter(p => p.status === 'scheduled').length
    const unassignedCount = store.pickups.filter(p => p.status === 'scheduled' && !p.collectorId).length

    const byGroup: Record<string, number> = {}
    for (const pickup of completed) {
      const rate = store.rates.find(r => pickup.scrapType.startsWith(r.category))
      const group = rate?.group || 'Other'
      byGroup[group] = (byGroup[group] || 0) + Number(pickup.weight || 0)
    }

    res.json({
      monthly: store.monthly,
      summary: {
        totalKg,
        totalPayout,
        scheduledCount,
        unassignedCount,
        completedCount: completed.length,
        verifiedCollectors: store.collectors.filter(c => c.verified).length,
      },
      byGroup: Object.entries(byGroup).map(([group, kg]) => ({ group, kg })),
    })
  })

  // CSV export
  app.get('/api/export/pickups.csv', (req, res) => {
    const userId = req.query.userId ? String(req.query.userId) : ''
    const rows = userId
      ? store.pickups.filter(p => (userId === 'demo-user' ? p.userId === 'u1' || p.userId === 'demo-user' : p.userId === userId))
      : store.pickups
    const csv = buildPickupsCsv(rows)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="scrap-connect-pickups.csv"')
    res.send(csv)
  })

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, 'dist')
    app.use(express.static(distDir))
    app.use((_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'))
    })
  } else {
    const { createServer: createViteServer } = await import('vite')
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Scrap Connect server listening on http://0.0.0.0:${PORT}`)
  })
}

startServer().catch(error => {
  console.error('Failed to start server:', error)
  process.exit(1)
})

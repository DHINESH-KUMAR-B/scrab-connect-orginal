async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`)
  }
  return data
}

export const api = {
  getRates: (group = '', q = '') => {
    const params = new URLSearchParams()
    if (group && group !== 'All') params.set('group', group)
    if (q) params.set('q', q)
    const qs = params.toString()
    return request(`/api/rates${qs ? `?${qs}` : ''}`)
  },
  updateRate: (category, pricePerKg) =>
    request(`/api/rates/${encodeURIComponent(category)}`, {
      method: 'PATCH',
      body: JSON.stringify({ pricePerKg }),
    }),
  getPickups: (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.userId) params.set('userId', filters.userId)
    if (filters.collectorId) params.set('collectorId', filters.collectorId)
    if (filters.status) params.set('status', filters.status)
    if (filters.unassigned) params.set('unassigned', 'true')
    const qs = params.toString()
    return request(`/api/pickups${qs ? `?${qs}` : ''}`)
  },
  createPickup: payload =>
    request('/api/pickups', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updatePickup: (id, patch) =>
    request(`/api/pickups/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  getCollectors: () => request('/api/collectors'),
  verifyCollector: (id, verified) =>
    request(`/api/collectors/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ verified }),
    }),
  getUsers: () => request('/api/users'),
  getUser: id => request(`/api/users/${encodeURIComponent(id)}`),
  updateProfile: (id, payload) =>
    request(`/api/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  getCenters: (params = {}) => {
    const search = new URLSearchParams()
    if (typeof params === 'string') {
      if (params && params !== 'All') search.set('material', params)
    } else if (params && typeof params === 'object') {
      if (params.state && params.state !== 'All') search.set('state', params.state)
      if (params.city && params.city !== 'All') search.set('city', params.city)
      if (params.material && params.material !== 'All') search.set('material', params.material)
      if (params.q) search.set('q', params.q)
      if (Number.isFinite(params.lat) && Number.isFinite(params.lng)) {
        search.set('lat', String(params.lat))
        search.set('lng', String(params.lng))
      }
      if (params.page) search.set('page', String(params.page))
      if (params.limit) search.set('limit', String(params.limit))
    }
    const qs = search.toString()
    return request(`/api/centers${qs ? `?${qs}` : ''}`)
  },
  getAnalytics: () => request('/api/analytics'),
  getTracking: id => request(`/api/pickups/${encodeURIComponent(id)}/tracking`),
  updateTracking: (id, payload) =>
    request(`/api/pickups/${encodeURIComponent(id)}/tracking`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getRewards: userId => request(`/api/rewards/${encodeURIComponent(userId)}`),
  claimReward: payload =>
    request('/api/rewards/claim', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getEngagement: (params = {}) => {
    const search = new URLSearchParams()
    if (params.targetType) search.set('targetType', params.targetType)
    if (params.targetId) search.set('targetId', params.targetId)
    if (params.userId) search.set('userId', params.userId)
    const qs = search.toString()
    return request(`/api/community/engagement${qs ? `?${qs}` : ''}`)
  },
  toggleLike: payload =>
    request('/api/community/like', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  submitReview: payload =>
    request('/api/community/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  toggleReviewHelpful: (reviewId, userId = 'guest') =>
    request(`/api/community/reviews/${encodeURIComponent(reviewId)}/helpful`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  toggleReviewThank: reviewId =>
    request(`/api/community/reviews/${encodeURIComponent(reviewId)}/thank`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  getSupportTickets: (userId = '') =>
    request(`/api/support/tickets${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`),
  createSupportTicket: payload =>
    request('/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  replySupportTicket: (id, payload) =>
    request(`/api/support/tickets/${encodeURIComponent(id)}/reply`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateSupportTicket: (id, status) =>
    request(`/api/support/tickets/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getWallet: userId => request(`/api/payments/${encodeURIComponent(userId)}`),
  checkoutOnline: payload =>
    request('/api/payments/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  withdrawOnline: payload =>
    request('/api/payments/withdraw', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getExportCsvUrl: (userId = '') =>
    `/api/export/pickups.csv${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`,
}

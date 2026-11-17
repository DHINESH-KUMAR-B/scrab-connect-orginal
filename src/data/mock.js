export const pickups = [
  { id: 'P101', userId: 'u1', collectorId: 'c1', scrapType: 'Metal', weight: 14, status: 'completed', price: 490, area: 'Adyar', date: '2026-11-10', lat: 13.0, lng: 80.25 },
  { id: 'P102', userId: 'u1', collectorId: 'c1', scrapType: 'Paper', weight: 8, status: 'scheduled', price: 96, area: 'Adyar', date: '2026-11-18', lat: 13.01, lng: 80.26 },
  { id: 'P103', userId: 'u2', collectorId: 'c2', scrapType: 'E-Waste', weight: 5, status: 'scheduled', price: 300, area: 'T Nagar', date: '2026-11-18', lat: 13.04, lng: 80.23 },
  { id: 'P104', userId: 'u3', collectorId: 'c1', scrapType: 'Plastic', weight: 6, status: 'scheduled', price: 108, area: 'Adyar', date: '2026-11-18', lat: 13.0, lng: 80.24 },
  { id: 'P105', userId: 'u4', collectorId: 'c2', scrapType: 'Cardboard', weight: 11, status: 'completed', price: 99, area: 'Velachery', date: '2026-11-09', lat: 12.98, lng: 80.22 }]
export const collectors = [
  { id: 'c1', name: 'Ravi Kumar', vehicle: 'Mini truck TN-09-4521', verified: true, rating: 4.8 },
  { id: 'c2', name: 'Selvi M', vehicle: 'E-rickshaw TN-22-1180', verified: true, rating: 4.6 },
  { id: 'c3', name: 'Arun P', vehicle: 'Van TN-07-7733', verified: false, rating: 0 }]
export const users = [
  { id: 'u1', name: 'Priya S', email: 'priya@mail.com', phone: '98400 11111', greenPoints: 1240 },
  { id: 'u2', name: 'Karthik R', email: 'karthik@mail.com', phone: '98400 22222', greenPoints: 980 },
  { id: 'u3', name: 'Meena L', email: 'meena@mail.com', phone: '98400 33333', greenPoints: 760 },
  { id: 'u4', name: 'GreenCafe', email: 'cafe@mail.com', phone: '98400 44444', greenPoints: 2100 }]
export const monthly = ['Jun','Jul','Aug','Sep','Oct','Nov'].map((month, i) => ({ month, kg: 20 + i * 9 + (i % 2) * 6, revenue: 4000 + i * 1800 }))
export const badges = [{ n: 'First pickup', on: true }, { n: '50 kg club', on: true }, { n: 'E-waste hero', on: false }, { n: '10 pickups', on: false }]
export const levels = [{ n: 'Seedling', min: 0 }, { n: 'Sapling', min: 500 }, { n: 'Tree', min: 1500 }, { n: 'Forest', min: 3000 }]

const DEMO_PICKUPS_KEY = 'scrap-connect-pickups'
export function getDemoPickups() {
  try {
    const saved = localStorage.getItem(DEMO_PICKUPS_KEY)
    if (!saved) return []
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed)) throw new Error('Saved demo pickups must be a list.')
    return parsed
  } catch (error) {
    console.error('Unable to read saved demo pickups.', error)
    localStorage.removeItem(DEMO_PICKUPS_KEY)
    return []
  }
}
export function saveDemoPickup(pickup) {
  const saved = getDemoPickups()
  const next = [...saved, pickup]
  localStorage.setItem(DEMO_PICKUPS_KEY, JSON.stringify(next))
  return pickup
}

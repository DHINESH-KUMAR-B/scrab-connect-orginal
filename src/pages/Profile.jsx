import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Camera, CheckCircle2, MapPin, Phone, ShieldCheck, Trash2, Truck, User } from 'lucide-react'
import { Glass, useToast } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { MapPicker } from '../components/MapWidgets'
import customerAvatar from '../assets/images/avatar_customer_portrait_1794940627362.jpg'
import collectorAvatar from '../assets/images/avatar_collector_portrait_1794940627741.jpg'

const SERVICE_AREAS = ['Adyar', 'T Nagar', 'Velachery', 'Mylapore', 'Guindy', 'Anna Nagar', 'Besant Nagar', 'OMR']
const TIME_SLOTS = ['Morning (08:00 – 12:00)', 'Afternoon (12:00 – 16:00)', 'Evening (16:00 – 19:00)']
const PAYOUT_METHODS = ['UPI', 'Bank Transfer', 'Cash']
const ACCOUNT_TYPES = ['Household', 'Apartment / HOA', 'Business / Shop', 'Office / Campus']

function resizePhotoToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file (JPG, PNG, or WebP).'))
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error('Choose a photo smaller than 8 MB.'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Unable to read the selected image.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Unable to decode this image file.'))
      img.onload = () => {
        const size = 256
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        const minDim = Math.min(img.width, img.height)
        const sx = (img.width - minDim) / 2
        const sy = (img.height - minDim) / 2
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.84))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const isOnboarding = params.get('setup') === '1'

  const homePath = user ? { user: '/dashboard', collector: '/collector', admin: '/admin' }[user.role] || '/dashboard' : '/login'

  const [form, setForm] = useState({
    name: user?.name || '',
    photoUrl: user?.photoUrl || '',
    phone: user?.phone || '',
    altPhone: user?.altPhone || '',
    altContactName: user?.altContactName || '',
    accountType: user?.accountType || 'Household',
    area: user?.area || '',
    city: user?.city || 'Chennai',
    pinCode: user?.pinCode || '',
    landmark: user?.landmark || '',
    address: user?.address || '',
    bio: user?.bio || '',
    payoutMethod: user?.payoutMethod || 'UPI',
    upiId: user?.upiId || '',
    preferredSlot: user?.preferredSlot || TIME_SLOTS[0],
    notifySms: user?.notifySms ?? true,
    notifyRates: user?.notifyRates ?? true,
    vehicle: user?.vehicle || '',
    licenseNo: user?.licenseNo || '',
    areas: Array.isArray(user?.areas) ? user.areas : [],
    capacityKg: user?.capacityKg || 250,
  })
  const [location, setLocation] = useState(
    Number.isFinite(user?.lat) && Number.isFinite(user?.lng) ? [user.lat, user.lng] : null
  )
  const [busy, setBusy] = useState(false)

  const completion = useMemo(() => {
    const checks = [
      Boolean(form.photoUrl),
      Boolean(form.name.trim()),
      Boolean(form.phone.trim()),
      Boolean(form.altPhone.trim()),
      Boolean(form.area.trim()),
      Boolean(form.city.trim()),
    ]
    if (user?.role === 'user') {
      checks.push(Boolean(form.address.trim()), Boolean(form.pinCode.trim()), Boolean(location), Boolean(form.payoutMethod))
    } else if (user?.role === 'collector') {
      checks.push(Boolean(form.vehicle.trim()), Boolean(form.licenseNo.trim()), form.areas.length > 0, Number(form.capacityKg) > 0)
    }
    const done = checks.filter(Boolean).length
    return Math.round((done / checks.length) * 100)
  }, [form, location, user?.role])

  const handlePhotoUpload = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await resizePhotoToDataUrl(file)
      setForm(prev => ({ ...prev, photoUrl: dataUrl }))
      toast('Profile photo ready — save profile to apply')
    } catch (error) {
      toast(error.message || 'Unable to process photo.')
    }
  }

  const toggleArea = area => {
    setForm(prev => ({
      ...prev,
      areas: prev.areas.includes(area)
        ? prev.areas.filter(item => item !== area)
        : [...prev.areas, area],
    }))
  }

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast('Geolocation is not available in this browser. Pick a spot on the map instead.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation([pos.coords.latitude, pos.coords.longitude])
        toast('Default pickup coordinates captured')
      },
      () => toast('Location permission denied. Click on the map to pin your address.')
    )
  }

  const submit = async e => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast('Enter your full name to continue.')
      return
    }
    if (!form.phone.trim()) {
      toast('Enter your primary mobile number.')
      return
    }
    if (user?.role === 'collector' && (!form.vehicle.trim() || !form.areas.length)) {
      toast('Add your vehicle details and at least one service area.')
      return
    }
    setBusy(true)
    try {
      await updateProfile({
        name: form.name.trim(),
        photoUrl: form.photoUrl,
        phone: form.phone.trim(),
        altPhone: form.altPhone.trim(),
        altContactName: form.altContactName.trim(),
        accountType: form.accountType,
        area: form.area.trim(),
        city: form.city.trim(),
        pinCode: form.pinCode.trim(),
        landmark: form.landmark.trim(),
        address: form.address.trim(),
        bio: form.bio.trim(),
        lat: location ? location[0] : undefined,
        lng: location ? location[1] : undefined,
        payoutMethod: form.payoutMethod,
        upiId: form.upiId.trim(),
        preferredSlot: form.preferredSlot,
        notifySms: form.notifySms,
        notifyRates: form.notifyRates,
        vehicle: form.vehicle.trim(),
        licenseNo: form.licenseNo.trim(),
        areas: form.areas,
        capacityKg: Number(form.capacityKg) || 250,
      })
      toast('Profile setup saved')
      if (isOnboarding) {
        nav(homePath)
      }
    } catch (error) {
      toast(error.message || 'Unable to save your profile.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{isOnboarding ? 'Complete your profile setup' : 'Profile & preferences'}</h1>
          <p className="mt-1 text-sm opacity-70">
            {user?.role === 'collector'
              ? 'Add your profile photo, two contact numbers, vehicle registration, and coverage neighborhoods.'
              : user?.role === 'admin'
                ? 'Manage your profile photo, contact numbers, and operations preferences.'
                : 'Add your photo, primary & alternate mobile numbers, default pickup address, and payout method.'}
          </p>
        </div>
        <Link to={homePath} className="glass whitespace-nowrap px-4 py-2 text-sm hover:bg-white/10">
          {isOnboarding ? 'Skip for now' : 'Back to workspace'}
        </Link>
      </div>

      <Glass>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {user?.role === 'collector' ? <Truck className="h-4 w-4 text-leaf-400" aria-hidden="true"/>
              : user?.role === 'admin' ? <ShieldCheck className="h-4 w-4 text-leaf-400" aria-hidden="true"/>
                : <User className="h-4 w-4 text-leaf-400" aria-hidden="true"/>}
            <span>Profile completion</span>
          </div>
          <span className="font-mono text-sm font-bold tabular-nums text-leaf-400">{completion}%</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-leaf-500 transition-all" style={{ width: `${completion}%` }}/>
        </div>
        {user?.profileCompleted && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-leaf-400">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true"/> Profile verified for quick booking and dispatch
          </p>
        )}
      </Glass>

      <Glass>
        <form onSubmit={submit} className="space-y-6">
          <div className="flex flex-wrap items-center gap-5 border-b border-white/10 pb-5">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-leaf-500/15 flex items-center justify-center text-2xl font-extrabold text-leaf-400">
              {form.photoUrl
                ? <img src={form.photoUrl} alt="Profile preview" referrerPolicy="no-referrer" className="h-full w-full object-cover"/>
                : (form.name || user?.email || 'SC').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 w-full sm:flex-1 space-y-2.5">
              <div>
                <h2 className="text-sm font-semibold">Profile photo</h2>
                <p className="text-xs opacity-70">Upload a photo or pick a studio avatar so collectors and customers recognize you.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="btn inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap !py-1.5 !px-3 text-xs">
                  <Camera className="h-3.5 w-3.5" aria-hidden="true"/> Upload photo
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="sr-only"/>
                </label>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, photoUrl: customerAvatar }))}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs hover:bg-white/10"
                >
                  <img src={customerAvatar} alt="" referrerPolicy="no-referrer" className="h-4 w-4 rounded-full object-cover"/> Home preset
                </button>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, photoUrl: collectorAvatar }))}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs hover:bg-white/10"
                >
                  <img src={collectorAvatar} alt="" referrerPolicy="no-referrer" className="h-4 w-4 rounded-full object-cover"/> Collector preset
                </button>
                {form.photoUrl && (
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, photoUrl: '' }))}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-red-300 hover:bg-red-500/15"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true"/> Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium opacity-75" htmlFor="prof-name">Full name</label>
              <input
                id="prof-name"
                required
                className="input"
                placeholder="e.g. Priya Sundaram"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium opacity-75" htmlFor="prof-account-type">Account category</label>
              <select
                id="prof-account-type"
                className="input"
                value={form.accountType}
                onChange={e => setForm({ ...form, accountType: e.target.value })}
              >
                {ACCOUNT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium opacity-75" htmlFor="prof-email">Account email</label>
              <input id="prof-email" disabled className="input cursor-not-allowed opacity-60" value={user?.email || ''}/>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium opacity-75" htmlFor="prof-bio">Recycling note / short bio</label>
              <input
                id="prof-bio"
                className="input"
                placeholder="e.g. Weekend pickups preferred, sorted paper & e-waste"
                value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3 border-t border-white/10 pt-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Phone className="h-4 w-4 text-leaf-400" aria-hidden="true"/> Contact numbers (2 mobile numbers)
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium opacity-75" htmlFor="prof-phone">Primary mobile number *</label>
                <input
                  id="prof-phone"
                  type="tel"
                  required
                  className="input font-mono tabular-nums"
                  placeholder="e.g. +91 98400 11111"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium opacity-75" htmlFor="prof-alt-phone">Secondary mobile number</label>
                <input
                  id="prof-alt-phone"
                  type="tel"
                  className="input font-mono tabular-nums"
                  placeholder="e.g. +91 98400 22222"
                  value={form.altPhone}
                  onChange={e => setForm({ ...form, altPhone: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium opacity-75" htmlFor="prof-alt-name">Alternate contact name</label>
                <input
                  id="prof-alt-name"
                  className="input"
                  placeholder="e.g. Security / Family"
                  value={form.altContactName}
                  onChange={e => setForm({ ...form, altContactName: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-white/10 pt-5">
            <h2 className="text-sm font-semibold">Location &amp; address details</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium opacity-75" htmlFor="prof-area">Neighborhood / area</label>
                <input
                  id="prof-area"
                  className="input"
                  placeholder="e.g. Adyar"
                  value={form.area}
                  onChange={e => setForm({ ...form, area: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium opacity-75" htmlFor="prof-city">City</label>
                <input
                  id="prof-city"
                  className="input"
                  placeholder="e.g. Chennai"
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium opacity-75" htmlFor="prof-pin">PIN / Postal code</label>
                <input
                  id="prof-pin"
                  className="input font-mono tabular-nums"
                  placeholder="e.g. 600020"
                  value={form.pinCode}
                  onChange={e => setForm({ ...form, pinCode: e.target.value })}
                />
              </div>
            </div>

            {user?.role === 'user' && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium opacity-75" htmlFor="prof-address">Default street address</label>
                    <input
                      id="prof-address"
                      className="input"
                      placeholder="Flat / house no. / street (auto-fills bookings)"
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium opacity-75" htmlFor="prof-landmark">Landmark / gate instructions</label>
                    <input
                      id="prof-landmark"
                      className="input"
                      placeholder="e.g. Near Gandhi Nagar Park, ring bell #2"
                      value={form.landmark}
                      onChange={e => setForm({ ...form, landmark: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium opacity-80">
                    <MapPin className="h-3.5 w-3.5 text-leaf-400" aria-hidden="true"/> Default map pin
                  </span>
                  <button type="button" onClick={detectLocation} className="text-xs underline">
                    Use current location
                  </button>
                </div>
                <MapPicker location={location} onSelect={setLocation}/>
              </>
            )}
          </div>

          {user?.role === 'user' && (
            <div className="grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium opacity-75" htmlFor="prof-payout">Preferred payout method</label>
                <select
                  id="prof-payout"
                  className="input"
                  value={form.payoutMethod}
                  onChange={e => setForm({ ...form, payoutMethod: e.target.value })}
                >
                  {PAYOUT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium opacity-75" htmlFor="prof-upi">UPI ID / payout reference</label>
                <input
                  id="prof-upi"
                  className="input"
                  placeholder={form.payoutMethod === 'UPI' ? 'e.g. priya@okicici' : 'Account or preference note'}
                  value={form.upiId}
                  onChange={e => setForm({ ...form, upiId: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium opacity-75" htmlFor="prof-slot">Preferred pickup window</label>
                <select
                  id="prof-slot"
                  className="input"
                  value={form.preferredSlot}
                  onChange={e => setForm({ ...form, preferredSlot: e.target.value })}
                >
                  {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                </select>
              </div>
            </div>
          )}

          {user?.role === 'collector' && (
            <div className="space-y-4 border-t border-white/10 pt-5">
              <h2 className="text-sm font-semibold">Vehicle, license &amp; service coverage</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium opacity-75" htmlFor="prof-vehicle">Vehicle type &amp; plate</label>
                  <input
                    id="prof-vehicle"
                    required
                    className="input"
                    placeholder="e.g. E-rickshaw TN-22-1180"
                    value={form.vehicle}
                    onChange={e => setForm({ ...form, vehicle: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium opacity-75" htmlFor="prof-license">Driver license / ID no.</label>
                  <input
                    id="prof-license"
                    className="input font-mono tabular-nums"
                    placeholder="e.g. TN09-2019004412"
                    value={form.licenseNo}
                    onChange={e => setForm({ ...form, licenseNo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium opacity-75" htmlFor="prof-capacity">Max load capacity (kg)</label>
                  <input
                    id="prof-capacity"
                    type="number"
                    min="20"
                    max="5000"
                    className="input font-mono tabular-nums"
                    value={form.capacityKg}
                    onChange={e => setForm({ ...form, capacityKg: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium opacity-75">Service areas (select neighborhoods you cover)</p>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_AREAS.map(area => {
                    const active = form.areas.includes(area)
                    return (
                      <button
                        key={area}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleArea(area)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                          active ? 'border-leaf-400 bg-leaf-500/20 text-leaf-400' : 'border-white/15 opacity-75 hover:bg-white/10'
                        }`}
                      >
                        {area}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium opacity-75" htmlFor="prof-col-upi">Settlement UPI ID</label>
                <input
                  id="prof-col-upi"
                  className="input"
                  placeholder="e.g. collector@okaxis"
                  value={form.upiId}
                  onChange={e => setForm({ ...form, upiId: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="space-y-2 border-t border-white/10 pt-5 text-sm">
            <h2 className="font-semibold">Notifications</h2>
            <label className="flex items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                className="accent-green-500"
                checked={form.notifySms}
                onChange={e => setForm({ ...form, notifySms: e.target.checked })}
              />
              <span>SMS &amp; WhatsApp pickup arrival alerts to primary and alternate numbers</span>
            </label>
            <label className="flex items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                className="accent-green-500"
                checked={form.notifyRates}
                onChange={e => setForm({ ...form, notifyRates: e.target.checked })}
              />
              <span>Weekly scrap rate change updates</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-4">
            <Link to={homePath} className="glass px-4 py-2.5 text-sm hover:bg-white/10">Cancel</Link>
            <button disabled={busy} className="btn whitespace-nowrap disabled:opacity-60">
              {busy ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </Glass>
    </div>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { LocateFixed, MessageSquare, Navigation, Phone, Play, RotateCcw, ShieldCheck, Square, Truck, User } from 'lucide-react'
import { Glass, useToast } from './ui'
import { LiveTrackingMap } from './MapWidgets'
import { api } from '../lib/api'

const STAGES = [
  { key: 'assigned', label: 'Assigned' },
  { key: 'en_route', label: 'Buyer en route' },
  { key: 'arrived', label: 'Arrived' },
  { key: 'weighing', label: 'Weighing' },
  { key: 'completed', label: 'Completed' },
]

function formatPingTime(iso) {
  if (!iso) return 'Just now'
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return 'Live'
  }
}

// True only when the value is a usable { lat, lng } pair
const hasCoords = loc => Boolean(loc) && Number.isFinite(Number(loc.lat)) && Number.isFinite(Number(loc.lng))

export default function LiveTracker({ pickupId, role = 'user', onStatusSync }) {
  const toast = useToast()
  const [tracking, setTracking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [autoDrive, setAutoDrive] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [pinDraft, setPinDraft] = useState('')
  const [error, setError] = useState('')
  const prevStageRef = useRef('')

  const fetchTracking = useCallback(async () => {
    if (!pickupId) return
    try {
      const data = await api.getTracking(pickupId)
      setTracking(data)
      setError('')
      if (prevStageRef.current && prevStageRef.current !== data.trackingStage && data.trackingStage === 'completed') {
        onStatusSync?.()
      }
      prevStageRef.current = data.trackingStage
      if (data.trackingStage === 'arrived' || data.trackingStage === 'weighing' || data.trackingStage === 'completed') {
        setAutoDrive(false)
      }
    } catch (err) {
      setError(err.message || 'Live tracking is unavailable for this pickup.')
    } finally {
      setLoading(false)
    }
  }, [pickupId, onStatusSync])

  useEffect(() => {
    setLoading(true)
    setAutoDrive(false)
    prevStageRef.current = ''
    fetchTracking()
  }, [pickupId, fetchTracking])

  useEffect(() => {
    if (!pickupId || tracking?.status === 'completed' || tracking?.status === 'cancelled') return undefined
    const timer = setInterval(fetchTracking, 2500)
    return () => clearInterval(timer)
  }, [pickupId, tracking?.status, fetchTracking])

  const sendUpdate = useCallback(async (payload, successMsg) => {
    if (!pickupId) return
    setBusy(true)
    try {
      const updated = await api.updateTracking(pickupId, payload)
      setTracking(updated)
      setError('')
      if (successMsg) toast(successMsg)
      if (updated.trackingStage === 'arrived' || updated.trackingStage === 'completed') {
        setAutoDrive(false)
      }
    } catch (err) {
      toast(err.message || 'Unable to update live location.')
    } finally {
      setBusy(false)
    }
  }, [pickupId, toast])

  useEffect(() => {
    if (!autoDrive || !pickupId) return undefined
    const driver = setInterval(() => {
      sendUpdate({ advanceStep: true })
    }, 2000)
    return () => clearInterval(driver)
  }, [autoDrive, pickupId, sendUpdate])

  const shareBrowserGps = () => {
    if (!navigator.geolocation) {
      toast('GPS geolocation is not supported in this browser.')
      return
    }
    setBusy(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        const payload = role === 'collector'
          ? { collectorLat: coords.lat, collectorLng: coords.lng, trackingStage: 'en_route' }
          : { userLat: coords.lat, userLng: coords.lng }
        sendUpdate(payload, role === 'collector' ? 'Buyer live GPS updated' : 'Your live GPS pin updated')
      },
      err => {
        setBusy(false)
        toast(err.code === err.PERMISSION_DENIED
          ? 'Location permission denied. Enable browser location or use demo controls.'
          : 'Could not read current GPS coordinates.')
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  if (!pickupId) return null

  if (loading && !tracking) {
    return (
      <Glass>
        <p className="text-sm opacity-70">Connecting live GPS telemetry for {pickupId}…</p>
      </Glass>
    )
  }

  if (error && !tracking) {
    return (
      <Glass>
        <p role="alert" className="text-sm text-red-300">{error}</p>
      </Glass>
    )
  }

  if (!tracking) return null

  const userHasLocation = hasCoords(tracking.userLocation)
  const collectorHasLocation = hasCoords(tracking.collectorLocation)
  const distanceKm = Number(tracking.distanceKm)
  const hasDistance = collectorHasLocation && Number.isFinite(distanceKm)

  const stageIndex = Math.max(0, STAGES.findIndex(s => s.key === tracking.trackingStage))
  const currentStageLabel = STAGES[stageIndex]?.label || 'Assigned'
  const etaDisplay = tracking.trackingStage === 'arrived' || tracking.trackingStage === 'weighing'
    ? 'At door'
    : tracking.trackingStage === 'completed'
      ? 'Done'
      : collectorHasLocation
        ? `${tracking.etaMinutes ?? '–'} min`
        : 'Pending'

  return (
    <Glass className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-leaf-400">
            Live GPS link · Pickup {tracking.pickupId}
          </p>
          <h3 className="mt-0.5 text-lg font-bold">
            {tracking.scrapType} · <span className="font-mono tabular-nums">{tracking.weight} kg</span> · <span className="font-mono tabular-nums text-leaf-400">₹{tracking.price}</span>
          </h3>
          <p className="text-xs opacity-70">
            {tracking.address} · Scheduled {tracking.date}{tracking.time ? ` at ${tracking.time}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={shareBrowserGps}
            className="btn inline-flex items-center gap-1.5 whitespace-nowrap !py-1.5 !px-3 text-xs disabled:opacity-60"
          >
            <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
            {role === 'collector' ? 'Broadcast my GPS' : 'Share my live GPS'}
          </button>

          {role === 'collector' ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => sendUpdate({ trackingStage: 'en_route' }, 'Trip started — customer notified')}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium whitespace-nowrap hover:bg-white/10"
              >
                <Navigation className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                Start trip
              </button>
              <button
                type="button"
                onClick={() => setAutoDrive(v => !v)}
                className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  autoDrive ? 'border-amber-400/50 bg-amber-500/15 text-amber-200' : 'border-white/15 hover:bg-white/10'
                }`}
              >
                {autoDrive ? <Square className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
                {autoDrive ? 'Stop auto-drive' : 'Auto-drive to user'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => sendUpdate({ trackingStage: 'arrived' }, 'Marked as arrived at user pin')}
                className="rounded-lg border border-leaf-400/40 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-leaf-400 hover:bg-leaf-500/15"
              >
                Mark arrived
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => sendUpdate({ trackingStage: 'weighing' }, 'Weighing started')}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium whitespace-nowrap hover:bg-white/10"
              >
                Start weighing
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => sendUpdate({ advanceStep: true })}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium whitespace-nowrap hover:bg-white/10"
              >
                Step buyer closer
              </button>
              <button
                type="button"
                onClick={() => setAutoDrive(v => !v)}
                className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  autoDrive ? 'border-amber-400/50 bg-amber-500/15 text-amber-200' : 'border-white/15 hover:bg-white/10'
                }`}
              >
                {autoDrive ? <Square className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
                {autoDrive ? 'Pause live move' : 'Auto-simulate buyer'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => sendUpdate({ resetDemo: true }, 'Demo route reset')}
                className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/10"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset route
              </button>
            </>
          )}
        </div>
      </div>

      {/* Live telemetry KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs opacity-65">Live distance</p>
          <p className="mt-1 font-mono text-lg font-bold tabular-nums">
            {hasDistance ? `${distanceKm.toFixed(2)} km` : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs opacity-65">Estimated arrival</p>
          <p className="mt-1 font-mono text-lg font-bold tabular-nums text-leaf-400">{etaDisplay}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs opacity-65">Current status</p>
          <p className="mt-1 text-sm font-semibold">{currentStageLabel}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs opacity-65">Last GPS ping</p>
          <p className="mt-1 font-mono text-sm font-semibold tabular-nums">{formatPingTime(tracking.lastPingAt)}</p>
        </div>
      </div>

      {/* 5-stage progress stepper */}
      <ol className="grid grid-cols-5 gap-1 sm:gap-1.5 text-center text-[10px] sm:text-[11px]" aria-label="Pickup live progress">
        {STAGES.map((stage, i) => {
          const active = i <= stageIndex
          const current = i === stageIndex
          return (
            <li key={stage.key} className="space-y-1">
              <div className={`h-1.5 rounded-full transition-all ${active ? 'bg-leaf-500' : 'bg-white/10'}`} />
              <span className={`block truncate ${current ? 'font-bold text-leaf-400' : active ? 'opacity-85' : 'opacity-45'}`}>
                {stage.label}
              </span>
            </li>
          )
        })}
      </ol>

      {userHasLocation ? (
        <LiveTrackingMap
          userLocation={tracking.userLocation}
          collectorLocation={collectorHasLocation ? tracking.collectorLocation : null}
          userLabel={`${tracking.user?.name || 'Customer'} · ${tracking.address}`}
          collectorLabel={tracking.collector ? `${tracking.collector.name} (${tracking.collector.vehicle})` : 'Awaiting buyer'}
          trackingStage={tracking.trackingStage}
        />
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm opacity-80">
          The pickup location is not available yet, so the live map cannot be shown.
          {role === 'user' && ' Tap "Share my live GPS" to set your pin.'}
        </div>
      )}

      {/* Bidirectional contact cards: User & Buyer */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 text-sm">
          <div className="flex items-center gap-2 font-semibold">
            <User className="h-4 w-4 text-sky-400" aria-hidden="true" />
            <span>Seller / User location</span>
          </div>
          <p className="mt-1 font-medium">{tracking.user?.name || 'Customer'}</p>
          <p className="text-xs opacity-75">{tracking.address}</p>
          {userHasLocation && (
            <p className="mt-1 font-mono text-xs tabular-nums opacity-65">
              GPS: {Number(tracking.userLocation.lat).toFixed(4)}, {Number(tracking.userLocation.lng).toFixed(4)}
            </p>
          )}
          {(tracking.user?.phone || tracking.user?.altPhone) && (
            <p className="mt-1.5 flex flex-wrap items-center gap-3 text-xs opacity-80">
              {tracking.user.phone && (
                <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                  <Phone className="h-3 w-3" aria-hidden="true" /> {tracking.user.phone}
                </span>
              )}
              {tracking.user.altPhone && (
                <span className="font-mono tabular-nums opacity-80">Alt: {tracking.user.altPhone}</span>
              )}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 text-sm">
          <div className="flex items-center gap-2 font-semibold">
            <Truck className="h-4 w-4 text-leaf-400" aria-hidden="true" />
            <span>Buyer / Collector live unit</span>
          </div>
          {tracking.collector ? (
            <>
              <p className="mt-1 font-medium">
                {tracking.collector.name} · <span className="font-mono text-xs text-amber-300 tabular-nums">{tracking.collector.rating || '4.8'}/5</span>
              </p>
              <p className="text-xs opacity-75">{tracking.collector.vehicle}</p>
              {collectorHasLocation && (
                <p className="mt-1 font-mono text-xs tabular-nums opacity-65">
                  GPS: {Number(tracking.collectorLocation.lat).toFixed(4)}, {Number(tracking.collectorLocation.lng).toFixed(4)}
                </p>
              )}
              {tracking.collector.phone && (
                <p className="mt-1.5 inline-flex items-center gap-1 font-mono text-xs tabular-nums opacity-80">
                  <Phone className="h-3 w-3" aria-hidden="true" /> {tracking.collector.phone}
                </p>
              )}
            </>
          ) : (
            <p className="mt-1.5 text-xs opacity-70">
              No buyer assigned yet. Use "Step buyer closer" or accept this job in the Collector Pool to begin live GPS tracking.
            </p>
          )}
        </div>
      </div>

      {/* Creative Handoff Security PIN & Bidirectional Live Note */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-4 w-4 text-leaf-400" aria-hidden="true" />
              Handoff security PIN
            </span>
            <span className={`text-xs font-semibold ${tracking.pinVerified ? 'text-leaf-400' : 'opacity-70'}`}>
              {tracking.pinVerified ? 'PIN verified' : 'Pending arrival check'}
            </span>
          </div>
          {role === 'user' ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-2xl font-extrabold tracking-widest tabular-nums text-leaf-400">
                {tracking.handoffPin || '4829'}
              </p>
              <p className="max-w-xs text-xs opacity-70">
                Share this 4-digit PIN only with {tracking.collector?.name || 'your verified collector'} before weighing begins.
              </p>
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {tracking.pinVerified ? (
                <p className="text-xs text-leaf-400">Customer PIN matched — safe to weigh and settle payout.</p>
              ) : (
                <>
                  <input
                    type="text"
                    maxLength={4}
                    inputMode="numeric"
                    aria-label="Customer 4-digit handoff PIN"
                    placeholder="Enter 4-digit PIN"
                    value={pinDraft}
                    onChange={e => setPinDraft(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="input !w-36 !py-1.5 font-mono text-xs tracking-widest tabular-nums"
                  />
                  <button
                    type="button"
                    disabled={busy || pinDraft.length < 4}
                    onClick={() => {
                      if (pinDraft === tracking.handoffPin) {
                        sendUpdate({ verifyPin: pinDraft }, 'Customer handoff PIN verified')
                        setPinDraft('')
                      } else {
                        toast('PIN does not match customer code. Ask the customer for their 4-digit PIN.')
                      }
                    }}
                    className="btn whitespace-nowrap !py-1.5 !px-3 text-xs disabled:opacity-50"
                  >
                    Verify PIN
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 font-semibold">
              <MessageSquare className="h-4 w-4 text-sky-400" aria-hidden="true" />
              Live doorstep note
            </span>
            <span className="text-xs opacity-65">Synced live</span>
          </div>
          {tracking.liveNote ? (
            <p className="mt-1.5 text-xs text-leaf-300">Latest note: &ldquo;{tracking.liveNote}&rdquo;</p>
          ) : (
            <p className="mt-1.5 text-xs opacity-60">Send a quick gate or preparation update below.</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(role === 'collector'
              ? ['5 min away', 'Reached main gate', 'Digital scale ready']
              : ['Waiting at gate', 'Bring extra sacks', 'Leave at porch']
            ).map(preset => (
              <button
                key={preset}
                type="button"
                disabled={busy}
                onClick={() => sendUpdate({ liveNote: `${role === 'collector' ? 'Buyer' : 'User'}: ${preset}` }, 'Live note sent')}
                className="rounded-lg border border-white/15 px-2 py-1 text-[11px] font-medium whitespace-nowrap hover:bg-white/10"
              >
                {preset}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              maxLength={120}
              aria-label="Send custom live pickup note"
              placeholder={role === 'collector' ? 'Custom ETA or gate note…' : 'Custom gate or weight note…'}
              value={noteDraft}
              onChange={e => setNoteDraft(e.target.value)}
              className="input flex-1 !py-1 text-xs"
            />
            <button
              type="button"
              disabled={busy || !noteDraft.trim()}
              onClick={() => {
                sendUpdate({ liveNote: `${role === 'collector' ? 'Buyer' : 'User'}: ${noteDraft.trim()}` }, 'Live note updated')
                setNoteDraft('')
              }}
              className="rounded-lg border border-leaf-400/40 px-3 py-1 text-xs font-medium whitespace-nowrap text-leaf-400 hover:bg-leaf-500/15 disabled:opacity-45"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </Glass>
  )
}

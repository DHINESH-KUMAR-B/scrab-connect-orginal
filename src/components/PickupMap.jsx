import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'

const CHENNAI = [13.0475, 80.209]

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
})

function MapClick({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect([event.latlng.lat, event.latlng.lng])
    }
  })
  return null
}

function Recenter({ location }) {
  const map = useMap()
  useEffect(() => {
    if (location) map.flyTo(location, Math.max(map.getZoom(), 15), { duration: 0.5 })
  }, [location, map])
  return null
}

function FitStops({ stops }) {
  const map = useMap()
  useEffect(() => {
    if (stops.length > 1) {
      map.fitBounds(stops.map(stop => [stop.lat, stop.lng]), { padding: [32, 32], maxZoom: 14 })
    } else if (stops.length === 1) {
      map.setView([stops[0].lat, stops[0].lng], 14)
    }
  }, [map, stops])
  return null
}

export function MapPicker({ location, onSelect }) {
  const [satellite, setSatellite] = useState(false)
  return (
    <div className="space-y-2">
      <button type="button" className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10" aria-pressed={satellite} onClick={() => setSatellite(value => !value)}>{satellite ? 'Switch to street map' : 'Switch to satellite'}</button>
      <MapContainer center={location || CHENNAI} zoom={12} scrollWheelZoom className="h-72 w-full rounded-xl">
        <TileLayer key={satellite ? 'satellite' : 'street'}
          attribution={satellite
            ? 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
          url={satellite
            ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
        />
        <MapClick onSelect={onSelect} />
        <Recenter location={location} />
        {location && <Marker position={location}><Popup>Pickup location</Popup></Marker>}
      </MapContainer>
      {location
        ? <p className="text-xs opacity-70">Pickup pin: {location[0].toFixed(5)}, {location[1].toFixed(5)}</p>
        : <p className="text-xs opacity-70">Click the map to pin your pickup location.</p>}
    </div>
  )
}

export function PickupMap({ pickups, route = false, onSelect }) {
  const [satellite, setSatellite] = useState(false)
  const stops = useMemo(
    () => pickups.filter(pickup => Number.isFinite(pickup.lat) && Number.isFinite(pickup.lng)),
    [pickups]
  )
  const line = useMemo(() => route ? stops.map(pickup => [pickup.lat, pickup.lng]) : [], [route, stops])

  return (
    <div className="space-y-2">
      <button type="button" className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10" aria-pressed={satellite} onClick={() => setSatellite(value => !value)}>{satellite ? 'Switch to street map' : 'Switch to satellite'}</button>
      <MapContainer center={CHENNAI} zoom={12} scrollWheelZoom className="h-80 w-full rounded-xl">
        <TileLayer key={satellite ? 'satellite' : 'street'}
          attribution={satellite
            ? 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
          url={satellite
            ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
        />
        <FitStops stops={stops} />
        {line.length > 1 && <Polyline positions={line} pathOptions={{ color: '#16a34a', weight: 4, opacity: 0.8 }} />}
        {stops.map((pickup, index) => (
          <Marker
            key={pickup.id}
            position={[pickup.lat, pickup.lng]}
            eventHandlers={{ click: () => onSelect?.(pickup) }}
          >
            <Popup>
              <strong>{pickup.name ? pickup.name : `Stop ${index + 1}: ${pickup.scrapType}`}</strong>
              {pickup.name ? (
                <>
                  <br />{pickup.hours}
                  <br />{pickup.address}
                </>
              ) : (
                <>
                  <br />{pickup.weight} kg · {pickup.status}
                  <br />{pickup.address || pickup.area}
                </>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

function createPinIcon(kind, pulsing = false) {
  const isCollector = kind === 'collector'
  const bg = isCollector ? '#22c55e' : '#0ea5e9'
  const ring = pulsing && isCollector
    ? '<span style="position:absolute;inset:-6px;border-radius:9999px;border:2px solid #22c55e;opacity:0.65;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>'
    : ''
  const svg = isCollector
    ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#052e16" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>'

  return L.divIcon({
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
    html: `<div style="position:relative;width:34px;height:34px;border-radius:9999px;background:${bg};display:flex;align-items:center;justify-content:center;border:2.5px solid #ffffff;box-shadow:0 4px 12px rgba(0,0,0,0.45);">${ring}${svg}</div>`,
  })
}

function FitPair({ userLocation, collectorLocation }) {
  const map = useMap()
  useEffect(() => {
    const hasUser = userLocation && Number.isFinite(userLocation.lat) && Number.isFinite(userLocation.lng)
    const hasCollector = collectorLocation && Number.isFinite(collectorLocation.lat) && Number.isFinite(collectorLocation.lng)
    if (hasUser && hasCollector) {
      const samePoint = Math.abs(userLocation.lat - collectorLocation.lat) < 0.0002 &&
        Math.abs(userLocation.lng - collectorLocation.lng) < 0.0002
      if (samePoint) {
        map.setView([userLocation.lat, userLocation.lng], 16)
      } else {
        map.fitBounds(
          [[userLocation.lat, userLocation.lng], [collectorLocation.lat, collectorLocation.lng]],
          { padding: [52, 52], maxZoom: 16 }
        )
      }
    } else if (hasUser) {
      map.setView([userLocation.lat, userLocation.lng], 15)
    } else if (hasCollector) {
      map.setView([collectorLocation.lat, collectorLocation.lng], 15)
    }
  }, [map, userLocation?.lat, userLocation?.lng, collectorLocation?.lat, collectorLocation?.lng])
  return null
}

export function LiveTrackingMap({
  userLocation,
  collectorLocation,
  userLabel = 'User pickup point',
  collectorLabel = 'Buyer / Collector live GPS',
  trackingStage = 'assigned',
}) {
  const [satellite, setSatellite] = useState(false)
  const hasUser = userLocation && Number.isFinite(userLocation.lat) && Number.isFinite(userLocation.lng)
  const hasCollector = collectorLocation && Number.isFinite(collectorLocation.lat) && Number.isFinite(collectorLocation.lng)
  const userIcon = useMemo(() => createPinIcon('user', false), [])
  const collectorIcon = useMemo(() => createPinIcon('collector', trackingStage === 'en_route'), [trackingStage])

  const center = hasUser
    ? [userLocation.lat, userLocation.lng]
    : hasCollector
      ? [collectorLocation.lat, collectorLocation.lng]
      : CHENNAI

  const routeLine = hasUser && hasCollector
    ? [[collectorLocation.lat, collectorLocation.lng], [userLocation.lat, userLocation.lng]]
    : []

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-4 opacity-85">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-sky-500" aria-hidden="true" />
            User pin
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" aria-hidden="true" />
            Buyer / Collector live GPS
          </span>
        </div>
        <button
          type="button"
          className="rounded-lg border border-white/15 px-3 py-1 text-xs hover:bg-white/10"
          aria-pressed={satellite}
          onClick={() => setSatellite(value => !value)}
        >
          {satellite ? 'Street map' : 'Satellite view'}
        </button>
      </div>
      <MapContainer center={center} zoom={14} scrollWheelZoom className="h-72 w-full rounded-xl">
        <TileLayer
          key={satellite ? 'satellite' : 'street'}
          attribution={satellite
            ? 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
          url={satellite
            ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
        />
        <FitPair userLocation={userLocation} collectorLocation={collectorLocation} />
        {routeLine.length === 2 && (
          <Polyline
            positions={routeLine}
            pathOptions={{ color: '#22c55e', weight: 4, opacity: 0.85, dashArray: '8 8' }}
          />
        )}
        {hasUser && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <strong>User location</strong>
              <br />{userLabel}
            </Popup>
          </Marker>
        )}
        {hasCollector && (
          <Marker position={[collectorLocation.lat, collectorLocation.lng]} icon={collectorIcon}>
            <Popup>
              <strong>Buyer / Collector</strong>
              <br />{collectorLabel}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}


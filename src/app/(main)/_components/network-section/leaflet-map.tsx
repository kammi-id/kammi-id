'use client'

// Raw Leaflet — no react-leaflet to avoid React 19 DOM reconciliation conflicts.
// Leaflet manages its own DOM; React only owns the outer <div> ref.

import { useEffect, useRef } from 'react'
import type { Map as LMap, GeoJSON as LGeoJSON, PathOptions } from 'leaflet'
import type { FeatureCollection, Feature, Geometry } from 'geojson'
import { SLUG_TO_ID_NAME, type ProvinceTooltip } from './leaflet-map-utils'
import 'leaflet/dist/leaflet.css'

// ── Province styles (semi-transparent so OSM tiles show through) ──────────────
const STYLE_HAS_PW: PathOptions = {
  fillColor: '#b85450',
  fillOpacity: 0.55,
  color: 'rgba(255,255,255,0.85)',
  weight: 0.7,
  opacity: 1
}
const STYLE_NO_PW: PathOptions = {
  fillColor: '#c4856e',
  fillOpacity: 0.3,
  color: 'rgba(255,255,255,0.6)',
  weight: 0.5,
  opacity: 1
}
const STYLE_HOVER: PathOptions = {
  fillColor: '#8b1a1a',
  fillOpacity: 0.82,
  color: 'rgba(255,255,255,0.95)',
  weight: 1.5,
  opacity: 1
}

// ── Props ─────────────────────────────────────────────────────────────────────
export interface LeafletMapProps {
  pwLookup: Record<string, string>
  onTooltip: (t: ProvinceTooltip) => void
  onMapHover: (hovering: boolean) => void
}

const LeafletMap = ({ pwLookup, onTooltip, onMapHover }: LeafletMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LMap | null>(null)
  const geoLayerRef = useRef<LGeoJSON | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Cancelled flag prevents async callback from touching unmounted DOM
    let cancelled = false
    let map: LMap | null = null

    const init = async () => {
      const L = await import('leaflet')
      const geoData: FeatureCollection = (
        await import('./indonesia-provinces.geojson.json')
      ).default as FeatureCollection

      if (cancelled || !containerRef.current) return
      if ((container as any)._leaflet_id) return

      // ── Map init ────────────────────────────────────────────────────────────
      map = L.map(container, {
        center: [-2.5, 118],
        zoom: 4,
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        keyboard: false,
        // Attribution enabled — OSM legally requires it
        attributionControl: true
      })
      mapRef.current = map

      // Fit all of Indonesia in view
      map.fitBounds(
        [
          [-11, 94],
          [6.5, 142]
        ],
        { padding: [6, 6], animate: false }
      )

      // ── OpenStreetMap base layer ─────────────────────────────────────────────
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
        maxZoom: 18,
        opacity: 0.9
      }).addTo(map)

      // ── Province GeoJSON overlay ─────────────────────────────────────────────
      const geoLayer = L.geoJSON(geoData, {
        style: (feature) => {
          const slug: string = feature?.properties?.slug ?? ''
          return pwLookup[slug] ? { ...STYLE_HAS_PW } : { ...STYLE_NO_PW }
        },
        onEachFeature: (feature: Feature<Geometry, any>, layer: L.Layer) => {
          const slug: string = feature.properties?.slug ?? ''
          const idName = SLUG_TO_ID_NAME[slug] ?? feature.properties?.name ?? ''
          const pwName = pwLookup[slug] ?? null
          const path = layer as L.Path

          layer.on({
            mouseover(e: L.LeafletMouseEvent) {
              path.setStyle(STYLE_HOVER)
              ;(path as any).bringToFront?.()
              onTooltip({
                visible: true,
                clientX: e.originalEvent.clientX,
                clientY: e.originalEvent.clientY,
                idName,
                pwName
              })
            },
            mousemove(e: L.LeafletMouseEvent) {
              onTooltip({
                visible: true,
                clientX: e.originalEvent.clientX,
                clientY: e.originalEvent.clientY,
                idName,
                pwName
              })
            },
            mouseout() {
              path.setStyle(
                pwLookup[slug] ? { ...STYLE_HAS_PW } : { ...STYLE_NO_PW }
              )
              onTooltip({
                visible: false,
                clientX: 0,
                clientY: 0,
                idName: '',
                pwName: null
              })
            }
          })
        }
      }).addTo(map)

      geoLayerRef.current = geoLayer
    }

    init()

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        geoLayerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-style provinces when pwLookup changes
  useEffect(() => {
    const layer = geoLayerRef.current
    if (!layer) return
    layer.eachLayer((l) => {
      const feature = (l as any).feature as Feature<Geometry, any>
      const slug: string = feature?.properties?.slug ?? ''
      ;(l as L.Path).setStyle(
        pwLookup[slug] ? { ...STYLE_HAS_PW } : { ...STYLE_NO_PW }
      )
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pwLookup])

  return (
    <>
      {/* Scope Leaflet cursor overrides without disabling attribution */}
      <style>{`
        .kammi-map .leaflet-grab,
        .kammi-map .leaflet-crosshair { cursor: default !important; }
        .kammi-map .leaflet-interactive { cursor: pointer !important; }
        .kammi-map .leaflet-attribution-flag { display: none !important; }
        .kammi-map .leaflet-control-attribution {
          background: rgba(255,255,255,0.75) !important;
          font-size: 9px !important;
          max-width: min(240px, 60vw) !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }
        .kammi-map { overflow: hidden; }
      `}</style>
      <div
        className='kammi-map h-full w-full'
        onMouseEnter={() => onMapHover(true)}
        onMouseLeave={() => onMapHover(false)}
      >
        <div ref={containerRef} className='h-full w-full' />
      </div>
    </>
  )
}

export default LeafletMap

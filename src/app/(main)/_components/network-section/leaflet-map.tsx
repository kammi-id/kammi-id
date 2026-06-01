'use client'

// Raw Leaflet — no react-leaflet to avoid React 19 DOM reconciliation conflicts.
// Leaflet manages its own DOM; React only owns the outer <div> ref.

import { useEffect, useRef } from 'react'
import type { Map as LMap, GeoJSON as LGeoJSON, PathOptions } from 'leaflet'
import type { FeatureCollection, Feature, Geometry } from 'geojson'
import { SLUG_TO_ID_NAME, type ProvinceTooltip } from './leaflet-map-utils'
import 'leaflet/dist/leaflet.css'

const COLOR_HAS_PW = '#b85450'   // on-brand crimson, filled
const COLOR_NO_PW  = '#d4a5a3'   // lighter for empty provinces
const COLOR_HOVER  = '#8b1a1a'   // deep hover

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

    let L: typeof import('leaflet')
    let map: LMap

    const init = async () => {
      // Dynamic imports keep Leaflet out of the SSR bundle
      L = await import('leaflet')
      const geoData: FeatureCollection = (
        await import('./indonesia-provinces.geojson.json')
      ).default as FeatureCollection

      // Guard: component may have unmounted while imports resolved
      if (!containerRef.current) return

      // Leaflet sets data-initialized to avoid double-init
      if ((container as any)._leaflet_id) return

      map = L.map(container, {
        center: [-2.5, 118],
        zoom: 4,
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        keyboard: false,
        attributionControl: false
      })
      mapRef.current = map

      // Fit to Indonesia bounds
      map.fitBounds([[-11, 94], [6.5, 142]], { padding: [6, 6], animate: false })

      // GeoJSON layer
      const geoLayer = L.geoJSON(geoData, {
        style: (feature) => provinceStyle(feature, false),
        onEachFeature: (feature, layer) => {
          const slug: string = feature.properties?.slug ?? ''
          const idName = SLUG_TO_ID_NAME[slug] ?? feature.properties?.name ?? ''
          const pwName = pwLookup[slug] ?? null
          const path = layer as L.Path

          layer.on({
            mouseover(e: L.LeafletMouseEvent) {
              path.setStyle({ fillColor: COLOR_HOVER, fillOpacity: 1, weight: 1.5 })
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
              path.setStyle(provinceStyle(feature, false))
              onTooltip({ visible: false, clientX: 0, clientY: 0, idName: '', pwName: null })
            }
          })
        }
      }).addTo(map)

      geoLayerRef.current = geoLayer
    }

    init()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        geoLayerRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update styles when pwLookup changes (e.g., if data reloads)
  useEffect(() => {
    const layer = geoLayerRef.current
    if (!layer) return
    layer.eachLayer((l) => {
      const feature = (l as any).feature as Feature<Geometry, any>
      ;(l as L.Path).setStyle(provinceStyle(feature, false))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pwLookup])

  const provinceStyle = (
    feature: Feature<Geometry, any> | undefined,
    _hovered: boolean
  ): PathOptions => {
    const slug: string = feature?.properties?.slug ?? ''
    const hasPW = !!pwLookup[slug]
    return {
      fillColor: hasPW ? COLOR_HAS_PW : COLOR_NO_PW,
      fillOpacity: 0.85,
      color: 'rgba(255,255,255,0.9)',
      weight: 0.6,
      opacity: 1
    }
  }

  return (
    <>
      {/* Override Leaflet default grey ocean */}
      <style>{`
        .kammi-map .leaflet-container {
          background: oklch(0.94 0.018 240) !important;
        }
        .kammi-map .leaflet-grab,
        .kammi-map .leaflet-crosshair {
          cursor: default !important;
        }
        .kammi-map .leaflet-interactive {
          cursor: pointer !important;
        }
      `}</style>
      <div
        className='kammi-map h-full w-full'
        onMouseEnter={() => onMapHover(true)}
        onMouseLeave={() => onMapHover(false)}
      >
        <div
          ref={containerRef}
          className='h-full w-full rounded-2xl'
          style={{ background: 'oklch(0.94 0.018 240)' }}
        />
      </div>
    </>
  )
}

export default LeafletMap

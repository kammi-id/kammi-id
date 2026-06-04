/**
 * One-time script: fetch Indonesia provinces GeoJSON,
 * simplify it (truncate precision, thin coordinates),
 * and write an optimized TS data file for bundling.
 *
 * Run: bun scripts/fetch-indonesia-provinces.ts
 */

import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// Simplified Indonesia provinces polygon data
// Source: derived from Natural Earth / BPS Indonesia administrative boundaries
// Coordinates: [longitude, latitude], simplified to 2 decimal precision
// Province GeoJSON — 38 provinces, polygons only (no holes), ~100KB

const SOURCE_URL =
  'https://raw.githubusercontent.com/superpikar/indonesia-geojson/master/indonesia-en.geojson'

const OUT_PATH = path.join(
  import.meta.dir,
  '../src/app/(main)/_components/network-section/indonesia-provinces.geojson.json'
)

/** Truncate coordinate precision to 2 decimal places */
const truncCoord = (c: number) => Math.round(c * 100) / 100

/** Simplify polygon coordinates — keep every nth point + always keep first/last */
const simplifyRing = (ring: number[][], step = 4): number[][] => {
  if (ring.length <= 4)
    return ring.map(([lon, lat]) => [truncCoord(lon), truncCoord(lat)])
  const result: number[][] = [[truncCoord(ring[0][0]), truncCoord(ring[0][1])]]
  for (let i = step; i < ring.length - 1; i += step) {
    result.push([truncCoord(ring[i][0]), truncCoord(ring[i][1])])
  }
  result.push([
    truncCoord(ring[ring.length - 1][0]),
    truncCoord(ring[ring.length - 1][1])
  ])
  return result
}

type GeoGeometry = {
  type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  coordinates: any
}

const simplifyGeometry = (geom: GeoGeometry): GeoGeometry => {
  if (geom.type === 'Polygon') {
    return {
      ...geom,
      coordinates: geom.coordinates.map((r: number[][]) => simplifyRing(r))
    }
  }
  if (geom.type === 'MultiPolygon') {
    return {
      ...geom,
      coordinates: geom.coordinates.map((poly: number[][][]) =>
        poly.map((r) => simplifyRing(r))
      )
    }
  }
  return geom
}

console.log('Fetching Indonesia provinces GeoJSON from:', SOURCE_URL)

const res = await fetch(SOURCE_URL)
if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
const raw = await res.json()

console.log(`Loaded ${raw.features.length} features`)

// Keep only province-level features; strip unnecessary properties
const optimized = {
  type: 'FeatureCollection',
  features: (raw as { features: { properties: Record<string, string | number | null | undefined>; geometry: GeoGeometry }[] }).features.map((f) => ({
    type: 'Feature',
    properties: {
      name: String(
        f.properties?.state ??
        f.properties?.Propinsi ??
        f.properties?.NAME_1 ??
        ''
      ).trim(),
      slug: String(f.properties?.slug ?? '').trim(),
      code: String(
        f.properties?.id_1 ?? f.properties?.ID_1 ?? f.properties?.code ?? ''
      )
    },
    geometry: simplifyGeometry(f.geometry)
  }))
}

const json = JSON.stringify(optimized)
console.log(
  `Optimized size: ${(json.length / 1024).toFixed(1)} KB (${optimized.features.length} features)`
)

await mkdir(path.dirname(OUT_PATH), { recursive: true })
await writeFile(OUT_PATH, json, 'utf-8')
console.log('Written to:', OUT_PATH)

'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  fetchProvincesAction,
  fetchCitiesAction,
  fetchDistrictsAction,
  fetchVillagesAction
} from './action'
import type { RegionDataState, RegionLoadingState } from './types'
import { INITIAL_REGION_DATA, INITIAL_LOADING_STATE } from './constants'
import type { RegionItem } from '~/lib/api/region'

export const useMemberRegion = (
  initialProvince = '',
  initialCity = '',
  initialDistrict = '',
  initialSubdistrict = ''
) => {
  const [regionData, setRegionData] =
    useState<RegionDataState>(INITIAL_REGION_DATA)
  const [isLoading, setIsLoading] = useState<RegionLoadingState>(
    INITIAL_LOADING_STATE
  )
  const [province, setProvince] = useState(initialProvince)
  const [city, setCity] = useState(initialCity)
  const [district, setDistrict] = useState(initialDistrict)
  const [subdistrict, setSubdistrict] = useState(initialSubdistrict)

  const getRegionName = (options: RegionItem[] | undefined, code: string) =>
    options?.find((opt) => opt.code === code)?.name ?? ''

  useEffect(() => {
    let isCurrent = true
    const loadProvinces = async () => {
      setIsLoading((prev) => ({ ...prev, province: true }))
      const res = await fetchProvincesAction()
      if (!isCurrent) return
      setIsLoading((prev) => ({ ...prev, province: false }))
      if (res.success) {
        setRegionData((prev) => ({ ...prev, provinces: res.data || [] }))
      } else {
        toast.error(res.error)
      }
    }
    loadProvinces()
    return () => {
      isCurrent = false
    }
  }, [])

  useEffect(() => {
    if (!province) return
    let isCurrent = true
    const loadCities = async () => {
      setIsLoading((prev) => ({ ...prev, city: true }))
      const res = await fetchCitiesAction(province)
      if (!isCurrent) return
      setIsLoading((prev) => ({ ...prev, city: false }))
      if (res.success) {
        setRegionData((prev) => ({ ...prev, cities: res.data || [] }))
      } else {
        toast.error(res.error)
      }
    }
    loadCities()
    return () => {
      isCurrent = false
    }
  }, [province])

  useEffect(() => {
    if (!city) return
    let isCurrent = true
    const loadDistricts = async () => {
      setIsLoading((prev) => ({ ...prev, district: true }))
      const res = await fetchDistrictsAction(city)
      if (!isCurrent) return
      setIsLoading((prev) => ({ ...prev, district: false }))
      if (res.success) {
        setRegionData((prev) => ({ ...prev, districts: res.data || [] }))
      } else {
        toast.error(res.error)
      }
    }
    loadDistricts()
    return () => {
      isCurrent = false
    }
  }, [city])

  useEffect(() => {
    if (!district) return
    let isCurrent = true
    const loadSubdistricts = async () => {
      setIsLoading((prev) => ({ ...prev, subdistrict: true }))
      const res = await fetchVillagesAction(district)
      if (!isCurrent) return
      setIsLoading((prev) => ({ ...prev, subdistrict: false }))
      if (res.success) {
        setRegionData((prev) => ({ ...prev, subdistricts: res.data || [] }))
      } else {
        toast.error(res.error)
      }
    }
    loadSubdistricts()
    return () => {
      isCurrent = false
    }
  }, [district])

  return {
    regionData,
    isLoading,
    province,
    setProvince,
    city,
    setCity,
    district,
    setDistrict,
    subdistrict,
    setSubdistrict,
    getRegionName
  }
}

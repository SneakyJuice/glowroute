export interface GeoResult {
  city: string
  state: string
  display: string // "Tampa, FL"
}

export async function getUserCity(): Promise<GeoResult | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return }
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          // Use free BigDataCloud reverse geocode (no API key needed)
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          )
          const data = await res.json()
          const city = data.city || data.locality || data.principalSubdivision || ''
          const state = data.principalSubdivisionCode?.replace('US-', '') || ''
          if (!city) { resolve(null); return }
          resolve({ city, state, display: state ? `${city}, ${state}` : city })
        } catch {
          resolve(null)
        }
      },
      () => resolve(null),
      { timeout: 5000, maximumAge: 300000 }
    )
  })
}
import * as L from 'leaflet'

export const STOP_ICON = L.divIcon({
  className: '',
  html: `<div class="flex flex-col items-center justify-center w-5 h-5 rounded-full"><span class="active-ping absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span><svg viewBox="0 0 32 32" width="1.2em" height="1.2em" class="w-4 h-4"><path fill="currentColor" d="M27 11h2v4h-2zM3 11h2v4H3zm17 9h2v2h-2zm-10 0h2v2h-2z"></path><path fill="currentColor" d="M21 4H11a5.006 5.006 0 0 0-5 5v14a2 2 0 0 0 2 2v3h2v-3h12v3h2v-3a2.003 2.003 0 0 0 2-2V9a5.006 5.006 0 0 0-5-5m3 6v6H8v-6ZM11 6h10a2.995 2.995 0 0 1 2.816 2H8.184A2.995 2.995 0 0 1 11 6M8 23v-5h16.001l.001 5Z"></path></svg></div>`,
  iconSize: [20, 20],
  iconAnchor: [12, 26],
  tooltipAnchor: [0, -20]
})

export const BUS_ICON = L.divIcon({
  className: 'bus-marker-wrapper',
  html: `<div class="bus-beacon"></div>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="6" width="26" height="14" rx="3.5" fill="#2563eb" stroke="#fff" stroke-width="1.5"/>
      <circle cx="7" cy="21" r="3" fill="#fff"/>
      <circle cx="21" cy="21" r="3" fill="#fff"/>
      <rect x="4" y="8" width="8" height="5" rx="1.5" fill="#93c5fd" opacity="0.5"/>
      <rect x="16" y="8" width="8" height="5" rx="1.5" fill="#93c5fd" opacity="0.5"/>
    </svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  tooltipAnchor: [0, -14]
})

export const PRESENCE_ICON = L.divIcon({
  className: 'bus-marker-wrapper',
  html: `<div class="bus-beacon"></div>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
      <rect x="1" y="6" width="26" height="14" rx="3.5" fill="#16a34a" stroke="#fff" stroke-width="1.5"/>
      <circle cx="7" cy="21" r="3" fill="#fff"/>
      <circle cx="21" cy="21" r="3" fill="#fff"/>
      <rect x="4" y="8" width="8" height="5" rx="1.5" fill="#86efac" opacity="0.5"/>
      <rect x="16" y="8" width="8" height="5" rx="1.5" fill="#86efac" opacity="0.5"/>
    </svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  tooltipAnchor: [0, -14]
})

export function clusterBusIcon(count: number) {
  return L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
      <circle cx="20" cy="20" r="18" fill="#2563eb" stroke="#fff" stroke-width="2.5"/>
      <text x="20" y="26" text-anchor="middle" font-size="16" font-weight="bold" fill="#fff">${count}</text>
    </svg>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    tooltipAnchor: [0, -20]
  })
}

export function clusterPresenceIcon(count: number) {
  return L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
      <circle cx="20" cy="20" r="18" fill="#16a34a" stroke="#fff" stroke-width="2.5"/>
      <text x="20" y="26" text-anchor="middle" font-size="16" font-weight="bold" fill="#fff">${count}</text>
    </svg>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    tooltipAnchor: [0, -20]
  })
}

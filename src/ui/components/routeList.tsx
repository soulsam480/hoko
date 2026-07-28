import { useSignal } from '@preact/signals'
import { Suspense } from 'preact/compat'
import CarbonSearch from '~icons/carbon/search'
import { getSearchedRoutes } from '../../db/queries'
import { Route } from '../../db/schema'
import { haversine } from '../../lib/coordinates'
import { connection } from '../connection'
import { flyToFeeder } from '../geo/map'
import { chosenRoute, chosenStop, insideBus, presenceIndex } from '../stores'
import { suspendFn } from '../suspense-utils'
import { BackButton } from './backButton'

interface ISearchedProps {
  term: string
}

interface IListProps {
  routes: Route[]
}

function List({ routes }: IListProps) {
  const stop = chosenStop.value

  return (
    <div
      id='route-grid'
      className='grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[38vh] overflow-y-auto pb-1'
    >
      {routes.map(route => {
        const feeders = presenceIndex.value.get(route.id) || []
        const activeFeeders = feeders.filter(
          f => Date.now() - f.lastSeen < 90_000
        )
        const count = activeFeeders.length

        let closestDistance: string | null = null
        if (stop && count > 0) {
          const distances = activeFeeders.map(f =>
            haversine(stop.lat, stop.lon, f.lat, f.lon)
          )
          const minMeters = Math.round(Math.min(...distances))
          closestDistance =
            minMeters < 1000
              ? `${minMeters}m`
              : `${(minMeters / 1000).toFixed(1)}km`
        }

        return (
          <button
            key={route.id}
            className='btn btn-outline justify-start font-mono'
            type='button'
            onClick={() => {
              chosenRoute.value = route
              insideBus.value = false

              if (chosenStop.value === null) {
                return
              }

              const routeFeeders = presenceIndex.value.get(route.id) || []
              const activeFeeders = routeFeeders.filter(
                f => Date.now() - f.lastSeen < 90_000
              )

              if (activeFeeders.length > 0) {
                const closest = activeFeeders.reduce((best, f) => {
                  const dist = haversine(
                    chosenStop.value!.lat,
                    chosenStop.value!.lon,
                    f.lat,
                    f.lon
                  )
                  const bestDist = haversine(
                    chosenStop.value!.lat,
                    chosenStop.value!.lon,
                    best.lat,
                    best.lon
                  )
                  return dist < bestDist ? f : best
                })
                flyToFeeder(closest.lat, closest.lon)
              }

              connection.joinRoute(route)
            }}
          >
            <span className='flex-1 text-left'>{route.name}</span>
            {count > 0 && (
              <span className='badge badge-success badge-sm gap-1'>
                {count} bus{count > 1 ? 'es' : ''}
                {closestDistance && (
                  <span className='font-sans font-normal'>
                    ~{closestDistance}
                  </span>
                )}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function SearchedList({ term }: ISearchedProps) {
  const fetcher = () => getSearchedRoutes(chosenStop.value!.id, term)

  const data = suspendFn(`routes-${chosenStop.value?.id}-${term}`, fetcher)()

  return <List routes={data} />
}

export function RouteList() {
  const term = useSignal('')

  if (!chosenStop.value || chosenRoute.value) {
    return
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center gap-2 mb-1'>
        <BackButton
          onClick={() => {
            chosenStop.value = null
            chosenRoute.value = null
          }}
        />
        <div>
          <h2 className='text-lg font-semibold leading-tight'>
            {chosenStop.value!.name}
          </h2>
          <p className='text-sm text-base-content/60'>
            Choose a route to track
          </p>
        </div>
      </div>

      <label className='input input-bordered w-full mb-3'>
        <CarbonSearch className='w-4 h-4 opacity-50' />
        <input
          type='text'
          placeholder='Search routes'
          onInput={e => (term.value = e.currentTarget.value)}
        />
      </label>

      <Suspense
        fallback={
          <div className='text-xs text-base-content/50'>Searching...</div>
        }
      >
        <SearchedList term={term.value} />
      </Suspense>
    </div>
  )
}

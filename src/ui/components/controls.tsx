import { useSignal } from '@preact/signals'
import GisPoisO from '~icons/gis/pois-o'
import { chosenRoute, chosenStop, closestStops, insideBus } from '../stores'
import { connection } from '../connection'

export function Controls() {
  const openControls = useSignal(true)
  return (
    <>
      <button
        class='bg-cyan-50 p-2 border border-cyan-200 relative text-cyan-800 rounded-full shadow-md'
        type='button'
        onClick={() => {
          openControls.value = !openControls.value
        }}
      >
        <GisPoisO class='stroke-2' />

        {closestStops.value.length > 0 && (
          <>
            <span class='absolute -top-1.5 -left-1.5 animate-ping p-2 bg-red-600 rounded-full'></span>
            <span class='absolute -top-1 -left-1 p-1.5 bg-red-600 rounded-full'></span>
          </>
        )}
      </button>

      {openControls.value && (
        <div className='max-w-[100vw_-_32px] rounded-lg p-2 bg-cyan-50 border-cyan-200 border shadow-md'>
          {chosenStop.value === null && (
            <>
              <div className='mb-1 flex flex-col gap-0.5 justify-between'>
                <div class='text-xs font-semibold'>
                  Choose boarding bus stop
                </div>
                <div class='text-gray-800 text-xxs'>
                  Showing withing 1km radius
                </div>
              </div>

              <ul class='flex flex-col max-h-[calc(100vh_/_3)] overflow-y-scroll'>
                {closestStops.value.map(stop => {
                  return (
                    <li class='text-xs' key={stop.id}>
                      <button
                        class='p-1 hover:bg-cyan-100 rounded w-full text-start'
                        type='button'
                        onClick={() => {
                          chosenStop.value = stop
                        }}
                      >
                        {stop.name}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}

          {chosenStop.value !== null && chosenRoute.value === null && (
            <>
              <div className='text-xs font-semibold mb-1 flex gap-1 justify-between'>
                <div>Choose route to track</div>
                <button
                  type='button'
                  onClick={() => {
                    chosenStop.value = null
                    chosenRoute.value = null
                  }}
                >
                  Back
                </button>
              </div>
              <ul class='grid grid-cols-2 gap-x-1 max-h-[calc(100vh_/_3)] overflow-y-scroll'>
                {chosenStop.value.route_list.map(route => {
                  return (
                    <li class='text-xs' key={route}>
                      <button
                        class='p-1 hover:bg-cyan-100 rounded w-full text-start'
                        type='button'
                        onClick={() => {
                          chosenRoute.value = route

                          if (chosenStop.value === null) {
                            return
                          }

                          connection.findFeeders(chosenStop.value?.id, route)
                        }}
                      >
                        {route}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}

          {chosenRoute.value !== null && (
            <>
              <div className='text-xs font-semibold mb-1 flex gap-4 justify-between'>
                <div>Currently tracking {chosenRoute.value}</div>
                <button
                  type='button'
                  onClick={() => {
                    chosenStop.value = null
                    chosenRoute.value = null
                  }}
                >
                  Back
                </button>
              </div>

              <label
                class='flex items-center gap-1 text-xs mt-1'
                id='inside-bus'
              >
                <span>Are you inside bus ?</span>
                <input
                  type='checkbox'
                  checked={insideBus.value}
                  onChange={() => {
                    connection.updateInsideBus(!insideBus.value)
                    insideBus.value = !insideBus.value
                  }}
                />
              </label>

              <ul class='grid grid-cols-2 gap-x-1 max-h-[calc(100vh_/_3)] overflow-y-scroll'>
                {connection.feeders.value.map(feeder => {
                  return (
                    <li class='text-xs' key={feeder}>
                      <button
                        class='p-1 hover:bg-cyan-100 rounded w-full text-start'
                        type='button'
                        onClick={() => {
                          connection.track(feeder.id)
                        }}
                      >
                        {feeder.id}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </>
  )
}

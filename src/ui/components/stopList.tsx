import CarbonBus from '~icons/carbon/bus'
import CarbonChevronRight from '~icons/carbon/chevron-right'
import { isReady } from '../../db/client'
import { getRoutesForStop } from '../../db/queries'
import { flyToStop } from '../geo/map'
import { chosenStop, closestStops, stopRoutes } from '../stores'

export function StopList() {
  if (chosenStop.value) {
    return
  }

  return (
    <div className='mb-1'>
      <h2 className='text-lg font-semibold'>Choose boarding bus stop</h2>
      <div className='flex items-center gap-2 mt-1'>
        <span className='badge badge-soft badge-primary badge-sm'>
          1 km radius
        </span>
        <span className='text-sm text-base-content/60'>
          {closestStops.value.length} stops nearby
        </span>
      </div>

      <ul className='list max-h-[46vh] overflow-y-auto -mx-2'>
        {closestStops.value.map(stop => {
          return (
            <li
              key={stop.id}
              className='list-row items-center py-2 px-2 rounded-field hover:bg-base-200 cursor-pointer transition-colors'
              onClick={() => {
                chosenStop.value = stop
                flyToStop(stop.id)
                isReady().then(() =>
                  getRoutesForStop(stop.id).then(routes => {
                    stopRoutes.value = routes
                  })
                )
              }}
            >
              <div className='avatar avatar-placeholder'>
                <div className='bg-primary/15 text-primary w-8 rounded-full'>
                  <CarbonBus className='w-4 h-4' />
                </div>
              </div>
              <div className='list-col-grow'>
                <div className='font-medium text-base-content'>{stop.name}</div>
              </div>
              <CarbonChevronRight className='w-4 h-4 text-base-content/30' />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

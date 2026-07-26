import CarbonWarning from '~icons/carbon/warning'
import { chosenRoute, connectionState, feeders, insideBus } from '../stores'
import { SelectedRouteControls } from './selectedRouteControls'

export function TrackingControls() {
  if (chosenRoute.value === null) {
    return
  }

  const state = connectionState.value
  const feederCount = feeders.value.length

  return (
    <div className='flex flex-col gap-1'>
      <SelectedRouteControls />
      {state === 'joining' && (
        <div className='text-xs text-info'>Joining room...</div>
      )}
      {state === 'error' && (
        <div className='text-xs text-error'>
          Connection failed. Select the route again to retry.
        </div>
      )}
      {state === 'joined' && !insideBus.value && (
        <div role='alert' className='alert alert-warning alert-soft mt-2'>
          <CarbonWarning className='w-5 h-5 shrink-0' />
          <span className='text-sm'>
            {feederCount === 0
              ? 'No buses on this route right now'
              : `${feederCount} bus${feederCount > 1 ? 'es' : ''} tracking on this route`}
          </span>
        </div>
      )}
    </div>
  )
}

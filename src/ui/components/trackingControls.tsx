import { connection } from '../connection'
import { chosenRoute } from '../stores'
import { SelectedRouteControls } from './selectedRouteControls'

export function TrackingControls() {
  if (chosenRoute.value === null) {
    return
  }

  const state = connection.connectionState.value
  const feederCount = connection.feeders.value.length

  return (
    <div className='flex flex-col gap-1'>
      <SelectedRouteControls />
      {state === 'joining' && (
        <div className='text-xs text-cyan-700'>Joining room...</div>
      )}
      {state === 'error' && (
        <div className='text-xs text-red-600'>
          Connection failed. Select the route again to retry.
        </div>
      )}
      {state === 'joined' && (
        <div className='text-xs text-cyan-700'>
          {feederCount === 0
            ? 'No buses on this route right now'
            : `${feederCount} bus${feederCount > 1 ? 'es' : ''} tracking on this route`}
        </div>
      )}
    </div>
  )
}

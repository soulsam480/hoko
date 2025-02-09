import { useComputed } from '@preact/signals'
import { chosenRoute } from '../stores'
import { AvailableFeeders } from './availableFeeders'
import { SelectedRouteControls } from './selectedRouteControls'
import { connection } from '../connection'
import { CurrentTrackingControls } from './currentTrackingControls'

export function TrackingControls() {
  const status = useComputed(() => connection.trackingState.value.state)
  const feeder = useComputed(() => connection.trackingState.value.feeder_id)

  if (chosenRoute.value === null) {
    return
  }

  return (
    <>
      <SelectedRouteControls />
      {status.value === 'idle' && <AvailableFeeders />}
      {status.value === 'requested' && (
        <div className='text-xs'>Attempting to track {feeder}</div>
      )}
      {status.value === 'tracking' && <CurrentTrackingControls />}
    </>
  )
}

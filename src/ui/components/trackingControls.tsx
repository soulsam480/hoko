import { chosenRoute } from '../stores'
import { AvailableFeeders } from './availableFeeders'
import { SelectedRouteControls } from './selectedRouteControls'

export function TrackingControls() {
  if (chosenRoute.value === null) {
    return
  }

  return (
    <>
      <SelectedRouteControls />
      <AvailableFeeders />
    </>
  )
}

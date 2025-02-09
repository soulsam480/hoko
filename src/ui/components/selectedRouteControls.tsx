import { connection } from '../connection'
import { chosenRoute, insideBus } from '../stores'
import { BackButton } from './backButton'

export function SelectedRouteControls() {
  return (
    <div className='flex flex-col gap-1'>
      <div className='text-xs flex gap-2'>
        <BackButton
          onClick={() => {
            chosenRoute.value = null

            connection.untrack()
          }}
        />
        <div>
          Currently tracking{' '}
          <span className='font-semibold'>{chosenRoute.value}</span>
        </div>
      </div>

      <label class='flex items-center gap-1 text-xs mt-1' id='inside-bus'>
        <input
          type='checkbox'
          checked={insideBus.value}
          onChange={() => {
            connection.updateInsideBus(!insideBus.value)
            insideBus.value = !insideBus.value
          }}
        />

        <span>Are you inside bus ?</span>
      </label>
    </div>
  )
}
